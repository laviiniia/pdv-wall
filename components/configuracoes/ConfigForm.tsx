"use client";

import { salvar } from "@/app/(dashboard)/configuracoes/actions";
import { Formulario } from "@/components/form/Formulario";

export function ConfigForm({
  secao,
  podeEditar,
  children,
}: {
  secao: string;
  podeEditar: boolean;
  children: React.ReactNode;
}) {
  return (
    <Formulario
      acao={salvar}
      podeEditar={podeEditar}
      rotuloBotao="Salvar configurações"
      avisoSomenteLeitura="Você pode visualizar, mas não alterar, as configurações desta seção."
    >
      <input type="hidden" name="secao" value={secao} />
      {children}
    </Formulario>
  );
}
