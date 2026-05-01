[CmdletBinding()]
param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]] $CliArgs
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-RepoRoot {
  return Split-Path -Parent $PSScriptRoot
}

function Get-SupabaseCliPath {
  param(
    [string] $RepoRoot,
    [string] $Version
  )

  return (Join-Path $RepoRoot "vendor_imports/tools/supabase/$Version/supabase.exe")
}

$repoRoot = Get-RepoRoot
$packageJson = Get-Content -Raw (Join-Path $repoRoot "package.json") | ConvertFrom-Json
$version = $env:SUPABASE_CLI_VERSION

if (-not $version) {
  $version = [string] $packageJson.config.supabaseCliVersion
}

if (-not $version) {
  throw "Missing package.json config.supabaseCliVersion"
}

$cliPath = Get-SupabaseCliPath -RepoRoot $repoRoot -Version $version

if (-not (Test-Path $cliPath)) {
  throw "Local Supabase CLI is not installed. Run 'npm run supabase:install' first."
}

& $cliPath @CliArgs
exit $LASTEXITCODE
