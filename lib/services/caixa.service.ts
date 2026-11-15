import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { PERMISSAO, temPermissao } from "@/lib/constants/roles";
import { dataNoFuso } from "@/lib/utils/data";
import type { ContextoRequisicao } from "./auth.service";
import { getConfig } from "./configuracoes.service";

type Usuario = { id: number; email: string; nome: string; permissoes: string[] };
const c = (v: { toString(): string } | null | undefined) => (v == null ? 0 : Math.round(Number(v.toString()) * 100));
const dec = (centavos: number) => new Prisma.Decimal((centavos / 100).toFixed(2));

export function sessaoAbertaDoOperador(operadorId: number) {
  return prisma.sessaoCaixa.findFirst({ where: { operadorId, status: "aberto" } });
}

/** Números de caixa configurados (Configurações › Financeiro › número de caixas), com quem está usando. */
export async function situacaoDosCaixas() {
  const fin = await getConfig("financeiro");
  const abertos = await prisma.sessaoCaixa.findMany({ where: { status: "aberto" }, include: { operador: { select: { nome: true } } } });
  return Array.from({ length: fin.caixasQuantidade }, (_, i) => {
    const caixa = String(i + 1).padStart(2, "0");
    const s = abertos.find((a) => a.caixa === caixa);
    return { caixa, ocupadoPor: s?.operador.nome ?? null, sessaoId: s?.id ?? null };
  });
}

/** Saldo sugerido na abertura = dinheiro contado no último fechamento daquele caixa. */
export async function saldoSugerido(caixa: string) {
  const ultimo = await prisma.sessaoCaixa.findFirst({ where: { caixa, status: "fechado" }, orderBy: { fechadoEm: "desc" }, select: { saldoReal: true } });
  return c(ultimo?.saldoReal);
}

export type Resultado = { ok: true; id: number } | { ok: false; erro: string };

export async function abrirCaixa(
  dados: { caixa: string; saldoInicial: number; observacao?: string },
  usuario: Usuario,
  ctx: ContextoRequisicao,
): Promise<Resultado> {
  const fin = await getConfig("financeiro");
  if (Number(dados.caixa) < 1 || Number(dados.caixa) > fin.caixasQuantidade) return { ok: false, erro: "Caixa inexistente." };
  if (await sessaoAbertaDoOperador(usuario.id)) return { ok: false, erro: "Você já tem um caixa aberto. Feche-o antes de abrir outro." };

  const empresa = await getConfig("empresa");
  const dia = dataNoFuso(new Date(), empresa.funcionamento.timezone).replace(/-/g, "");
  try {
    const sessao = await prisma.$transaction(async (tx) => {
      const criada = await tx.sessaoCaixa.create({
        data: {
          numero: `TMP-${crypto.randomUUID()}`.slice(0, 30),
          caixa: dados.caixa,
          operadorId: usuario.id,
          saldoInicial: new Prisma.Decimal(dados.saldoInicial.toFixed(2)),
          observacaoAbertura: dados.observacao ?? null,
        },
      });
      return tx.sessaoCaixa.update({ where: { id: criada.id }, data: { numero: `CX-${dia}-${String(criada.id).padStart(6, "0")}` } });
    });
    await auditar("CAIXA_ABERTO", usuario, ctx, { sessao_id: sessao.id, caixa: dados.caixa, saldo_inicial: dados.saldoInicial });
    return { ok: true, id: sessao.id };
  } catch (e) {
    // índices únicos parciais: o caixa (ou o operador) já tem sessão aberta
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, erro: `O caixa ${dados.caixa} já está aberto por outra pessoa.` };
    }
    throw e;
  }
}

/**
 * Resumo da sessão (seção 5.1.2). O "esperado" é só DINHEIRO na gaveta:
 * saldo inicial + dinheiro das vendas (já descontado o troco) + suprimentos − sangrias − despesas pagas com dinheiro do caixa.
 * Cartão/PIX aparecem à parte, para conferir com a maquininha/extrato.
 */
export async function resumoSessao(sessaoId: number) {
  const sessao = await prisma.sessaoCaixa.findUnique({
    where: { id: sessaoId },
    include: {
      operador: { select: { nome: true } },
      fechadoPor: { select: { nome: true } },
      movimentos: { orderBy: { criadoEm: "asc" }, include: { usuario: { select: { nome: true } } } },
      despesas: { where: { cancelada: false }, select: { id: true, numero: true, descricao: true, valor: true, criadoEm: true } },
    },
  });
  if (!sessao) return null;

  const vendas = await prisma.venda.findMany({
    where: { sessaoCaixaId: sessaoId },
    select: { status: true, total: true, pagamentos: { select: { forma: true, valor: true } } },
  });
  const finalizadas = vendas.filter((v) => v.status === "finalizada");
  const porForma: Record<string, number> = {};
  for (const v of finalizadas) for (const p of v.pagamentos) porForma[p.forma] = (porForma[p.forma] ?? 0) + c(p.valor);

  const suprimentos = sessao.movimentos.filter((m) => m.tipo === "suprimento").reduce((s, m) => s + c(m.valor), 0);
  const sangrias = sessao.movimentos.filter((m) => m.tipo === "sangria").reduce((s, m) => s + c(m.valor), 0);
  const despesas = sessao.despesas.reduce((s, d) => s + c(d.valor), 0);
  const inicial = c(sessao.saldoInicial);
  const dinheiroVendas = porForma.dinheiro ?? 0;

  return {
    sessao,
    totais: {
      inicial,
      vendas: finalizadas.length,
      canceladas: vendas.length - finalizadas.length,
      totalVendido: finalizadas.reduce((s, v) => s + c(v.total), 0),
      porForma,
      dinheiroVendas,
      suprimentos,
      sangrias,
      despesas,
      esperado: inicial + dinheiroVendas + suprimentos - sangrias - despesas,
    },
  };
}

