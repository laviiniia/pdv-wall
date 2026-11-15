"use client";

import { useState, useTransition } from "react";
import { enviarEmailTeste } from "@/app/(dashboard)/configuracoes/actions";
import { Selo } from "@/components/produtos/Selos";
import { Button } from "@/components/ui/button";

/** Situação do envio de e-mail (Resend) com botão de teste. A chave nunca chega ao navegador. */
export function TesteEmail({ situacao }: { situacao: { ativo: boolean; temChave: boolean; remetente: string | null; remetenteDeTeste: boolean } }) {
  const [pending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<{ ok: boolean; mensagem: string } | null>(null);

  return (
    <section className="mt-10 max-w-3xl border-t pt-6">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold">Envio de e-mail (Resend)</h2>
        {situacao.ativo ? <Selo tom="ok">Configurado</Selo> : <Selo tom="aviso">Não configurado</Selo>}
      </div>
      <p className="mb-3 text-sm text-muted-foreground">
        Usado para recuperação de senha e convite de novos usuários. A chave e o remetente ficam nas variáveis de ambiente do servidor.
      </p>
      <dl className="mb-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted-foreground">RESEND_API_KEY</dt>
        <dd>{situacao.temChave ? "definida" : <span className="text-destructive">falta</span>}</dd>
        <dt className="text-muted-foreground">EMAIL_FROM</dt>
        <dd className="break-all">{situacao.remetente ?? <span className="text-destructive">falta</span>}</dd>
      </dl>
      {situacao.remetenteDeTeste && (
        <p className="mb-3 rounded-md bg-amber-500/10 px-3 py-2 text-sm">
          Remetente de teste do Resend: só entrega para o e-mail da sua conta no Resend. Para enviar a qualquer pessoa, verifique um domínio no Resend e use um endereço dele.
        </p>
      )}
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={() => {
          setResultado(null);
          startTransition(async () => setResultado(await enviarEmailTeste()));
        }}
      >
        {pending ? "Enviando..." : "Enviar e-mail de teste para mim"}
      </Button>
      {resultado && (
        <p role={resultado.ok ? "status" : "alert"} className={`mt-3 rounded-md px-3 py-2 text-sm ${resultado.ok ? "bg-emerald-500/10" : "bg-destructive/10 text-destructive"}`}>
          {resultado.mensagem}
        </p>
      )}
    </section>
  );
}
