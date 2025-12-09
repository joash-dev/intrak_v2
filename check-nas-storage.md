# How to Check NAS Storage

## Method 1: Via Admin UI (Web Interface)

1. Log in as Admin
2. Go to **Admin → Settings**
3. Scroll down to **"System Information"** section
4. Look for **"NAS Storage"** card (if NAS is available)

**Information displayed:**
- Percentage used (e.g., "45% Used")
- Used / Total (e.g., "84.21 GiB / 1.71 TiB")
- Free space (e.g., "1.63 TiB free")
- Visual progress bar

---

## Method 2: Via SSH Commands (VPS)

### Check if NAS is mounted:
```bash
# Check mount status
df -h | grep nas

# Or more detailed:
mount | grep nas
```

### Check NAS storage usage:
```bash
# Check disk space on NAS mount point
df -h /mnt/nas-intrak

# Or if mounted inside container:
docker compose -f docker-compose.prod.yml exec server df -h /mnt/nas/intrak
```

### Check detailed storage info:
```bash
# Check total, used, and available space
docker compose -f docker-compose.prod.yml exec server sh -c "df -h /mnt/nas/intrak | tail -1"
```

### Check file sizes in NAS:
```bash
# Check total size of files in NAS
docker compose -f docker-compose.prod.yml exec server du -sh /mnt/nas/intrak/*

# Check size of documents folder
docker compose -f docker-compose.prod.yml exec server du -sh /mnt/nas/intrak/documents

# Check size of templates folder
docker compose -f docker-compose.prod.yml exec server du -sh /mnt/nas/intrak/templates

# Check size of profile photos folder
docker compose -f docker-compose.prod.yml exec server du -sh /mnt/nas/intrak/profile-photos
```

---

## Method 3: Via API Endpoint

### Get system info (includes NAS storage):
```bash
# From VPS or local machine
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  https://intrak.site/api/admin/system-info

# Or using the API directly:
curl -X GET https://intrak.site/api/admin/system-info \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response includes:**
```json
{
  "nasAvailable": true,
  "nasStorage": {
    "total": "1.71 TiB",
    "used": "84.21 GiB",
    "free": "1.63 TiB",
    "percentUsed": 4.8,
    "totalFormatted": "1.71 TiB",
    "usedFormatted": "84.21 GiB",
    "freeFormatted": "1.63 TiB",
    "path": "/mnt/nas/intrak",
    "available": true
  }
}
```

---

## Method 4: Check from Docker Container

### Enter the server container:
```bash
docker compose -f docker-compose.prod.yml exec server sh
```

### Inside container, check storage:
```bash
# Check NAS mount point
df -h /mnt/nas/intrak

# List files and sizes
ls -lh /mnt/nas/intrak/

# Check specific folder sizes
du -sh /mnt/nas/intrak/documents
du -sh /mnt/nas/intrak/templates
du -sh /mnt/nas/intrak/profile-photos
```

---

## Quick Reference Commands

```bash
# Quick check - NAS storage summary
docker compose -f docker-compose.prod.yml exec server df -h /mnt/nas/intrak

# Detailed breakdown by folder
docker compose -f docker-compose.prod.yml exec server sh -c "
  echo '=== NAS Storage Breakdown ===' &&
  echo 'Documents:' && du -sh /mnt/nas/intrak/documents 2>/dev/null || echo 'N/A' &&
  echo 'Templates:' && du -sh /mnt/nas/intrak/templates 2>/dev/null || echo 'N/A' &&
  echo 'Profile Photos:' && du -sh /mnt/nas/intrak/profile-photos 2>/dev/null || echo 'N/A' &&
  echo 'Total:' && du -sh /mnt/nas/intrak 2>/dev/null || echo 'N/A'
"
```

---

## Troubleshooting

### If NAS storage is not showing in Admin UI:

1. **Check if NAS is enabled:**
   ```bash
   docker compose -f docker-compose.prod.yml exec server sh -c "echo \$USE_NAS"
   ```
   Should return: `true`

2. **Check if NAS is mounted:**
   ```bash
   docker compose -f docker-compose.prod.yml exec server mount | grep nas
   ```

3. **Check server logs:**
   ```bash
   docker compose -f docker-compose.prod.yml logs server | grep -i nas
   ```

4. **Verify NAS path exists:**
   ```bash
   docker compose -f docker-compose.prod.yml exec server ls -la /mnt/nas/intrak
   ```

---

## Expected Output Examples

### `df -h` output:
```
Filesystem      Size  Used Avail Use% Mounted on
//100.121.34.91/Serber  1.8T   85G  1.7T   5% /mnt/nas/intrak
```

### `du -sh` output:
```
84G    /mnt/nas/intrak/documents
500M   /mnt/nas/intrak/templates
50M    /mnt/nas/intrak/profile-photos
84.5G  /mnt/nas/intrak
```

