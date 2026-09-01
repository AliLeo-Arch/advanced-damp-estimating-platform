# Shared helpers for Advanced Damp startup scripts

function Test-TcpPortInUse {
    param([int]$Port)
    try {
        $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
            Select-Object -First 1
        return [bool]$conn
    }
    catch {
        $line = netstat -ano | Select-String ":$Port\s" | Select-String "LISTENING" | Select-Object -First 1
        return [bool]$line
    }
}

function Assert-PortFree {
    param(
        [int]$Port,
        [string]$Label = "Port $Port"
    )
    if (Test-TcpPortInUse -Port $Port) {
        Write-Host ""
        Write-Host "ERROR: $Label is already in use." -ForegroundColor Red
        Write-Host "Stop the dev backend (start-local.ps1 window) or another app on port $Port, then retry."
        Write-Host "Or run: .\scripts\stop-servers.ps1"
        exit 1
    }
}

function Stop-ListeningPort {
    param([int]$Port)
    try {
        $pids = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
            Select-Object -ExpandProperty OwningProcess -Unique
    }
    catch {
        $pids = @()
    }
    foreach ($procId in $pids) {
        if ($procId -and $procId -gt 0) {
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            Write-Host "Stopped process $procId on port $Port"
        }
    }
}
