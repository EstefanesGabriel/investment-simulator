import { before, after, test } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { once } from 'node:events'

let base
let processo, pasta, registros = ''
const esperar = ms => new Promise(resolver => setTimeout(resolver,ms))

before(async () => {
  pasta = await mkdtemp(join(tmpdir(),'vertice-testes-'))
  processo = spawn('dotnet',['bin/Release/net10.0/API.dll','--urls','http://127.0.0.1:0'],{
    cwd:resolve('backend/API'),env:{...process.env,
      ConnectionStrings__Banco:'Data Source='+join(pasta,'testes.db'),
      Indicadores__AtualizacaoAutomatica:'false',
      PATH:(process.env.UCRT_BIN || 'C:/msys64/ucrt64/bin')+';'+process.env.PATH}
  })
  processo.stdout.on('data',texto=>{
    registros+=texto
    const endereco=registros.match(/Now listening on: (http:\/\/127\.0\.0\.1:\d+)/)
    if(endereco)base=endereco[1]
  })
  processo.stderr.on('data',texto=>registros+=texto)
  for(let tentativa=0;tentativa<80;tentativa++) {
    if(processo.exitCode!==null) throw new Error(registros)
    try {if(base && (await fetch(base+'/api/projecoes/catalogo')).ok)return} catch {}
    await esperar(100)
  }
  throw new Error('API não iniciou. '+registros)
})
after(async () => {
  if(processo && processo.exitCode===null) {const encerrado=once(processo,'exit');processo.kill();await encerrado}
  if(pasta) await rm(pasta,{recursive:true,force:true})
})
const investimento = alteracoes => ({nome:'Teste',produto:'CDB',modalidade:'prefixado',taxa:'10',diasUteis:false,...alteracoes})
const parametros = alteracoes => ({capital:'1000',aporte:'0',inicio:'2026-01-01',fim:'2027-01-01',investimentos:[investimento()],...alteracoes})
async function enviar(dados) {
  return fetch(base+'/api/projecoes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(dados)})
}
async function projetar(dados=parametros()) {
  const resposta=await enviar(dados)
  assert.equal(resposta.status,200,await resposta.clone().text()+'\n'+registros.slice(-3000))
  return resposta.json()
}
const final = projecao => projecao.evolucao.at(-1)
test('CDB anual e tributação após 360 dias',async()=>{
  const resultado=final((await projetar())[0])
  assert.equal(resultado.bruto,'1100.00')
  assert.equal(resultado.ir,'17.50')
  assert.equal(resultado.liquido,'1082.50')
  assert.equal(resultado.anualizada,'8.25')
})
test('isenções de LCI, LCA, CRI, CRA e debênture incentivada',async()=>{
  const resultados=await projetar(parametros({investimentos:['LCI','LCA','CRI','CRA','DEBI'].map(produto=>investimento({produto}))}))
  for(const resultado of resultados) {
    assert.equal(final(resultado).ir,'0.00')
    assert.equal(final(resultado).iof,'0.00')
    assert.equal(final(resultado).liquido,'1100.00')
  }
})
for(const [dias,aliquota] of [[1,22.5],[29,22.5],[30,22.5],[180,22.5],[181,20],[360,20],[361,17.5],[720,17.5],[721,15]]) {
  test('IR e IOF no prazo de '+dias+' dias',async()=>{
    const fim=new Date('2026-01-01T00:00:00Z');fim.setUTCDate(fim.getUTCDate()+dias)
    const resultado=final((await projetar(parametros({fim:fim.toISOString().slice(0,10)})))[0])
    // Referência independente apenas no teste.
    const ganho=1000*(Math.pow(1.1,dias/365)-1)
    const iof= dias===1 ? Math.round(ganho*.96*100)/100 : dias===29 ? Math.round(ganho*.03*100)/100 : 0
    const ir=Math.round((ganho-iof)*aliquota)/100
    assert.ok(Math.abs(Number(resultado.ir)-ir)<.011)
    assert.equal(Number(resultado.iof),iof)
  })
}
test('aporte recente conserva idade própria para IOF',async()=>{
  const resultado=final((await projetar(parametros({aporte:'1000',fim:'2026-02-02'})))[0])
  assert.equal(resultado.aplicado,'2000.00')
  assert.ok(Number(resultado.iof)>0)
})
test('taxa zero com aportes e custos individualizados',async()=>{
  const resultado=final((await projetar(parametros({aporte:'100',investimentos:[investimento({taxa:0,corretagem:2,outrosCustos:3})]})))[0])
  assert.equal(resultado.aplicado,'2100.00')
  assert.equal(resultado.bruto,'2100.00')
  assert.equal(resultado.corretagem,'24.00')
  assert.equal(resultado.outrosCustos,'3.00')
  assert.equal(resultado.liquido,'2073.00')
})
test('híbrido usa composição de IPCA e taxa real',async()=>{
  const resultado=final((await projetar(parametros({investimentos:[investimento({modalidade:'ipca',taxa:6,indexador:4})]})))[0])
  assert.equal(resultado.bruto,'1102.40')
})
test('poupança só rende no aniversário',async()=>{
  const produto=investimento({produto:'POUPANCA',modalidade:'poupanca',indexador:10,trMensal:0})
  const antes=final((await projetar(parametros({fim:'2026-01-31',investimentos:[produto]})))[0])
  const depois=final((await projetar(parametros({fim:'2026-02-01',investimentos:[produto]})))[0])
  assert.equal(antes.bruto,'1000.00')
  assert.equal(depois.bruto,'1005.00')
})
test('cenário negativo de ação não gera IR sobre perda',async()=>{
  const resultado=final((await projetar(parametros({investimentos:[investimento({produto:'ACOES',modalidade:'cenario',taxa:-20})]})))[0])
  assert.equal(resultado.bruto,'800.00')
  assert.equal(resultado.ir,'0.00')
  assert.equal(resultado.anualizada,'-20.00')
})
test('câmbio e realização de ganho no exterior',async()=>{
  const resultado=final((await projetar(parametros({investimentos:[investimento({produto:'EXTERIOR',modalidade:'cenario',taxa:10,cambio:10})]})))[0])
  assert.equal(resultado.bruto,'1210.00')
  assert.equal(resultado.ir,'31.50')
})
test('proventos reinvestidos superam caixa sem remuneração',async()=>{
  const resultados=await projetar(parametros({investimentos:[false,true].map(reinvestir=>investimento({produto:'FII',modalidade:'cenario',taxa:0,dividendos:12,isencaoRendimentos:true,reinvestir}))}))
  assert.equal(final(resultados[0]).liquido,'1120.00')
  assert.ok(Number(final(resultados[1]).liquido)>1120)
})
test('fundos LP e CP antecipam tributos e reduzem capitalização',async()=>{
  const resultados=await projetar(parametros({investimentos:['CDB','FUNDO_LP','FUNDO_CP'].map(produto=>investimento({produto}))}))
  assert.ok(Number(final(resultados[1]).liquido)<Number(final(resultados[0]).liquido))
  assert.ok(Number(final(resultados[2]).liquido)<Number(final(resultados[1]).liquido))
  assert.equal(resultados[1].evolucao.length,resultados[0].evolucao.length)
})
test('comparação mantém mesmo capital e prazo',async()=>{
  const resultados=await projetar(parametros({investimentos:[investimento(),investimento({produto:'LCI'})]}))
  assert.equal(final(resultados[0]).data,final(resultados[1]).data)
  assert.equal(final(resultados[0]).aplicado,final(resultados[1]).aplicado)
})
test('validações de produto, datas, limites e modalidade',async()=>{
  for(const dados of [
    parametros({capital:0}),parametros({fim:'2025-01-01'}),parametros({fim:'2037-01-01'}),
    parametros({investimentos:[investimento({produto:'inexistente'})]}),
    parametros({investimentos:[investimento({produto:'LCI',modalidade:'selic'})]}),
    parametros({investimentos:[investimento({vencimento:'2026-06-01'})]})
  ]) assert.equal((await enviar(dados)).status,400)
})
test('histórico manual persistido com fonte e unidade, sem cotações fabricadas',async()=>{
  let historico=await (await fetch(base+'/api/indicadores')).json()
  assert.equal(historico.dados.length,0)
  for(let tentativa=0;tentativa<2;tentativa++) {
    const resposta=await fetch(base+'/api/indicadores/manual',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({codigo:'USD',data:'2026-01-02',valor:'5.20',compra:'5.19'})})
    assert.equal(resposta.status,204)
  }
  historico=await (await fetch(base+'/api/indicadores')).json()
  assert.equal(historico.dados.length,1)
  assert.equal(historico.dados[0].fonte,'Informado manualmente')
  assert.equal(historico.dados[0].compra,5.19)
})
test('histórico inclui observações de seis anos e limita a janela a dez anos',async()=>{
  const hoje=new Date()
  const antigas=[6,11].map(anos=>{
    const data=new Date(hoje)
    data.setUTCFullYear(data.getUTCFullYear()-anos)
    return data.toISOString().slice(0,10)
  })
  for(const data of antigas) {
    const resposta=await fetch(base+'/api/indicadores/manual',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({codigo:'CDI',data,valor:'0.05'})})
    assert.equal(resposta.status,204)
  }
  const historico=await (await fetch(base+'/api/indicadores')).json()
  assert.ok(historico.dados.some(item=>item.codigo==='CDI'&&item.data===antigas[0]))
  assert.ok(!historico.dados.some(item=>item.codigo==='CDI'&&item.data===antigas[1]))
})
test('simulador original continua disponível',async()=>{
  const resposta=await fetch(base+'/api/simulacoes/juros-compostos',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({capital:'1000',taxa:'1',meses:12})})
  assert.equal(resposta.status,200)
  assert.equal((await resposta.json()).montante,'1126.83')
})

