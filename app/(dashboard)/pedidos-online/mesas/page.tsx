import type { Metadata } from "next";
import Link from "next/link";
import { Printer } from "lucide-react";
import { adicionarMesas } from "@/app/(dashboard)/pedidos-online/actions";
import { BotaoMesa } from "@/components/cozinha/BotaoMesa";
import { CampoNumero, Grupo } from "@/components/form/campos";
import { Formulario } from "@/components/form/Formulario";
import { PageHeader } from "@/components/layout/PageHeader";
import { Selo } from "@/components/produtos/Selos";
import { urlBase } from "@/lib/auth/contexto";
import { exigirPermissao } from "@/lib/auth/dal";
import { PERMISSAO } from "@/lib/constants/roles";
import { listarMesas, qrCodeSvg } from "@/lib/services/pedidos.service";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Mesas" };

export default async function MesasPage() {
  await exigirPermissao(PERMISSAO.MESAS_GERENCIAR);
  const [mesas, base] = await Promise.all([listarMesas(), urlBase()]);
  const qrs = await Promise.all(mesas.map((m) => qrCodeSvg(`${base}/mesa/${m.token}`)));
  const proxima = (mesas.at(-1)?.numero ?? 0) + 1;

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/pedidos-online" className="text-muted-foreground hover:underline">
          ← Cozinha
        </Link>
      </p>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader titulo="Mesas e QR Codes" descricao={`${mesas.length} mesa(s) · cada QR Code abre o cardápio da mesa`} />
        {mesas.length > 0 && (
          <Link
            href="/qrcodes"
            target="_blank"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm hover:bg-muted"
          >
            <Printer className="size-4" /> Imprimir QR Codes
          </Link>
        )}
      </div>

      <Formulario acao={adicionarMesas} rotuloBotao="Criar mesas" className="mb-8 flex max-w-xl flex-col gap-4">
        <Grupo titulo="Adicionar mesas">
          <CampoNumero nome="de" rotulo="Da mesa" valor={proxima} />
          <CampoNumero nome="ate" rotulo="Até a mesa" valor={proxima + (mesas.length ? 0 : 9)} />
          <CampoNumero nome="capacidade" rotulo="Lugares por mesa" valor={4} />
        </Grupo>
      </Formulario>

      {mesas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma mesa ainda.</p>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
          {mesas.map((m, i) => (
            <li key={m.id} className={cn("flex flex-col items-center gap-2 rounded-xl border p-4", !m.ativa && "opacity-60")}>
              <div className="flex w-full items-center justify-between">
                <span className="font-semibold">Mesa {String(m.numero).padStart(2, "0")}</span>
                {!m.ativa ? <Selo tom="neutro">Inativa</Selo> : m._count.pedidos > 0 ? <Selo tom="aviso">{m._count.pedidos} em preparo</Selo> : null}
              </div>
              <div className="size-32 bg-white p-1 [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: qrs[i] }} aria-label={`QR Code da mesa ${m.numero}`} role="img" />
              <a href={`/mesa/${m.token}`} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                Abrir cardápio
              </a>
              <div className="flex gap-3">
                <BotaoMesa id={m.id} acao={m.ativa ? "desativar" : "ativar"} rotulo={m.ativa ? "Desativar" : "Ativar"} />
                <BotaoMesa id={m.id} acao="novoToken" rotulo="Novo QR" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
