// Datas no fuso da empresa (Configurações › Empresa › timezone), independentemente
// do fuso do servidor (na Vercel, o servidor roda em UTC).

/** "AAAA-MM-DD" da data no fuso informado. */
export function dataNoFuso(data: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(data);
}

/** Diferença (ms) entre o fuso e o UTC naquele instante. */
function deslocamento(instante: number, timeZone: string) {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(new Date(instante))
      .map((p) => [p.type, p.value]),
  );
  const comoUTC = Date.UTC(+partes.year, +partes.month - 1, +partes.day, +partes.hour, +partes.minute, +partes.second);
  return comoUTC - instante;
}

/** Início e fim (exclusivo) do dia "AAAA-MM-DD" no fuso, como instantes UTC. */
export function intervaloDoDia(dia: string, timeZone: string) {
  const [a, m, d] = dia.split("-").map(Number);
  const meiaNoiteUTC = Date.UTC(a, m - 1, d);
  const inicio = meiaNoiteUTC - deslocamento(meiaNoiteUTC, timeZone);
  const proxima = Date.UTC(a, m - 1, d + 1);
  const fim = proxima - deslocamento(proxima, timeZone);
  return { inicio: new Date(inicio), fim: new Date(fim) };
}
