# Reset a user password (run from repo root)
param(
    [Parameter(Mandatory = $true)]
    [string]$Email,

    [Parameter(Mandatory = $true)]
    [string]$Password
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Python = Join-Path $Root "backend\.venv\Scripts\python.exe"
$Script = Join-Path $Root "backend\scripts\reset_password.py"

if (-not (Test-Path $Python)) {
    Write-Error "Backend venv not found."
}

& $Python $Script $Email $Password
