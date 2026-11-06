# Modelo financeiro e fontes

Versão inicial ampliada, revisada em 3 de novembro de 2026. Todos os valores futuros são cenários definidos pelo usuário. Os indicadores oficiais publicados aparecem com unidade, origem e data, separados das premissas de projeção.

## Contrato e precisão

O executável projecao recebe VERTICE-1 na primeira linha, seguido dos parâmetros numéricos em linhas com ponto decimal, regras fiscais e calendário de eventos. Cada evento inclui as taxas aplicáveis ao intervalo, permitindo trajetórias mensais. Projetor.cs define a ordem exata. A resposta tem uma linha por evento, com data AAAAMMDD e 14 campos separados por |. Os campos são aplicado, bruto, líquido, IR, IOF, administração, custódia, corretagem, outros custos, proventos, rentabilidade bruta, rentabilidade líquida, ganho real e TIR anualizada.

Moedas e taxas usam decimal no C# e PIC com COMP-3 no COBOL. Valores monetários têm até 18 dígitos inteiros e oito casas internas. Fatores têm 14 casas. A saída e os tributos por evento são arredondados ao centavo com ROUNDED. A potência usa a aritmética do runtime GnuCOBOL. Os montantes de projeção são strings decimais no JSON.

O adaptador limita quatro processos simultâneos, timeout de vinte segundos por programa incluindo espera na fila e encerra a árvore de processos no cancelamento. O motor original de juros compostos mantém seu contrato e timeout anterior. Não há execução de shell com parâmetros do usuário.

## Taxas, aportes e calendários

A taxa anual prefixada se converte pelo fator (1 + taxa/100) elevado a dias/365, ou dias úteis/252 conforme a base escolhida. CDI e Selic pós-fixados usam a taxa anual hipotética convertida ao dia útil, multiplicam a taxa diária pelo percentual contratado e capitalizam nos dias úteis. Spread adicional é capitalizado pela base 252.

O híbrido usa o produto dos fatores anuais de inflação e taxa real, elevado a dias/365. É uma aproximação de projeção, sem defasagem do índice, VNA ou precificação de mercado dos títulos. O indicador IPCA do SGS é mensal e não é preenchido automaticamente como taxa anual.

Cada aporte constitui um lote. O calendário considera a data inicial exclusiva para envelhecimento tributário e o resgate na data final. Para capitalização útil, conta os dias úteis no intervalo [início, fim). Os aportes ocorrem no aniversário mensal da data inicial, ao fim do período, exceto na data final. Finais de mês usam o último dia válido do mês. Depósitos em finais de semana são uma convenção da simulação, com rendimento de mercado a partir do próximo dia útil.

O calendário inclui finais de semana, feriados nacionais, Carnaval, Sexta-feira Santa e Corpus Christi. Feriados adicionais podem ser informados. Fechamentos extraordinários e convenções particulares da instituição devem ser acrescentados pelo usuário.

