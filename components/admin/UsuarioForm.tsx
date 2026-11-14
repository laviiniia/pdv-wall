"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { criar, editar } from "@/app/(dashboard)/admin/usuarios/actions";
import { CamposNovaSenha, inputClass } from "@/components/auth/CamposNovaSenha";
import { Button } from "@/components/ui/button";
import { ROLES } from "@/lib/constants/roles";
import { MODOS_SENHA } from "@/lib/validations/usuario.schema";

export type UsuarioEditavel = {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  role: string;
  ativo: boolean;
  bloqueado: boolean;
};

const PERFIS = [
  { valor: ROLES.ADMIN, rotulo: "Administrador", descricao: "Acesso total, inclusive usuários" },
  { valor: ROLES.GERENTE, rotulo: "Gerente", descricao: "Vendas, estoque, financeiro e relatórios" },
  { valor: ROLES.OPERADOR, rotulo: "Operador", descricao: "PDV, pedidos e caixa" },
];

const MODOS = [
  { valor: MODOS_SENHA.LINK, rotulo: "Enviar link por e-mail", descricao: "O usuário define a própria senha (link válido por 72h)" },
  { valor: MODOS_SENHA.TEMPORARIA, rotulo: "Gerar senha temporária", descricao: "Mostrada uma vez; troca obrigatória no 1º acesso" },
  { valor: MODOS_SENHA.DEFINIR, rotulo: "Definir agora", descricao: "Troca obrigatória no 1º acesso" },
];

export function UsuarioForm({ usuario }: { usuario?: UsuarioEditavel }) {
  const edicao = !!usuario;
  const [state, action, pending] = useActionState(edicao ? editar : criar, undefined);
  const [modoSenha, setModoSenha] = useState<string>(MODOS_SENHA.LINK);
  const v = state?.valores;

  if (state?.criado) return <SenhaTemporariaCriada {...state.criado} />;

  const erro = (campo: keyof NonNullable<NonNullable<typeof state>["campos"]>) =>
    state?.campos?.[campo] && <span className="text-xs font-normal text-destructive">{state.campos[campo]![0]}</span>;

  // Em erro, o formulário volta com o que foi digitado; senão, com os dados do usuário.
  const padrao = (campo: string, original?: string | null) => v?.[campo] ?? original ?? "";
  const marcado = (campo: string, original: boolean) => (v ? v[campo] === "on" : original);

  return (
    <form action={action} className="flex max-w-xl flex-col gap-6" noValidate>
      {edicao && <input type="hidden" name="id" value={usuario.id} />}

      {state?.erro && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.erro}
        </p>
      )}

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 text-sm font-semibold">Informações pessoais</legend>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Nome completo
          <input name="nome" required defaultValue={padrao("nome", usuario?.nome)} aria-invalid={!!state?.campos?.nome} className={inputClass} />
          {erro("nome")}
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          E-mail
          <input name="email" type="email" required defaultValue={padrao("email", usuario?.email)} aria-invalid={!!state?.campos?.email} className={inputClass} />
          {erro("email")}
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Telefone <span className="font-normal text-muted-foreground">(opcional)</span>
          <input name="telefone" type="tel" defaultValue={padrao("telefone", usuario?.telefone)} aria-invalid={!!state?.campos?.telefone} className={inputClass} />
          {erro("telefone")}
        </label>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-sm font-semibold">Acesso</legend>
        <div className="flex flex-col gap-2">
          {PERFIS.map((p) => (
            <label key={p.valor} className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-checked:border-primary has-checked:bg-primary/5">
              <input
                type="radio"
                name="role"
                value={p.valor}
                defaultChecked={padrao("role", usuario?.role ?? ROLES.OPERADOR) === p.valor}
                className="mt-0.5 accent-primary"
              />
              <span className="text-sm">
                <span className="font-medium">{p.rotulo}</span>
                <span className="block text-muted-foreground">{p.descricao}</span>
              </span>
            </label>
          ))}
          {erro("role")}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="ativo" defaultChecked={marcado("ativo", usuario?.ativo ?? true)} className="size-4 accent-primary" />
          Ativo <span className="text-muted-foreground">(desmarcado = não consegue entrar)</span>
        </label>
        {edicao && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="bloqueado" defaultChecked={marcado("bloqueado", usuario.bloqueado)} className="size-4 accent-primary" />
            Bloqueado
          </label>
        )}
      </fieldset>

      {!edicao && (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-semibold">Senha inicial</legend>
          {MODOS.map((m) => (
            <label key={m.valor} className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-checked:border-primary has-checked:bg-primary/5">
              <input
                type="radio"
                name="modoSenha"
                value={m.valor}
                checked={modoSenha === m.valor}
                onChange={() => setModoSenha(m.valor)}
                className="mt-0.5 accent-primary"
              />
              <span className="text-sm">
                <span className="font-medium">{m.rotulo}</span>
                <span className="block text-muted-foreground">{m.descricao}</span>
              </span>
            </label>
          ))}
          {modoSenha === MODOS_SENHA.DEFINIR && (
            <div className="flex flex-col gap-4 pt-1">
              <CamposNovaSenha erros={state?.campos} rotulo="Senha" />
            </div>
          )}
        </fieldset>
      )}

      <div className="flex gap-2">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Salvando..." : edicao ? "Salvar alterações" : "Criar usuário"}
        </Button>
        <Link href="/admin/usuarios" className="inline-flex h-9 items-center rounded-lg px-3 text-sm hover:bg-muted">
          Cancelar
        </Link>
      </div>
    </form>
  );
}

function SenhaTemporariaCriada({ nome, email, senhaTemporaria }: { nome: string; email: string; senhaTemporaria: string }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(`Login: ${email}\nSenha temporária: ${senhaTemporaria}`);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  };

  return (
    <div className="flex max-w-xl flex-col gap-4 rounded-xl border p-5">
      <p className="font-medium">Usuário {nome} criado.</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted-foreground">Login</dt>
        <dd>{email}</dd>
        <dt className="text-muted-foreground">Senha temporária</dt>
        <dd className="font-mono" data-testid="senha-temporaria">{senhaTemporaria}</dd>
      </dl>
      <p className="rounded-md bg-amber-500/10 px-3 py-2 text-sm">
        Anote ou copie agora: a senha não será mostrada de novo. O usuário vai precisar trocá-la no primeiro acesso.
      </p>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={copiar}>
          {copiado ? "Copiado!" : "Copiar dados"}
        </Button>
        <Link href="/admin/usuarios" className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground">
          Concluir
        </Link>
      </div>
    </div>
  );
}
