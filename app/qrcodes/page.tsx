import type { Metadata } from "next";
import { ImprimirAutomatico } from "@/components/pdv/ImprimirAutomatico";
import { urlBase } from "@/lib/auth/contexto";
import { exigirPermissao } from "@/lib/auth/dal";
import { PERMISSAO } from "@/lib/constants/roles";
import { getConfig } from "@/lib/services/configuracoes.service";
import { listarMesas, qrCodeSvg } from "@/lib/services/pedidos.service";

export const metadata: Metadata = { title: "QR Codes das mesas" };

// Folha A4 com os QR Codes das mesas ativas, para recortar e colar (fora do layout do dashboard).
export default async function QrCodesPage() {
  await exigirPermissao(PERMISSAO.MESAS_GERENCIAR);
  const [mesas, base, empresa] = await Promise.all([listarMesas(), urlBase(), getConfig("empresa")]);
  const ativas = mesas.filter((m) => m.ativa);
  const qrs = await Promise.all(ativas.map((m) => qrCodeSvg(`${base}/mesa/${m.token}`)));

  return (
    <div className="min-h-screen bg-white p-6 text-black print:p-0">
      <style>{`@page { size: A4; margin: 10mm; }`}</style>
      <ImprimirAutomatico automatico={false} />
      <ul className="grid grid-cols-3 gap-4">
        {ativas.map((m, i) => (
          <li key={m.id} className="flex break-inside-avoid flex-col items-center gap-1 rounded-lg border border-dashed border-neutral-400 p-4 text-center">
            <p className="text-xs">{empresa.nomeFantasia || empresa.nome}</p>
            <p className="text-xl font-bold">Mesa {String(m.numero).padStart(2, "0")}</p>
            <div className="size-40 [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: qrs[i] }} />
            <p className="text-sm font-medium">Aponte a câmera para ver o cardápio e pedir</p>
          </li>
        ))}
      </ul>
      {ativas.length === 0 && <p>Nenhuma mesa ativa.</p>}
    </div>
  );
}
