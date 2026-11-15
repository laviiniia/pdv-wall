import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ImprimirAutomatico } from "@/components/pdv/ImprimirAutomatico";
import { exigirPermissao } from "@/lib/auth/dal";
import { PERMISSAO } from "@/lib/constants/roles";
import { getConfig } from "@/lib/services/configuracoes.service";
import { buscarPedidoParaEtiqueta } from "@/lib/services/pedidos.service";

export const metadata: Metadata = { title: "Etiqueta" };

// Etiqueta de preparo para a impressora térmica da cozinha (MODULO_2_3, seção 7.1.2).
// Fora do layout do dashboard (como /cupom), para imprimir só a etiqueta.
export default async function EtiquetaPage({ params }: PageProps<"/etiqueta/[id]">) {
  await exigirPermissao(PERMISSAO.PEDIDOS_VER);
  const { id } = await params;
  const pedido = await buscarPedidoParaEtiqueta(Number(id));
  if (!pedido) notFound();
  const [empresa, vendas] = await Promise.all([getConfig("empresa"), getConfig("vendas")]);
  const largura = vendas.papel === "58mm" ? "58mm" : "80mm";
  const hora = pedido.criadoEm.toLocaleTimeString("pt-BR", { timeZone: empresa.funcionamento.timezone, hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-neutral-100 p-4 text-black print:bg-white print:p-0">
      <style>{`@page { size: ${largura} auto; margin: 0; }`}</style>
      <div className="mx-auto" style={{ width: largura }}>
        <ImprimirAutomatico automatico />
        <article className="bg-white p-3 font-mono text-[12px] leading-snug shadow print:shadow-none">
          <p className="text-center text-[15px] font-bold">MESA {String(pedido.mesa.numero).padStart(2, "0")}</p>
          <p className="text-center">
            {pedido.numero} · {hora}
          </p>
          <hr className="my-2 border-dashed border-black" />
          {pedido.itens.map((i) => {
            const opcoes = i.personalizacoes as { tipo: string; nome: string }[];
            return (
              <div key={i.id} className="mb-2">
                <p className="font-bold">
                  {i.quantidade}x {i.nomeProduto}
                </p>
                {opcoes.map((o) => (
                  <p key={o.nome} className="pl-3">
                    {o.tipo === "adicao" ? "+ " : "- "}
                    {o.nome}
                  </p>
                ))}
                {i.observacao && <p className="pl-3 italic">Obs: {i.observacao}</p>}
                <p className="pl-3 text-[10px]">Tempo: {i.tempoPreparoMin} min</p>
              </div>
            );
          })}
          {pedido.alergias && (
            <>
              <hr className="my-2 border-dashed border-black" />
              <p className="font-bold">ALERGIAS: {pedido.alergias}</p>
            </>
          )}
          {pedido.observacoes && <p>Obs. do pedido: {pedido.observacoes}</p>}
          <hr className="my-2 border-dashed border-black" />
          <p className="font-bold">TEMPO TOTAL: {pedido.tempoPreparoMin} min</p>
        </article>
      </div>
    </div>
  );
}
