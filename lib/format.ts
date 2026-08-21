export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDistance(km: number | null): string {
  if (km == null) return 'Distância indisponível';
  if (km < 0.1) return 'A menos de 100 m';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1).replace('.', ',')} km`;
}

export function formatClock(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function minutesOpen(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}

export function statusLabel(status: string): string {
  if (status === 'aberta') return 'Aberta';
  if (status === 'finalizada') return 'Finalizada';
  if (status === 'cancelada') return 'Cancelada';
  return status;
}