export async function registrarMovimentoCaixa(
  dados: { tipo: "suprimento" | "sangria"; valor: number; motivo: string },
  usuario: Usuario,
  ctx: ContextoRequisicao,
): Promise<Resultado> {
  const sessao = await sessaoAbertaDoOperador(usuario.id);
  if (!sessao) return { ok: false, erro: "Você não tem caixa aberto." };
  const valor = Math.round(dados.valor * 100);
  if (dados.tipo === "sangria") {
    const r = await resumoSessao(sessao.id);
    if (r && valor > r.totais.esperado) return { ok: false, erro: "A sangria não pode ser maior que o dinheiro esperado no caixa." };
  }
  const mov = await prisma.movimentoCaixa.create({
    data: { sessaoId: sessao.id, tipo: dados.tipo, valor: dec(valor), motivo: dados.motivo, usuarioId: usuario.id },
  });
  await auditar(dados.tipo === "sangria" ? "CAIXA_SANGRIA" : "CAIXA_SUPRIMENTO", usuario, ctx, { sessao_id: sessao.id, valor: dados.valor, motivo: dados.motivo });
  return { ok: true, id: mov.id };
}

export async function fecharCaixa(
  dados: { sessaoId: number; saldoReal: number; motivoDiferenca?: string; observacao?: string },
  usuario: Usuario,
  ctx: ContextoRequisicao,
): Promise<{ ok: true; diferenca: number } | { ok: false; erro: string }> {
  const [resumo, fin] = await Promise.all([resumoSessao(dados.sessaoId), getConfig("financeiro")]);
  if (!resumo || resumo.sessao.status !== "aberto") return { ok: false, erro: "Este caixa não está aberto." };
  const dono = resumo.sessao.operadorId === usuario.id;
  if (!dono && !temPermissao(usuario.permissoes, PERMISSAO.CAIXA_GERENCIAR)) return { ok: false, erro: "Só quem abriu ou um gerente pode fechar este caixa." };

  const real = Math.round(dados.saldoReal * 100);
  const diferenca = real - resumo.totais.esperado;
  if (diferenca !== 0) {
    if (!dados.motivoDiferenca) return { ok: false, erro: "Há diferença no caixa: informe o motivo." };
    if (fin.diferencaCaixaSoGerente && !temPermissao(usuario.permissoes, PERMISSAO.CAIXA_FECHAR_DIFERENCA)) {
      return { ok: false, erro: "Fechamento com diferença precisa de um gerente (Configurações › Financeiro). Chame um gerente para fechar este caixa." };
    }
  }

  // Condicional no status: dois fechamentos simultâneos não gravam duas vezes.
  const r = await prisma.sessaoCaixa.updateMany({
    where: { id: dados.sessaoId, status: "aberto" },
    data: {
      status: "fechado",
      fechadoEm: new Date(),
      fechadoPorId: usuario.id,
      saldoEsperado: dec(resumo.totais.esperado),
      saldoReal: dec(real),
      diferenca: dec(diferenca),
      motivoDiferenca: diferenca !== 0 ? dados.motivoDiferenca : null,
      observacaoFechamento: dados.observacao ?? null,
    },
  });
  if (r.count === 0) return { ok: false, erro: "Este caixa já foi fechado." };
  await prisma.auditoria.create({
    data: {
      acao: "CAIXA_FECHADO",
      modulo: "FINANCEIRO",
      nivel: diferenca !== 0 ? "WARN" : "INFO",
      usuarioId: usuario.id,
      emailUsuario: usuario.email,
      dadosModificados: { sessao_id: dados.sessaoId, esperado: resumo.totais.esperado / 100, real: real / 100, diferenca: diferenca / 100, motivo: dados.motivoDiferenca ?? null },
      ipAddress: ctx.ip ?? null,
      userAgent: ctx.userAgent ?? null,
    },
  });
  return { ok: true, diferenca };
}

export function historicoSessoes(usuario: Usuario, limite = 30) {
  return prisma.sessaoCaixa.findMany({
    where: temPermissao(usuario.permissoes, PERMISSAO.CAIXA_GERENCIAR) ? {} : { operadorId: usuario.id },
    orderBy: { abertoEm: "desc" },
    take: limite,
    include: { operador: { select: { nome: true } } },
  });
}

function auditar(acao: string, usuario: Usuario, ctx: ContextoRequisicao, dados: Prisma.InputJsonObject) {
  return prisma.auditoria.create({
    data: { acao, modulo: "FINANCEIRO", usuarioId: usuario.id, emailUsuario: usuario.email, dadosModificados: dados, ipAddress: ctx.ip ?? null, userAgent: ctx.userAgent ?? null },
  });
}
