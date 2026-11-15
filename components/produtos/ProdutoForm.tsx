import Link from "next/link";
import { salvarProduto } from "@/app/(dashboard)/produtos/actions";
import { CampoCheckbox, CampoNumero, CampoSelect, CampoTexto, CampoTextoLongo, Grupo } from "@/components/form/campos";
import { Formulario } from "@/components/form/Formulario";
import { numeroParaInput } from "@/lib/utils/numero";
import { UNIDADES_MEDIDA } from "@/lib/validations/produto.schema";
import { CamposPreco } from "./CamposPreco";

export type ProdutoEditavel = {
  id: number;
  nome: string;
  descricao: string | null;
  sku: string;
  codigoBarras: string | null;
  categoriaId: number;
  status: "ativo" | "inativo";
  precoCusto: { toString(): string };
  precoVenda: { toString(): string };
  unidadeMedida: string;
  quantidadeMinima: number;
  dataValidade: Date | null;
  lote: string | null;
};

export function ProdutoForm({
  produto,
  categorias,
  margemMinimaPct,
  podeEditar,
}: {
  produto?: ProdutoEditavel;
  categorias: { id: number; nome: string; icone: string | null; ativa: boolean }[];
  margemMinimaPct: number;
  podeEditar: boolean;
}) {
  const opcoesCategoria = Object.fromEntries([
    ["", "Selecione..."],
    ...categorias.map((c) => [String(c.id), `${c.icone ? `${c.icone} ` : ""}${c.nome}${c.ativa ? "" : " (inativa)"}`]),
  ]);

  return (
    <Formulario
      acao={salvarProduto}
      podeEditar={podeEditar}
      rotuloBotao={produto ? "Salvar alterações" : "Cadastrar produto"}
      avisoSomenteLeitura="Você pode visualizar, mas não alterar, os produtos."
      acoesExtras={
        <Link href="/produtos" className="inline-flex h-9 items-center rounded-lg px-3 text-sm hover:bg-muted">
          {produto ? "Voltar" : "Cancelar"}
        </Link>
      }
    >
      {produto && <input type="hidden" name="id" value={produto.id} />}

      <Grupo titulo="Informações básicas">
        <CampoTexto nome="nome" rotulo="Nome do produto" valor={produto?.nome ?? ""} maxLength={100} required largo />
        <CampoTexto
          nome="sku"
          rotulo="SKU / código"
          valor={produto?.sku ?? ""}
          maxLength={20}
          placeholder="HAM-001"
          ajuda="Formato TIPO-NÚMERO"
          className="uppercase"
          required
        />
        <CampoTexto
          nome="codigoBarras"
          rotulo="Código de barras (opcional)"
          valor={produto?.codigoBarras ?? ""}
          inputMode="numeric"
          maxLength={14}
          ajuda="EAN-8 ou EAN-13; usado pelo leitor no PDV"
        />
        <CampoSelect nome="categoriaId" rotulo="Categoria" valor={produto ? String(produto.categoriaId) : ""} opcoes={opcoesCategoria} />
        <CampoTextoLongo nome="descricao" rotulo="Descrição" valor={produto?.descricao ?? ""} max={500} />
        <CampoCheckbox
          nome="ativo"
          rotulo="Produto ativo"
          ajuda="Inativos não aparecem no PDV nem no cardápio digital"
          valor={produto ? produto.status === "ativo" : true}
          largo
        />
      </Grupo>

      <Grupo titulo="Preços">
        <CamposPreco
          custo={produto ? numeroParaInput(produto.precoCusto) : ""}
          venda={produto ? numeroParaInput(produto.precoVenda) : ""}
          margemMinimaPct={margemMinimaPct}
        />
      </Grupo>

      <Grupo titulo="Estoque e medidas">
        <CampoSelect nome="unidadeMedida" rotulo="Unidade de medida" valor={produto?.unidadeMedida ?? "un"} opcoes={UNIDADES_MEDIDA} />
        <CampoNumero
          nome="quantidadeMinima"
          rotulo="Quantidade mínima"
          valor={produto?.quantidadeMinima ?? 0}
          ajuda="Ao atingir, gera alerta de estoque"
        />
      </Grupo>

      <Grupo titulo="Validade (opcional)">
        <CampoTexto
          nome="dataValidade"
          rotulo="Data de validade"
          tipo="date"
          valor={produto?.dataValidade?.toISOString().slice(0, 10) ?? ""}
        />
        <CampoTexto nome="lote" rotulo="Lote" valor={produto?.lote ?? ""} maxLength={50} />
      </Grupo>
    </Formulario>
  );
}
