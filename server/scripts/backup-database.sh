#!/bin/bash

# INTRAK Database Backup Script
# This script creates a compressed backup of the PostgreSQL database
# Backups are stored on NAS (if available) or local storage
# Old backups (older than 7 days) are automatically cleaned up

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DB_CONTAINER="intrak_v2-db-1"
DB_USER="${POSTGRES_USER:-intrak}"
DB_NAME="${POSTGRES_DB:-intrak_db}"
NAS_MOUNT="/mnt/nas-intrak"
NAS_BACKUP_DIR="${NAS_MOUNT}/backups/database"
LOCAL_BACKUP_DIR="./backups/database"
RETENTION_DAYS=7

# Generate backup filename with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILENAME="intrak_db_${TIMESTAMP}.sql.gz"

# Function to log messages
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" >&2
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Determine backup location (NAS preferred, local fallback)
BACKUP_DIR=""
if [ -d "$NAS_MOUNT" ] && [ -w "$NAS_MOUNT" ]; then
    BACKUP_DIR="$NAS_BACKUP_DIR"
    log "Using NAS for backup storage: $BACKUP_DIR"
else
    BACKUP_DIR="$LOCAL_BACKUP_DIR"
    log_warning "NAS not available, using local storage: $BACKUP_DIR"
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Full path to backup file
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILENAME}"

log "Starting database backup..."
log "Database: $DB_NAME"
log "Backup file: $BACKUP_PATH"

# Check if database container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
    log_error "Database container '$DB_CONTAINER' is not running!"
    exit 1
fi

# Create backup using pg_dump inside the container
if docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_PATH"; then
    BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
    log "Backup completed successfully!"
    log "Backup size: $BACKUP_SIZE"
    log "Backup location: $BACKUP_PATH"
else
    log_error "Backup failed!"
    # Clean up partial backup file if it exists
    [ -f "$BACKUP_PATH" ] && rm -f "$BACKUP_PATH"
    exit 1
fi

# Cleanup old backups (older than RETENTION_DAYS)
log "Cleaning up backups older than $RETENTION_DAYS days..."
DELETED_COUNT=0
if [ -d "$BACKUP_DIR" ]; then
    while IFS= read -r old_backup; do
        if [ -f "$old_backup" ]; then
            rm -f "$old_backup"
            DELETED_COUNT=$((DELETED_COUNT + 1))
            log "Deleted old backup: $(basename "$old_backup")"
        fi
    done < <(find "$BACKUP_DIR" -name "intrak_db_*.sql.gz" -type f -mtime +$RETENTION_DAYS)
fi

if [ $DELETED_COUNT -gt 0 ]; then
    log "Cleaned up $DELETED_COUNT old backup(s)"
else
    log "No old backups to clean up"
fi

log "Backup process completed successfully!"

# Optional: Log to file
LOG_FILE="/var/log/intrak-backup.log"
if [ -w "$(dirname "$LOG_FILE")" ] || [ -w "$LOG_FILE" ] 2>/dev/null; then
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Backup completed: $BACKUP_FILENAME ($BACKUP_SIZE)" >> "$LOG_FILE"
fi

exit 0

