"use client";

import { useState, useTransition } from "react";
import { gerarSenhaTemporaria } from "@/app/(dashboard)/equipe/actions";
import { Button } from "@/components/ui/button";

/** Gera uma senha temporária para outra pessoa e mostra uma única vez. */
export function SenhaTemporaria({ usuarioId, nome, compacto }: { usuarioId: number; nome: string; compacto?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<{ email: string; senha: string } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  if (resultado) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-left text-sm" role="status">
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
          <dt className="text-muted-foreground">Login</dt>
          <dd>{resultado.email}</dd>
          <dt className="text-muted-foreground">Senha temporária</dt>
          <dd className="font-mono" data-testid="senha-temporaria">{resultado.senha}</dd>
        </dl>
        <p className="text-xs text-muted-foreground">Anote agora: não será mostrada de novo. {nome} vai trocar a senha ao entrar.</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(`Login: ${resultado.email}\nSenha temporária: ${resultado.senha}`);
              setCopiado(true);
            } catch {
              setCopiado(false);
            }
          }}
        >
          {copiado ? "Copiado!" : "Copiar"}
        </Button>
      </div>
    );
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="outline"
        size={compacto ? "sm" : "default"}
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`Gerar uma senha temporária para ${nome}?\n\nA senha atual deixa de valer e quem estiver logado com ela é desconectado.`)) return;
          setErro(null);
          startTransition(async () => {
            const r = await gerarSenhaTemporaria(usuarioId);
            if (r.ok) setResultado({ email: r.email, senha: r.senha });
            else setErro(r.erro);
          });
        }}
      >
        {pending ? "Gerando..." : "Gerar senha temporária"}
      </Button>
      {erro && <span role="alert" className="text-xs text-destructive">{erro}</span>}
    </span>
  );
}
