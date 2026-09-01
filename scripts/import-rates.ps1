# Import rates from CSV (upsert by code)
param(
    [Parameter(Mandatory = $true)]
    [string]$CsvPath,

    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Root "backend"
$Python = Join-Path $Backend ".venv\Scripts\python.exe"
$Script = Join-Path $Backend "scripts\import_rates.py"

if (-not (Test-Path $Python)) {
    Write-Error "Backend venv not found. Run pip install from backend/ first."
}
if (-not (Test-Path $CsvPath)) {
    Write-Error "CSV not found: $CsvPath"
}

$args = @($Script, (Resolve-Path $CsvPath))
if ($DryRun) { $args += "--dry-run" }

& $Python @args
