# Record a professional product demo video (standalone kit).
# Requires backend :8000 and frontend (Vite) running.
$ErrorActionPreference = "Stop"
$Kit = $PSScriptRoot
$Root = Split-Path -Parent (Split-Path -Parent $Kit)

function Test-Url($url) {
    try {
        $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 3
        return $r.StatusCode -ge 200 -and $r.StatusCode -lt 500
    } catch {
        return $false
    }
}

$base = $env:BASE_URL
if (-not $base) {
    if (Test-Url "http://localhost:5173/") { $base = "http://localhost:5173" }
    elseif (Test-Url "http://localhost:5174/") { $base = "http://localhost:5174" }
    elseif (Test-Url "http://127.0.0.1:5173/") { $base = "http://127.0.0.1:5173" }
    else { $base = "http://127.0.0.1:5173" }
}

Push-Location $Kit
try {
    if (-not (Test-Path "node_modules\playwright")) {
        Write-Host "Installing demo-video-kit dependencies..."
        npm install
    }

    $env:BASE_URL = $base
    if (-not $env:BROWSER_CHANNEL) { $env:BROWSER_CHANNEL = "chrome" }
    $env:DOCS_OUT = Join-Path $Root "docs\demos\trade-estimating\v1.0.0\video"

    Write-Host "Recording demo against $($env:BASE_URL) (browser channel=$($env:BROWSER_CHANNEL)) ..."
    node src/record.mjs
}
finally {
    Pop-Location
}
