import Link from "next/link";
import { salvarCategoria } from "@/app/(dashboard)/produtos/actions";
import { CampoCheckbox, CampoTexto, CampoTextoLongo, Grupo } from "@/components/form/campos";
import { Formulario } from "@/components/form/Formulario";

export type CategoriaEditavel = {
  id: number;
  nome: string;
  descricao: string | null;
  corHex: string;
  icone: string | null;
  ativa: boolean;
};

export function CategoriaForm({ categoria, podeEditar }: { categoria?: CategoriaEditavel; podeEditar: boolean }) {
  return (
    <Formulario
      acao={salvarCategoria}
      podeEditar={podeEditar}
      rotuloBotao={categoria ? "Salvar alterações" : "Criar categoria"}
      avisoSomenteLeitura="Você pode visualizar, mas não alterar, as categorias."
      className="flex max-w-xl flex-col gap-8"
      acoesExtras={
        <Link href="/produtos/categorias" className="inline-flex h-9 items-center rounded-lg px-3 text-sm hover:bg-muted">
          Cancelar
        </Link>
      }
    >
      {categoria && <input type="hidden" name="id" value={categoria.id} />}
      <Grupo titulo="Categoria">
        <CampoTexto nome="nome" rotulo="Nome" valor={categoria?.nome ?? ""} maxLength={50} required largo />
        <CampoTextoLongo nome="descricao" rotulo="Descrição" valor={categoria?.descricao ?? ""} max={200} />
        <CampoTexto
          nome="icone"
          rotulo="Ícone"
          valor={categoria?.icone ?? ""}
          maxLength={8}
          placeholder="🍔"
          ajuda="Um emoji, usado no cardápio digital"
        />
        <CampoTexto nome="corHex" rotulo="Cor" tipo="color" valor={categoria?.corHex ?? "#808080"} className="w-20 p-1" />
        <CampoCheckbox
          nome="ativa"
          rotulo="Categoria ativa"
          ajuda="Inativa: não aparece nos filtros nem para novos produtos; os produtos dela continuam existindo"
          valor={categoria?.ativa ?? true}
          largo
        />
      </Grupo>
    </Formulario>
  );
}
