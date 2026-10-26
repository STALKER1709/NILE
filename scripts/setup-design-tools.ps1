#requires -Version 5.1
$ErrorActionPreference = 'Stop'

function Invoke-Checked {
    param(
        [Parameter(Mandatory = $true)][string]$Command,
        [Parameter(Mandatory = $true)][string[]]$Arguments
    )
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "La commande '$Command $($Arguments -join ' ')' a echoue (code $LASTEXITCODE)."
    }
}

Write-Host 'NILE - installation des outils UI/UX' -ForegroundColor Cyan
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    throw 'pnpm est introuvable. Active pnpm puis relance ce script.'
}
if (-not (Test-Path 'package.json')) {
    throw 'Lance ce script depuis la racine du depot NILE (package.json introuvable).'
}

Write-Host '[1/3] Installation de Motion for React dans le projet...' -ForegroundColor Yellow
Invoke-Checked -Command 'pnpm' -Arguments @('add', 'motion')

Write-Host '[2/3] Installation du skill officiel Motion...' -ForegroundColor Yellow
Invoke-Checked -Command 'npx' -Arguments @('--yes', 'motion-ai')

Write-Host '[3/3] Installation des skills 21st.dev...' -ForegroundColor Yellow
Invoke-Checked -Command 'npx' -Arguments @('--yes', 'skills', 'add', '21st-dev/skill', '-y')
Invoke-Checked -Command 'npx' -Arguments @('--yes', '@21st-dev/cli', 'install-skill')

Write-Host ''
Write-Host 'Dependance Motion et skills installes.' -ForegroundColor Green
Write-Host 'Pour connecter 21st MCP dans Claude Code, ouvre Claude Code et execute :' -ForegroundColor Cyan
Write-Host '  /plugin marketplace add 21st-dev/claude-code-plugin'
Write-Host '  /plugin install 21st@21st'
Write-Host 'Puis redemarre/recharge Claude Code et verifie /mcp.'
Write-Host 'Si 21st demande une cle, cree-la sur https://21st.dev/settings/api-keys et configure API_KEY_21ST localement.'
Write-Host 'Ne commit jamais une cle API ni un jeton prive.'
Write-Host ''
Write-Host 'Validation requise : pnpm typecheck ; pnpm test ; pnpm build' -ForegroundColor Yellow
