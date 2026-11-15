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
      "mesas.gerenciar",
      "estoque.ver",
      "estoque.criar_entrada",
      "estoque.ajustar",
      "financeiro.ver",
      "financeiro.criar_despesa",
      "financeiro.pagar_contas",
      "caixa.abrir_fechar",
      "caixa.fechar_com_diferenca",
      "caixa.gerenciar",
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
  // Pedidos online (MODULO_2_3)
  PEDIDOS_VER: "pedidos.ver",
  PEDIDOS_MUDAR_STATUS: "pedidos.mudar_status",
  PEDIDOS_CANCELAR: "pedidos.cancelar",
  MESAS_GERENCIAR: "mesas.gerenciar",
  // Estoque (MODULO_2_4)
  ESTOQUE_VER: "estoque.ver",
  ESTOQUE_ENTRADA: "estoque.criar_entrada",
  /** Saída manual, ajuste e inventário (gerente). */
  ESTOQUE_AJUSTAR: "estoque.ajustar",
  /** Desfazer movimentos (doc: só admin). */
  ESTOQUE_DESFAZER: "estoque.desfazer",
  // Financeiro e caixa (MODULO_2_5)
  FINANCEIRO_VER: "financeiro.ver",
  FINANCEIRO_DESPESAS: "financeiro.criar_despesa",
  FINANCEIRO_PAGAR: "financeiro.pagar_contas",
  CAIXA_OPERAR: "caixa.abrir_fechar",
  /** Fechar caixa com diferença quando Configurações › Financeiro exige gerente. */
  CAIXA_FECHAR_DIFERENCA: "caixa.fechar_com_diferenca",
  /** Ver e fechar o caixa de outros operadores. */
  CAIXA_GERENCIAR: "caixa.gerenciar",
  RELATORIOS_VER: "relatorios.ver",
} as const;

export function temPermissao(permissoes: string[], requerida: string): boolean {
  return permissoes.includes("*") || permissoes.includes(requerida);
}
