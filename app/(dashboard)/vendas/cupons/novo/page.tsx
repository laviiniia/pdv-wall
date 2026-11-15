import type { Metadata } from "next";
import Link from "next/link";
import { salvarCupom } from "@/app/(dashboard)/vendas/actions";
import { CampoCheckbox, CampoNumero, CampoSelect, CampoTexto, Grupo } from "@/components/form/campos";
import { Formulario } from "@/components/form/Formulario";
import { PageHeader } from "@/components/layout/PageHeader";
import { exigirPermissao } from "@/lib/auth/dal";
import { PERMISSAO } from "@/lib/constants/roles";

export const metadata: Metadata = { title: "Novo cupom" };

/** "AAAA-MM-DDTHH:MM" para <input type="datetime-local">. */
const local = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);

export default async function NovoCupomPage() {
  await exigirPermissao(PERMISSAO.CUPONS_GERENCIAR);
  const agora = new Date();
  const em30dias = new Date(agora.getTime() + 30 * 86_400_000);

  return (
    <>
      <PageHeader titulo="Novo cupom" />
      <Formulario
        acao={salvarCupom}
        rotuloBotao="Criar cupom"
        className="flex max-w-xl flex-col gap-8"
        acoesExtras={
          <Link href="/vendas/cupons" className="inline-flex h-9 items-center rounded-lg px-3 text-sm hover:bg-muted">
            Cancelar
          </Link>
        }
      >
        <Grupo titulo="Cupom">
          <CampoTexto nome="codigo" rotulo="Código" valor="" placeholder="PROMO10" className="uppercase" maxLength={50} required />
          <CampoTexto nome="descricao" rotulo="Descrição (opcional)" valor="" maxLength={200} />
          <CampoSelect nome="tipo" rotulo="Tipo de desconto" valor="percentual" opcoes={{ percentual: "Percentual (%)", valor: "Valor fixo (R$)" }} />
          <CampoNumero nome="valor" rotulo="Desconto" valor={10} ajuda="Em % ou R$, conforme o tipo" />
          <CampoNumero nome="valorMinimo" rotulo="Compra mínima" valor={0} prefixo="R$" />
          <CampoTexto nome="usosMaximos" rotulo="Limite de usos" valor="" inputMode="numeric" placeholder="Ilimitado" />
        </Grupo>
        <Grupo titulo="Validade">
          <CampoTexto nome="inicio" rotulo="Início" tipo="datetime-local" valor={local(agora)} />
          <CampoTexto nome="expiracao" rotulo="Expiração" tipo="datetime-local" valor={local(em30dias)} />
          <CampoCheckbox nome="ativo" rotulo="Ativo" valor largo />
        </Grupo>
      </Formulario>
    </>
  );
}
