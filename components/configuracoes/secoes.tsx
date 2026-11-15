// Formulários de cada seção. Server components que montam os campos (client) dentro de <ConfigForm>.
import {
  CATEGORIAS_DESPESA_PADRAO,
  type ConfigEmpresa,
  type ConfigEstoque,
  type ConfigFinanceiro,
  type ConfigVendas,
  DIAS_SEMANA,
  FORMAS_PAGAMENTO,
  REGIMES,
  UFS,
} from "@/lib/validations/configuracoes.schema";
import { CampoCheckbox, CampoLista, CampoNumero, CampoSelect, CampoTexto, Grupo } from "@/components/form/campos";
import { CategoriasCustomizadas } from "./CategoriasCustomizadas";

function formatarCnpj(d: string) {
  return d.length === 14 ? d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") : d;
}
function formatarCep(d: string) {
  return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export function SecaoEmpresa({ c }: { c: ConfigEmpresa }) {
  return (
    <>
      <Grupo titulo="Informações gerais">
        <CampoTexto nome="nome" rotulo="Razão social" valor={c.nome} largo required />
        <CampoTexto nome="nomeFantasia" rotulo="Nome fantasia" valor={c.nomeFantasia} ajuda="Aparece no topo do menu e nos cupons" />
        <CampoTexto nome="cnpj" rotulo="CNPJ" valor={formatarCnpj(c.cnpj)} inputMode="numeric" placeholder="00.000.000/0000-00" />
        <CampoTexto nome="inscricaoEstadual" rotulo="Inscrição estadual" valor={c.inscricaoEstadual} />
        <CampoSelect nome="regimeTributario" rotulo="Regime tributário" valor={c.regimeTributario} opcoes={REGIMES} />
      </Grupo>
      <Grupo titulo="Contato">
        <CampoTexto nome="telefone" rotulo="Telefone" valor={c.telefone} tipo="tel" />
        <CampoTexto nome="email" rotulo="E-mail de contato" valor={c.email} tipo="email" />
        <CampoTexto nome="website" rotulo="Site" valor={c.website} largo placeholder="www.exemplo.com.br" />
      </Grupo>
      <Grupo titulo="Endereço">
        <CampoTexto nome="endereco.cep" rotulo="CEP" valor={formatarCep(c.endereco.cep)} inputMode="numeric" placeholder="00000-000" />
        <CampoTexto nome="endereco.rua" rotulo="Rua" valor={c.endereco.rua} />
        <CampoTexto nome="endereco.numero" rotulo="Número" valor={c.endereco.numero} />
        <CampoTexto nome="endereco.complemento" rotulo="Complemento" valor={c.endereco.complemento} />
        <CampoTexto nome="endereco.bairro" rotulo="Bairro" valor={c.endereco.bairro} />
        <CampoTexto nome="endereco.cidade" rotulo="Cidade" valor={c.endereco.cidade} />
        <CampoSelect nome="endereco.uf" rotulo="UF" valor={c.endereco.uf} opcoes={["", ...UFS]} />
      </Grupo>
      <Grupo titulo="Funcionamento">
        <CampoTexto nome="funcionamento.abertura" rotulo="Abre às" valor={c.funcionamento.abertura} tipo="time" />
        <CampoTexto nome="funcionamento.fechamento" rotulo="Fecha às" valor={c.funcionamento.fechamento} tipo="time" />
        <CampoLista
          nome="funcionamento.dias"
          rotulo="Dias de funcionamento"
          inline
          opcoes={DIAS_SEMANA.map((d, i) => [String(i), d])}
          valores={c.funcionamento.dias.map(String)}
        />
        <input type="hidden" name="funcionamento.timezone" value={c.funcionamento.timezone} />
      </Grupo>
    </>
  );
}

export function SecaoVendas({ c }: { c: ConfigVendas }) {
  return (
    <>
      <Grupo titulo="Descontos">
        <CampoNumero nome="descontoMaxOperadorPct" rotulo="Desconto máximo do operador" valor={c.descontoMaxOperadorPct} sufixo="%" />
        <CampoNumero nome="descontoMaxGerentePct" rotulo="Desconto máximo do gerente" valor={c.descontoMaxGerentePct} sufixo="%" ajuda="Admin não tem limite" />
        <CampoCheckbox nome="exigirAprovacao" rotulo="Exigir aprovação de gerente para descontos altos" valor={c.exigirAprovacao} />
        <CampoNumero nome="aprovacaoGerenteAcimaDe" rotulo="Aprovação acima de" valor={c.aprovacaoGerenteAcimaDe} prefixo="R$" />
      </Grupo>
      <Grupo titulo="Pagamentos">
        <CampoLista nome="formasPagamento" rotulo="Formas de pagamento aceitas" opcoes={Object.entries(FORMAS_PAGAMENTO)} valores={c.formasPagamento} />
        <CampoNumero nome="parcelamentoMax" rotulo="Parcelamento máximo no crédito" valor={c.parcelamentoMax} sufixo="x" ajuda="1 = só à vista" />
        <div />
        <CampoNumero nome="taxaDebitoPct" rotulo="Taxa do débito" valor={c.taxaDebitoPct} sufixo="%" />
        <CampoNumero nome="taxaCreditoPct" rotulo="Taxa do crédito" valor={c.taxaCreditoPct} sufixo="%" />
      </Grupo>
      <Grupo titulo="Impressora e cupom">
        <CampoCheckbox nome="impressoraAtiva" rotulo="Imprimir cupom ao finalizar a venda" valor={c.impressoraAtiva} largo />
        <CampoSelect nome="papel" rotulo="Tamanho do papel" valor={c.papel} opcoes={["58mm", "80mm", "A4"]} />
        <CampoNumero nome="copias" rotulo="Cópias por venda" valor={c.copias} />
        <CampoTexto nome="rodapeCupom" rotulo="Rodapé do cupom" valor={c.rodapeCupom} largo />
      </Grupo>
      <Grupo titulo="Pedidos online">
        <CampoCheckbox nome="pedidosOnlineAtivos" rotulo="Aceitar pedidos online (QR Code)" valor={c.pedidosOnlineAtivos} largo />
        <CampoNumero nome="limitePedidosSimultaneos" rotulo="Limite de pedidos simultâneos" valor={c.limitePedidosSimultaneos} ajuda="Capacidade da cozinha" />
        <CampoNumero nome="tempoPreparoMin" rotulo="Tempo médio de preparo" valor={c.tempoPreparoMin} sufixo="min" />
        <CampoTexto nome="pedidosOnlineInicio" rotulo="Recebe pedidos a partir de" valor={c.pedidosOnlineInicio} tipo="time" />
        <CampoTexto nome="pedidosOnlineFim" rotulo="Até" valor={c.pedidosOnlineFim} tipo="time" />
      </Grupo>
    </>
  );
}

export function SecaoEstoque({ c }: { c: ConfigEstoque }) {
  return (
    <>
      <Grupo titulo="Alertas">
        <CampoCheckbox nome="alertasAtivos" rotulo="Ativar alertas de estoque" valor={c.alertasAtivos} largo />
        <CampoNumero nome="nivelCriticoPct" rotulo="Nível crítico (vermelho)" valor={c.nivelCriticoPct} sufixo="% acima do mínimo" />
        <CampoNumero nome="nivelBaixoPct" rotulo="Nível baixo (amarelo)" valor={c.nivelBaixoPct} sufixo="% acima do mínimo" />
      </Grupo>
      <Grupo titulo="Movimentações">
        <CampoCheckbox nome="baixaAutomaticaVendas" rotulo="Dar baixa no estoque automaticamente ao vender" valor={c.baixaAutomaticaVendas} largo />
        <CampoCheckbox nome="confirmarSaidaManual" rotulo="Exigir confirmação para saída manual" ajuda="Perda, dano, devolução" valor={c.confirmarSaidaManual} largo />
        <CampoCheckbox nome="permitirEstoqueNegativo" rotulo="Permitir vender com estoque negativo" valor={c.permitirEstoqueNegativo} largo />
      </Grupo>
      <Grupo titulo="Lote e validade">
        <CampoCheckbox nome="rastrearLotes" rotulo="Rastrear lotes (FIFO)" valor={c.rastrearLotes} largo />
        <CampoNumero nome="diasAlertaValidade" rotulo="Alertar vencimento com antecedência de" valor={c.diasAlertaValidade} sufixo="dias" />
        <CampoCheckbox nome="permitirVendaVencido" rotulo="Permitir vender produto vencido" valor={c.permitirVendaVencido} />
      </Grupo>
      <Grupo titulo="Inventário">
        <CampoSelect nome="frequenciaInventario" rotulo="Frequência recomendada" valor={c.frequenciaInventario} opcoes={{ mensal: "Mensal", trimestral: "Trimestral", anual: "Anual" }} />
        <CampoNumero nome="divergenciaMaxInventarioPct" rotulo="Divergência máxima aceitável" valor={c.divergenciaMaxInventarioPct} sufixo="%" />
      </Grupo>
    </>
  );
}

export function SecaoFinanceiro({ c }: { c: ConfigFinanceiro }) {
  return (
    <>
      <Grupo titulo="Impostos (alíquotas padrão)">
        <CampoNumero nome="icmsPct" rotulo="ICMS" valor={c.icmsPct} sufixo="%" />
        <CampoNumero nome="pisPct" rotulo="PIS" valor={c.pisPct} sufixo="%" />
        <CampoNumero nome="cofinsPct" rotulo="COFINS" valor={c.cofinsPct} sufixo="%" />
        <CampoNumero nome="issPct" rotulo="ISS (serviços)" valor={c.issPct} sufixo="%" />
      </Grupo>
      <Grupo titulo="Margem">
        <CampoNumero nome="margemMinimaPct" rotulo="Margem mínima desejada" valor={c.margemMinimaPct} sufixo="%" ajuda="Abaixo disso, o sistema alerta" />
      </Grupo>
      <Grupo titulo="Categorias de despesa">
        <CampoLista nome="categoriasDespesa" rotulo="Categorias ativas" opcoes={Object.entries(CATEGORIAS_DESPESA_PADRAO)} valores={c.categoriasDespesa} />
        <CategoriasCustomizadas valores={c.categoriasCustomizadas} />
      </Grupo>
      <Grupo titulo="Caixa">
        <CampoNumero nome="caixasQuantidade" rotulo="Número de caixas" valor={c.caixasQuantidade} />
        <CampoCheckbox nome="diferencaCaixaSoGerente" rotulo="Só gerente/admin pode fechar caixa com diferença" valor={c.diferencaCaixaSoGerente} />
      </Grupo>
    </>
  );
}
