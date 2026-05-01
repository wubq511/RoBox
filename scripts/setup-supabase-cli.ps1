[CmdletBinding()]
param(
  [string] $Version,
  [switch] $Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-RepoRoot {
  return Split-Path -Parent $PSScriptRoot
}

function Get-VendorToolDir {
  param(
    [string] $RepoRoot,
    [string] $ToolName
  )

  return Join-Path $RepoRoot "vendor_imports/tools/$ToolName"
}

function Get-PackageJson {
  param(
    [string] $RepoRoot
  )

  $packageJsonPath = Join-Path $RepoRoot "package.json"
  return Get-Content -Raw $packageJsonPath | ConvertFrom-Json
}

function Get-TargetArch {
  $architecture = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture

  switch ($architecture) {
    "X64" { return "amd64" }
    "Arm64" { return "arm64" }
    default {
      throw "Unsupported Windows architecture for Supabase CLI: $architecture"
    }
  }
}

function Invoke-DownloadFile {
  param(
    [string] $Url,
    [string] $DestinationPath
  )

  $attempts = 3

  for ($attempt = 1; $attempt -le $attempts; $attempt++) {
    try {
      Invoke-WebRequest -Uri $Url -OutFile $DestinationPath -UseBasicParsing
      return
    } catch {
      if ($attempt -eq $attempts) {
        break
      }

      Start-Sleep -Seconds (2 * $attempt)
    }
  }

  $curl = Get-Command "curl.exe" -ErrorAction SilentlyContinue
  if ($null -ne $curl) {
    & $curl.Source "--location" "--fail" "--silent" "--show-error" "--output" $DestinationPath $Url
    if ($LASTEXITCODE -eq 0) {
      return
    }
  }

  throw "Failed to download $Url"
}

function Get-Checksum {
  param(
    [string] $ChecksumFilePath,
    [string] $FileName
  )

  $match = Select-String -Path $ChecksumFilePath -Pattern ([Regex]::Escape($FileName)) | Select-Object -First 1
  if ($null -eq $match) {
    throw "Checksum entry not found for $FileName"
  }

  return $match.Line.Split(' ', [System.StringSplitOptions]::RemoveEmptyEntries)[0].ToLower()
}

function Ensure-TarAvailable {
  if (-not (Get-Command "tar.exe" -ErrorAction SilentlyContinue)) {
    throw "tar.exe is required to extract the Supabase CLI archive."
  }
}

function Get-Sha256Hash {
  param(
    [string] $Path
  )

  $stream = [System.IO.File]::OpenRead($Path)
  try {
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    try {
      $hashBytes = $sha256.ComputeHash($stream)
      return ([System.BitConverter]::ToString($hashBytes) -replace "-", "").ToLower()
    } finally {
      $sha256.Dispose()
    }
  } finally {
    $stream.Dispose()
  }
}

$repoRoot = Get-RepoRoot
$packageJson = Get-PackageJson -RepoRoot $repoRoot

if (-not $Version) {
  $Version = $env:SUPABASE_CLI_VERSION
}

if (-not $Version) {
  $Version = [string] $packageJson.config.supabaseCliVersion
}

if (-not $Version) {
  throw "Missing Supabase CLI version. Set package.json config.supabaseCliVersion or pass -Version."
}

$arch = Get-TargetArch
$platform = "windows"
$archiveName = "supabase_${platform}_${arch}.tar.gz"
$checksumName = "supabase_${Version}_checksums.txt"
$releaseBaseUrl = "https://github.com/supabase/cli/releases/download/v$Version"

$toolRoot = Get-VendorToolDir -RepoRoot $repoRoot -ToolName "supabase"
$targetDir = Join-Path $toolRoot $Version
$targetExe = Join-Path $targetDir "supabase.exe"

if ((Test-Path $targetExe) -and (-not $Force)) {
  Write-Output "Supabase CLI $Version already installed at $targetExe"
  & $targetExe "--version"
  exit $LASTEXITCODE
}

Ensure-TarAvailable

$tempDir = Join-Path ([System.IO.Path]::GetTempPath()) ("robox-supabase-cli-" + [System.Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $tempDir | Out-Null

try {
  $archivePath = Join-Path $tempDir $archiveName
  $checksumPath = Join-Path $tempDir $checksumName

  Invoke-DownloadFile -Url "$releaseBaseUrl/$checksumName" -DestinationPath $checksumPath
  Invoke-DownloadFile -Url "$releaseBaseUrl/$archiveName" -DestinationPath $archivePath

  $expectedChecksum = Get-Checksum -ChecksumFilePath $checksumPath -FileName $archiveName
  $actualChecksum = Get-Sha256Hash -Path $archivePath

  if ($expectedChecksum -ne $actualChecksum) {
    throw "Checksum mismatch for $archiveName"
  }

  $extractDir = Join-Path $tempDir "extract"
  New-Item -ItemType Directory -Path $extractDir | Out-Null

  & tar.exe "-xf" $archivePath "-C" $extractDir
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to extract $archiveName"
  }

  $extractedExe = Join-Path $extractDir "supabase.exe"
  if (-not (Test-Path $extractedExe)) {
    throw "supabase.exe was not found in the extracted archive."
  }

  New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
  Copy-Item -Force $extractedExe $targetExe

  Write-Output "Installed Supabase CLI $Version to $targetExe"
  & $targetExe "--version"
  exit $LASTEXITCODE
} finally {
  if (Test-Path $tempDir) {
    Remove-Item -Recurse -Force $tempDir
  }
}
