# Restore SQLite backup (run from repo root). Usage: .\scripts\restore.ps1 advanced_damp-20260831-120000.db
param(
    [Parameter(Mandatory = $true)]
    [string]$Filename
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Root "backend"
$Db = Join-Path $Backend "data\advanced_damp_local_prod.db"
$BackupDir = Join-Path $Backend "data\backups"
$Source = Join-Path $BackupDir $Filename

if (-not (Test-Path $Source)) {
    Write-Error "Backup not found: $Source"
}

$Pre = Join-Path $BackupDir ("pre-restore-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".db")
if (Test-Path $Db) {
    Copy-Item $Db $Pre
    Write-Host "Pre-restore safety copy: $Pre"
}

Copy-Item $Source $Db -Force
Write-Host "Restored $Filename to $Db"
Write-Host "Restart the backend to reload the database."
