# backup-database.ps1
# Backs up the Neon PostgreSQL database to a local timestamped file.
#
# Usage:
#   .\scripts\backup-database.ps1
#
# Prerequisites:
#   - pg_dump must be installed (PostgreSQL client tools)
#   - POSTGRES_URL_NON_POOLING must be set in .env.local (uses the non-pooled/direct connection)
#
# Schedule with Windows Task Scheduler for automated daily backups.

$ErrorActionPreference = "Stop"

# --- Configuration ---
$BackupDir = "$env:USERPROFILE\backups\myearringadvisor"
$RetainDays = 30  # Delete backups older than this

# --- Load connection string from .env.local ---
$EnvFile = Join-Path $PSScriptRoot "..\.env.local"
if (-not (Test-Path $EnvFile)) {
    Write-Error "Cannot find .env.local at $EnvFile"
    exit 1
}

$ConnectionString = (Get-Content $EnvFile | Where-Object { $_ -match '^POSTGRES_URL_NON_POOLING=' }) -replace '^POSTGRES_URL_NON_POOLING="?([^"]*)"?$', '$1'
if (-not $ConnectionString) {
    Write-Error "POSTGRES_URL_NON_POOLING not found in .env.local"
    exit 1
}

# --- Create backup directory ---
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    Write-Host "Created backup directory: $BackupDir"
}

# --- Run pg_dump ---
$Timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$BackupFile = Join-Path $BackupDir "neondb_$Timestamp.sql.gz"
$PlainFile = Join-Path $BackupDir "neondb_$Timestamp.sql"

Write-Host "Starting backup at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')..."
Write-Host "Target: $PlainFile"

try {
    # Use pg_dump with the direct (non-pooled) connection string
    # --no-owner and --no-acl make the dump portable across different database users
    & pg_dump $ConnectionString --no-owner --no-acl --clean --if-exists -f $PlainFile

    if ($LASTEXITCODE -ne 0) {
        Write-Error "pg_dump failed with exit code $LASTEXITCODE"
        exit 1
    }

    $FileSize = (Get-Item $PlainFile).Length
    $FileSizeMB = [math]::Round($FileSize / 1MB, 2)
    Write-Host "Backup complete: $PlainFile ($FileSizeMB MB)"
}
catch {
    Write-Error "Backup failed: $_"
    exit 1
}

# --- Cleanup old backups ---
$Cutoff = (Get-Date).AddDays(-$RetainDays)
$OldFiles = Get-ChildItem $BackupDir -Filter "neondb_*.sql*" | Where-Object { $_.LastWriteTime -lt $Cutoff }

if ($OldFiles) {
    $OldFiles | Remove-Item -Force
    Write-Host "Cleaned up $($OldFiles.Count) backup(s) older than $RetainDays days"
}

Write-Host "Done. Backups in $BackupDir retained for $RetainDays days."
