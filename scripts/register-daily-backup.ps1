# Register a daily Windows Task Scheduler job for SQLite backups.
# Run once from an elevated PowerShell (or as the office service account):
#   .\scripts\register-daily-backup.ps1
# Optional: .\scripts\register-daily-backup.ps1 -Time "02:30"
param(
    [string]$TaskName = "TradeEstimatingDailyBackup",
    [string]$Time = "02:00"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$BackupScript = Join-Path $Root "scripts\backup.ps1"

if (-not (Test-Path $BackupScript)) {
    Write-Error "Backup script not found: $BackupScript"
}

$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$BackupScript`""

$trigger = New-ScheduledTaskTrigger -Daily -At $Time
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Description "Daily SQLite backup for Trade Estimating & Quoting" `
    -Force | Out-Null

Write-Host "Scheduled task '$TaskName' registered to run daily at $Time."
Write-Host "Backups land in backend\data\backups\ (keeps latest 30 by default)."
Write-Host "To remove later: Unregister-ScheduledTask -TaskName '$TaskName' -Confirm:`$false"
