import { Selo } from "@/components/produtos/Selos";
import { ROTULOS_SITUACAO, type SituacaoEstoque } from "@/lib/estoque/situacao";

const TOM = { sem_estoque: "erro", critico: "erro", baixo: "aviso", normal: "ok" } as const;

export function SeloSituacao({ situacao }: { situacao: SituacaoEstoque }) {
  return <Selo tom={TOM[situacao]}>{ROTULOS_SITUACAO[situacao]}</Selo>;
}
