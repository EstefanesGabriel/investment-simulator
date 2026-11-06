export type Entrada = { capital: string; taxa: string; meses: string }
export async function simular(entrada: Entrada): Promise<`${number}`> {
  const resposta = await fetch('/api/simulacoes/juros-compostos', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entrada)
  })
  if (!resposta.ok) throw new Error(resposta.status === 400 ? 'Confira os limites e as casas decimais dos campos.' : 'Não foi possível calcular. Tente novamente.')
  const dados = await resposta.json()
  if (typeof dados.montante !== "string" || !/^\d+(\.\d{1,2})?$/.test(dados.montante)) throw new Error("Montante inválido na resposta.")
  return dados.montante as `${number}`
}

