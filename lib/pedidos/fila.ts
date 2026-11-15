// Fila inteligente (MODULO_2_3, seção 5.1):
//   tempo estimado = maior tempo de preparo entre os itens + espera da fila
//   espera da fila  = maior tempo restante entre os pedidos à frente (a cozinha trabalha em paralelo)

export type StatusPedido = "confirmado" | "preparando" | "pausado" | "pronto" | "entregue" | "cancelado";

export const STATUS_ATIVOS: StatusPedido[] = ["confirmado", "preparando", "pausado"];

export type PedidoNaFila = {
  status: StatusPedido;
  tempoPreparoMin: number;
  iniciadoEm: Date | null;
};

/** Minutos que ainda faltam para um pedido ficar pronto. */
export function minutosRestantes(p: PedidoNaFila, agora = new Date()) {
  if (!STATUS_ATIVOS.includes(p.status)) return 0;
  if (p.status === "preparando" && p.iniciadoEm) {
    const decorridos = (agora.getTime() - p.iniciadoEm.getTime()) / 60_000;
    return Math.max(0, Math.ceil(p.tempoPreparoMin - decorridos));
  }
  // Aguardando ou pausado: ainda vai precisar do tempo inteiro.
  return p.tempoPreparoMin;
}

export function esperaDaFila(aFrente: PedidoNaFila[], agora = new Date()) {
  return aFrente.reduce((max, p) => Math.max(max, minutosRestantes(p, agora)), 0);
}

export function tempoPreparoDoPedido(temposItens: number[]) {
  return temposItens.reduce((max, t) => Math.max(max, t), 0);
}

/** Previsão atual de um pedido (recalculada a cada consulta: a fila anda). */
export function previsaoMinutos(pedido: PedidoNaFila, aFrente: PedidoNaFila[], agora = new Date()) {
  if (pedido.status === "preparando" || pedido.status === "pausado") return minutosRestantes(pedido, agora);
  if (pedido.status !== "confirmado") return 0;
  return pedido.tempoPreparoMin + esperaDaFila(aFrente, agora);
}

/** "HH:MM" está dentro do intervalo? Aceita intervalo que vira a meia-noite (ex.: 18:00 → 02:00). */
export function dentroDoHorario(agoraHHMM: string, inicio: string, fim: string) {
  if (inicio === fim) return true;
  return inicio < fim ? agoraHHMM >= inicio && agoraHHMM < fim : agoraHHMM >= inicio || agoraHHMM < fim;
}

/** Transições permitidas no painel da cozinha (seção 7.1.2). */
export const TRANSICOES: Record<StatusPedido, StatusPedido[]> = {
  confirmado: ["preparando", "cancelado"],
  preparando: ["pausado", "pronto", "cancelado"],
  pausado: ["preparando", "cancelado"],
  pronto: ["entregue", "preparando"], // "reabrir" volta para preparo
  entregue: [],
  cancelado: [],
};

export const ROTULOS_STATUS: Record<StatusPedido, string> = {
  confirmado: "Aguardando",
  preparando: "Preparando",
  pausado: "Pausado",
  pronto: "Pronto",
  entregue: "Entregue",
  cancelado: "Cancelado",
};
