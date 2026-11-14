const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatarMoeda(valor: number | string | { toString(): string }): string {
  return moeda.format(Number(valor.toString()));
}
