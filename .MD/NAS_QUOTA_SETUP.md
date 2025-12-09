# NAS Quota Configuration Guide

## Problem

Kapag nag-check ng NAS storage sa INTRAK system, maaaring makita ang buong filesystem size (hal. 1.8 TB) imbes na ang actual quota limit na naka-set sa OpenMediaVault (hal. 50 GB).

## Solution

Ang system ay may support para sa manual quota configuration. Puwede mong i-set ang quota limit via environment variable.

---

## Setup Instructions

### Step 1: Check Your OpenMediaVault Quota

1. Log in sa OpenMediaVault web interface
2. Pumunta sa **Storage → Shared Folders**
3. I-click ang share folder na ginagamit (hal. "documents" o "Serber")
4. Tingnan ang **Quota** setting
5. Note ang quota limit (hal. 50 GB)

### Step 2: Add Quota to Environment Variables

I-add ang `NAS_QUOTA_GB` sa `.env` file:

```env
# NAS Configuration
USE_NAS=true
NAS_HOST=100.121.34.91
NAS_PATH=/mnt/nas/intrak
NAS_USERNAME=don
NAS_PASSWORD=brandongani725
NAS_SHARE_NAME=Serber

# NAS Quota Limit (in GB) - Set this to match OpenMediaVault quota
NAS_QUOTA_GB=50
```

### Step 3: Restart Server

```bash
# On VPS
cd /root/intrak_v2
docker compose -f docker-compose.prod.yml restart server
```

### Step 4: Verify

1. Log in sa Admin UI
2. Pumunta sa **Admin → Settings**
3. Scroll down sa **"System Information"** section
4. Tingnan ang **"NAS Storage"** card
5. Dapat makita ang correct quota (50 GB) imbes ng buong filesystem size

---

## How It Works

1. **Without Quota**: System shows actual filesystem size (e.g., 1.8 TB)
2. **With Quota**: System shows quota limit (e.g., 50 GB) and calculates usage based on actual files

### Example:

**Before (without quota):**
```
Total: 1.71 TiB
Used: 84.21 GiB
Free: 1.63 TiB
Percent Used: 4.8%
```

**After (with NAS_QUOTA_GB=50):**
```
Total: 50.00 GiB
Used: 5.00 GiB (actual files)
Free: 45.00 GiB
Percent Used: 10%
```

---

## Environment Variable

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `NAS_QUOTA_GB` | Quota limit in GB (must match OpenMediaVault quota) | `50` | Optional |

**Note**: Kung hindi naka-set ang `NAS_QUOTA_GB`, ang system ay magpapakita ng actual filesystem size.

---

## Troubleshooting

### Issue: Still showing full filesystem size

**Solution:**
1. Verify `NAS_QUOTA_GB` is set in `.env`
2. Restart server: `docker compose -f docker-compose.prod.yml restart server`
3. Check logs: `docker compose -f docker-compose.prod.yml logs server | grep -i nas`

### Issue: Quota not matching OpenMediaVault

**Solution:**
1. Double-check quota sa OpenMediaVault
2. Update `NAS_QUOTA_GB` sa `.env` to match
3. Restart server

### Issue: Percent used is incorrect

**Solution:**
- Ang system ay nag-calculate ng percent based sa actual used space vs quota
- Kung may files na lumalampas sa quota, ang percent ay maaaring maging 100%
- Check actual files: `docker compose -f docker-compose.prod.yml exec server du -sh /mnt/nas/intrak/*`

---

## Manual Verification

### Check actual files size:
```bash
docker compose -f docker-compose.prod.yml exec server du -sh /mnt/nas/intrak/*
```

### Check quota setting:
```bash
docker compose -f docker-compose.prod.yml exec server sh -c "echo \$NAS_QUOTA_GB"
```

### Check storage metrics via API:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://intrak.site/api/admin/system-info | jq '.nasStorage'
```

---

## Summary

1. **Add `NAS_QUOTA_GB=50`** sa `.env` file (replace 50 with your actual quota)
2. **Restart server** para ma-apply ang changes
3. **Verify** sa Admin UI na tama na ang storage display

Ang system ay magpapakita na ng correct quota limit (50 GB) imbes ng buong filesystem size!

