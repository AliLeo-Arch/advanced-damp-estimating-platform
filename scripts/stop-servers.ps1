# Stop dev/production servers on common ports (8000 backend, 5173 Vite)
$ErrorActionPreference = "Stop"
. "$PSScriptRoot\common.ps1"

Write-Host "Stopping listeners on ports 8000 and 5173 ..."
Stop-ListeningPort -Port 8000
Stop-ListeningPort -Port 5173
Write-Host "Done. You can now run start-local.ps1 or start-production.ps1."
