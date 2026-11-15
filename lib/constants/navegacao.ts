import {
  BarChart3,
  Boxes,
  Landmark,
  LayoutDashboard,
  type LucideIcon,
  Package,
  QrCode,
  Settings,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react";
import { PERMISSAO } from "./roles";

export type ItemNavegacao = {
  href: string;
  titulo: string;
  icone: LucideIcon;
  /** Documento de especificação em docs/modulos */
  doc?: string;
  /** Se definido, o item só aparece para quem tem a permissão. */
  permissao?: string;
};

export const NAVEGACAO: ItemNavegacao[] = [
  { href: "/dashboard", titulo: "Dashboard", icone: LayoutDashboard },
  { href: "/produtos", titulo: "Produtos", icone: Package, doc: "MODULO_2_1_GESTAO_PRODUTOS.md" },
  { href: "/vendas", titulo: "Vendas (PDV)", icone: ShoppingCart, doc: "MODULO_2_2_VENDAS_PDV.md", permissao: PERMISSAO.VENDAS_CRIAR },
  { href: "/caixa", titulo: "Caixa", icone: Landmark, doc: "MODULO_2_5_FINANCEIRO.md", permissao: PERMISSAO.CAIXA_OPERAR },
  { href: "/pedidos-online", titulo: "Pedidos Online", icone: QrCode, doc: "MODULO_2_3_PEDIDOS_ONLINE_QR_CODE.md", permissao: PERMISSAO.PEDIDOS_VER },
  { href: "/estoque", titulo: "Estoque", icone: Boxes, doc: "MODULO_2_4_CONTROLE_ESTOQUE.md", permissao: PERMISSAO.ESTOQUE_VER },
  { href: "/financeiro", titulo: "Financeiro", icone: Wallet, doc: "MODULO_2_5_FINANCEIRO.md", permissao: PERMISSAO.FINANCEIRO_VER },
  { href: "/relatorios", titulo: "Relatórios", icone: BarChart3, doc: "MODULO_2_6_RELATORIOS.md", permissao: PERMISSAO.RELATORIOS_VER },
  { href: "/configuracoes", titulo: "Configurações", icone: Settings, doc: "MODULO_4_CONFIGURACOES.md" },
  {
    href: "/admin/usuarios",
    titulo: "Usuários",
    icone: Users,
    doc: "MODULO_3_AUTENTICACAO.md",
    permissao: PERMISSAO.USUARIOS_GERENCIAR,
  },
];
