import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { comparar, moeda, novoInvestimento, numero, requisitar, type Investimento, type Parametros, type Produto, type Projecao } from './projecoes'

function Numero({titulo,valor,alterar,min='0',max='100000000',passo='0.0001'}:{
  titulo:string;valor:string;alterar:(valor:string)=>void;min?:string;max?:string;passo?:string
}) {
  return <label>{titulo}<input className="entrada" required type="number" min={min} max={max} step={passo}
    value={valor} onChange={evento=>alterar(evento.target.value)}/></label>
}
const modalidades:Record<string,string> = { prefixado:'Prefixado', cdi:'Percentual do CDI', selic:'Percentual da Selic', ipca:'IPCA + taxa', poupanca:'Regra da poupança', cenario:'Cenário de mercado' }

function Editor({valor,produtos,alterar}:{valor:Investimento;produtos:Produto[];alterar:(valor:Investimento)=>void}) {
  const produto = produtos.find(item=>item.codigo===valor.produto)!
  function mudar(chave:keyof Investimento, conteudo:string|boolean|null) { alterar({...valor,[chave]:conteudo}) }
  return <div className="editor">
    <label>Nome<input className="entrada" maxLength={60} required value={valor.nome} onChange={evento=>mudar('nome',evento.target.value)}/></label>
    <label>Investimento<select className="entrada" value={valor.produto} onChange={evento=>{
      const escolhido = produtos.find(item=>item.codigo===evento.target.value)!
      alterar({...novoInvestimento(),nome:escolhido.nome,produto:escolhido.codigo,modalidade:escolhido.modalidades[0]})
    }}>{produtos.map(item=><option value={item.codigo} key={item.codigo}>{item.nome}</option>)}</select></label>
    <p className="nota">{produto.observacao}</p>
    <div className="duas-colunas">
    <label>Remuneração<select className="entrada" value={valor.modalidade} onChange={evento=>mudar('modalidade',evento.target.value)}>{produto.modalidades.map(item=><option key={item} value={item}>{modalidades[item]}</option>)}</select></label>
    <label>Cenário<select className="entrada" value={valor.cenario} onChange={evento=>mudar('cenario',evento.target.value)}><option value="pessimista">Pessimista</option><option value="base">Base</option><option value="otimista">Otimista</option></select></label>
    {valor.modalidade!=='poupanca' && <Numero titulo={produto.grupo==='variavel'?'Valorização anual (%)':'Taxa ou spread anual (%)'} valor={valor.taxa} min="-90" max="100" alterar={v=>mudar('taxa',v)}/>}
    {['cdi','selic','ipca','poupanca'].includes(valor.modalidade) && <Numero titulo={valor.modalidade==='poupanca'?'Selic projetada (% a.a.)':valor.modalidade==='ipca'?'IPCA projetado (% a.a.)':'Indexador projetado (% a.a.)'} min="-50" max="100" valor={valor.indexador} alterar={v=>mudar('indexador',v)}/>}
    {['cdi','selic'].includes(valor.modalidade) && <Numero titulo="Percentual do indexador (%)" valor={valor.percentual} max="300" alterar={v=>mudar('percentual',v)}/>}
    {valor.modalidade==='poupanca' && <Numero titulo="TR mensal projetada (%)" valor={valor.trMensal} max="10" alterar={v=>mudar('trMensal',v)}/>}
    <Numero titulo="Inflação projetada (% a.a.)" valor={valor.inflacao} min="-50" max="100" alterar={v=>mudar('inflacao',v)}/>
    </div>
    {produto.grupo==='fixa' && valor.modalidade==='prefixado' && <label className="marcacao"><input type="checkbox" checked={valor.diasUteis} onChange={evento=>mudar('diasUteis',evento.target.checked)}/>Taxa na base de 252 dias úteis (desmarque para 365 corridos)</label>}
    {produto.grupo==='variavel' && <><p className="aviso">Cenário hipotético. O investimento pode perder valor. As taxas são premissas informadas por você.</p>
      <div className="duas-colunas"><Numero titulo="Dividendos (% a.a., pagos mensalmente)" valor={valor.dividendos} max="50" alterar={v=>mudar('dividendos',v)}/>
      {['ACOES','ETF','BDR'].includes(valor.produto) && <Numero titulo="Imposto efetivo sobre proventos (%)" valor={valor.impostoDividendos} max="100" alterar={v=>mudar('impostoDividendos',v)}/>}
      {valor.produto==='EXTERIOR' && <><Numero titulo="Variação USD/BRL (% a.a.)" valor={valor.cambio} min="-90" max="100" alterar={v=>mudar('cambio',v)}/><Numero titulo="Retenção no exterior sobre proventos (%)" valor={valor.impostoExterior} max="100" alterar={v=>mudar('impostoExterior',v)}/></>}
      </div>
      <label className="marcacao"><input type="checkbox" checked={valor.reinvestir} onChange={evento=>mudar('reinvestir',evento.target.checked)}/>Reinvestir proventos líquidos</label>
      {valor.produto==='EXTERIOR'&&<label className="marcacao"><input type="checkbox" checked={valor.compensarImpostoExterior??false} onChange={evento=>mudar('compensarImpostoExterior',evento.target.checked)}/>Imposto estrangeiro elegível a compensação no Brasil (tratado ou reciprocidade)</label>}
      {['FII','FIAGRO'].includes(valor.produto) && <label className="marcacao"><input type="checkbox" checked={valor.isencaoRendimentos} onChange={evento=>mudar('isencaoRendimentos',evento.target.checked)}/>Declaro atendidos os requisitos de isenção dos rendimentos</label>}
      {valor.produto==='ACOES' && <label className="marcacao"><input type="checkbox" checked={valor.isencaoVendasAcoes} onChange={evento=>mudar('isencaoVendasAcoes',evento.target.checked)}/>Venda comum elegível, sem outras vendas de ações no mês (motor verifica R$ 20 mil)</label>}
    </>}
    <details><summary>Custos, vencimento e liquidez</summary><div className="duas-colunas">
      <Numero titulo="Administração (% a.a.)" valor={valor.administracao} max="20" alterar={v=>mudar('administracao',v)}/>
      <Numero titulo="Custódia efetiva (% a.a.)" valor={valor.custodia} max="20" alterar={v=>mudar('custodia',v)}/>
      <Numero titulo="Corretagem por compra (R$)" valor={valor.corretagem} max="1000" passo="0.01" alterar={v=>mudar('corretagem',v)}/>
      <Numero titulo="Outros custos totais (R$)" valor={valor.outrosCustos} max="1000" passo="0.01" alterar={v=>mudar('outrosCustos',v)}/>
      <label>Vencimento (opcional)<input className="entrada" type="date" value={valor.vencimento??''} onChange={evento=>mudar('vencimento',evento.target.value||null)}/></label>
      <label>Liquidez contratada<input className="entrada" maxLength={120} value={valor.liquidez} onChange={evento=>mudar('liquidez',evento.target.value)}/></label>
    </div></details>
    <details><summary>Trajetória mensal do cenário</summary>
      <p className="nota">Cada mudança começa em um aniversário mensal da data inicial e vale até a próxima mudança. Preencha as taxas anuais completas do novo período.</p>
      {(valor.mudancas??[]).map((mudanca,indice)=><div className="painel" key={indice}>
        <label>Data da mudança<input className="entrada" required type="date" value={mudanca.data} onChange={evento=>alterar({...valor,mudancas:valor.mudancas.map((item,i)=>i===indice?{...item,data:evento.target.value}:item)})}/></label>
        <div className="duas-colunas">{(['taxa','indexador','inflacao','cambio'] as const).map(chave=><Numero key={chave}
          titulo={({taxa:'Taxa ou valorização',indexador:'Indexador',inflacao:'Inflação',cambio:'Câmbio'})[chave]+' (% a.a.)'}
          min={chave==='indexador'||chave==='inflacao'?'-50':'-90'} max="100" valor={mudanca[chave]}
          alterar={conteudo=>alterar({...valor,mudancas:valor.mudancas.map((item,i)=>i===indice?{...item,[chave]:conteudo}:item)})}/>)}</div>
        <button className="secundario" type="button" onClick={()=>alterar({...valor,mudancas:valor.mudancas.filter((_,i)=>i!==indice)})}>Remover mudança</button>
      </div>)}
      {(valor.mudancas??[]).length<120&&<button className="secundario" type="button" onClick={()=>alterar({...valor,mudancas:[...(valor.mudancas??[]),{data:'',taxa:valor.taxa,indexador:valor.indexador,inflacao:valor.inflacao,cambio:valor.cambio}]})}>+ Mudança mensal</button>}
    </details>
  </div>
}

