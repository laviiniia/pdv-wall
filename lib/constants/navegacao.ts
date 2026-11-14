import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  type LucideIcon,
  Package,
  QrCode,
  Settings,
  ShoppingCart,
  Wallet,
} from "lucide-react";

export type ItemNavegacao = {
  href: string;
  titulo: string;
  icone: LucideIcon;
  /** Documento de especificação em docs/modulos */
  doc?: string;
};

export const NAVEGACAO: ItemNavegacao[] = [
  { href: "/dashboard", titulo: "Dashboard", icone: LayoutDashboard },
  { href: "/produtos", titulo: "Produtos", icone: Package, doc: "MODULO_2_1_GESTAO_PRODUTOS.md" },
  { href: "/vendas", titulo: "Vendas (PDV)", icone: ShoppingCart, doc: "MODULO_2_2_VENDAS_PDV.md" },
  { href: "/pedidos-online", titulo: "Pedidos Online", icone: QrCode, doc: "MODULO_2_3_PEDIDOS_ONLINE_QR_CODE.md" },
  { href: "/estoque", titulo: "Estoque", icone: Boxes, doc: "MODULO_2_4_CONTROLE_ESTOQUE.md" },
  { href: "/financeiro", titulo: "Financeiro", icone: Wallet, doc: "MODULO_2_5_FINANCEIRO.md" },
  { href: "/relatorios", titulo: "Relatórios", icone: BarChart3, doc: "MODULO_2_6_RELATORIOS.md" },
  { href: "/configuracoes", titulo: "Configurações", icone: Settings, doc: "MODULO_4_CONFIGURACOES.md" },
];
