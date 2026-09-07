# Create a timestamped SQLite backup via the app helper (online backup API).
# Run from repo root: .\scripts\backup.ps1
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Root "backend"
$Python = Join-Path $Backend ".venv\Scripts\python.exe"
if (-not (Test-Path $Python)) {
    $Python = "python"
}

Push-Location $Backend
try {
    $result = & $Python -c @"
from app.backup import create_backup
row = create_backup()
print(row['path'])
"@
    if ($LASTEXITCODE -ne 0) {
        throw "Backup failed"
    }
    Write-Host "Backup created: $result"
}
finally {
    Pop-Location
}
