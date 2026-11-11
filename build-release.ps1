<#
.SYNOPSIS
  Incrementa a versao do Combustivel e gera o AAB de producao via EAS.

.DESCRIPTION
  - Valida Git e ferramentas necessarias.
  - Incrementa app.json (version e versionCode).
  - Atualiza version.json (latestVersion).
  - Atualiza src/config/app.config.ts (appVersion).
  - Executa EAS Build Android Production.
  - Restaura os arquivos se o build falhar.
  - Cria commit Git somente apos build bem-sucedido.

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
# 1. CONFIGURACAO
# ============================================================

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$appJson = Join-Path $root 'app.json'
$versionJson = Join-Path $root 'version.json'
$appConfigTs = Join-Path $root 'src\config\app.config.ts'

$utf8Bom = New-Object System.Text.UTF8Encoding -ArgumentList $true

$originalAppJson = $null
$originalVersionJson = $null
$originalAppConfigTs = $null

$versionJsonExists = Test-Path $versionJson
$filesModified = $false

# ============================================================
# 2. FUNCOES AUXILIARES
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

    if ($null -ne $originalAppConfigTs) {
        Write-Utf8File -Path $appConfigTs -Content $originalAppConfigTs
    }

    if ($versionJsonExists -and $null -ne $originalVersionJson) {
        Write-Utf8File -Path $versionJson -Content $originalVersionJson
    }

    Write-Host "Arquivos restaurados." -ForegroundColor Green
}

function Replace-ExactlyOnce {
    param(
        [string]$Content,
        [string]$Pattern,
        [string]$Replacement,
        [string]$Description
    )

    $matches = [regex]::Matches($Content, $Pattern)

    if ($matches.Count -ne 1) {
        throw "Esperada exatamente uma ocorrencia de $Description. Encontradas: $($matches.Count)"
    }

    $regex = [regex]::new($Pattern)

    return $regex.Replace($Content, $Replacement, 1)
}

# ============================================================
# 3. VALIDACOES INICIAIS
# ============================================================

Write-Section "VALIDACAO INICIAL"

if (-not (Test-Path $appJson)) {
    throw "app.json nao encontrado."
}

if (-not (Test-Path $appConfigTs)) {
    throw "src/config/app.config.ts nao encontrado."
}

if (-not (Test-Path (Join-Path $root 'package.json'))) {
    throw "package.json nao encontrado."
}

Test-Command 'git'
Test-Command 'node'
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
        throw "Execute o script na raiz do repositorio."
    }

    $gitStatus = git status --porcelain

    if ($LASTEXITCODE -ne 0) {
        throw "Nao foi possivel verificar o Git."
    }

    if ($gitStatus) {
        Write-Host $gitStatus -ForegroundColor Yellow
        throw "Existem alteracoes pendentes no Git. Faca commit ou stash antes."
    }

    Write-Host "Git: OK" -ForegroundColor Green
    Write-Host "Node.js: OK" -ForegroundColor Green
    Write-Host "npx: OK" -ForegroundColor Green

}
finally {
    Pop-Location
}

# ============================================================
# 4. LEITURA DOS ARQUIVOS
# ============================================================

Write-Section "LEITURA DAS VERSOES"

$originalAppJson = Get-Content $appJson -Raw
$originalAppConfigTs = Get-Content $appConfigTs -Raw

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

# Valida app.config.ts.
$appConfigMatches = [regex]::Matches(
    $originalAppConfigTs,
    "appVersion\s*:\s*'[^']+'"
)

if ($appConfigMatches.Count -ne 1) {
    throw "Propriedade appVersion nao encontrada ou duplicada em app.config.ts."
}

# Valida version.json, se existir.
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
# 5. CALCULO DA NOVA VERSAO
# ============================================================

$major = [int]$Matches[1]
$minor = [int]$Matches[2]
$patch = [int]$Matches[3]

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

# ============================================================
# 6. RESUMO E CONFIRMACAO
# ============================================================

Write-Section "RESUMO DO RELEASE"

Write-Host "Projeto: Combustivel" -ForegroundColor White
Write-Host ""
Write-Host "Version:     $currentVersion -> $newVersion"
Write-Host "VersionCode: $currentCode -> $newCode"
Write-Host "BumpType:    $BumpType"
Write-Host ""
Write-Host "Arquivos que serao atualizados:"
Write-Host "  - app.json"
Write-Host "  - version.json"
Write-Host "  - src/config/app.config.ts"
Write-Host ""

$confirm = Read-Host "Confirma o release de producao? (s/N)"

if ($confirm -notmatch '^[sS]$') {
    Write-Host "Release cancelado." -ForegroundColor Yellow
    exit 0
}

# ============================================================
# 7. ATUALIZACAO DOS ARQUIVOS
# ============================================================

Write-Section "ATUALIZANDO VERSOES"

