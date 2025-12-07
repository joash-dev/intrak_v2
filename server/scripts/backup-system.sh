#!/bin/bash

# INTRAK Complete System Backup Script
# This script creates backups of database, files, and system configuration
# Backups are stored on NAS (if available) or local storage
# Old backups (older than 7 days) are automatically cleaned up

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DB_CONTAINER="intrak_v2-db-1"
DB_USER="${POSTGRES_USER:-intrak}"
DB_NAME="${POSTGRES_DB:-intrak_db}"
NAS_MOUNT="/mnt/nas-intrak"
NAS_BACKUP_DIR="${NAS_MOUNT}/backups"
LOCAL_BACKUP_DIR="${PROJECT_ROOT}/backups"
RETENTION_DAYS=7

# Generate backup filename with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR_NAME="intrak_backup_${TIMESTAMP}"

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

log_info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

# Determine backup location (NAS preferred, local fallback)
BACKUP_BASE_DIR=""
if [ -d "$NAS_MOUNT" ] && [ -w "$NAS_MOUNT" ]; then
    BACKUP_BASE_DIR="$NAS_BACKUP_DIR"
    log "Using NAS for backup storage: $BACKUP_BASE_DIR"
else
    BACKUP_BASE_DIR="$LOCAL_BACKUP_DIR"
    log_warning "NAS not available, using local storage: $BACKUP_BASE_DIR"
fi

# Create backup directory structure
BACKUP_DIR="${BACKUP_BASE_DIR}/${BACKUP_DIR_NAME}"
mkdir -p "${BACKUP_DIR}/database"
mkdir -p "${BACKUP_DIR}/files"
mkdir -p "${BACKUP_DIR}/config"

log "Starting INTRAK system backup..."
log "Backup directory: $BACKUP_DIR"

# ============================================
# 1. Database Backup
# ============================================
log_info "Backing up database..."

DB_BACKUP_FILE="${BACKUP_DIR}/database/intrak_db_${TIMESTAMP}.sql.gz"

# Check if database container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
    log_error "Database container '$DB_CONTAINER' is not running!"
    exit 1
fi

# Create database backup
if docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip > "$DB_BACKUP_FILE"; then
    DB_BACKUP_SIZE=$(du -h "$DB_BACKUP_FILE" | cut -f1)
    log "✅ Database backup completed: $DB_BACKUP_SIZE"
else
    log_error "Database backup failed!"
    rm -f "$DB_BACKUP_FILE"
    exit 1
fi

# ============================================
# 2. Files Backup (from NAS or local storage)
# ============================================
log_info "Backing up files..."

# Backup from NAS if available
if [ -d "$NAS_MOUNT/intrak" ] && [ -r "$NAS_MOUNT/intrak" ]; then
    log "Backing up files from NAS..."
    if [ -d "$NAS_MOUNT/intrak/documents" ]; then
        cp -r "$NAS_MOUNT/intrak/documents" "${BACKUP_DIR}/files/" 2>/dev/null || log_warning "Failed to backup documents"
    fi
    if [ -d "$NAS_MOUNT/intrak/templates" ]; then
        cp -r "$NAS_MOUNT/intrak/templates" "${BACKUP_DIR}/files/" 2>/dev/null || log_warning "Failed to backup templates"
    fi
    if [ -d "$NAS_MOUNT/intrak/profile-photos" ]; then
        cp -r "$NAS_MOUNT/intrak/profile-photos" "${BACKUP_DIR}/files/" 2>/dev/null || log_warning "Failed to backup profile photos"
    fi
else
    # Backup from local storage (inside container)
    log "Backing up files from local storage..."
    if docker ps --format '{{.Names}}' | grep -q "intrak_v2-server"; then
        log_info "Copying files from server container..."
        docker cp "intrak_v2-server-1:/app/uploads" "${BACKUP_DIR}/files/" 2>/dev/null || log_warning "Failed to backup local files"
    fi
fi

# Compress files backup
if [ -d "${BACKUP_DIR}/files" ] && [ "$(ls -A ${BACKUP_DIR}/files)" ]; then
    cd "${BACKUP_DIR}"
    tar -czf "files_${TIMESTAMP}.tar.gz" files/ 2>/dev/null && rm -rf files/ || log_warning "Failed to compress files"
    FILES_BACKUP_SIZE=$(du -h "files_${TIMESTAMP}.tar.gz" | cut -f1)
    log "✅ Files backup completed: $FILES_BACKUP_SIZE"
else
    log_warning "No files to backup"
fi

# ============================================
# 3. Configuration Backup
# ============================================
log_info "Backing up configuration..."

# Backup .env file (if accessible)
if [ -f "${PROJECT_ROOT}/.env" ] && [ -r "${PROJECT_ROOT}/.env" ]; then
    cp "${PROJECT_ROOT}/.env" "${BACKUP_DIR}/config/.env" 2>/dev/null || log_warning "Failed to backup .env"
fi

# Backup docker-compose file
if [ -f "${PROJECT_ROOT}/docker-compose.prod.yml" ]; then
    cp "${PROJECT_ROOT}/docker-compose.prod.yml" "${BACKUP_DIR}/config/" 2>/dev/null || log_warning "Failed to backup docker-compose"
fi

# Create backup manifest
cat > "${BACKUP_DIR}/backup_manifest.json" <<EOF
{
  "timestamp": "${TIMESTAMP}",
  "backupDate": "$(date -Iseconds)",
  "database": {
    "file": "database/intrak_db_${TIMESTAMP}.sql.gz",
    "size": "${DB_BACKUP_SIZE}"
  },
  "files": {
    "archive": "files_${TIMESTAMP}.tar.gz",
    "size": "${FILES_BACKUP_SIZE:-N/A}"
  },
  "system": {
    "hostname": "$(hostname)",
    "user": "$(whoami)"
  }
}
EOF

log "✅ Configuration backup completed"

# ============================================
# 4. Cleanup Old Backups
# ============================================
log_info "Cleaning up backups older than $RETENTION_DAYS days..."

DELETED_COUNT=0
if [ -d "$BACKUP_BASE_DIR" ]; then
    while IFS= read -r old_backup; do
        if [ -d "$old_backup" ]; then
            rm -rf "$old_backup"
            DELETED_COUNT=$((DELETED_COUNT + 1))
            log "Deleted old backup: $(basename "$old_backup")"
        fi
    done < <(find "$BACKUP_BASE_DIR" -maxdepth 1 -type d -name "intrak_backup_*" -mtime +$RETENTION_DAYS)
fi

if [ $DELETED_COUNT -gt 0 ]; then
    log "Cleaned up $DELETED_COUNT old backup(s)"
else
    log "No old backups to clean up"
fi

# ============================================
# 5. Summary
# ============================================
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
log "✅ Backup process completed successfully!"
log "Backup location: $BACKUP_DIR"
log "Total backup size: $TOTAL_SIZE"

# Optional: Log to file
LOG_FILE="/var/log/intrak-backup.log"
if [ -w "$(dirname "$LOG_FILE")" ] 2>/dev/null || [ -w "$LOG_FILE" ] 2>/dev/null; then
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Backup completed: $BACKUP_DIR_NAME ($TOTAL_SIZE)" >> "$LOG_FILE"
fi

exit 0

