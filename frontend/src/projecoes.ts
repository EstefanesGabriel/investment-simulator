export type Investimento = {
  mudancas:{data:string;taxa:string;indexador:string;inflacao:string;cambio:string}[];
  nome:string; produto:string; modalidade:string; taxa:string; percentual:string; indexador:string; inflacao:string;
  administracao:string; custodia:string; corretagem:string; outrosCustos:string; dividendos:string;
  impostoDividendos:string; cambio:string; impostoExterior:string; trMensal:string; reinvestir:boolean;
  isencaoRendimentos:boolean; isencaoVendasAcoes:boolean; compensarImpostoExterior:boolean; diasUteis:boolean; liquidez:string; vencimento:string|null; cenario:string
}
export type Produto = { codigo:string; nome:string; grupo:string; tributacao:string; modalidades:string[]; risco:string; observacao:string }
export type Ponto = { data:string; aplicado:string; bruto:string; liquido:string; ir:string; iof:string; administracao:string;
  custodia:string; corretagem:string; outrosCustos:string; proventos:string; rentabilidadeBruta:string; rentabilidadeLiquida:string; ganhoReal:string; anualizada:string }
export type Projecao = { investimento:Investimento; produto:Produto; regraFiscal:string; premissas:string[]; evolucao:Ponto[] }
export type Parametros = { capital:string; aporte:string; inicio:string; fim:string; feriados:string[]; investimentos:Investimento[] }
export const novoInvestimento = ():Investimento => ({
  mudancas:[],
  nome:'Meu investimento', produto:'CDB', modalidade:'prefixado', taxa:'0', percentual:'100', indexador:'0', inflacao:'0',
  administracao:'0', custodia:'0', corretagem:'0', outrosCustos:'0', dividendos:'0', impostoDividendos:'0',
  cambio:'0', impostoExterior:'0', trMensal:'0', reinvestir:true, isencaoRendimentos:false,
  isencaoVendasAcoes:false, compensarImpostoExterior:false, diasUteis:true, liquidez:'Conforme contrato', vencimento:null, cenario:'base'
})
export async function requisitar<T>(endereco:string, opcoes?:RequestInit):Promise<T> {
  const resposta = await fetch(endereco,opcoes)
  if (!resposta.ok) {
    const erro = await resposta.json().catch(()=>({}))
    throw new Error(erro.detail || Object.values(erro.errors || {}).flat().join(' ') || 'Não foi possível concluir a solicitação.')
  }
  return resposta.status === 204 ? undefined as T : resposta.json()
}
export const comparar = (dados:Parametros) => requisitar<Projecao[]>('/api/projecoes', {
  method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(dados)
})
export function moeda(valor:string) {
  return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(valor as `${number}`)
}
export function numero(valor:string) {
  return new Intl.NumberFormat('pt-BR',{maximumFractionDigits:4}).format(valor as `${number}`)
}
