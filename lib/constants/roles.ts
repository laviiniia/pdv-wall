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
      "produtos.gerenciar",
      "produtos.editar_preco",
      "vendas.criar",
      "vendas.ver",
      "vendas.cancelar",
      "vendas.desconto_livre",
      "cupons.gerenciar",
      "pedidos.ver",
      "pedidos.criar",
      "pedidos.mudar_status",
      "pedidos.cancelar",
      "estoque.ver",
      "estoque.criar_entrada",
      "financeiro.ver",
      "financeiro.criar_despesa",
      "relatorios.ver",
      "configuracoes.editar_operacional",
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

// Permissões usadas pelas telas de administração (admin tem "*").
export const PERMISSAO = {
  USUARIOS_GERENCIAR: "usuarios.gerenciar",
  /** Todas as seções de configurações (admin). */
  CONFIG_EDITAR: "configuracoes.editar",
  /** Seções operacionais de configurações, ex.: estoque (gerente). */
  CONFIG_EDITAR_OPERACIONAL: "configuracoes.editar_operacional",
  /** Criar, editar, desativar e reativar produtos e categorias (MODULO_2_1: admin e gerente). */
  PRODUTOS_GERENCIAR: "produtos.gerenciar",
  // Vendas (MODULO_2_2 e matriz do MODULO_3)
  VENDAS_CRIAR: "vendas.criar",
  /** Ver todas as vendas (gerente). */
  VENDAS_VER: "vendas.ver",
  /** Ver só as próprias vendas (operador). */
  VENDAS_VER_PROPRIAS: "vendas.ver_proprias",
  VENDAS_CANCELAR: "vendas.cancelar",
  VENDAS_CANCELAR_PROPRIAS: "vendas.cancelar_proprias",
  CUPONS_GERENCIAR: "cupons.gerenciar",
} as const;

export function temPermissao(permissoes: string[], requerida: string): boolean {
  return permissoes.includes("*") || permissoes.includes(requerida);
}
