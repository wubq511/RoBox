Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

function Assert-True {
  param(
    [bool] $Condition,
    [string] $Message
  )

  if (-not $Condition) {
    throw $Message
  }
}

$setupScript = Join-Path $repoRoot "scripts/setup-supabase-cli.ps1"
$runScript = Join-Path $repoRoot "scripts/run-supabase.ps1"
$packageJsonPath = Join-Path $repoRoot "package.json"

Assert-True (Test-Path $setupScript) "Missing setup script: $setupScript"
Assert-True (Test-Path $runScript) "Missing wrapper script: $runScript"

$packageJson = Get-Content -Raw $packageJsonPath | ConvertFrom-Json

Assert-True ($packageJson.scripts."supabase:install" -eq "powershell -ExecutionPolicy Bypass -File ./scripts/setup-supabase-cli.ps1") "package.json is missing supabase:install"
Assert-True ($packageJson.scripts."supabase:init" -eq "powershell -ExecutionPolicy Bypass -File ./scripts/run-supabase.ps1 init") "package.json is not routing supabase:init through the local wrapper"
Assert-True ($packageJson.scripts."supabase:status" -eq "powershell -ExecutionPolicy Bypass -File ./scripts/run-supabase.ps1 status") "package.json is not routing supabase:status through the local wrapper"

Write-Output "Local Supabase CLI contract looks good."
