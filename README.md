# Investment Platform

**English** | [Português (Brasil)](README.pt-BR.md)

A personal portfolio project for simulating investments, comparing scenarios, and checking economic indicators. Explore how contributions, investment duration, returns, taxes, fees, and inflation affect projected wealth.

The application currently focuses on fixed-income and equity investment simulations, scenario comparison, and indicators from the Central Bank of Brazil (BCB). This guide covers local execution in a browser.

The interface is in Brazilian Portuguese. This guide keeps the actual menu and field labels where needed so you can find them in the application. Financial assumptions and products focus on the Brazilian market. This is a personal portfolio project, not a commercial product.

## Contents

- [Features](#features)
- [Technology stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Windows installation and execution](#windows-installation-and-execution)
- [Usage](#usage)
- [Data storage and offline use](#data-storage-and-offline-use)
- [Optional configuration](#optional-configuration)
- [Build and tests](#build-and-tests)
- [Running on Linux](#running-on-linux)
- [API](#api)
- [Project structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Current limitations](#current-limitations)

## Features

| Area | Features |
| --- | --- |
| Simulators | Initial capital, monthly contributions, dates, rates, inflation, costs, and monthly scenario changes |
| Fixed income | CDB, LCI, LCA, LC, financial bills, Tesouro Selic, Prefixado and IPCA+, ordinary and tax-incentivized debentures, CRI, CRA, savings accounts, and short- and long-term funds |
| Equity and market scenarios | Brazilian stocks, FIIs, Fiagros under the FII tax regime, equity ETFs, BDRs, foreign stocks and ETFs, and equity funds |
| Scenarios | Pessimistic, base, and optimistic assumptions supplied by the user |
| Comparison | Up to eight alternatives sharing initial amounts and dates |
| Results | Gross and net balances, IR and IOF taxes, individual costs, distributions, inflation-adjusted gains, and annualized IRR |
| Indicators | Selic, CDI, IPCA, and PTAX buying and selling rates, with source, unit, and reference date |
| Interface | Light theme and responsive layouts |
| Compound interest | Standalone calculator with principal, monthly interest rate, and duration in months |

Each investment's characteristics and assumptions appear in its form and result summary. Implemented tax rules have versions and effective dates.

## Technology stack

| Layer | Technologies | Responsibility |
| --- | --- | --- |
| Frontend | React 19, TypeScript, Vite 7, Tailwind CSS 4 | Pages, forms, and styling |
| Navigation and data fetching | React Router, TanStack Query | Routing, requests, and frontend caching |
| API | C#, ASP.NET Core Web API, .NET 10 | Validation, REST endpoints, and orchestration |
| Persistence | Entity Framework Core 10, SQLite | Indicators, compound-interest simulations, and migrations |
| Financial engine | GnuCOBOL 3.2 | Returns, taxes, projections, and consolidation |
| API documentation | OpenAPI | Endpoints and contracts |
| Tests | Node.js built-in test runner | API, SQLite, and COBOL integration |

The browser sends parameters to the API over HTTP/JSON. The API validates input, prepares the calendar, runs the COBOL program, and returns results to the interface.

```text
React / TypeScript → .NET API → GnuCOBOL engine
                        ↓
                      SQLite
                        ↑
                  BCB indicators
```

Financial calculations run in COBOL. The backend also fetches Central Bank data and stores observations in SQLite.

## Prerequisites

The validated environment is Windows with PowerShell and MSYS2 UCRT64.

| Tool | Version used or expected |
| --- | --- |
| Node.js | Validated with 24.x; the frontend also supports 22.12 or later in the 22.x line |
| npm | Included with Node.js |
| .NET SDK | 10.x |
| GnuCOBOL | 3.2 |
| GCC and COBOL libraries | Provided by MSYS2 UCRT64 on Windows |
| Browser | Modern JavaScript support |
| Git | Optional for obtaining and updating the repository |

Install [Node.js](https://nodejs.org/en/download) and [.NET SDK 10](https://dotnet.microsoft.com/en-us/download/dotnet/10.0) from their official websites. Open a new terminal afterward to load PATH changes.

Initial dependency installation requires internet access. External indicator updates also require a connection.

## Windows installation and execution

### 1. Set up GnuCOBOL

Install [MSYS2](https://www.msys2.org/). The project script assumes the default UCRT64 directory: `C:\msys64\ucrt64`.

Open **MSYS2 UCRT64** from the Start menu:

```bash
pacman -Syu
```

If prompted to close the terminal during the update, close it, reopen UCRT64, and repeat the command. Then run:

```bash
pacman -S --needed mingw-w64-ucrt-x86_64-gnucobol mingw-w64-ucrt-x86_64-gcc
cobc -V
gcc --version
```

Run `pacman` in MSYS2 UCRT64. The remaining Windows steps use PowerShell.

### 2. Get the project

Clone the repository using the URL on its hosting page, or download and extract its ZIP archive.

Examples use `C:\dev\invest-project`. Replace this with your local project directory, including if your cloned folder has a different name.

Open PowerShell:

```powershell
cd C:\dev\invest-project
node --version
npm.cmd --version
dotnet --list-sdks
```

The SDK list must include .NET 10.x. The project root contains `frontend`, `backend`, `COBOL`, and this README.

### 3. Install dependencies

From the project root:

```powershell
npm.cmd --prefix frontend ci
dotnet restore backend/API
```

`npm ci` uses the versions recorded in the lockfile. Run it again when frontend dependencies change.

### 4. Compile COBOL and start the API

In the **first PowerShell terminal**, from the project root:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
. ./COBOL/compilar.ps1
dotnet run --project backend/API --urls http://127.0.0.1:5080
```

Confirm the policy change if prompted. The `Process` scope applies only to this terminal and expires when it closes.

The dot followed by a space before `./COBOL/compilar.ps1` imports the script's environment settings into the current session. This lets the API locate the GnuCOBOL DLLs. The script generates `juros.exe` and `projecao.exe` in `COBOL/bin`.

The API creates or updates SQLite automatically through migrations. Wait until it reports that it is listening on `http://127.0.0.1:5080`, and leave this terminal open.

### 5. Start the frontend

Open a **second PowerShell terminal**:

```powershell
cd C:\dev\invest-project
npm.cmd --prefix frontend run dev
```

Open the URL printed by Vite, normally [http://localhost:5173](http://localhost:5173). Vite may select another port if that one is occupied.

### 6. Verify the application

Open **Juros compostos** (Compound interest) in the menu. Enter principal `1000`, monthly rate `1`, and duration `12`. The expected result is BRL 1,126.83, displayed as **R$ 1.126,83**. This checks the frontend, API, and COBOL workflow.

Open **Indicadores** (Indicators) to check external data loading. Fetch errors appear on the page.

### Starting again and stopping

After installation, repeat steps 4 and 5. Compilation also prepares the COBOL environment in the new terminal.

If the COBOL executables are already compiled and their source files have not changed, you can start without recompiling. In the **first PowerShell terminal**:

```powershell
cd C:\dev\invest-project
$env:Path = "C:\msys64\ucrt64\bin;" + $env:Path
dotnet run --project backend/API --urls http://127.0.0.1:5080
```

Set `Path` in each new terminal used to start the API. Adjust the directory if MSYS2 is installed elsewhere. Without access to the GnuCOBOL DLLs, the API may start successfully while calculations fail.

In the **second PowerShell terminal**:

```powershell
cd C:\dev\invest-project
npm.cmd --prefix frontend run dev
```

Open the URL printed by Vite. Running `powershell -ExecutionPolicy Bypass -File .\COBOL\compilar.ps1` compiles in a separate process: its environment changes do not persist in the original terminal. If you use that command, set `Path` as shown above before starting the API.

To stop, press `Ctrl+C` in both terminals. Stop the API before rebuilding its code or the COBOL programs, then restart it.

## Usage

### Simulators

1. Open **Simuladores**.
2. Enter initial capital, monthly contributions, and dates.
3. Select an investment and one of its available return models.
4. Enter projected rates, inflation, and other parameters.
5. Expand **Custos, vencimento e liquidez** to set costs, maturity, and liquidity terms.
6. Click **Simular investimento**.
7. Review the results and assumptions.

Enter `10` for a 10% rate. For 100% of CDI, enter `100` in the benchmark percentage field.

Investment simulator rates are annual, as indicated by their labels. The separate **Juros compostos** calculator uses a monthly rate. Market indicators retain the units published by their sources.

Contributions occur at the end of each complete monthly period, except on the final redemption date.

### Fixed-income example

These values are manually supplied assumptions.

| Field | Value |
| --- | --- |
| Initial capital | BRL 1,000.00 |
| Monthly contribution | BRL 0.00 |
| Start date | January 1, 2026 |
| End date | January 1, 2027 |
| Product | CDB |
| Return model | Prefixado (fixed rate) |
| Annual rate | 10% |
| 252-business-day basis | Unchecked; use 365 calendar days |
| Inflation and costs | Zero |

Under the tax rule implemented in the current version, the expected result is BRL 1,100.00 gross, BRL 17.50 income tax (IR), and BRL 1,082.50 net.

### Comparison

1. Open **Comparador**, or click **Levar ao comparador** after a simulation.
2. Set shared amounts and dates.
3. Click **Adicionar investimento** to add alternatives.
4. Adjust products, rates, and costs.
5. Click **Comparar investimentos**.

Edit or remove alternatives and recalculate on the same page. The limit is eight investments.

Results show gross and net balances, taxes, costs, and assumptions for each alternative. Each investment is an independent alternative for the same starting capital.

### Scenarios and monthly changes

**Pessimista**, **Base**, and **Otimista** label assumptions you supply. Add an entry for each scenario in the comparison and enter its rates.

Under **Trajetória mensal do cenário**, use **Mudança mensal** to change the investment rate, benchmark, inflation, or exchange-rate assumption. The date must be a monthly anniversary of the investment start date, before the final date. Each change remains effective until the next one.

For example, an investment starting January 10, 2026 accepts a change on February 10, 2026. A separate exchange-rate assumption applies to foreign investments. BDR projections are in Brazilian reais.

### Distributions and reinvestment

For supported products, enter the annual dividend percentage. The model distributes this income monthly.

Enable **Reinvestir proventos líquidos** to reinvest net distributions in new lots. Otherwise, distributions remain as cash without earning interest until the end.

Tax exemption and foreign tax credit options depend on the investment's and investor's actual conditions. Review the assumptions before enabling them.

### Indicators

| Indicator | Source | Unit |
| --- | --- | --- |
| Selic target | SGS 432 | % per year |
| Daily effective Selic | SGS 11 | % per day |
| Daily CDI | SGS 12 | % per day |
| Monthly IPCA | SGS 433 | % per month |
| US dollar | PTAX | BRL per USD, buying and selling rates |

The API updates indicators on startup and every six hours. **Atualizar indicadores** enforces a minimum five-minute interval between attempts. A new request may return the same observation if the source has not published another one.

The last ten years of history are loaded progressively in short intervals and stored in SQLite. Initial loading can take time, with progress indicated on the page. Later updates reuse stored data and resume older history retrieval when needed.

The reference date identifies the economic observation. The consultation timestamp indicates when the application received it. PTAX is a closing reference exchange rate.

To enter your own observations, expand **Registrar observação manual**, fill in the fields, and save. Then select **Observações manuais** under **Fonte de origem**. Both buying and selling rates are required for USD.

Indicators provide reference information. Simulation rates are entered manually.

### Results

| UI field | Meaning |
| --- | --- |
| Capital aplicado | Initial capital plus contributions |
| Montante bruto | Projected amount before the displayed deductions, according to the product model |
| Montante líquido | Result after modeled taxes and costs |
| IR e IOF | Estimated taxes based on tax regime and holding period |
| Proventos brutos | Income distributed during the projection |
| Rentabilidade bruta e líquida | Simple gross and net returns relative to total contributions |
| Ganho real | Inflation-adjusted gain, expressed in purchasing power at the start date |
| TIR líquida anualizada | Annualized net internal rate of return, considering contribution dates and the final result |

IRR is unavailable when the final net amount is zero or negative. Calculations and rounding are described in the [financial model documentation (Portuguese)](docs/modelo-financeiro.md).

## Data storage and offline use

SQLite uses a local file. With the commands in this guide, the default location is `backend/API/simulador.db`.

It stores indicators, manual observations, and simulations from the standalone compound-interest calculator. Migrations create and update tables automatically.

Investment simulator and comparison parameters are kept in the browser's `sessionStorage`. They belong to the tab session and may be lost when it closes or its data is cleared. The API recalculates projection results.

To back up the database, stop all API instances using it and copy the SQLite file. This backup does not include browser-stored parameters.

Once dependencies are installed, calculations with manual assumptions work without an external connection. Stored indicators remain available with their reference dates. An installation without stored history shows no data until a successful fetch or manual entry.

## Optional configuration

Set variables in the terminal where the corresponding service will start.

| Setting | Terminal | Effect |
| --- | --- | --- |
| `ConnectionStrings__Banco` | API | Changes the SQLite file |
| `Indicadores__AtualizacaoAutomatica` | API | Enables or disables automatic external updates |
| `API_PROXY` | Vite | Changes the API target URL |
| `UCRT_BIN` | Tests | Changes the UCRT64 DLL directory used by the test suite |

### Custom MSYS2 directory

```powershell
. ./COBOL/compilar.ps1 -Ucrt 'D:\ferramentas\msys64\ucrt64'
```

Replace the path with your installation directory and start the API in the same terminal.

### Custom SQLite file

Create the destination directory before starting the API. With the COBOL environment prepared:

```powershell
$env:ConnectionStrings__Banco = 'Data Source=C:/dev/invest-project/meus-dados.db'
dotnet run --project backend/API --urls http://127.0.0.1:5080
```

### Disable automatic updates

Set this before starting or restarting the API:

```powershell
$env:Indicadores__AtualizacaoAutomatica = 'false'
```

Stored history and the manual refresh button remain available.

### Change ports

In the API terminal, with the COBOL environment prepared:

```powershell
dotnet run --project backend/API --urls http://127.0.0.1:5081
```

In the frontend terminal:

```powershell
$env:API_PROXY = 'http://127.0.0.1:5081'
npm.cmd --prefix frontend run dev -- --port 5174
```

Open [http://localhost:5174](http://localhost:5174). Restart Vite whenever you change the proxy target.

## Build and tests

From the project root, stop the API if it is using the binaries you intend to rebuild:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
. ./COBOL/compilar.ps1
dotnet build backend/API -c Release
npm.cmd --prefix frontend run build
node --test testes/integracao.mjs
```

The frontend build checks TypeScript and generates `frontend/dist`. Tests use the Release API build.

The suite contains 33 integration cases. It starts an API on a dynamic local port, uses a temporary database, disables automatic external requests, and executes the real COBOL engine. On completion, it stops the process and removes its temporary data.

Coverage includes taxes, contributions, costs, savings accounts, losses, exchange rates, distributions, funds, monthly scenarios, limits, validation, and manual persistence. The current test setup has been validated on Windows.

To customize the test UCRT64 directory:

```powershell
$env:UCRT_BIN = 'D:\ferramentas\msys64\ucrt64\bin'
node --test testes/integracao.mjs
```

An earlier validation completed 32 tests, builds, and live requests to all five Central Bank sources. Automated browser-based visual inspection remains pending.

## Running on Linux

These commands describe building from source. Execution and the test suite still require Linux-specific validation.

Install Node.js, .NET SDK 10, GnuCOBOL 3.2, GCC, and the development libraries required by your distribution. Check:

```bash
node --version
npm --version
dotnet --list-sdks
cobc -V
gcc --version
```

From the project root:

```bash
npm --prefix frontend ci
dotnet restore backend/API
mkdir -p COBOL/bin
cobc -free -x -o COBOL/bin/juros COBOL/juros.cob
cobc -free -x -o COBOL/bin/projecao COBOL/projecao.cob COBOL/rendimentos.cob COBOL/tributacao.cob COBOL/consolidacao.cob
dotnet run --project backend/API --urls http://127.0.0.1:5080
```

In another terminal, from the same root:

```bash
npm --prefix frontend run dev
```

The API selects the executable name appropriate for the operating system. Compile COBOL in the target environment and make its runtime libraries available.

## API

The OpenAPI specification is available while the API is running: [local OpenAPI](http://127.0.0.1:5080/openapi/v1.json).

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/projecoes/catalogo` | Products and tax rules |
| POST | `/api/projecoes` | Projections for one or more alternatives |
| GET | `/api/indicadores` | Stored history and warnings |
| POST | `/api/indicadores/atualizar` | External data refresh |
| POST | `/api/indicadores/manual` | Save or update a manual observation |
| POST | `/api/simulacoes/juros-compostos` | Standalone compound-interest calculator |

### PowerShell example

With the API running, execute in another terminal. API field names and enum values remain in Portuguese:

```powershell
$entrada = @{
    capital = '1000'
    aporte = '0'
    inicio = '2026-01-01'
    fim = '2027-01-01'
    investimentos = @(
        @{
            nome = 'Hypothetical CDB'
            produto = 'CDB'
            modalidade = 'prefixado'
            taxa = '10'
            diasUteis = $false
        }
    )
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri 'http://127.0.0.1:5080/api/projecoes' -Method Post -ContentType 'application/json' -Body $entrada
```

The response includes parameters, assumptions, and time-series results. Monetary projection values are decimal strings.

Investment simulators accept initial capital from BRL 0.01 to BRL 100 million, monthly contributions up to BRL 1 million, and durations up to ten years, with start dates from 2026 onward. The standalone calculator has separate limits documented in OpenAPI.

## Project structure

```text
README.md                   Main documentation in English
README.pt-BR.md             Brazilian Portuguese documentation
Directory.Build.props       Shared .NET build settings
frontend/
  public/                   Favicon
  src/                      Interface, routes, and HTTP services
  index.html                Entry page
  package.json              Scripts and dependencies
  package-lock.json         Locked dependency versions
  vite.config.ts            Vite and API proxy
backend/
  API/
    Configuracao/           Product catalog and versioned tax rules
    Controllers/            REST endpoints
    Servicos/               Periodic indicator updates
    Program.cs              Configuration and startup
  Application/              DTOs, validation, contracts, and use cases
  Domain/                   Entities
  Infrastructure/
    Migrations/             SQLite schema evolution
    Banco.cs                EF Core context
    ExecutorCobol.cs         Controlled engine execution
    Projetor.cs              Calendar and projection contract
    ProvedorBcb.cs           Public data sources
COBOL/
  compilar.ps1              Compilation and UCRT64 environment
  juros.cob                 Standalone calculator
  projecao.cob              Projections and events
  rendimentos.cob           Rate conversion and returns
  tributacao.cob            IR and IOF taxes
  consolidacao.cob          Consolidated results
testes/
  integracao.mjs            Integration suite
docs/
  modelo-financeiro.md      Formulas, sources, assumptions, and limitations (Portuguese)
```

`node_modules`, `dist`, `bin`, and `obj` are generated during installation or compilation. Local SQLite files are also ignored by Git.

## Troubleshooting

| Problem | Solution |
| --- | --- |
| “Running scripts is disabled on this system” | Run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in the current terminal, then `. ./COBOL/compilar.ps1` |
| PowerShell blocks `npm.ps1` | Use `npm.cmd`, as shown in the examples |
| `node`, `npm`, or `dotnet` not found | Check the installation and open a new terminal |
| Compatible SDK not found | Check `dotnet --list-sdks` and install SDK 10 |
| `cobc` or `gcc` not found | Install the UCRT64 packages and check the path supplied to `-Ucrt` |
| COBOL `default.conf` error | Compile with the script, which sets `COB_CONFIG_DIR` |
| Missing COBOL DLLs, or API starts but calculations fail | Run `$env:Path = "C:\msys64\ucrt64\bin;" + $env:Path` in the API terminal and restart the API; alternatively, dot-source the compilation script and start the API in that same terminal |
| Missing `juros` or `projecao` executable | Compile the COBOL sources |
| .NET DLL in use during build | Stop the API with `Ctrl+C`, rebuild, and restart |
| Port already in use | Stop the previous instance or change ports as described above |
| Interface opens but requests fail | Check that the API is running and `API_PROXY` points to it; restart Vite after changing the variable |
| HTTP 400 when simulating | Check the message, dates, limits, return model, maturity, and decimal precision |
| Monthly change rejected | Use a unique monthly anniversary date before the final date |
| Engine failure or timeout | Check API logs and compiled executables |
| Missing or outdated indicators | Check source, dates, and warnings; refresh after the minimum interval or enter manual observations |
| SQLite access failure | Check write permissions, destination directory, and connection string |
| Dependency download failure | Check connectivity and proxy settings, then retry `npm ci` or `dotnet restore` |
| Tests cannot find the backend | Run `dotnet build backend/API -c Release` |
| Outdated interface or favicon | Refresh while bypassing the browser cache with `Ctrl+F5` |

## Current limitations

This is an evolving learning and portfolio project. Results are projections based on implemented assumptions and rules, focused on individuals residing in Brazil.

- Coupons, amortization, mark-to-market pricing, inflation-adjusted nominal values (VNA), inflation lags, and issue-specific settlement require additional models.
- Prior loss offsets, annual high-income tax adjustments, special funds, and performance fees remain unimplemented.
- Remittance and repatriation IOF, percentage-based exchange spreads, and event-level international tax calculations require expansion.
- Costs use the approximations described in the financial documentation.
- Authentication, user isolation, full portfolio management, exportable reports, and transaction imports are outside the current implementation.
- Hosting and distribution require additional server, API, frontend, and COBOL runtime configuration.

External sources are public and require no API key in the current integration. Availability and access conditions are managed by the Central Bank.

See the [financial model documentation (Portuguese)](docs/modelo-financeiro.md) for formulas, tax-rule effective dates, official sources, and product assumptions.
