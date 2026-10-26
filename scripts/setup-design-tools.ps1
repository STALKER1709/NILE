#requires -Version 5.1
$ErrorActionPreference = 'Stop'
Write-Host 'NILE - installation des outils UI/UX' -ForegroundColor Cyan
Write-Host 'Ce script modifie package.json / pnpm-lock.yaml et la configuration locale de Codex.'
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) { throw 'pnpm est introuvable. Installe/active pnpm puis relance ce script.' }
if (-not (Test-Path 'package.json')) { throw 'Lance ce script depuis la racine du depot NILE (package.json introuvable).' }
Write-Host '[1/4] Installation de Motion for React...' -ForegroundColor Yellow
pnpm add motion
Write-Host '[2/4] Installation du skill Motion...' -ForegroundColor Yellow
npx --yes motion-ai
Write-Host '[3/4] Installation des skills 21st.dev...' -ForegroundColor Yellow
npx --yes skills add 21st-dev/skill -y
npx --yes @21st-dev/cli install-skill
Write-Host '[4/4] Configuration du connecteur 21st.dev pour Codex...' -ForegroundColor Yellow
npx --yes @21st-dev/cli init --client codex --write
Write-Host 'Installation terminee. Lance ensuite pnpm typecheck, pnpm test et pnpm build.' -ForegroundColor Green
Write-Host 'Si necessaire, authentifie-toi avec: npx @21st-dev/cli login'
Write-Host 'Ne commit jamais une cle API ni un jeton prive.'