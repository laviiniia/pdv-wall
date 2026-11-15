// Cálculos do PDV em centavos inteiros (sem erro de ponto flutuante).
// Usado pela tela (prévia) e pelo servidor (valor oficial, sempre recalculado com os preços do banco).

export type Desconto = { tipo: "percentual" | "valor"; valor: number } | null;

export const centavos = (reais: number) => Math.round(reais * 100);
export const reais = (centavos: number) => centavos / 100;

/** Subtotal de um item: preço × quantidade (quantidade pode ser fracionada para kg/L). */
export function subtotalItem(precoCentavos: number, quantidade: number) {
  return Math.round(precoCentavos * quantidade);
}

export function calcularTotais(itens: { precoCentavos: number; quantidade: number }[], desconto: Desconto) {
  const subtotal = itens.reduce((s, i) => s + subtotalItem(i.precoCentavos, i.quantidade), 0);
  let descontoValor = 0;
  if (desconto && subtotal > 0) {
    descontoValor =
      desconto.tipo === "percentual" ? Math.round((subtotal * desconto.valor) / 100) : centavos(desconto.valor);
  }
  descontoValor = Math.min(Math.max(descontoValor, 0), subtotal);
  const descontoPercentual = subtotal > 0 ? Math.round((descontoValor / subtotal) * 10000) / 100 : 0;
  return { subtotal, descontoValor, descontoPercentual, total: subtotal - descontoValor };
}

export type FormaPagamento = "dinheiro" | "debito" | "credito" | "pix" | "voucher";

export const ROTULOS_FORMA: Record<FormaPagamento, string> = {
  dinheiro: "Dinheiro",
  debito: "Débito",
  credito: "Crédito",
  pix: "PIX",
  voucher: "Vale/voucher",
};

export type PagamentoEntrada = {
  forma: FormaPagamento;
  /** Parte do total paga nesta forma, em centavos. */
  valor: number;
  /** Dinheiro: quanto o cliente entregou, em centavos. */
  recebido?: number;
  /** Crédito: número de parcelas. */
  parcelas?: number;
  numeroTransacao?: string;
};

export const PARCELA_MINIMA_CENTAVOS = 500; // doc: cada parcela mínima R$ 5,00

/**
 * Valida os pagamentos contra o total. Regras (MODULO_2_2, seção 4):
 * soma das partes = total; dinheiro recebido ≥ parte; parcelas dentro do limite e ≥ R$ 5,00 cada.
 * Devolve o troco total (só sai do dinheiro).
 */
export function validarPagamentos(
  total: number,
  pagamentos: PagamentoEntrada[],
  opcoes: { formasAceitas: readonly FormaPagamento[]; parcelamentoMax: number },
): { ok: true; troco: number } | { ok: false; erro: string } {
  if (total === 0) {
    return pagamentos.length === 0 ? { ok: true, troco: 0 } : { ok: false, erro: "Venda com total zero não recebe pagamento." };
  }
  if (pagamentos.length === 0) return { ok: false, erro: "Informe a forma de pagamento." };

  let soma = 0;
  let troco = 0;
  for (const p of pagamentos) {
    const nome = ROTULOS_FORMA[p.forma];
    if (!opcoes.formasAceitas.includes(p.forma)) return { ok: false, erro: `${nome} não está habilitado nas configurações.` };
    if (!Number.isInteger(p.valor) || p.valor <= 0) return { ok: false, erro: `Informe o valor pago em ${nome}.` };
    soma += p.valor;

    if (p.forma === "dinheiro") {
      const recebido = p.recebido ?? p.valor;
      if (recebido < p.valor) return { ok: false, erro: "Valor recebido em dinheiro é insuficiente." };
      troco += recebido - p.valor;
    }
    if (p.forma === "credito") {
      const parcelas = p.parcelas ?? 1;
      if (!Number.isInteger(parcelas) || parcelas < 1 || parcelas > opcoes.parcelamentoMax) {
        return { ok: false, erro: `Parcelamento máximo: ${opcoes.parcelamentoMax}x.` };
      }
      if (parcelas > 1 && Math.floor(p.valor / parcelas) < PARCELA_MINIMA_CENTAVOS) {
        return { ok: false, erro: "Cada parcela precisa ser de pelo menos R$ 5,00." };
      }
    }
  }

  if (soma !== total) {
    const diferenca = Math.abs(total - soma) / 100;
    const texto = diferenca.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    return { ok: false, erro: soma < total ? `Faltam ${texto} para fechar o total.` : `Os pagamentos passam do total em ${texto}.` };
  }
  return { ok: true, troco };
}

/** Valor de cada parcela (a última absorve os centavos de diferença), como no exemplo da doc. */
export function dividirParcelas(valor: number, parcelas: number) {
  const base = Math.floor(valor / parcelas);
  return Array.from({ length: parcelas }, (_, i) => (i === parcelas - 1 ? valor - base * (parcelas - 1) : base));
}
