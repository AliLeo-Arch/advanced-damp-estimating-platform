# Create a timestamped SQLite backup (run from repo root)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Root "backend"
$Db = Join-Path $Backend "data\advanced_damp_local_prod.db"
$BackupDir = Join-Path $Backend "data\backups"
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$Target = Join-Path $BackupDir "advanced_damp-$Stamp.db"

if (-not (Test-Path $Db)) {
    Write-Error "Database not found: $Db"
}

New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
Copy-Item $Db $Target
Write-Host "Backup created: $Target"
