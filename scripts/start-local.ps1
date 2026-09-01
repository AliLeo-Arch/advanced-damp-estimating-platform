# Start Advanced Damp Estimating (backend + frontend)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
. "$PSScriptRoot\common.ps1"

if (Test-TcpPortInUse -Port 8000) {
    Write-Host "WARNING: Port 8000 is already in use. Backend may fail to start." -ForegroundColor Yellow
    Write-Host "Run .\scripts\stop-servers.ps1 first, or use start-production.ps1 for single-port mode."
}

Write-Host "Starting backend on http://127.0.0.1:8000 ..."
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$Root\backend'; .\.venv\Scripts\uvicorn.exe app.main:app --reload --port 8000"
)

Start-Sleep -Seconds 2

Write-Host "Starting frontend on http://127.0.0.1:5173 ..."
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$Root\frontend'; npm run dev"
)

Write-Host "Two terminal windows opened. Open http://127.0.0.1:5173 in your browser."
