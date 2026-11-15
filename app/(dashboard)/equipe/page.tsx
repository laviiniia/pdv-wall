import type { Metadata } from "next";
import { SenhaTemporaria } from "@/components/admin/SenhaTemporaria";
import { PageHeader } from "@/components/layout/PageHeader";
import { Selo } from "@/components/produtos/Selos";
import { exigirPermissao } from "@/lib/auth/dal";
import { PERMISSAO } from "@/lib/constants/roles";
import { equipeParaRedefinir } from "@/lib/services/usuarios.service";

export const metadata: Metadata = { title: "Equipe" };

const PERFIS: Record<string, string> = { admin: "Administrador", gerente: "Gerente", operador: "Operador" };
const dataHora = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default async function EquipePage() {
  const usuario = await exigirPermissao(PERMISSAO.USUARIOS_REDEFINIR_SENHA);
  const equipe = await equipeParaRedefinir(usuario);

  return (
    <>
      <PageHeader
        titulo="Equipe"
        descricao="Esqueceu a senha ou bloqueou a conta? Gere uma senha temporária: a pessoa entra com ela e escolhe uma nova."
      />
      {equipe.length === 0 ? (
        <p className="max-w-xl rounded-md bg-muted px-3 py-2 text-sm">Nenhum operador ativo.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Perfil</th>
                <th className="px-4 py-3 font-medium">Situação</th>
                <th className="px-4 py-3 font-medium">Último acesso</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {equipe.map((p) => (
                <tr key={p.id} className="align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium">{p.nome}</div>
                    <div className="text-xs text-muted-foreground">{p.email}</div>
                  </td>
                  <td className="px-4 py-3">{PERFIS[p.role.nome] ?? p.role.nome}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.bloqueado ? <Selo tom="erro">Bloqueado</Selo> : <Selo tom="ok">Ativo</Selo>}
                      {p.deveTrocarSenha && <Selo tom="aviso">Senha temporária</Selo>}
                    </div>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{p.ultimoLogin ? dataHora.format(p.ultimoLogin) : "Nunca"}</td>
                  <td className="px-4 py-3 text-right">
                    <SenhaTemporaria usuarioId={p.id} nome={p.nome} compacto />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-4 max-w-2xl text-xs text-muted-foreground">
        Para criar, editar ou desativar pessoas, peça a um administrador. Cada senha gerada fica registrada na auditoria.
      </p>
    </>
  );
}
