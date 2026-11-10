```powershell
<#
.SYNOPSIS
  Incrementa a versao do Combustivel e gera o AAB de producao via EAS.

.DESCRIPTION
  1. Valida Git, ferramentas e arquivos JSON.
  2. Incrementa version e versionCode.
  3. Atualiza app.json e version.json.
  4. Executa EAS Build de producao.
  5. Se o build falhar, restaura os arquivos originais.
  6. Se o build passar, cria o commit Git.

.PARAMETER BumpType
  patch (padrao), minor ou major.

.EXAMPLE
  .\build-release.ps1
  .\build-release.ps1 -BumpType minor
  .\build-release.ps1 -BumpType major
#>

param(
    [ValidateSet('patch', 'minor', 'major')]
    [string]$BumpType = 'patch'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ============================================================
# CONFIGURACAO
# ============================================================

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$appJson = Join-Path $root 'app.json'
$versionJson = Join-Path $root 'version.json'

$utf8Bom = New-Object System.Text.UTF8Encoding -ArgumentList $true

$originalAppJson = $null
$originalVersionJson = $null
$versionJsonExists = Test-Path $versionJson

$filesModified = $false

# ============================================================
# FUNCOES
# ============================================================

function Write-Section {
    param([string]$Message)

    Write-Host ""
    Write-Host "==================================================" -ForegroundColor DarkGray
    Write-Host " $Message" -ForegroundColor Cyan
    Write-Host "==================================================" -ForegroundColor DarkGray
}

function Test-Command {
    param([string]$Name)

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Comando nao encontrado: $Name"
    }
}

function Write-Utf8File {
    param(
        [string]$Path,
        [string]$Content
    )

    [System.IO.File]::WriteAllText(
        $Path,
        $Content,
        $utf8Bom
    )
}

function Restore-OriginalFiles {

    Write-Host ""
    Write-Host "Restaurando arquivos originais..." -ForegroundColor Yellow

    if ($null -ne $originalAppJson) {
        Write-Utf8File -Path $appJson -Content $originalAppJson
    }

    if ($versionJsonExists -and $null -ne $originalVersionJson) {
        Write-Utf8File -Path $versionJson -Content $originalVersionJson
    }

    Write-Host "Arquivos restaurados." -ForegroundColor Green
}

# ============================================================
# 1. VALIDACOES INICIAIS
# ============================================================

Write-Section "VALIDACAO INICIAL"

if (-not (Test-Path $appJson)) {
    throw "app.json nao encontrado em: $root"
}

if (-not (Test-Path (Join-Path $root 'package.json'))) {
    throw "package.json nao encontrado. Verifique a raiz do projeto."
}

Test-Command 'git'
Test-Command 'node'
Test-Command 'npm'
Test-Command 'npx'

Push-Location $root

try {

    $gitRoot = git rev-parse --show-toplevel 2>$null

    if ($LASTEXITCODE -ne 0) {
        throw "A pasta nao pertence a um repositorio Git."
    }

    $gitRoot = (Resolve-Path $gitRoot.Trim()).Path
    $projectRoot = (Resolve-Path $root).Path

    if ($gitRoot -ne $projectRoot) {
        throw "Execute o script na raiz do repositorio Git."
    }

    $gitStatus = git status --porcelain

    if ($LASTEXITCODE -ne 0) {
        throw "Nao foi possivel verificar o estado do Git."
    }

    if ($gitStatus) {
        Write-Host $gitStatus -ForegroundColor Yellow
        throw "Git possui alteracoes pendentes. Faca commit ou stash antes do release."
    }

    Write-Host "Git: OK" -ForegroundColor Green
    Write-Host "Node.js: OK" -ForegroundColor Green
    Write-Host "npm: OK" -ForegroundColor Green

}
finally {
    Pop-Location
}

# ============================================================
# 2. LEITURA E VALIDACAO DOS JSON
# ============================================================

Write-Section "LEITURA DAS VERSOES"

$originalAppJson = Get-Content $appJson -Raw

try {
    $app = $originalAppJson | ConvertFrom-Json
}
catch {
    throw "app.json possui JSON invalido."
}

if ($null -eq $app.expo) {
    throw "Propriedade expo nao encontrada em app.json."
}

if ($null -eq $app.expo.android) {
    throw "Propriedade expo.android nao encontrada."
}

$currentVersion = [string]$app.expo.version
$currentCode = 0

if (-not [int]::TryParse(
    [string]$app.expo.android.versionCode,
    [ref]$currentCode
)) {
    throw "android.versionCode invalido."
}

if ($currentCode -lt 1) {
    throw "versionCode precisa ser maior que zero."
}

if ($currentVersion -notmatch '^(\d+)\.(\d+)\.(\d+)$') {
    throw "Versao invalida: $currentVersion. Esperado X.Y.Z."
}

$major = [int]$Matches[1]
$minor = [int]$Matches[2]
$patch = [int]$Matches[3]

# ============================================================
# 3. CALCULO DA NOVA VERSAO
# ============================================================

switch ($BumpType) {

    'major' {
        $major++
        $minor = 0
        $patch = 0
    }

    'minor' {
        $minor++
        $patch = 0
    }

    'patch' {
        $patch++
    }
}

$newVersion = "$major.$minor.$patch"
$newCode = $currentCode + 1

if ($versionJsonExists) {

    $originalVersionJson = Get-Content $versionJson -Raw

    try {
        $versionData = $originalVersionJson | ConvertFrom-Json
    }
    catch {
        throw "version.json possui JSON invalido."
    }

    if ($null -eq $versionData.PSObject.Properties['latestVersion']) {
        throw "latestVersion nao encontrada em version.json."
    }
}

# ============================================================
# 4. RESUMO E CONFIRMACAO
# ============================================================

Write-Section "RESUMO DO RELEASE"

Write-Host "Projeto: Combustivel" -ForegroundColor White
Write-Host ""
Write-Host "Version:     $currentVersion -> $newVersion"
Write-Host "VersionCode: $currentCode -> $newCode"
Write-Host "BumpType:    $BumpType"
Write-Host "Build:       Android / Production / AAB"
Write-Host ""

$confirm = Read-Host "Confirma o release de producao? (s/N)"

if ($confirm -notmatch '^[sS]$') {
    Write-Host "Release cancelado." -ForegroundColor Yellow
    exit 0
}

# ============================================================
# 5. ATUALIZACAO DOS ARQUIVOS
# ============================================================

Write-Section "ATUALIZANDO VERSOES"

try {

    $versionMatches = [regex]::Matches(
        $originalAppJson,
        '"version"\s*:\s*"[^"]+"'
    )

    $codeMatches = [regex]::Matches(
        $originalAppJson,
        '"versionCode"\s*:\s*\d+'
    )

    if ($versionMatches.Count -ne 1) {
        throw "Esperada exatamente uma propriedade version em app.json."
    }

    if ($codeMatches.Count -ne 1) {
        throw "Esperada exatamente uma propriedade versionCode em app.json."
    }

    $newAppJson = [regex]::Replace(
        $originalAppJson,
        '"version"\s*:\s*"[^"]+"',
        ('"version": "' + $newVersion + '"'),
        1
    )

    $newAppJson = [regex]::Replace(
        $newAppJson,
        '"versionCode"\s*:\s*\d+',
        ('"versionCode": ' + $newCode),
        1
    )

    # Valida o resultado antes de gravar.
    $validatedApp = $newAppJson | ConvertFrom-Json

    if ($validatedApp.expo.version -ne $newVersion) {
        throw "Falha na validacao da nova versao."
    }

    if ([int]$validatedApp.expo.android.versionCode -ne $newCode) {
        throw "Falha na validacao do novo versionCode."
    }

    # Atualiza version.json.
    if ($versionJsonExists) {

        $newVersionJson = [regex]::Replace(
            $originalVersionJson,
            '"latestVersion"\s*:\s*"[^"]+"',
            ('"latestVersion": "' + $newVersion + '"'),
            1
        )

        $validatedVersion = $newVersionJson | ConvertFrom-Json

        if ($validatedVersion.latestVersion -ne $newVersion) {
            throw "Falha na validacao de version.json."
        }
    }

    # Grava os arquivos.
    Write-Utf8File -Path $appJson -Content $newAppJson

    if ($versionJsonExists) {
        Write-Utf8File -Path $versionJson -Content $newVersionJson
    }

    $filesModified = $true

    Write-Host "app.json atualizado." -ForegroundColor Green

    if ($versionJsonExists) {
        Write-Host "version.json atualizado." -ForegroundColor Green
    }

}
catch {

    if ($filesModified) {
        Restore-OriginalFiles
    }

    throw
}

# ============================================================
# 6. EAS BUILD
# ============================================================

Write-Section "EAS BUILD - PRODUCAO"

Write-Host "Iniciando build Android..." -ForegroundColor Cyan
Write-Host "O processo sera acompanhado ate sua conclusao."
Write-Host ""

try {

    & npx eas-cli build `
        --platform android `
        --profile production `
        --non-interactive

    $buildExitCode = $LASTEXITCODE

    if ($buildExitCode -ne 0) {
        throw "EAS Build falhou. Codigo de saida: $buildExitCode"
    }

    Write-Host ""
    Write-Host "Build concluido com sucesso!" -ForegroundColor Green

}
catch {

    Write-Host ""
    Write-Host "ERRO DURANTE O BUILD!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red

    Restore-OriginalFiles

    Write-Host ""
    Write-Host "Release cancelado. Nenhum commit foi criado." -ForegroundColor Yellow

    exit 1
}

