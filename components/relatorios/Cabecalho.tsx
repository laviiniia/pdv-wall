import { FiltroPeriodo } from "@/components/relatorios/Controles";
import { COMPARACOES, type FiltroRelatorio, PRESETS, queryDoFiltro } from "@/lib/services/relatorios.service";

/** Filtro + título do período (o título aparece também na impressão). */
export function CabecalhoRelatorio({
  filtro,
  titulo,
  exportar,
}: {
  filtro: FiltroRelatorio;
  titulo: string;
  exportar: { rotulo: string; tipo: string }[];
}) {
  const qs = queryDoFiltro(filtro);
  return (
    <>
      <FiltroPeriodo
        presets={PRESETS}
        comparacoes={COMPARACOES}
        preset={filtro.preset}
        comparar={filtro.comparar}
        de={filtro.atual.de}
        ate={filtro.atual.ate}
        exportar={exportar.map((e) => ({ rotulo: e.rotulo, href: `/api/relatorios/${e.tipo}?${qs}` }))}
      />
      <div className="mb-4">
        <h2 className="text-lg font-semibold">
          {titulo} · {filtro.atual.rotulo}
        </h2>
        {filtro.comparado && (
          <p className="text-xs text-muted-foreground">
            Comparado com {filtro.comparado.rotulo} ({filtro.atual.dias} dia{filtro.atual.dias > 1 ? "s" : ""} em cada lado)
          </p>
        )}
      </div>
    </>
  );
}