test('mudança mensal aplica nova taxa somente dali em diante',async()=>{
  const resultado=final((await projetar(parametros({fim:'2026-03-01',investimentos:[investimento({
    taxa:0,mudancas:[{data:'2026-02-01',taxa:10,indexador:0,inflacao:0,cambio:0}]
  })]})))[0])
  const esperado=1000*Math.pow(1.1,28/365)
  assert.ok(Math.abs(Number(resultado.bruto)-esperado)<.011)
})
test('rejeita trajetória fora do aniversário mensal',async()=>{
  assert.equal((await enviar(parametros({investimentos:[investimento({
    mudancas:[{data:'2026-02-02',taxa:10,indexador:0,inflacao:0,cambio:0}]
  })]}))).status,400)
})
test('dividendos acima do limite mensal recebem retenção',async()=>{
  const resultado=final((await projetar(parametros({capital:'2000000',investimentos:[investimento({
    produto:'ACOES',modalidade:'cenario',taxa:0,dividendos:36,reinvestir:false
  })]})))[0])
  assert.equal(resultado.ir,'72000.00')
  assert.equal(resultado.liquido,'2648000.00')
})
test('isenção de venda de ações respeita limite e produto',async()=>{
  const dados=parametros({investimentos:[investimento({produto:'ACOES',modalidade:'cenario',isencaoVendasAcoes:true})]})
  assert.equal(final((await projetar(dados))[0]).ir,'0.00')
  assert.ok(Number(final((await projetar({...dados,capital:'20000'}))[0]).ir)>0)
  assert.equal((await enviar(parametros({investimentos:[investimento({produto:'ETF',modalidade:'cenario',isencaoVendasAcoes:true})]}))).status,400)
})
test('compensação estrangeira exige opção e limita crédito ao imposto brasileiro',async()=>{
  const resultados=await projetar(parametros({investimentos:[false,true].map(compensarImpostoExterior=>investimento({
    produto:'EXTERIOR',modalidade:'cenario',taxa:0,dividendos:12,impostoExterior:30,reinvestir:false,compensarImpostoExterior
  }))}))
  assert.equal(final(resultados[0]).ir,'54.00')
  assert.equal(final(resultados[1]).ir,'36.00')
})
test('custos e tributos reconciliam o montante líquido ao centavo',async()=>{
  const resultado=final((await projetar(parametros({investimentos:[investimento({
    produto:'FUNDO_LP',administracao:1.173,custodia:.243,corretagem:.07,outrosCustos:.03
  })]})))[0])
  const esperado=Number(resultado.bruto)-['ir','iof','administracao','custodia','corretagem','outrosCustos'].reduce((soma,chave)=>soma+Number(resultado[chave]),0)
  assert.ok(Math.abs(Number(resultado.liquido)-esperado)<.001)
})
test('dez anos, limite de capital e aportes',async()=>{
  const resultado=final((await projetar(parametros({capital:'100000000',aporte:'1000000',fim:'2036-01-01',
    investimentos:[investimento({taxa:100})]})))[0])
  assert.equal(resultado.aplicado,'219000000.00')
  assert.equal(resultado.bruto,'120077241127.66')
})
test('TIR indisponível quando os custos excedem o patrimônio',async()=>{
  const resultado=final((await projetar(parametros({capital:1,investimentos:[investimento({taxa:0,outrosCustos:2})]})))[0])
  assert.equal(resultado.liquido,'-1.00')
  assert.equal(resultado.anualizada,'NA')
})
test('vendas sem ganho, taxas zero e feriados adicionais',async()=>{
  const resultados=await projetar(parametros({fim:'2026-01-03',feriados:['2026-01-02'],
    investimentos:[investimento({diasUteis:true})]}))
  assert.equal(final(resultados[0]).bruto,'1000.00')
})
