# Export current rates to CSV (edit in Excel, then re-import)
param(
    [string]$OutputPath = "",
    [switch]$IncludeInactive
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Root "backend"
$Python = Join-Path $Backend ".venv\Scripts\python.exe"
$Script = Join-Path $Backend "scripts\export_rates.py"

if (-not (Test-Path $Python)) {
    Write-Error "Backend venv not found. Run pip install from backend/ first."
}

$args = @($Script)
if ($OutputPath) {
    $args += (Resolve-Path -LiteralPath $OutputPath -ErrorAction SilentlyContinue)
    if (-not $args[-1]) { $args += $OutputPath }
}
if ($IncludeInactive) { $args += "--include-inactive" }

& $Python @args