function carregar():Parametros {
  try {
    const salvo = sessionStorage.getItem('vertice-projecoes-v1')
    if (salvo) return JSON.parse(salvo)
  } catch { /* Dados locais indisponíveis ou inválidos. */ }
  const hoje = new Date().toLocaleDateString('en-CA')
  return {capital:'10000',aporte:'0',inicio:hoje,fim:`${Number(hoje.slice(0,4))+1}${hoje.slice(4)}`,feriados:[],investimentos:[novoInvestimento()]}
}

function Resumo({projecao}:{projecao:Projecao}) {
  const fim = projecao.evolucao[projecao.evolucao.length-1]
  return <section className="painel resumo"><h2>{projecao.investimento.nome} · {projecao.investimento.cenario}</h2>
    <p>Montante líquido estimado</p><strong className="valor-destaque">{moeda(fim.liquido)}</strong>
    <dl>{[
      ['Capital aplicado',moeda(fim.aplicado)],['Montante bruto',moeda(fim.bruto)],['IR',moeda(fim.ir)],['IOF',moeda(fim.iof)],
      ['Administração',moeda(fim.administracao)],['Custódia',moeda(fim.custodia)],['Corretagem',moeda(fim.corretagem)],
      ['Outros custos',moeda(fim.outrosCustos)],['Proventos brutos',moeda(fim.proventos)],
      ['Rentabilidade bruta',numero(fim.rentabilidadeBruta)+'%'],['Rentabilidade líquida',numero(fim.rentabilidadeLiquida)+'%'],
      ['Ganho real em moeda da data inicial',moeda(fim.ganhoReal)],['TIR líquida anualizada',fim.anualizada==='NA'?'Indisponível':numero(fim.anualizada)+'%'],
      ['Liquidez',projecao.investimento.liquidez],['Vencimento',projecao.investimento.vencimento||'Não informado'],['Risco',projecao.produto.risco]
    ].map(([titulo,valor])=><div key={titulo}><dt>{titulo}</dt><dd>{valor}</dd></div>)}</dl>
    <details><summary>Premissas · {projecao.regraFiscal}</summary><ul>{projecao.premissas.map(texto=><li key={texto}>{texto}</li>)}</ul></details>
  </section>
}

