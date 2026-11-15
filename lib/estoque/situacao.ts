// Níveis de alerta de estoque (MODULO_2_4, seção 4.1 + Configurações › Estoque).
// Os percentuais são "acima do mínimo": com mínimo 10, crítico 20% e baixo 50%,
//   0 ............ sem estoque
//   ≤ 12 ......... crítico   (10 + 20%)
//   ≤ 15 ......... baixo     (10 + 50%)
//   > 15 ......... normal
// Com mínimo 0, só "sem estoque" (≤ 0) dispara alerta.

export type SituacaoEstoque = "sem_estoque" | "critico" | "baixo" | "normal";

export function situacaoEstoque(quantidade: number, minimo: number, cfg: { nivelCriticoPct: number; nivelBaixoPct: number }): SituacaoEstoque {
  if (quantidade <= 0) return "sem_estoque";
  if (minimo <= 0) return "normal";
  if (quantidade <= minimo * (1 + cfg.nivelCriticoPct / 100)) return "critico";
  if (quantidade <= minimo * (1 + cfg.nivelBaixoPct / 100)) return "baixo";
  return "normal";
}

export const ROTULOS_SITUACAO: Record<SituacaoEstoque, string> = {
  sem_estoque: "Sem estoque",
  critico: "Crítico",
  baixo: "Baixo",
  normal: "Normal",
};

export const ORDEM_SITUACAO: Record<SituacaoEstoque, number> = { sem_estoque: 0, critico: 1, baixo: 2, normal: 3 };

export type TipoMovimento =
  | "entrada"
  | "venda"
  | "estorno_venda"
  | "devolucao"
  | "dano"
  | "perda"
  | "ajuste"
  | "inventario"
  | "desfazimento";

export const ROTULOS_MOVIMENTO: Record<TipoMovimento, string> = {
  entrada: "Entrada",
  venda: "Venda",
  estorno_venda: "Venda cancelada",
  devolucao: "Devolução",
  dano: "Dano",
  perda: "Perda",
  ajuste: "Ajuste",
  inventario: "Inventário",
  desfazimento: "Desfazimento",
};

/** Movimentos lançados à mão que podem ser desfeitos (vendas se desfazem cancelando a venda). */
export const TIPOS_DESFAZIVEIS: TipoMovimento[] = ["entrada", "devolucao", "dano", "perda", "ajuste"];

/** Quantidade aceita pela unidade: "un" só inteiro; kg/g/L/ml até 3 casas. */
export function quantidadeValida(qtd: number, unidade: string) {
  if (!Number.isFinite(qtd) || qtd <= 0) return false;
  if (unidade === "un") return Number.isInteger(qtd);
  return Math.abs(qtd * 1000 - Math.round(qtd * 1000)) < 1e-6;
}
