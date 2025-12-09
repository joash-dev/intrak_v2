# How to Check NAS Disk Storage

## Method 1: Via OpenMediaVault Web Interface (Easiest)

### Step 1: Access OpenMediaVault
1. Open browser
2. Go to: `http://raspberry-pi-local-ip` or `http://tailscale-ip-of-nas`
3. Login with admin credentials

### Step 2: Check Storage
1. Go to **Storage → Disks**
   - Shows all physical disks
   - Shows disk size, health, temperature
   - Shows used/free space per disk

2. Go to **Storage → File Systems**
   - Shows mounted file systems
   - Shows total size, used, available
   - Shows mount point and file system type

3. Go to **Storage → Shared Folders**
   - Shows shared folders
   - Shows quota limits (if set)
   - Shows actual usage per folder

### Step 3: Check Disk Usage
1. Go to **Storage → SMART**
   - Shows disk health and statistics
   - Shows disk capacity

2. Go to **Storage → Disks → [Select Disk]**
   - Shows detailed disk information
   - Shows total capacity
   - Shows partition information

---

## Method 2: Via SSH to Raspberry Pi NAS

### Step 1: SSH to NAS
```bash
# Via Tailscale IP
ssh pi@100.121.34.91  # Replace with your NAS Tailscale IP

# Or via local network
ssh pi@192.168.1.100  # Replace with your NAS local IP
```

### Step 2: Check Disk Space
```bash
# Check all mounted filesystems
df -h

# Check specific disk
df -h /dev/sda1  # Replace with your disk device

# Check disk usage by folder
du -sh /srv/dev-disk-by-*/*

# Check OpenMediaVault data directory
du -sh /srv/dev-disk-by-*/* 2>/dev/null
```

### Step 3: Check Physical Disks
```bash
# List all disks
lsblk

# Show disk information
sudo fdisk -l

# Check disk usage
sudo df -h

# Check specific mount point
df -h /srv/dev-disk-by-uuid-*
```

### Step 4: Check Shared Folder Usage
```bash
# Check shared folders (usually in /srv/)
du -sh /srv/*

# Check specific share
du -sh /srv/dev-disk-by-uuid-*/Serber  # Replace with your share name
```

---

## Method 3: From VPS Server (Check Mounted NAS)

### Step 1: SSH to VPS
```bash
ssh root@your-vps-ip
```

### Step 2: Check NAS Mount Point
```bash
# Check if NAS is mounted
df -h | grep nas

# Check detailed mount info
mount | grep nas

# Check disk space on NAS mount
df -h /mnt/nas-intrak
```

### Step 3: From Docker Container
```bash
# Enter server container
docker compose -f docker-compose.prod.yml exec server sh

# Inside container, check NAS storage
df -h /mnt/nas/intrak

# Check folder sizes
du -sh /mnt/nas/intrak/*

# Exit container
exit
```

### Step 4: Detailed Breakdown
```bash
# Check total NAS storage
docker compose -f docker-compose.prod.yml exec server df -h /mnt/nas/intrak

# Check folder sizes
docker compose -f docker-compose.prod.yml exec server sh -c "
  echo '=== NAS Storage Breakdown ===' &&
  echo 'Total:' && df -h /mnt/nas/intrak | tail -1 &&
  echo '' &&
  echo 'Documents:' && du -sh /mnt/nas/intrak/documents 2>/dev/null || echo 'N/A' &&
  echo 'Templates:' && du -sh /mnt/nas/intrak/templates 2>/dev/null || echo 'N/A' &&
  echo 'Profile Photos:' && du -sh /mnt/nas/intrak/profile-photos 2>/dev/null || echo 'N/A'
"
```

---

## Method 4: Check via SMB/CIFS (From Windows/Mac)

### Windows:
1. Open File Explorer
2. Map network drive: `\\100.121.34.91\Serber` (use your NAS IP and share name)
3. Right-click on mapped drive → Properties
4. Shows "Used space" and "Free space"

### Mac:
1. Open Finder
2. Go to: `smb://100.121.34.91/Serber`
3. Connect with credentials
4. Right-click on mounted share → Get Info
5. Shows disk space information

---

## Quick Commands Reference

### From VPS (Easiest):
```bash
# Quick check
docker compose -f docker-compose.prod.yml exec server df -h /mnt/nas/intrak

# Detailed breakdown
docker compose -f docker-compose.prod.yml exec server du -sh /mnt/nas/intrak/*
```

### From Raspberry Pi NAS:
```bash
# Check all disks
df -h

# Check specific disk
lsblk

# Check OpenMediaVault data
du -sh /srv/*
```

---

## Expected Output Examples

### `df -h` output (from VPS):
```
Filesystem      Size  Used Avail Use% Mounted on
//100.121.34.91/Serber  50G   5G   45G  10% /mnt/nas/intrak
```

**Meaning:**
- **Size**: 50 GB (total allocated/quota)
- **Used**: 5 GB (actual files)
- **Avail**: 45 GB (free space)
- **Use%**: 10% (percentage used)

### `du -sh` output (folder breakdown):
```
5.0G    /mnt/nas/intrak/documents
100M   /mnt/nas/intrak/templates
50M    /mnt/nas/intrak/profile-photos
```

---

## Understanding the Output

### If you see 50 GB:
- This is your **quota limit** set in OpenMediaVault
- This is the **allocated space** for the share
- This is what INTRAK should show (with `NAS_QUOTA_GB=50`)

### If you see 1.8 TB:
- This is the **actual physical disk size**
- This is the **entire filesystem** size
- This is what INTRAK shows **without** quota configuration

---

## Troubleshooting

### Issue: Can't see NAS storage

**Check if NAS is mounted:**
```bash
# From VPS
df -h | grep nas

# If not mounted, check mount status
mount | grep nas
```

### Issue: Shows wrong size

**Check actual quota in OpenMediaVault:**
1. OpenMediaVault → Storage → Shared Folders
2. Click on your share folder
3. Check "Quota" setting
4. Update `NAS_QUOTA_GB` in `.env` to match

### Issue: Can't access OpenMediaVault

**Check Tailscale connection:**
```bash
# From VPS
ping 100.121.34.91  # Replace with NAS Tailscale IP

# Check Tailscale status
tailscale status
```

---

## Summary

**Easiest way to check NAS disk storage:**

1. **From VPS (Recommended):**
   ```bash
   docker compose -f docker-compose.prod.yml exec server df -h /mnt/nas/intrak
   ```

2. **From OpenMediaVault Web UI:**
   - Storage → File Systems
   - Storage → Shared Folders

3. **From Raspberry Pi (SSH):**
   ```bash
   df -h
   du -sh /srv/*
   ```

The `df -h` command shows the **actual allocated disk space** for the NAS share, which should match your OpenMediaVault quota setting (50 GB).

