"use client";

import { cancelar } from "@/app/(dashboard)/vendas/actions";
import { CampoTextoLongo, Grupo } from "@/components/form/campos";
import { Formulario } from "@/components/form/Formulario";

export function CancelarVenda({ id, numero }: { id: number; numero: string }) {
  return (
    <Formulario acao={cancelar} rotuloBotao="Cancelar venda" rotuloEnviando="Cancelando..." className="flex max-w-xl flex-col gap-4">
      <input type="hidden" name="id" value={id} />
      <Grupo titulo={`Cancelar ${numero}`}>
        <CampoTextoLongo
          nome="motivo"
          rotulo="Motivo do cancelamento"
          valor=""
          max={500}
          ajuda="Fica registrado na venda e na auditoria. Não pode ser desfeito."
        />
      </Grupo>
    </Formulario>
  );
}
