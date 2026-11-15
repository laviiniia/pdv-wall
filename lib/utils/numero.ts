/**
 * Lê número digitado em formato brasileiro ou internacional.
 * Aceita "2,50", "2.50" e "1.234,56"; vazio → undefined.
 * O ponto só é tratado como separador de milhar quando também há vírgula.
 */
export function lerNumero(v: string) {
  let t = v.trim().replace(/^R\$\s*/, "");
  if (t === "") return undefined;
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  return Number(t);
}

/** 2.5 → "2,50" (para preencher inputs de dinheiro). */
export function numeroParaInput(n: number | string | { toString(): string }, casas = 2) {
  return Number(n.toString()).toFixed(casas).replace(".", ",");
}
