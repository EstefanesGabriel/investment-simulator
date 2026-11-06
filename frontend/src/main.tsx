import { type FormEvent } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider, useMutation } from '@tanstack/react-query'
import { simular } from './servicos'
import './estilo.css'
import { Investimentos } from './Investimentos'
import { Indicadores } from './Indicadores'

function Campo({nome, titulo, unidade, inicial, minimo, maximo, passo}: {
  nome:string; titulo:string; unidade:string; inicial:string; minimo:string; maximo:string; passo:string
}) {
  return <label>{titulo}<span className="campo"><input name={nome} type="number" required defaultValue={inicial} min={minimo} max={maximo} step={passo}/><small>{unidade}</small></span></label>
}

function Simulador() {
  const calculo = useMutation({ mutationFn: simular })
  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const dados = new FormData(evento.currentTarget)
    calculo.mutate({capital:String(dados.get('capital')), taxa:String(dados.get('taxa')), meses:String(dados.get('meses'))})
  }
  return <main><p className="rubrica">PLANEJAMENTO &nbsp; / &nbsp; SIMULADORES</p>
    <h1>Juros compostos</h1><p>Projete o crescimento de um investimento com uma taxa mensal constante.</p>
    <div className="grade"><form onSubmit={enviar} onChange={() => calculo.reset()}><h2>Parâmetros da simulação</h2>
      <fieldset disabled={calculo.isPending}><Campo nome="capital" titulo="Capital inicial" unidade="R$" inicial="10000" minimo="0.01" maximo="100000000" passo="0.01"/>
      <Campo nome="taxa" titulo="Taxa mensal" unidade="%" inicial="1" minimo="0" maximo="5" passo="0.0001"/>
      <Campo nome="meses" titulo="Prazo" unidade="meses" inicial="12" minimo="1" maximo="360" passo="1"/>
      <button className="calcular">{calculo.isPending ? 'Calculando…' : 'Calcular projeção →'}</button></fieldset>
      {calculo.isError && <p role="alert">{calculo.error.message}</p>}</form>
      <section className="resultado" aria-live="polite"><p className="rubrica">RESULTADO DA SIMULAÇÃO</p><h2>Montante final</h2><strong>{calculo.data ? new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(calculo.data) : 'R$ —'}</strong><p>{calculo.data ? 'Capital acumulado ao fim do prazo informado.' : 'Calcule para visualizar sua projeção.'}</p></section></div></main>
}
function Aplicacao() {
  return <div className="aplicacao"><aside><span className="descricao-projeto">Plataforma de Investimentos</span><nav>
    <NavLink to="/indicadores">Indicadores</NavLink>
    <NavLink to="/simuladores">Simuladores</NavLink>
    <NavLink to="/comparador">Comparador</NavLink>
    <NavLink to="/simulador">Juros compostos</NavLink>
  </nav></aside><Routes>
    <Route path="/indicadores" element={<Indicadores/>}/>
    <Route path="/simuladores" element={<Investimentos/>}/>
    <Route path="/comparador" element={<Investimentos/>}/>
    <Route path="/simulador" element={<Simulador/>}/>
    <Route path="*" element={<Navigate to="/simuladores" replace/>}/>
  </Routes></div>
}
createRoot(document.getElementById('root')!).render(<QueryClientProvider client={new QueryClient()}><BrowserRouter><Aplicacao/></BrowserRouter></QueryClientProvider>)

