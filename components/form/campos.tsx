"use client";

import { cn } from "@/lib/utils";
import { useFormCtx } from "./FormCtx";

const inputBase =
  "h-9 rounded-md border bg-background px-3 text-sm font-normal outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive disabled:bg-muted/50 disabled:text-muted-foreground";

function Erro({ nome }: { nome: string }) {
  const { erros } = useFormCtx();
  const msg = erros[nome]?.[0];
  return msg ? <span className="text-xs font-normal text-destructive">{msg}</span> : null;
}

function Ajuda({ children }: { children?: React.ReactNode }) {
  return children ? <span className="text-xs font-normal text-muted-foreground">{children}</span> : null;
}

export function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="border-b pb-2 text-sm font-semibold">{titulo}</h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

type BaseProps = { nome: string; rotulo: string; ajuda?: React.ReactNode; largo?: boolean };

export function CampoTexto({
  nome,
  rotulo,
  ajuda,
  largo,
  valor,
  tipo = "text",
  className,
  ...rest
}: BaseProps & { valor: string; tipo?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  const { erros } = useFormCtx();
  return (
    <label className={cn("flex flex-col gap-1.5 text-sm font-medium", largo && "sm:col-span-2")}>
      {rotulo}
      <input
        name={nome}
        type={tipo}
        defaultValue={valor}
        aria-invalid={!!erros[nome]}
        className={cn(inputBase, className)}
        {...rest}
      />
      <Ajuda>{ajuda}</Ajuda>
      <Erro nome={nome} />
    </label>
  );
}

export function CampoTextoLongo({
  nome,
  rotulo,
  ajuda,
  valor,
  max,
}: BaseProps & { valor: string; max?: number }) {
  const { erros } = useFormCtx();
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium sm:col-span-2">
      {rotulo}
      <textarea
        name={nome}
        defaultValue={valor}
        maxLength={max}
        rows={3}
        aria-invalid={!!erros[nome]}
        className={cn(inputBase, "h-auto py-2")}
      />
      <Ajuda>{ajuda}</Ajuda>
      <Erro nome={nome} />
    </label>
  );
}

/** Número com prefixo/sufixo (R$, %, min). Aceita vírgula decimal. */
export function CampoNumero({
  nome,
  rotulo,
  ajuda,
  valor,
  prefixo,
  sufixo,
}: BaseProps & { valor: number; prefixo?: string; sufixo?: string }) {
  const { erros } = useFormCtx();
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      {rotulo}
      <span className="flex items-center gap-2">
        {prefixo && <span className="text-sm font-normal text-muted-foreground">{prefixo}</span>}
        <input
          name={nome}
          inputMode="decimal"
          defaultValue={String(valor).replace(".", ",")}
          aria-invalid={!!erros[nome]}
          className={cn(inputBase, "w-28 text-right tabular-nums")}
        />
        {sufixo && <span className="text-sm font-normal text-muted-foreground">{sufixo}</span>}
      </span>
      <Ajuda>{ajuda}</Ajuda>
      <Erro nome={nome} />
    </label>
  );
}

export function CampoSelect({
  nome,
  rotulo,
  ajuda,
  valor,
  opcoes,
}: BaseProps & { valor: string; opcoes: Record<string, string> | readonly string[] }) {
  const { erros } = useFormCtx();
  const pares = Array.isArray(opcoes) ? opcoes.map((o) => [o, o] as const) : Object.entries(opcoes);
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      {rotulo}
      <select name={nome} defaultValue={valor} aria-invalid={!!erros[nome]} className={inputBase}>
        {pares.map(([v, r]) => (
          <option key={v} value={v}>
            {r}
          </option>
        ))}
      </select>
      <Ajuda>{ajuda}</Ajuda>
      <Erro nome={nome} />
    </label>
  );
}

export function CampoCheckbox({ nome, rotulo, ajuda, largo, valor }: BaseProps & { valor: boolean }) {
  return (
    <label className={cn("flex items-start gap-2.5 text-sm", largo && "sm:col-span-2")}>
      <input type="checkbox" name={nome} value="true" defaultChecked={valor} className="mt-0.5 size-4 accent-primary" />
      <span className="flex flex-col gap-0.5">
        <span className="font-medium">{rotulo}</span>
        <Ajuda>{ajuda}</Ajuda>
        <Erro nome={nome} />
      </span>
    </label>
  );
}

/** Grupo de checkboxes que vira uma lista. Declara o campo em `__lista__` para a action. */
export function CampoLista({
  nome,
  rotulo,
  ajuda,
  opcoes,
  valores,
  inline,
}: BaseProps & { opcoes: [string, string][]; valores: string[]; inline?: boolean }) {
  return (
    <fieldset className="flex flex-col gap-2 text-sm sm:col-span-2">
      <legend className="mb-1.5 font-medium">{rotulo}</legend>
      <input type="hidden" name="__lista__" value={nome} />
      <div className={cn("flex gap-x-5 gap-y-2", inline ? "flex-row flex-wrap" : "flex-col")}>
        {opcoes.map(([v, r]) => (
          <label key={v} className="flex items-center gap-2">
            <input type="checkbox" name={nome} value={v} defaultChecked={valores.includes(v)} className="size-4 accent-primary" />
            {r}
          </label>
        ))}
      </div>
      <Ajuda>{ajuda}</Ajuda>
      <Erro nome={nome} />
    </fieldset>
  );
}