A poupança considera depósitos novos e aniversário mensal. Sem aniversário completo, não há remuneração daquele período. A remuneração mensal é TR composta com 0,5% quando a Selic excede 8,5%, ou com a taxa equivalente mensal de 70% da Selic anual. Para depósitos nos dias 29 a 31, o formulário solicita a data-base legal do dia 1 seguinte. [Banco Central](https://www.bcb.gov.br/estatisticas/remuneradepositospoupanca/1000)

## Tributação versionada

Configuracao/tributacao.json contém vigência, versão, fonte, alíquotas e tabela IOF. Configuracao/produtos.json associa cada produto ao regime. Alterações exigem editar as configurações e reiniciar a API. Vigências não podem se sobrepor. Uma projeção que atravessa regras diferentes é rejeitada para ser dividida em períodos. O cenário futuro mantém a regra selecionada como hipótese e não antecipa mudanças legais.

A tabela de renda fixa aplica 22,5% até 180 dias, 20% até 360, 17,5% até 720 e 15% acima de 720. O IOF regressivo de 1 a 29 dias incide sobre o rendimento positivo, antes da base de IR. O lote conserva a própria data de aplicação. LCI, LCA, CRI, CRA, poupança e debêntures incentivadas usam isenção para pessoa física, condicionada ao enquadramento do instrumento. [Receita Federal — tabelas de 2026](https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026), [Lei 11.033](https://www2.camara.leg.br/legin/fed/lei/2004/lei-11033-21-dezembro-2004-535177-normaatualizada-pl.html), [Decreto 6.306](https://www2.camara.leg.br/legin/fed/decret/2007/decreto-6306-14-dezembro-2007-566561-normaatualizada-pe.html)

Fundos de longo e curto prazo sofrem come-cotas no último dia útil de maio/novembro. A antecipação reduz o saldo que continua rendendo. O modelo mantém o ganho realizado e a base após cada evento por lote para calcular o complemento no resgate, sem descontar a antecipação duas vezes. Longo prazo usa antecipação de 15% e tabela regressiva. Curto prazo usa 20% na antecipação e 22,5%/20% no resgate. Considera fundos sem carência tributária especial e sem alteração de enquadramento. [IN RFB 1.585/2015](https://normas.receita.fazenda.gov.br/sijut2consulta/link.action?idAto=67494)

Ações, ETFs de renda variável e BDRs usam 15% sobre ganhos líquidos na venda comum simulada. FII/Fiagro sob regime de FII usam 20%. A isenção de ações até R$ 20 mil precisa ser explicitamente habilitada, presume ausência de outras vendas no mês e é verificada contra o valor total de venda do cenário. ETFs e BDRs não recebem essa isenção. Os resultados de linhas distintas do comparador representam alternativas, e não uma carteira vendida simultaneamente. [Receita Federal — renda variável](https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/pagamento/renda-variavel)

A isenção dos rendimentos de FII/Fiagro depende de declaração do usuário de que o fundo e o cotista cumprem os requisitos legais, incluindo negociação elegível, quantidade de cotistas e limites de participação. O padrão conserva tributação de 20% sobre os rendimentos. Fundos de ações usam 15% no resgate, sem come-cotas. A variação de cota informada deve incluir os rendimentos internos. [Lei 11.033](https://www2.camara.leg.br/legin/fed/lei/2004/lei-11033-21-dezembro-2004-535177-normaatualizada-pl.html), [Receita Federal — fundos](https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/pagamento/renda-variavel/fundos-de-investimento-no-brasil)

Ações brasileiras consideram um emissor por cenário. Dividendos mensais superiores a R$ 50 mil recebem retenção de 10% no modelo, conforme parâmetros versionados de 2026. A alíquota efetiva manual atende outras hipóteses de proventos, inclusive BDRs. A apuração anual de altas rendas, exceções de lucros anteriores e agregação por pagador permanecem fora do modelo. [Receita Federal — Lei 15.270](https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/perguntas-e-respostas/dirf/perguntas-e-respostas-sobre-tributacao-de-altas-rendas_consideracoes-sobre-lucros-e-dividendos2025.pdf)

No exterior, valorização do ativo e variação cambial são compostas. O modelo provisiona 15% de imposto brasileiro sobre ganho realizado na venda final e sobre proventos. Retenção estrangeira é parametrizada. A compensação depende de declaração expressa de elegibilidade e fica limitada à parcela brasileira. Os proventos são estimados mensalmente em reais. A apuração fiscal efetiva exige datas e câmbio de cada realização. [Receita Federal — IN 2.180](https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2024/marco/receita-federal-edita-norma-que-regulamenta-a-tributacao)

## Proventos, custos e resultados

Os proventos anuais informados são divididos em pagamentos mensais sobre o saldo inicial do período. Proventos líquidos reinvestidos criam novos lotes. Sem reinvestimento, permanecem em caixa sem juros até o final. O bruto soma o saldo de investimentos, o caixa e os tributos já retidos para permitir reconciliação com o líquido. Em fundos, inclui também os custos internos já descontados, sem recompor o rendimento que esses valores deixaram de produzir.

Administração e custódia são estimativas pro rata sobre o saldo inicial de cada intervalo, usando dias corridos/365. Em fundos, reduzem o saldo antes da tributação. Nos demais instrumentos são despesas descontadas no resgate. Corretagem é cobrada no investimento inicial e em cada aporte. Outros custos são um valor único informado. Custódia efetiva do Tesouro deve considerar isenções aplicáveis. Não há taxa de performance. A apuração diária exata de despesas e a dedutibilidade fiscal específica de corretagem ainda exigem ampliação.

Rentabilidade simples é (montante / soma dos aportes − 1) × 100. A TIR anualizada resolve, por bisseção no COBOL, a equivalência entre os aportes nas respectivas datas e o valor líquido final. É calculada no ponto final, em base 365. Proventos em caixa integram o recebimento final. Se o líquido for zero ou negativo, a TIR é marcada como indisponível. Os demais pontos trazem NA nesse campo.

Ganho real desconta o montante final e cada aporte pela inflação hipotética até a data inicial. Comparar cenários exige premissas de inflação coerentes.

## Banco Central e disponibilidade

As atualizações recentes consultam 90 dias (400 para IPCA). O histórico até dez anos é preenchido progressivamente em blocos de até 90 dias, com persistência por bloco e pausa entre requisições. Consultas incompletas podem ser retomadas a partir dos dados armazenados. Os intervalos ficam abaixo do limite de dez anos do SGS. As unidades originais são preservadas — Selic meta em % ao ano, Selic efetiva e CDI em % ao dia, IPCA em % ao mês. A data de referência de uma observação mensal é a data informada pelo SGS. PTAX usa CotacaoDolarPeriodo com compra/venda de fechamento. [SGS 432 e limites de consulta](https://dadosabertos.bcb.gov.br/dataset/432-taxa-de-juros---meta-selic-definida-pelo-copom), [documentação PTAX](https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/documentacao)

O provedor IProvedorIndicadores pode ser substituído por outra implementação sem alterar os simuladores. Não usa chave ou serviço pago. A disponibilidade e as condições futuras de terceiros não são garantidas.

A atualização ocorre no início e a cada seis horas. A ação manual respeita intervalo mínimo de cinco minutos e as fontes têm timeout individual. Falhas de uma série não impedem as demais. O banco conserva registros anteriores e dados manuais separados dos oficiais. Não há substituição por cotações fictícias. O dashboard consulta o histórico local e mostra a data de referência e a última consulta bem-sucedida. A atualização externa pode ser desativada com Indicadores__AtualizacaoAutomatica=false.

## Ampliações pendentes e limites

- Cupons, amortizações, marcação a mercado, VNA, defasagens de inflação, carências e liquidação específica de cada emissão.
- ETFs de renda fixa e fundos especiais, reenquadramentos fiscais, compensação de perdas anteriores e taxa de performance.
- Retenções definitivas, ajuste anual de altas rendas, limites mensais agregados entre ativos/pagadores e hipóteses de transição da tributação dos dividendos.
- IOF de remessa/repatriação, spread de câmbio percentual, créditos fiscais estrangeiros transportados e cálculo fiscal por evento de realização. Outros custos permitem apenas estimativa manual agregada.
Mudanças mensais de taxa, indexador, inflação e câmbio podem ser registradas nos aniversários da aplicação. Cada mudança vale até a próxima, e os fatores de inflação são acumulados por intervalo para descontar cada aporte corretamente.
- Validação visual em navegador, compilação em Linux e publicação. A entrega foi compilada no Windows.


