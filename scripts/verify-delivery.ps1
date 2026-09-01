# Run delivery verification checks (tests, benchmarks, rate CSV round-trip)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Root "backend"
$Python = Join-Path $Backend ".venv\Scripts\python.exe"

if (-not (Test-Path $Python)) {
    Write-Error "Backend venv not found. Set up backend first."
}

Set-Location $Backend
$failed = $false

function Run-Step {
    param([string]$Title, [scriptblock]$Action)
    Write-Host ""
    Write-Host "== $Title ==" -ForegroundColor Cyan
    & $Action
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FAILED: $Title" -ForegroundColor Red
        $script:failed = $true
    }
    else {
        Write-Host "OK: $Title" -ForegroundColor Green
    }
}

Run-Step "Backend tests" { & $Python -m pytest tests/ -q }
Run-Step "Benchmark scenarios" { & $Python scripts/validate_benchmarks.py }
Run-Step "Rate import dry-run" {
    & $Python scripts/import_rates.py data/rates_import_template.csv --dry-run
}
Run-Step "Rate export" {
    & $Python scripts/export_rates.py data/rates_export_verify.csv
}

Write-Host ""
if ($failed) {
    Write-Host "Delivery verification FAILED." -ForegroundColor Red
    exit 1
}

Write-Host "Delivery verification passed." -ForegroundColor Green
