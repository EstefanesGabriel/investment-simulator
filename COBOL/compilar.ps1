param([string]$Ucrt = 'C:\msys64\ucrt64')
$ErrorActionPreference = 'Stop'
$env:Path = (Join-Path $Ucrt 'bin') + ';' + $env:Path
$env:COB_CONFIG_DIR = Join-Path $Ucrt 'share/gnucobol/config'
$destino = Join-Path $PSScriptRoot 'bin'
New-Item -ItemType Directory -Force $destino | Out-Null
& cobc -free -x -o (Join-Path $destino 'juros.exe') (Join-Path $PSScriptRoot 'juros.cob')
if ($LASTEXITCODE -ne 0) { throw 'Falha ao compilar juros.cob.' }
& cobc -free -x -o (Join-Path $destino 'projecao.exe') (Join-Path $PSScriptRoot 'projecao.cob') (Join-Path $PSScriptRoot 'rendimentos.cob') (Join-Path $PSScriptRoot 'tributacao.cob') (Join-Path $PSScriptRoot 'consolidacao.cob')
if ($LASTEXITCODE -ne 0) { throw 'Falha ao compilar projecao.cob.' }
