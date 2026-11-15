import "server-only";
import { prisma } from "@/lib/prisma";

type Email = { para: string; assunto: string; html: string; texto: string };

/** Erro de envio com mensagem já explicada para quem administra o sistema. */
export class ErroEmail extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ErroEmail";
  }
}

/** Situação da configuração do Resend (sem expor a chave). */
export function situacaoEmail() {
  const temChave = !!process.env.RESEND_API_KEY;
  const remetente = process.env.EMAIL_FROM || null;
  return {
    ativo: temChave && !!remetente,
    temChave,
    remetente,
    /** onboarding@resend.dev só entrega para o e-mail da própria conta do Resend (modo de teste). */
    remetenteDeTeste: !!remetente && remetente.includes("@resend.dev"),
  };
}

/** Traduz as respostas de erro do Resend para algo acionável. */
function explicar(status: number, corpo: string) {
  let msg = corpo;
  try {
    msg = (JSON.parse(corpo) as { message?: string }).message ?? corpo;
  } catch {}
  if (status === 401 || status === 403) {
    // A ordem importa: a mensagem do modo de teste também fala em "domain".
    if (/testing emails|own email/i.test(msg)) {
      return "Modo de teste do Resend: com o remetente onboarding@resend.dev só dá para enviar para o e-mail da sua conta no Resend. Use esse e-mail no seu usuário ou verifique um domínio em resend.com/domains.";
    }
    if (/domain/i.test(msg)) return `O domínio do remetente (EMAIL_FROM) não está verificado no Resend. ${msg}`;
    return `Chave do Resend (RESEND_API_KEY) inválida ou sem permissão de envio. ${msg}`;
  }
  if (status === 422) return `O Resend recusou o e-mail (verifique o EMAIL_FROM e o destinatário). ${msg}`;
  if (status === 429) return "Limite de envios do Resend atingido. Tente de novo em instantes.";
  return `Falha no Resend (${status}). ${msg}`;
}

/**
 * Envia e-mail pela API do Resend quando RESEND_API_KEY e EMAIL_FROM estão configurados.
 * Sem eles (desenvolvimento), só imprime o conteúdo no terminal do `next dev`.
 * Falhas são registradas na auditoria (EMAIL_FALHA) e relançadas como ErroEmail.
 */
export async function enviarEmail({ para, assunto, html, texto }: Email): Promise<{ id: string | null; simulado: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    if (process.env.NODE_ENV === "production") {
      throw new ErroEmail("RESEND_API_KEY/EMAIL_FROM não configurados: não é possível enviar e-mail.");
    }
    console.info(`\n[email:dev] Para: ${para}\n[email:dev] Assunto: ${assunto}\n${texto}\n`);
    return { id: null, simulado: true };
  }

  let res: Response;
  try {
    res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [para],
        subject: assunto,
        html,
        text: texto,
        ...(process.env.EMAIL_REPLY_TO && { reply_to: process.env.EMAIL_REPLY_TO }),
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (e) {
    const erro = new ErroEmail(`Não foi possível falar com o Resend (${e instanceof Error ? e.message : "erro de rede"}).`);
    await registrarFalha(para, assunto, erro);
    throw erro;
  }

  if (!res.ok) {
    const erro = new ErroEmail(explicar(res.status, await res.text()), res.status);
    await registrarFalha(para, assunto, erro);
    throw erro;
  }
  const corpo = (await res.json().catch(() => ({}))) as { id?: string };
  return { id: corpo.id ?? null, simulado: false };
}

function registrarFalha(para: string, assunto: string, erro: ErroEmail) {
  console.error("[email] falha no envio:", erro.message);
  return prisma.auditoria
    .create({
      data: {
        acao: "EMAIL_FALHA",
        modulo: "EMAIL",
        nivel: "ERROR",
        sucesso: false,
        mensagemErro: erro.message.slice(0, 1000),
        dadosModificados: { para, assunto, status: erro.status ?? null },
      },
    })
    .catch(() => {});
}
