export function PageHeader({ titulo, descricao }: { titulo: string; descricao?: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
      {descricao && <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>}
    </header>
  );
}
