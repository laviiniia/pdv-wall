// Perfis e permissões padrão (docs/modulos/MODULO_3_AUTENTICACAO.md, matriz de permissões).
// Formato: "<modulo>.<acao>". "*" = acesso total.

export const ROLES = {
  ADMIN: "admin",
  GERENTE: "gerente",
  OPERADOR: "operador",
} as const;

export type RoleNome = (typeof ROLES)[keyof typeof ROLES];

export const PERMISSOES_PADRAO: Record<RoleNome, { descricao: string; permissoes: string[] }> = {
  admin: {
    descricao: "Administrador - Acesso Total",
    permissoes: ["*"],
  },
  gerente: {
    descricao: "Gerente - Acesso Operacional e Financeiro",
    permissoes: [
      "produtos.ver",
      "produtos.editar_preco",
      "vendas.criar",
      "vendas.ver",
      "vendas.cancelar",
      "vendas.desconto_livre",
      "pedidos.ver",
      "pedidos.criar",
      "pedidos.mudar_status",
      "pedidos.cancelar",
      "estoque.ver",
      "estoque.criar_entrada",
      "financeiro.ver",
      "financeiro.criar_despesa",
      "relatorios.ver",
    ],
  },
  operador: {
    descricao: "Operador - Acesso Limitado a Vendas",
    permissoes: [
      "produtos.ver",
      "vendas.criar",
      "vendas.ver_proprias",
      "vendas.cancelar_proprias",
      "vendas.desconto_20",
      "pedidos.ver",
      "pedidos.criar",
      "pedidos.mudar_status",
      "estoque.ver",
      "caixa.abrir_fechar",
    ],
  },
};

export function temPermissao(permissoes: string[], requerida: string): boolean {
  return permissoes.includes("*") || permissoes.includes(requerida);
}
