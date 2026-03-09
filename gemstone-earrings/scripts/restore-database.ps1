# restore-database.ps1
# Restores the Neon PostgreSQL database from a backup file.
#
# Usage:
#   .\scripts\restore-database.ps1 -BackupFile "C:\Users\RogerIdaho\backups\myearringadvisor\neondb_2026-03-09_120000.sql"
#
# Prerequisites:
#   - psql must be installed (PostgreSQL client tools)
#   - POSTGRES_URL_NON_POOLING must be set in .env.local
#
# WARNING: This will OVERWRITE all data in the target database.
# The backup script uses --clean --if-exists, so the restore will drop and recreate tables.

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile
)

$ErrorActionPreference = "Stop"

# --- Validate backup file ---
if (-not (Test-Path $BackupFile)) {
    Write-Error "Backup file not found: $BackupFile"
    exit 1
}

$FileSize = (Get-Item $BackupFile).Length
$FileSizeMB = [math]::Round($FileSize / 1MB, 2)
Write-Host "Backup file: $BackupFile ($FileSizeMB MB)"

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

# --- Confirmation ---
Write-Host ""
Write-Host "============================================" -ForegroundColor Red
Write-Host "  WARNING: THIS WILL OVERWRITE ALL DATA"     -ForegroundColor Red
Write-Host "  IN THE TARGET DATABASE (neondb)"            -ForegroundColor Red
Write-Host "============================================" -ForegroundColor Red
Write-Host ""
Write-Host "Database: neondb (Neon PostgreSQL)"
Write-Host "Backup:   $BackupFile"
Write-Host ""

$Confirm = Read-Host "Type 'RESTORE' to proceed"
if ($Confirm -ne "RESTORE") {
    Write-Host "Aborted."
    exit 0
}

# --- Restore ---
Write-Host ""
Write-Host "Restoring database from backup..."
Write-Host "Started at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

try {
    & psql $ConnectionString -f $BackupFile

    if ($LASTEXITCODE -ne 0) {
        Write-Error "psql restore failed with exit code $LASTEXITCODE"
        exit 1
    }

    Write-Host ""
    Write-Host "Restore complete at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "  1. Verify the site: https://www.myearringadvisor.com"
    Write-Host "  2. Check products page loads correctly"
    Write-Host "  3. Test login flow"
    Write-Host "  4. If deployed on Vercel, trigger a redeploy to clear any cached connections"
}
catch {
    Write-Error "Restore failed: $_"
    exit 1
}