export function Investimentos() {
  const [dados, definir] = useState<Parametros>(carregar)
  const catalogo = useQuery({queryKey:['catalogo'],queryFn:()=>requisitar<{produtos:Produto[]}>('/api/projecoes/catalogo'),staleTime:3600000})
  const calculo = useMutation({mutationFn:comparar})
  const navegar = useNavigate()
  const comparador = useLocation().pathname==='/comparador'
  useEffect(()=>{try {sessionStorage.setItem('vertice-projecoes-v1',JSON.stringify(dados))} catch { /* Armazenamento opcional. */ }},[dados])
  function mudar(valor:Parametros) {definir(valor);calculo.reset()}
  function enviar(evento:FormEvent) {evento.preventDefault();calculo.mutate({...dados,investimentos:comparador?dados.investimentos:[dados.investimentos[0]]})}
  if (catalogo.isPending) return <main>Carregando produtos…</main>
  if (catalogo.isError) return <main role="alert">{catalogo.error.message}<button onClick={()=>catalogo.refetch()}>Tentar novamente</button></main>
  return <main className="amplo"><p className="rubrica">PLANEJAMENTO / {comparador?'COMPARADOR':'SIMULADORES'}</p>
    <h1>{comparador?'Compare seus caminhos':'Projete seu investimento'}</h1>
    <p>Defina valores, datas e premissas. Cada aporte mantém seu próprio prazo tributário.</p>
    <form onSubmit={enviar} className="formulario-projecao"><fieldset disabled={calculo.isPending}><h2>Valores e datas comuns</h2>
      <div className="quatro-colunas"><Numero titulo="Valor inicial (R$)" valor={dados.capital} min="0.01" passo="0.01" alterar={v=>mudar({...dados,capital:v})}/>
      <Numero titulo="Aporte mensal (R$)" valor={dados.aporte} max="1000000" passo="0.01" alterar={v=>mudar({...dados,aporte:v})}/>
      <label>Data inicial<input required className="entrada" type="date" min="2026-01-01" value={dados.inicio} onChange={evento=>mudar({...dados,inicio:evento.target.value})}/></label>
      <label>Data final<input required className="entrada" type="date" value={dados.fim} onChange={evento=>mudar({...dados,fim:evento.target.value})}/></label></div>
      <details><summary>Calendário adicional</summary><label>Feriados locais ou de mercado, separados por vírgulas (AAAA-MM-DD)<input className="entrada" defaultValue={dados.feriados.join(',')} onBlur={evento=>mudar({...dados,feriados:evento.target.value.split(',').map(v=>v.trim()).filter(Boolean)})}/></label></details>
      <p className="nota">As taxas abaixo são hipóteses manuais. Os indicadores publicados estão no painel de mercado.</p>
      <div className="editores">{(comparador?dados.investimentos:[dados.investimentos[0]]).map((investimento,indice)=><section className="painel" key={indice}>
        <Editor valor={investimento} produtos={catalogo.data.produtos} alterar={valor=>mudar({...dados,investimentos:dados.investimentos.map((item,i)=>i===indice?valor:item)})}/>
        {comparador&&dados.investimentos.length>1&&<button className="secundario" type="button" onClick={()=>mudar({...dados,investimentos:dados.investimentos.filter((_,i)=>i!==indice)})}>Remover investimento</button>}
      </section>)}</div>
      {comparador&&dados.investimentos.length<8&&<button type="button" className="secundario" onClick={()=>mudar({...dados,investimentos:[...dados.investimentos,{...novoInvestimento(),nome:'Investimento '+(dados.investimentos.length+1)}]})}>+ Adicionar investimento</button>}
      <button className="calcular">{calculo.isPending?'Calculando…':comparador?'Comparar investimentos':'Simular investimento'}</button>
    </fieldset></form>
    {calculo.isError&&<p role="alert" className="aviso">{calculo.error.message}</p>}
    {calculo.data&&<section aria-live="polite"><div className="acoes"><h2>Resultados estimados</h2>
      {!comparador&&<button className="secundario" onClick={()=>navegar('/comparador')}>Levar ao comparador</button>}
      </div>
      <div className="editores">{calculo.data.map((projecao,i)=><Resumo key={i} projecao={projecao}/>)}</div>
    </section>}
    <p className="nota">Fundos com carência tributária especial, ETFs de renda fixa e produtos com cupons ou amortizações exigem modelos específicos e ainda estão fora deste catálogo.</p>
  </main>
}
