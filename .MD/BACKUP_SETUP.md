# INTRAK System Backup Setup Guide

## Overview

The INTRAK system includes automated backup functionality for:
- **Database**: PostgreSQL database backups
- **Files**: Documents, templates, and profile photos
- **Configuration**: Environment files and Docker configurations

## Backup Script

Location: `server/scripts/backup-system.sh`

### Features

- ✅ Automatic database backup (PostgreSQL)
- ✅ File backup from NAS or local storage
- ✅ Configuration backup (.env, docker-compose)
- ✅ Automatic cleanup of old backups (7 days retention)
- ✅ Backup manifest with metadata
- ✅ NAS storage support (with local fallback)

## Setup Instructions

### 1. Make Script Executable

On the VPS (Linux):

```bash
cd ~/intrak_v2
chmod +x server/scripts/backup-system.sh
```

### 2. Test Manual Backup

```bash
cd ~/intrak_v2
./server/scripts/backup-system.sh
```

### 3. Setup Automated Backup (Cron Job)

#### Option A: Daily Backup at 2 AM

```bash
# Edit crontab
crontab -e

# Add this line:
0 2 * * * cd /root/intrak_v2 && /root/intrak_v2/server/scripts/backup-system.sh >> /var/log/intrak-backup.log 2>&1
```

#### Option B: Weekly Backup (Every Sunday at 2 AM)

```bash
# Add to crontab:
0 2 * * 0 cd /root/intrak_v2 && /root/intrak_v2/server/scripts/backup-system.sh >> /var/log/intrak-backup.log 2>&1
```

#### Option C: Multiple Daily Backups (Every 6 Hours)

```bash
# Add to crontab:
0 */6 * * * cd /root/intrak_v2 && /root/intrak_v2/server/scripts/backup-system.sh >> /var/log/intrak-backup.log 2>&1
```

### 4. Verify Cron Job

```bash
# List current cron jobs
crontab -l

# Check backup logs
tail -f /var/log/intrak-backup.log
```

## Backup Locations

### NAS Storage (Preferred)
- Path: `/mnt/nas-intrak/backups/intrak_backup_YYYYMMDD_HHMMSS/`
- Structure:
  ```
  intrak_backup_YYYYMMDD_HHMMSS/
  ├── database/
  │   └── intrak_db_YYYYMMDD_HHMMSS.sql.gz
  ├── files_YYYYMMDD_HHMMSS.tar.gz
  ├── config/
  │   ├── .env
  │   └── docker-compose.prod.yml
  └── backup_manifest.json
  ```

### Local Storage (Fallback)
- Path: `~/intrak_v2/backups/intrak_backup_YYYYMMDD_HHMMSS/`
- Same structure as NAS

## Backup Retention

- **Default**: 7 days
- **Configurable**: Edit `RETENTION_DAYS` in `backup-system.sh`
- Old backups are automatically deleted

## Restore Instructions

### Restore Database

```bash
# 1. Stop the application
cd ~/intrak_v2
docker compose -f docker-compose.prod.yml down

# 2. Extract backup
cd /mnt/nas-intrak/backups/intrak_backup_YYYYMMDD_HHMMSS/database
gunzip intrak_db_YYYYMMDD_HHMMSS.sql.gz

# 3. Restore database
docker compose -f docker-compose.prod.yml up -d db
sleep 10
docker exec -i intrak_v2-db-1 psql -U intrak -d intrak_db < intrak_db_YYYYMMDD_HHMMSS.sql

# 4. Restart application
docker compose -f docker-compose.prod.yml up -d
```

### Restore Files

```bash
# 1. Extract files backup
cd /mnt/nas-intrak/backups/intrak_backup_YYYYMMDD_HHMMSS
tar -xzf files_YYYYMMDD_HHMMSS.tar.gz

# 2. Copy files to NAS or local storage
# For NAS:
cp -r files/* /mnt/nas-intrak/intrak/

# For local (inside container):
docker cp files/ intrak_v2-server-1:/app/uploads/
```

## Monitoring

### Check Backup Status

```bash
# View recent backups
ls -lh /mnt/nas-intrak/backups/ | tail -10

# Check backup size
du -sh /mnt/nas-intrak/backups/*

# View backup manifest
cat /mnt/nas-intrak/backups/intrak_backup_YYYYMMDD_HHMMSS/backup_manifest.json
```

### Backup Logs

```bash
# View backup logs
tail -f /var/log/intrak-backup.log

# Search for errors
grep -i error /var/log/intrak-backup.log
```

## Troubleshooting

### Backup Fails

1. **Check NAS Mount**:
   ```bash
   mount | grep nas
   ls -la /mnt/nas-intrak/
   ```

2. **Check Disk Space**:
   ```bash
   df -h
   ```

3. **Check Docker Containers**:
   ```bash
   docker ps | grep intrak
   ```

4. **Check Permissions**:
   ```bash
   ls -la server/scripts/backup-system.sh
   ```

### Backup Not Running

1. **Check Cron Service**:
   ```bash
   systemctl status cron
   ```

2. **Check Cron Logs**:
   ```bash
   grep CRON /var/log/syslog | tail -20
   ```

3. **Test Script Manually**:
   ```bash
   cd ~/intrak_v2
   ./server/scripts/backup-system.sh
   ```

## Best Practices

1. **Regular Testing**: Test restore process periodically
2. **Monitor Disk Space**: Ensure enough space for backups
3. **Offsite Backup**: Consider copying backups to external storage
4. **Backup Verification**: Periodically verify backup integrity
5. **Documentation**: Keep track of backup schedules and locations

## Notes

- Backups are compressed to save space
- Database backups use `pg_dump` with gzip compression
- File backups are tar.gz archives
- Backup manifest includes metadata for tracking