try {

    # app.json - version.
    $newAppJson = Replace-ExactlyOnce `
        -Content $originalAppJson `
        -Pattern '"version"\s*:\s*"[^"]+"' `
        -Replacement ('"version": "' + $newVersion + '"') `
        -Description 'version em app.json'

    # app.json - versionCode.
    $newAppJson = Replace-ExactlyOnce `
        -Content $newAppJson `
        -Pattern '"versionCode"\s*:\s*\d+' `
        -Replacement ('"versionCode": ' + $newCode) `
        -Description 'versionCode em app.json'

    # Valida app.json atualizado.
    $validatedApp = $newAppJson | ConvertFrom-Json

    if ($validatedApp.expo.version -ne $newVersion) {
        throw "Validacao de version falhou."
    }

    if ([int]$validatedApp.expo.android.versionCode -ne $newCode) {
        throw "Validacao de versionCode falhou."
    }

    # version.json.
    if ($versionJsonExists) {

        $newVersionJson = Replace-ExactlyOnce `
            -Content $originalVersionJson `
            -Pattern '"latestVersion"\s*:\s*"[^"]+"' `
            -Replacement ('"latestVersion": "' + $newVersion + '"') `
            -Description 'latestVersion em version.json'

        $validatedVersion = $newVersionJson | ConvertFrom-Json

        if ($validatedVersion.latestVersion -ne $newVersion) {
            throw "Validacao de version.json falhou."
        }
    }

    # app.config.ts.
    $newAppConfigTs = Replace-ExactlyOnce `
        -Content $originalAppConfigTs `
        -Pattern "appVersion\s*:\s*'[^']+'" `
        -Replacement ("appVersion: '" + $newVersion + "'") `
        -Description 'appVersion em app.config.ts'

    # Marca antes de gravar para permitir rollback
    # mesmo se uma gravacao falhar no meio do processo.
    $filesModified = $true

    Write-Utf8File -Path $appJson -Content $newAppJson

    if ($versionJsonExists) {
        Write-Utf8File -Path $versionJson -Content $newVersionJson
    }

    Write-Utf8File -Path $appConfigTs -Content $newAppConfigTs

    Write-Host "app.json atualizado." -ForegroundColor Green

    if ($versionJsonExists) {
        Write-Host "version.json atualizado." -ForegroundColor Green
    }

    Write-Host "app.config.ts atualizado." -ForegroundColor Green

}
catch {

    if ($filesModified) {
        Restore-OriginalFiles
    }

    throw
}

# ============================================================
# 8. EAS BUILD
# ============================================================

Write-Section "EAS BUILD - PRODUCAO"

Write-Host "Iniciando build Android..." -ForegroundColor Cyan
Write-Host "Aguarde a conclusao do processo."
Write-Host ""

try {

    Push-Location $root

    try {

        & npx eas-cli build `
            --platform android `
            --profile production `
            --non-interactive

        $buildExitCode = $LASTEXITCODE

        if ($buildExitCode -ne 0) {
            throw "EAS Build falhou. Codigo: $buildExitCode"
        }

    }
    finally {
        Pop-Location
    }

    Write-Host ""
    Write-Host "EAS Build finalizado com sucesso!" -ForegroundColor Green

}
catch {

    Write-Host ""
    Write-Host "ERRO DURANTE O BUILD!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red

    Restore-OriginalFiles

    Write-Host ""
    Write-Host "Release cancelado." -ForegroundColor Yellow
    Write-Host "Nenhum commit foi criado."

    exit 1
}

# ============================================================
# 9. COMMIT GIT
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

    git add src/config/app.config.ts

    if ($LASTEXITCODE -ne 0) {
        throw "Falha ao adicionar app.config.ts."
    }

    git commit -m "chore: release v$newVersion (versionCode $newCode)"

    if ($LASTEXITCODE -ne 0) {
        throw "Falha ao criar commit."
    }

    Write-Host "Commit criado com sucesso!" -ForegroundColor Green

}
catch {

    Write-Host ""
    Write-Host "ATENCAO: O BUILD FOI GERADO, MAS O COMMIT FALHOU." -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red

    Write-Host ""
    Write-Host "Os arquivos NAO serao restaurados."
    Write-Host "Eles correspondem a versao do AAB gerado."
    Write-Host "Verifique o Git e finalize o commit manualmente."

    exit 1

}
finally {
    Pop-Location
}

# ============================================================
# 10. RESULTADO FINAL
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

Write-Host "Consulte o historico de builds:" -ForegroundColor Cyan
Write-Host "https://expo.dev/accounts/SEU_USUARIO/projects/SEU_PROJETO/builds"

Write-Host ""
Write-Host "IMPORTANTE:" -ForegroundColor Yellow
Write-Host "Confira o AAB no EAS antes de enviar para a Play Store."
Write-Host ""