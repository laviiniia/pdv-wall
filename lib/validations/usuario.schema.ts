import { z } from "zod";
import { ROLES } from "@/lib/constants/roles";
import { senhaForteSchema } from "./auth.schema";

const opcional = (s: z.ZodString) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), s.optional());

const base = {
  nome: z.string().trim().min(3, "Informe o nome completo").max(150),
  email: z.email("Informe um e-mail válido").trim().toLowerCase().max(255),
  telefone: opcional(z.string().trim().max(20, "Telefone muito longo")),
  role: z.enum([ROLES.ADMIN, ROLES.GERENTE, ROLES.OPERADOR], "Selecione o perfil"),
  ativo: z.boolean(),
};

export const MODOS_SENHA = {
  LINK: "link", // envia link para o usuário definir a própria senha
  TEMPORARIA: "temporaria", // gera senha temporária; troca obrigatória no 1º acesso
  DEFINIR: "definir", // admin define agora; troca obrigatória no 1º acesso
} as const;

export const criarUsuarioSchema = z.discriminatedUnion("modoSenha", [
  z.object({ ...base, modoSenha: z.literal(MODOS_SENHA.LINK) }),
  z.object({ ...base, modoSenha: z.literal(MODOS_SENHA.TEMPORARIA) }),
  z.object({ ...base, modoSenha: z.literal(MODOS_SENHA.DEFINIR), senha: senhaForteSchema }),
]);

export const editarUsuarioSchema = z.object({
  ...base,
  id: z.coerce.number().int().positive(),
  bloqueado: z.boolean(),
});

export type CriarUsuarioInput = z.infer<typeof criarUsuarioSchema>;
export type EditarUsuarioInput = z.infer<typeof editarUsuarioSchema>;
