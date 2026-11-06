import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { numero, requisitar } from './projecoes'

type Indicador = {codigo:string;data:string;valor:number;compra:number|null;unidade:string;fonte:string;atualizadoEm:string}
type Historico = {dados:Indicador[];avisos:string[];atualizando:boolean}
const nomes:Record<string,string> = {SELIC:'Selic meta',SELIC_DIARIA:'Selic efetiva diária',CDI:'CDI diário',IPCA:'IPCA mensal',USD:'Dólar PTAX'}
export function Indicadores() {
  const consultas = useQueryClient()
  const [origem,definirOrigem] = useState('oficial')
  const consulta = useQuery({queryKey:['indicadores'],queryFn:()=>requisitar<Historico>('/api/indicadores'),
    refetchInterval:consulta=>consulta.state.data?.atualizando?5000:60000})
  const atualizar = useMutation({mutationFn:()=>requisitar<Historico>('/api/indicadores/atualizar',{method:'POST'}),
    onSuccess:dados=>consultas.setQueryData(['indicadores'],dados)})
  const manual = useMutation({mutationFn:(dados:object)=>requisitar('/api/indicadores/manual',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(dados)}),
    onSuccess:()=>consultas.invalidateQueries({queryKey:['indicadores']})})
  function salvar(evento:FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const dados = new FormData(evento.currentTarget)
    manual.mutate({codigo:dados.get('codigo'),data:dados.get('data'),valor:dados.get('valor'),compra:dados.get('compra')||null})
  }
  const dados = consulta.data?.dados ?? []
  const selecionados = dados.filter(item=>origem==='manual'?item.fonte==='Informado manualmente':item.fonte!=='Informado manualmente')
  return <main className="amplo"><p className="rubrica">MERCADO / INDICADORES</p><h1>Referências do mercado</h1>
    <p>Dados publicados pelo Banco Central. A PTAX é uma cotação de referência de fechamento.</p>
    <div className="acoes acoes-indicadores"><button className="secundario" disabled={atualizar.isPending} onClick={()=>atualizar.mutate()}>{atualizar.isPending?'Consultando fontes…':'Atualizar indicadores'}</button>
      <label>Fonte de origem<select className="entrada" value={origem} onChange={evento=>definirOrigem(evento.target.value)}><option value="oficial">Banco Central</option><option value="manual">Observações manuais</option></select></label>
    </div>
    {consulta.data?.atualizando&&<p role="status" className="nota">Carregando indicadores e histórico de até dez anos. Os dados aparecem conforme são armazenados.</p>}
    {(consulta.isError||atualizar.isError)&&<p role="alert" className="aviso">{consulta.error?.message||atualizar.error?.message}</p>}
    {consulta.data?.avisos.map(aviso=><p className="aviso" key={aviso}>{aviso}</p>)}
    <div className="indicadores">{Object.entries(nomes).map(([chave,nome])=>{
      const ultimo = selecionados.filter(item=>item.codigo===chave).at(-1)
      return <section className="painel" key={chave}><h2>{nome}</h2><strong>{ultimo?numero(String(ultimo.valor)):'Sem dados'}</strong>
        {ultimo&&<><p>{ultimo.unidade}{chave==='USD'?' · venda':''}</p>{ultimo.compra!==null&&<p>Compra {numero(String(ultimo.compra))}</p>}
        <p>Referência {ultimo.data}</p><small>{ultimo.fonte}<br/>Consulta {new Date(ultimo.atualizadoEm).toLocaleString('pt-BR')}</small></>}</section>
    })}</div>
    <details className="painel"><summary>Registrar observação manual</summary>
      <form onSubmit={salvar}><div className="duas-colunas">
        <label>Indicador<select className="entrada" name="codigo">{Object.entries(nomes).map(([chave,nome])=><option key={chave} value={chave}>{nome}</option>)}</select></label>
        <label>Data de referência<input className="entrada" name="data" type="date" required/></label>
        <label>Valor (unidade do indicador, venda para USD)<input className="entrada" name="valor" type="number" step="0.000001" required/></label>
        <label>Compra (obrigatória para USD)<input className="entrada" name="compra" type="number" step="0.000001" min="0.000001"/></label>
      </div><button className="calcular" disabled={manual.isPending}>Salvar observação manual</button>
      {manual.isSuccess&&<p role="status">Observação salva. Selecione a origem manual para consultá-la.</p>}
      {manual.isError&&<p role="alert">{manual.error.message}</p>}</form>
    </details>
    <p className="nota">Atualização automática a cada seis horas e intervalo mínimo de cinco minutos entre consultas manuais. Valores antigos continuam identificados pela data de referência. CDI e Selic diária estão em % ao dia e IPCA em % ao mês.</p>
    <p className="nota">Fontes oficiais <a href="https://dadosabertos.bcb.gov.br/" target="_blank" rel="noreferrer">SGS</a> · <a href="https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/documentacao" target="_blank" rel="noreferrer">PTAX</a></p>
  </main>
}
