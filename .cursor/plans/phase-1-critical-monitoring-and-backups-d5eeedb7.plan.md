<!-- d5eeedb7-ebfe-473c-95d3-25124a47092d edfe5444-75a7-412f-b2f7-acbddd40812e -->
# Phase 1: Admin Dashboard Alerts and Backups

## 1. NAS Storage Monitoring in Admin Dashboard

### Files to Modify:

- `server/src/controllers/admin.controller.ts` - Enhance `getSystemInfo` to include NAS storage metrics
- `server/src/config/nas.ts` - Add NAS storage check function using check-disk-space
- `client/src/pages/AdminUi/AdminSettings.tsx` - Add alerts section to System Management
- `client/src/services/adminService.ts` - Update SystemInfo interface with alerts and NAS metrics

### Implementation:

- Modify `getSystemInfo` to check NAS mount point storage (currently only checks root filesystem `/`)
- Add NAS storage metrics: total, used, free, percentUsed, formatted strings
- Add alerts array to SystemInfo response with warnings/critical issues
- Display alerts in admin dashboard below System Status cards
- Show storage alerts when NAS usage > 80% (warning) or > 90% (critical)
- Update Storage status card to show NAS storage instead of root filesystem when NAS is available

### Alerts Structure:

```typescript
alerts: Array<{
  type: 'warning' | 'critical' | 'info',
  message: string,
  component: 'storage' | 'database' | 'nas' | 'system',
  timestamp: string
}>
```

## 2. Alerts Display in Admin Dashboard

### Files to Modify:

- `client/src/pages/AdminUi/AdminSettings.tsx` - Add alerts section

### Implementation:

- Add alerts panel below System Status cards in System Management section
- Display alerts with color-coded cards (red=critical, yellow=warning, blue=info)
- Show alert count badge in System Status header
- Auto-refresh alerts when Refresh button is clicked
- Display alert message, type, and timestamp
- Optional: Add dismiss functionality for non-critical alerts

### UI Location:

- Place alerts section after the System Status cards grid
- Use similar styling to existing status cards
- Show "No alerts" message when alerts array is empty

## 3. Storage Monitoring Service

### Files to Create:

- `server/src/services/storageMonitor.service.ts` (new)

### Implementation:

- Create service to check NAS and local storage usage
- Use `check-disk-space` package (already in dependencies via admin.controller.ts)
- Return storage metrics with alerts
- Check storage on demand (when admin calls getSystemInfo)

### Key Functions:

- `getNASStorageMetrics()` - Get NAS mount point disk usage, return null if NAS unavailable
- `getLocalStorageMetrics()` - Get local storage disk usage
- `checkStorageAlerts(metrics)` - Evaluate thresholds (80% warning, 90% critical) and return alerts array

## 4. Automated Database Backups

### Files to Create:

- `server/scripts/backup-database.sh` (new)

### Implementation:

- Create shell script for PostgreSQL backup using pg_dump
- Check if NAS is available, use NAS for backup storage if available
- Backup database to compressed `.sql.gz` file with timestamp: `intrak_db_YYYYMMDD_HHMMSS.sql.gz`
- Store in `/mnt/nas/intrak/backups/database/` (if NAS available) or `./backups/database/`
- Keep last 7 days of backups (auto-cleanup old backups)
- Log backup success/failure to file

### Backup Script Features:

- Check NAS mount point availability
- Create backup directory if it doesn't exist
- Use pg_dump with compression
- Remove backups older than 7 days
- Log to file with timestamp

### Cron Setup (on VPS - manual step):

```bash
# Add to crontab: Daily backup at 2 AM
0 2 * * * /root/intrak_v2/server/scripts/backup-database.sh >> /var/log/intrak-backup.log 2>&1
```

## Implementation Order:

1. Create storage monitoring service (`storageMonitor.service.ts`)
2. Add NAS storage check to `getSystemInfo` in `admin.controller.ts`
3. Add alerts array to SystemInfo response
4. Update SystemInfo interface in `adminService.ts`
5. Enhance admin dashboard UI to display alerts (`AdminSettings.tsx`)
6. Create database backup script (`backup-database.sh`)
7. Document cron setup in script comments

## Testing:

- Verify NAS storage is detected and displayed in admin dashboard
- Test alerts appear when storage exceeds 80% or 90%
- Verify Storage card shows NAS metrics when NAS is available
- Test alerts refresh when admin clicks refresh button
- Verify database backup creates files successfully
- Test backup cleanup removes old files after 7 days

### To-dos

- [ ] Create storage monitoring service (server/src/services/storageMonitor.service.ts) with getNASStorageMetrics, getLocalStorageMetrics, and checkStorageAlerts functions
- [ ] Add NAS storage monitoring to getSystemInfo in server/src/controllers/admin.controller.ts - check NAS mount point using storageMonitor service, add NAS metrics to response
- [ ] Add alerts array to SystemInfo response in admin.controller.ts - include storage alerts from checkStorageAlerts, NAS availability alerts, and other system warnings
- [ ] Update SystemInfo interface in client/src/services/adminService.ts to include alerts array and NAS storage metrics (nasStorage, nasAvailable)
- [ ] Add alerts section to System Management in client/src/pages/AdminUi/AdminSettings.tsx - display alerts below System Status cards with color-coded cards, show alert count badge
- [ ] Update Storage status card in AdminSettings.tsx to show NAS storage metrics when available, fallback to root filesystem when NAS unavailable
- [ ] Create database backup script (server/scripts/backup-database.sh) with pg_dump, compression, NAS/local storage detection, 7-day retention, and logging
- [ ] Document cron setup in backup script comments for manual VPS configuration