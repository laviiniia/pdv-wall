import { Construction } from "lucide-react";
import { NAVEGACAO } from "@/lib/constants/navegacao";
import { PageHeader } from "./PageHeader";

/** Placeholder para módulos ainda não implementados. Aponta para a especificação em docs/. */
export function EmConstrucao({ href }: { href: string }) {
  const item = NAVEGACAO.find((i) => i.href === href);
  return (
    <>
      <PageHeader titulo={item?.titulo ?? "Módulo"} />
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-12 text-center">
        <Construction className="size-8 text-muted-foreground" />
        <p className="font-medium">Módulo em construção</p>
        {item?.doc && (
          <p className="text-sm text-muted-foreground">
            Especificação: <code className="rounded bg-muted px-1.5 py-0.5">docs/modulos/{item.doc}</code>
          </p>
        )}
      </div>
    </>
  );
}
