import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ImprimirAutomatico } from "@/components/pdv/ImprimirAutomatico";
import { getUsuarioAtual } from "@/lib/auth/dal";
import { getConfig } from "@/lib/services/configuracoes.service";
import { buscarVenda } from "@/lib/services/vendas.service";
import { ROTULOS_FORMA } from "@/lib/vendas/calculo";

export const metadata: Metadata = { title: "Cupom" };

const brl = (v: { toString(): string } | number) =>
  Number(v.toString()).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const qtd = (v: { toString(): string }) => Number(v.toString()).toLocaleString("pt-BR", { maximumFractionDigits: 3 });
const cnpj = (d: string) => (d.length === 14 ? d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") : d);

// Fora do layout do dashboard: página limpa para impressão térmica (MODULO_2_2, seção 5.1).
export default async function CupomPage({ params, searchParams }: PageProps<"/cupom/[id]">) {
  const { id } = await params;
  const { imprimir } = await searchParams;
  const usuario = await getUsuarioAtual();
  const venda = await buscarVenda(Number(id), usuario);
  if (!venda) notFound();

  const [empresa, vendas] = await Promise.all([getConfig("empresa"), getConfig("vendas")]);
  const tz = empresa.funcionamento.timezone;
  const data = venda.criadoEm.toLocaleDateString("pt-BR", { timeZone: tz });
  const hora = venda.criadoEm.toLocaleTimeString("pt-BR", { timeZone: tz });
  const largura = vendas.papel === "58mm" ? "58mm" : vendas.papel === "80mm" ? "80mm" : "180mm";
  const e = empresa.endereco;

  return (
    <div className="min-h-screen bg-neutral-100 p-4 text-black print:bg-white print:p-0">
      {/* Tamanho da página = largura da bobina configurada em Configurações › Vendas. */}
      <style>{`@page { size: ${largura} auto; margin: 0; } body { background: white; }`}</style>
      <div className="mx-auto" style={{ width: largura }}>
        <ImprimirAutomatico automatico={imprimir === "1"} />
        <article className="bg-white p-3 font-mono text-[11px] leading-snug shadow print:shadow-none">
          <header className="text-center">
            <p className="text-[13px] font-bold uppercase">{empresa.nomeFantasia || empresa.nome}</p>
            {empresa.nomeFantasia && <p>{empresa.nome}</p>}
            {empresa.cnpj && <p>CNPJ {cnpj(empresa.cnpj)}</p>}
            {e.rua && (
              <p>
                {e.rua}
                {e.numero && `, ${e.numero}`} {e.bairro && `- ${e.bairro}`} {e.cidade && `- ${e.cidade}`}
                {e.uf && `/${e.uf}`}
              </p>
            )}
            {empresa.telefone && <p>Tel. {empresa.telefone}</p>}
          </header>

          <hr className="my-2 border-dashed border-black" />
          <p className="text-center font-bold">RECIBO DE VENDA — NÃO É DOCUMENTO FISCAL</p>
          {venda.status === "cancelada" && <p className="mt-1 text-center text-[13px] font-bold">*** VENDA CANCELADA ***</p>}
          <p className="mt-1">Venda: {venda.numero}</p>
          <p>
            Data: {data} {hora}
          </p>
          <p>Operador: {venda.operador.nome}</p>
          {venda.caixa && <p>Caixa: {venda.caixa}</p>}

          <hr className="my-2 border-dashed border-black" />
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="font-normal">Item</th>
                <th className="text-right font-normal">Qtd</th>
                <th className="text-right font-normal">Total</th>
              </tr>
            </thead>
            <tbody>
              {venda.itens.map((i) => (
                <tr key={i.id} className="align-top">
                  <td className="pr-1">
                    {i.nomeProduto}
                    <br />
                    <span className="text-[10px]">{brl(i.precoUnitario)} {i.unidadeMedida !== "un" && `/${i.unidadeMedida}`}</span>
                  </td>
                  <td className="text-right">{qtd(i.quantidade)}</td>
                  <td className="text-right">{brl(i.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <hr className="my-2 border-dashed border-black" />
          <div className="flex justify-between">
            <span>SUBTOTAL</span>
            <span>{brl(venda.subtotal)}</span>
          </div>
          {Number(venda.descontoValor) > 0 && (
            <div className="flex justify-between">
              <span>
                DESCONTO {venda.cupom ? `(${venda.cupom.codigo})` : venda.descontoPercentual ? `(${Number(venda.descontoPercentual).toLocaleString("pt-BR")}%)` : ""}
              </span>
              <span>-{brl(venda.descontoValor)}</span>
            </div>
          )}
          <div className="mt-1 flex justify-between text-[13px] font-bold">
            <span>TOTAL</span>
            <span>{brl(venda.total)}</span>
          </div>

          <hr className="my-2 border-dashed border-black" />
          {venda.pagamentos.map((p) => (
            <div key={p.id}>
              <div className="flex justify-between">
                <span>
                  {ROTULOS_FORMA[p.forma]}
                  {p.forma === "credito" && p.parcelas > 1 && ` ${p.parcelas}x`}
                </span>
                <span>{brl(p.valor)}</span>
              </div>
              {p.forma === "dinheiro" && p.valorRecebido && (
                <div className="flex justify-between pl-2 text-[10px]">
                  <span>Recebido</span>
                  <span>{brl(p.valorRecebido)}</span>
                </div>
              )}
            </div>
          ))}
          {Number(venda.troco) > 0 && (
            <div className="flex justify-between font-bold">
              <span>TROCO</span>
              <span>{brl(venda.troco)}</span>
            </div>
          )}

          {vendas.rodapeCupom && (
            <>
              <hr className="my-2 border-dashed border-black" />
              <p className="text-center">{vendas.rodapeCupom}</p>
            </>
          )}
        </article>
      </div>
    </div>
  );
}
