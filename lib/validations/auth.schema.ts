import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Informe um e-mail válido").trim().toLowerCase(),
  senha: z.string().min(1, "Informe a senha"),
  manterConectado: z.boolean().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const recuperarSenhaSchema = z.object({
  email: z.email("Informe um e-mail válido").trim().toLowerCase(),
});

// Requisitos de senha (MODULO_3). Compartilhado com o formulário para o checklist ao vivo.
export const REQUISITOS_SENHA = [
  { id: "tamanho", texto: "Mínimo 8 caracteres", teste: (s: string) => s.length >= 8 },
  { id: "maiuscula", texto: "Contém letra maiúscula", teste: (s: string) => /[A-Z]/.test(s) },
  { id: "numero", texto: "Contém número", teste: (s: string) => /\d/.test(s) },
  { id: "simbolo", texto: "Contém símbolo", teste: (s: string) => /[^A-Za-z0-9]/.test(s) },
] as const;

export const senhaForteSchema = z
  .string()
  .max(72, "Máximo 72 caracteres") // limite do bcrypt
  .superRefine((senha, ctx) => {
    for (const r of REQUISITOS_SENHA) {
      if (!r.teste(senha)) ctx.addIssue({ code: "custom", message: r.texto });
    }
  });

export const redefinirSenhaSchema = z
  .object({
    token: z.string().min(1),
    senha: senhaForteSchema,
    confirmacao: z.string(),
  })
  .refine((d) => d.senha === d.confirmacao, {
    message: "As senhas não conferem",
    path: ["confirmacao"],
  });
