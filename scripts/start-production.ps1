# Production mode: build frontend and serve app from port 8000
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
. "$PSScriptRoot\common.ps1"

Assert-PortFree -Port 8000 -Label "Port 8000 (production server)"

Write-Host "Building frontend..."
Set-Location "$Root\frontend"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Frontend build failed"
}

Write-Host "Starting production server on http://127.0.0.1:8000 ..."
Set-Location "$Root\backend"
$env:SERVE_FRONTEND = "true"
.\.venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8000
