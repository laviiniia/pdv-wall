import "server-only";

type Email = { para: string; assunto: string; html: string; texto: string };

/**
 * Envia e-mail pela API do Resend quando RESEND_API_KEY e EMAIL_FROM estão configurados.
 * Sem eles (desenvolvimento), só imprime o conteúdo no terminal do `next dev`.
 */
export async function enviarEmail({ para, assunto, html, texto }: Email) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY/EMAIL_FROM não configurados: não é possível enviar e-mail.");
    }
    console.info(`\n[email:dev] Para: ${para}\n[email:dev] Assunto: ${assunto}\n${texto}\n`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [para], subject: assunto, html, text: texto }),
  });

  if (!res.ok) {
    throw new Error(`Falha ao enviar e-mail (Resend ${res.status}): ${await res.text()}`);
  }
}