# ============================================================
# 7. COMMIT GIT
# ============================================================

Write-Section "COMMIT GIT"

Push-Location $root

try {

    git add app.json

    if ($LASTEXITCODE -ne 0) {
        throw "Falha ao adicionar app.json."
    }

    if ($versionJsonExists) {

        git add version.json

        if ($LASTEXITCODE -ne 0) {
            throw "Falha ao adicionar version.json."
        }
    }

    git commit -m "chore: release v$newVersion (versionCode $newCode)"

    if ($LASTEXITCODE -ne 0) {
        throw "Build concluido, mas houve falha ao criar o commit."
    }

    Write-Host "Commit criado com sucesso!" -ForegroundColor Green

}
catch {

    Write-Host ""
    Write-Host "ATENCAO: O BUILD FOI GERADO, MAS O COMMIT FALHOU." -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "Nao restaure as versoes: elas correspondem ao AAB gerado."
    Write-Host "Verifique o Git e finalize o commit manualmente."

    exit 1

}
finally {
    Pop-Location
}

# ============================================================
# 8. RESULTADO FINAL
# ============================================================

Write-Section "RELEASE CONCLUIDO"

Write-Host ""
Write-Host "Aplicativo: Combustivel" -ForegroundColor White
Write-Host "Version: $newVersion" -ForegroundColor Green
Write-Host "VersionCode: $newCode" -ForegroundColor Green
Write-Host "Plataforma: Android"
Write-Host "Formato: AAB"
Write-Host "Perfil: Production"
Write-Host "Git: Commit criado"
Write-Host ""

Write-Host "Consulte o historico de builds em:" -ForegroundColor Cyan
Write-Host "https://expo.dev/accounts/SEU_USUARIO/projects/SEU_PROJETO/builds"

Write-Host ""
Write-Host "IMPORTANTE: Confira o AAB no EAS antes de enviar para a Play Store." -ForegroundColor Yellow
Write-Host ""
```
