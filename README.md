# Plataforma de Investimentos

Projeto pessoal de portfólio para simular investimentos, comparar cenários e acompanhar indicadores econômicos. A aplicação permite explorar como aportes, prazo, rentabilidade, impostos, custos e inflação afetam o patrimônio projetado.

O foco atual está nos simuladores de renda fixa e renda variável, no comparador e nos indicadores do Banco Central. A execução descrita neste guia é local, com a interface aberta no navegador.

## Conteúdo

- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação e execução no Windows](#instalação-e-execução-no-windows)
- [Como usar](#como-usar)
- [Dados e funcionamento sem conexão](#dados-e-funcionamento-sem-conexão)
- [Configurações opcionais](#configurações-opcionais)
- [Compilação e testes](#compilação-e-testes)
- [Execução no Linux](#execução-no-linux)
- [API](#api)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Problemas comuns](#problemas-comuns)
- [Limitações atuais](#limitações-atuais)

## Funcionalidades

| Área | Recursos |
| --- | --- |
| Simuladores | Capital inicial, aportes mensais, datas, taxas, inflação, custos e trajetórias mensais |
| Renda fixa | CDB, LCI, LCA, LC, letras financeiras, Tesouro Selic, Prefixado e IPCA+, debêntures comuns e incentivadas, CRI, CRA, poupança e fundos de curto e longo prazo |
| Renda variável | Ações brasileiras, FIIs, Fiagros sob regime de FII, ETFs de renda variável, BDRs, ações e ETFs no exterior e fundos de ações |
| Cenários | Pessimista, base e otimista, com parâmetros definidos pelo usuário |
| Comparador | Até oito alternativas com os mesmos valores de entrada e datas |
| Resultados | Montantes bruto e líquido, IR, IOF, custos individualizados, proventos, ganho real e TIR anualizada |
| Indicadores | Selic, CDI, IPCA e PTAX de compra e venda, com fonte, unidade e data |
| Interface | Tema claro e adaptação a telas menores |
| Juros compostos | Calculadora independente com capital, taxa mensal e prazo em meses |

As características e as hipóteses de cada investimento aparecem no formulário e no resumo do resultado. As regras tributárias implementadas possuem versão e vigência.

## Tecnologias

| Camada | Tecnologias | Responsabilidade |
| --- | --- | --- |
| Interface | React 19, TypeScript, Vite 7 e Tailwind CSS 4 | Páginas, formulários e estilos |
| Navegação e consultas | React Router e TanStack Query | Rotas, requisições e cache da interface |
| API | C# e ASP.NET Core Web API .NET 10 | Validação, endpoints REST e orquestração |
| Persistência | Entity Framework Core 10 e SQLite | Histórico de indicadores, calculadora original e migrations |
| Motor financeiro | GnuCOBOL 3.2 | Rendimentos, tributação, projeções e consolidação |
| Documentação da API | OpenAPI | Descrição dos endpoints e contratos |
| Testes | Executor nativo do Node.js | Integração entre API, SQLite e COBOL |

O navegador envia os parâmetros à API por HTTP/JSON. A API valida os dados, prepara o calendário, executa o programa COBOL e devolve os resultados para a interface.

```text
React / TypeScript → API .NET → Motor GnuCOBOL
                         ↓
                       SQLite
                         ↑
                  Indicadores do BCB
```

Os cálculos financeiros ficam no COBOL. O backend também consulta o Banco Central e persiste observações no SQLite.

## Pré-requisitos

O ambiente validado é Windows com PowerShell e MSYS2 UCRT64.

| Ferramenta | Versão utilizada ou esperada |
| --- | --- |
| Node.js | 24.x foi utilizado na validação. O frontend também admite 22.12 ou superior na linha 22 |
| npm | Incluído no Node.js |
| .NET SDK | 10.x |
| GnuCOBOL | 3.2 |
| GCC e bibliotecas COBOL | Disponibilizados pelo MSYS2 UCRT64 no Windows |
| Navegador | Suporte a JavaScript moderno e SVG |
| Git | Opcional para obter e atualizar o repositório |

Instale Node.js e .NET SDK pelos sites oficiais. Depois, abra um novo terminal para carregar as alterações do PATH. [Node.js](https://nodejs.org/en/download), [.NET SDK 10](https://dotnet.microsoft.com/en-us/download/dotnet/10.0)

A instalação inicial precisa de internet para baixar dependências. As consultas de indicadores também precisam de conexão.

## Instalação e execução no Windows

### 1. Preparar o GnuCOBOL

Instale o MSYS2. O script do projeto considera a pasta padrão `C:\msys64\ucrt64`. [Instalação oficial do MSYS2](https://www.msys2.org/)

Abra o terminal **MSYS2 UCRT64** pelo menu Iniciar:

```bash
pacman -Syu
```

Se a atualização solicitar o fechamento do terminal, feche-o, abra novamente o UCRT64 e repita o comando. Em seguida:

```bash
pacman -S --needed mingw-w64-ucrt-x86_64-gnucobol mingw-w64-ucrt-x86_64-gcc
cobc -V
gcc --version
```

Execute `pacman` no terminal MSYS2 UCRT64. Os próximos passos usam PowerShell.

### 2. Obter o projeto

Clone o repositório pelo endereço fornecido em sua página de hospedagem ou baixe e extraia o ZIP.

Os exemplos usam `C:\dev\invest-project`. Substitua esse caminho pela pasta em que você colocou o projeto.

Abra o PowerShell:

```powershell
cd C:\dev\invest-project
node --version
npm.cmd --version
dotnet --list-sdks
```

A listagem do .NET deve incluir um SDK 10.x. A raiz do projeto contém `frontend`, `backend`, `COBOL` e este README.

### 3. Instalar dependências

Na raiz:

```powershell
npm.cmd --prefix frontend ci
dotnet restore backend/API
```

O comando `npm ci` usa as versões registradas no arquivo de lock. Repita-o quando as dependências do frontend forem atualizadas.

### 4. Compilar o COBOL e iniciar a API

No **primeiro terminal PowerShell**, na raiz:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
. ./COBOL/compilar.ps1
dotnet run --project backend/API --urls http://127.0.0.1:5080
```

Confirme a alteração de política se solicitado. O escopo `Process` vale apenas para o terminal atual e termina quando ele é fechado.

O ponto e o espaço antes de `./COBOL/compilar.ps1` importam as configurações do script para a sessão. Assim, a API encontra as DLLs do GnuCOBOL. O script gera `juros.exe` e `projecao.exe` em `COBOL/bin`.

A API cria ou atualiza o SQLite automaticamente pelas migrations. Aguarde a mensagem de que está escutando em `http://127.0.0.1:5080` e mantenha esse terminal aberto.

### 5. Iniciar o frontend

Abra um **segundo terminal PowerShell**:

```powershell
cd C:\dev\invest-project
npm.cmd --prefix frontend run dev
```

Acesse o endereço exibido pelo Vite, normalmente [http://localhost:5173](http://localhost:5173). Se essa porta estiver ocupada, o Vite pode selecionar outra.

### 6. Confirmar o funcionamento

Abra **Juros compostos** no menu. Informe capital de R$ 1.000, taxa mensal de 1% e prazo de 12 meses. O resultado esperado é R$ 1.126,83. Esse exemplo verifica o fluxo entre interface, API e COBOL.

Abra **Indicadores** para acompanhar a carga dos dados externos. Falhas de consulta são apresentadas na página.

### Abrir novamente e encerrar

Após a instalação, repita os passos 4 e 5. A compilação também prepara o ambiente COBOL no novo terminal.

Se os executáveis COBOL já estiverem compilados e seus fontes não tiverem mudado, você pode iniciar sem recompilar. No **primeiro terminal PowerShell**, execute:

```powershell
cd C:\dev\invest-project
$env:Path = "C:\msys64\ucrt64\bin;" + $env:Path
dotnet run --project backend/API --urls http://127.0.0.1:5080
```

A configuração de `Path` precisa ser feita em cada novo terminal usado para iniciar a API. Se o MSYS2 estiver em outra pasta, ajuste o caminho. Sem as DLLs do GnuCOBOL acessíveis, a API pode iniciar normalmente, mas os cálculos falham.

No **segundo terminal PowerShell**, execute:

```powershell
cd C:\dev\invest-project
npm.cmd --prefix frontend run dev
```

Abra o endereço informado pelo Vite. Executar `powershell -ExecutionPolicy Bypass -File .\COBOL\compilar.ps1` compila em um processo separado: as alterações de ambiente desse processo não permanecem no terminal original. Nesse caso, configure o `Path` como mostrado acima antes de iniciar a API.

Para encerrar, pressione `Ctrl+C` nos dois terminais. Encerre a API antes de recompilar seu código ou os programas COBOL e reinicie-a ao terminar.

## Como usar

### Simuladores

1. Abra **Simuladores**.
2. Preencha capital inicial, aporte mensal e datas.
3. Selecione o investimento e uma modalidade disponível para ele.
4. Informe taxas projetadas, inflação e demais parâmetros.
5. Abra **Custos, vencimento e liquidez** para informar despesas e condições contratuais.
6. Clique em **Simular investimento**.
7. Consulte o resultado e as premissas.

Para uma taxa de 10%, digite `10`. Para 100% do CDI, digite `100` no campo de percentual do indexador.

As taxas dos novos simuladores são anuais, conforme os rótulos. A calculadora **Juros compostos** usa taxa mensal. Os indicadores de mercado mantêm as unidades publicadas pelas fontes.

Os aportes ocorrem ao fim de cada período mensal completo, exceto na data final de resgate.

### Exemplo de renda fixa

Os valores abaixo são hipóteses manuais.

| Campo | Valor |
| --- | --- |
| Capital | R$ 1.000,00 |
| Aporte | R$ 0,00 |
| Início | 01/01/2026 |
| Fim | 01/01/2027 |
| Produto | CDB |
| Modalidade | Prefixado |
| Taxa anual | 10% |
| Base de 252 dias úteis | Desmarcada, usando 365 dias corridos |
| Inflação e custos | Zero |

O resultado esperado é R$ 1.100,00 brutos, R$ 17,50 de IR e R$ 1.082,50 líquidos, conforme a regra fiscal selecionada na versão atual.

### Comparador

1. Abra **Comparador** ou use **Levar ao comparador** após uma simulação.
2. Defina os valores e as datas comuns.
3. Clique em **Adicionar investimento** para incluir alternativas.
4. Ajuste produtos, taxas e custos.
5. Clique em **Comparar investimentos**.

Você pode editar ou remover alternativas e calcular novamente na mesma página. O limite é de oito investimentos.

Os resultados apresentam patrimônio bruto e líquido, impostos, custos e premissas de cada alternativa. Cada investimento representa uma alternativa independente para o mesmo capital.

### Cenários e mudanças mensais

**Pessimista**, **Base** e **Otimista** identificam as premissas escolhidas por você. Adicione uma linha para cada cenário no comparador e informe suas taxas.

Em **Trajetória mensal do cenário**, use **Mudança mensal** para alterar taxa, indexador, inflação e câmbio. A data precisa corresponder a um aniversário mensal da aplicação, anterior à data final. Cada mudança vale até a seguinte.

Uma aplicação iniciada em 10/01/2026, por exemplo, aceita uma mudança em 10/02/2026. Variação cambial separada aplica-se aos investimentos no exterior. BDRs recebem projeções em reais.

### Proventos e reinvestimento

Nos produtos compatíveis, informe o percentual anual de dividendos. O modelo distribui esses proventos mensalmente.

Marque **Reinvestir proventos líquidos** para incluí-los em novos lotes. Com a opção desmarcada, eles ficam em caixa sem remuneração até o final.

As opções de isenção e compensação tributária dependem das condições reais do investimento e do investidor. Consulte as premissas antes de habilitá-las.

### Indicadores

| Indicador | Fonte | Unidade |
| --- | --- | --- |
| Selic meta | SGS 432 | % ao ano |
| Selic efetiva diária | SGS 11 | % ao dia |
| CDI diário | SGS 12 | % ao dia |
| IPCA mensal | SGS 433 | % ao mês |
| Dólar | PTAX | Reais por dólar, compra e venda |

A API atualiza os indicadores na inicialização e a cada seis horas. O botão **Atualizar indicadores** respeita intervalo mínimo de cinco minutos entre tentativas. Uma nova consulta pode trazer a mesma observação enquanto a fonte ainda não publicou outra.

O histórico dos últimos dez anos é carregado progressivamente em intervalos curtos e salvo no SQLite. A primeira carga pode demorar e seu andamento aparece na página. Atualizações seguintes reutilizam os dados armazenados e retomam a busca de períodos antigos quando necessário.

A **data de referência** corresponde à observação econômica. O horário de **consulta** indica quando a aplicação recebeu o dado. A PTAX é uma referência de fechamento.

Para registrar dados próprios, abra **Registrar observação manual**, preencha e salve. Depois selecione **Observações manuais** em **Fonte de origem**. Para USD, compra e venda são obrigatórias.

Os indicadores servem como referência de consulta. O preenchimento das taxas de simulação é manual.

### Resultados

| Campo | Interpretação |
| --- | --- |
| Capital aplicado | Soma do valor inicial com os aportes |
| Montante bruto | Valor projetado antes das deduções apresentadas, conforme o modelo do produto |
| Montante líquido | Resultado após os tributos e custos modelados |
| IR e IOF | Estimativas tributárias conforme regime e prazo |
| Proventos brutos | Rendimentos distribuídos durante a projeção |
| Rentabilidade bruta e líquida | Retorno simples em relação ao total aplicado |
| Ganho real | Resultado descontado pela inflação, em moeda da data inicial |
| TIR líquida anualizada | Taxa anual equivalente considerando datas dos aportes e resultado final |

A TIR fica indisponível quando o valor líquido final é zero ou negativo. Os cálculos e arredondamentos estão descritos no [modelo financeiro](docs/modelo-financeiro.md).

## Dados e funcionamento sem conexão

O SQLite é um arquivo local. Com os comandos deste guia, o arquivo padrão é `backend/API/simulador.db`.

Ele armazena indicadores, observações manuais e simulações da calculadora original de juros compostos. As tabelas são criadas e atualizadas automaticamente pelas migrations.

Os parâmetros dos novos simuladores e do comparador ficam no `sessionStorage` do navegador. Eles acompanham a sessão da aba e podem ser perdidos ao encerrá-la ou limpar seus dados. Os resultados das projeções são recalculados pela API.

Para fazer backup do banco, encerre as instâncias da API que o utilizam e copie o arquivo SQLite. Essa cópia não inclui os parâmetros armazenados no navegador.

Após instalar as dependências, é possível calcular com parâmetros manuais sem conexão externa. Os indicadores armazenados continuam disponíveis com suas datas. Uma instalação sem histórico exibirá ausência de dados até uma consulta bem-sucedida ou um registro manual.

## Configurações opcionais

Defina as variáveis no terminal em que o serviço será iniciado.

| Configuração | Terminal | Efeito |
| --- | --- | --- |
| `ConnectionStrings__Banco` | API | Altera o arquivo SQLite |
| `Indicadores__AtualizacaoAutomatica` | API | Habilita ou desabilita a atualização automática externa |
| `API_PROXY` | Vite | Altera o endereço da API |
| `UCRT_BIN` | Testes | Altera a pasta das DLLs UCRT64 usada pela suíte |

### MSYS2 em outra pasta

```powershell
. ./COBOL/compilar.ps1 -Ucrt 'D:\ferramentas\msys64\ucrt64'
```

Substitua pelo caminho real e inicie a API no mesmo terminal.

### Outro arquivo SQLite

Crie a pasta de destino antes de iniciar a API. Com o ambiente COBOL preparado:

```powershell
$env:ConnectionStrings__Banco = 'Data Source=C:/dev/invest-project/meus-dados.db'
dotnet run --project backend/API --urls http://127.0.0.1:5080
```

### Desabilitar atualizações automáticas

Defina antes de iniciar ou reiniciar a API:

```powershell
$env:Indicadores__AtualizacaoAutomatica = 'false'
```

A consulta ao histórico e o botão de atualização manual continuam disponíveis.

### Alterar as portas

No terminal da API, com o ambiente COBOL preparado:

```powershell
dotnet run --project backend/API --urls http://127.0.0.1:5081
```

No terminal do frontend:

```powershell
$env:API_PROXY = 'http://127.0.0.1:5081'
npm.cmd --prefix frontend run dev -- --port 5174
```

Abra [http://localhost:5174](http://localhost:5174). Reinicie o Vite sempre que mudar o destino do proxy.

## Compilação e testes

Na raiz, encerre a API se ela estiver usando os binários que serão recompilados:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
. ./COBOL/compilar.ps1
dotnet build backend/API -c Release
npm.cmd --prefix frontend run build
node --test testes/integracao.mjs
```

O build do frontend verifica o TypeScript e gera `frontend/dist`. Os testes usam o build Release da API.

A suíte possui 33 casos de integração. A integração inicia uma API em uma porta local dinâmica, utiliza banco temporário, desativa consultas automáticas externas e executa o COBOL real. Ao terminar, encerra o processo e remove seus dados temporários.

São cobertos impostos, aportes, custos, poupança, perdas, câmbio, proventos, fundos, trajetórias mensais, limites, validações e persistência manual. A configuração atual da suíte foi validada no Windows.

Para personalizar a pasta UCRT64 dos testes:

```powershell
$env:UCRT_BIN = 'D:\ferramentas\msys64\ucrt64\bin'
node --test testes/integracao.mjs
```

A validação anterior concluiu os 32 testes, os builds e as consultas reais às cinco fontes do Banco Central. A inspeção visual automatizada em navegador permanece pendente.

## Execução no Linux

Os comandos abaixo orientam a compilação a partir dos fontes. A execução e a suíte ainda precisam de validação específica no Linux.

Instale Node.js, .NET SDK 10, GnuCOBOL 3.2, GCC e as bibliotecas de desenvolvimento exigidas pela distribuição. Confira:

```bash
node --version
npm --version
dotnet --list-sdks
cobc -V
gcc --version
```

Na raiz:

```bash
npm --prefix frontend ci
dotnet restore backend/API
mkdir -p COBOL/bin
cobc -free -x -o COBOL/bin/juros COBOL/juros.cob
cobc -free -x -o COBOL/bin/projecao COBOL/projecao.cob COBOL/rendimentos.cob COBOL/tributacao.cob COBOL/consolidacao.cob
dotnet run --project backend/API --urls http://127.0.0.1:5080
```

Em outro terminal, na mesma raiz:

```bash
npm --prefix frontend run dev
```

A API procura o executável apropriado ao sistema operacional. Compile o COBOL no próprio ambiente de execução e disponibilize suas bibliotecas de runtime.

## API

A especificação OpenAPI fica disponível quando a API está em execução. [Abrir OpenAPI local](http://127.0.0.1:5080/openapi/v1.json)

| Método | Endpoint | Finalidade |
| --- | --- | --- |
| GET | `/api/projecoes/catalogo` | Produtos e regras fiscais |
| POST | `/api/projecoes` | Projeções de uma ou mais alternativas |
| GET | `/api/indicadores` | Histórico local e avisos |
| POST | `/api/indicadores/atualizar` | Atualização externa |
| POST | `/api/indicadores/manual` | Salvar ou atualizar observação manual |
| POST | `/api/simulacoes/juros-compostos` | Calculadora original |

### Exemplo pelo PowerShell

Com a API iniciada, execute em outro terminal:

```powershell
$entrada = @{
    capital = '1000'
    aporte = '0'
    inicio = '2026-01-01'
    fim = '2027-01-01'
    investimentos = @(
        @{
            nome = 'CDB hipotetico'
            produto = 'CDB'
            modalidade = 'prefixado'
            taxa = '10'
            diasUteis = $false
        }
    )
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri 'http://127.0.0.1:5080/api/projecoes' -Method Post -ContentType 'application/json' -Body $entrada
```

A resposta inclui parâmetros, premissas e evolução por data. Os valores monetários das projeções são strings decimais.

Os novos simuladores aceitam capital de R$ 0,01 a R$ 100 milhões, aportes de até R$ 1 milhão por mês e prazo de até dez anos, com início a partir de 2026. A calculadora original possui limites próprios descritos no OpenAPI.

## Estrutura do projeto

```text
frontend/
  public/                   Favicon
  src/                      Interface, rotas e serviços HTTP
  index.html                Página de entrada
  package.json              Scripts e dependências
  vite.config.ts            Vite e proxy da API
backend/
  API/
    Configuracao/           Catálogo e regras fiscais versionadas
    Controllers/            Endpoints REST
    Servicos/               Atualização periódica de indicadores
    Program.cs              Configuração e inicialização
  Application/              DTOs, validações, contratos e casos de uso
  Domain/                   Entidades
  Infrastructure/
    Migrations/             Evolução do schema SQLite
    Banco.cs                Contexto EF Core
    ExecutorCobol.cs         Execução controlada do motor
    Projetor.cs              Calendário e contrato das projeções
    ProvedorBcb.cs           Fontes públicas
COBOL/
  compilar.ps1              Compilação e ambiente UCRT64
  juros.cob                 Calculadora original
  projecao.cob              Projeções e eventos
  rendimentos.cob           Conversão de taxas e rendimentos
  tributacao.cob            IR e IOF
  consolidacao.cob          Resultados consolidados
testes/
  integracao.mjs            Suíte de integração
docs/
  modelo-financeiro.md      Fórmulas, fontes, hipóteses e limitações
```

As pastas `node_modules`, `dist`, `bin` e `obj` são geradas na instalação ou compilação. Os arquivos SQLite locais também são ignorados pelo Git.

## Problemas comuns

| Problema | Solução |
| --- | --- |
| “Running scripts is disabled on this system” | Execute `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` no terminal atual e depois `. ./COBOL/compilar.ps1` |
| PowerShell bloqueia `npm.ps1` | Use `npm.cmd`, como nos exemplos |
| `node`, `npm` ou `dotnet` não encontrado | Confira a instalação e abra um novo terminal |
| SDK compatível não encontrado | Confira `dotnet --list-sdks` e instale o SDK 10 |
| `cobc` ou `gcc` não encontrado | Instale os pacotes no UCRT64 e confira o caminho passado a `-Ucrt` |
| Erro de `default.conf` no COBOL | Compile pelo script, que configura `COB_CONFIG_DIR` |
| DLL do COBOL ausente ou API inicia, mas os cálculos falham | No terminal da API, execute `$env:Path = "C:\msys64\ucrt64\bin;" + $env:Path` e reinicie a API; alternativamente, importe o script com ponto e espaço e inicie a API no mesmo terminal |
| Executável `juros` ou `projecao` ausente | Compile os fontes COBOL |
| DLL .NET em uso durante o build | Encerre a API com `Ctrl+C`, compile e reinicie |
| Porta ocupada | Encerre a instância anterior ou altere as portas conforme este guia |
| Interface abre, mas requisições falham | Confira se a API está ativa e se `API_PROXY` aponta para ela. Reinicie o Vite após alterar a variável |
| HTTP 400 ao simular | Confira a mensagem, datas, limites, modalidade, vencimento e casas decimais |
| Mudança mensal rejeitada | Use um aniversário da aplicação, único e anterior à data final |
| Falha ou timeout do motor | Confira os logs da API e a compilação dos executáveis |
| Indicadores ausentes ou antigos | Confira origem, datas e avisos. Atualize após o intervalo mínimo ou registre dados manuais |
| Falha de acesso ao SQLite | Confira permissão de escrita, pasta de destino e conexão configurada |
| Falha ao baixar dependências | Confira conexão e proxy, depois repita `npm ci` ou `dotnet restore` |
| Testes não encontram o backend | Execute `dotnet build backend/API -c Release` |
| Interface ou favicon antigos | Atualize a página ignorando o cache com `Ctrl+F5` |

## Limitações atuais

Este é um projeto de estudo e portfólio em evolução. Os resultados são projeções baseadas em premissas e regras implementadas, com foco em pessoa física residente no Brasil.

- Cupons, amortizações, marcação a mercado, VNA, defasagens de inflação e liquidação específica de cada emissão exigem modelos adicionais.
- Compensação de perdas anteriores, ajustes anuais de altas rendas, fundos especiais e taxa de performance permanecem pendentes.
- IOF de remessa e repatriação, spread cambial percentual e apuração fiscal internacional por evento exigem ampliação.
- Os custos utilizam as aproximações descritas na documentação financeira.
- Autenticação, isolamento por usuário, gestão completa de carteira, relatórios exportáveis e importação de movimentações ainda estão fora da implementação atual.
- Hospedagem e distribuição dependem de configuração adicional do servidor, da API, dos arquivos do frontend e do runtime COBOL.

As fontes externas são públicas e não exigem chave na integração atual. Sua disponibilidade e suas condições de acesso são administradas pelo Banco Central.

Consulte fórmulas, vigências fiscais, fontes oficiais e hipóteses de cada produto na documentação complementar. [Modelo financeiro](docs/modelo-financeiro.md)
