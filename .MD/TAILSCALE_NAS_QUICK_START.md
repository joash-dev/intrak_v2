# Tailscale NAS Quick Start Guide

## What You Need

1. **Raspberry Pi** with OpenMediaVault installed
2. **Tailscale** installed on both Raspberry Pi and INTRAK server
3. **Tailscale IP** of your Raspberry Pi (e.g., `100.64.1.2`)

## Quick Setup Checklist

### On Raspberry Pi:
- [ ] Install OpenMediaVault
- [ ] Create SMB share named `documents`
- [ ] Create user `intrak_nas` with read/write access
- [ ] Install Tailscale: `curl -fsSL https://tailscale.com/install.sh | sh`
- [ ] Run `sudo tailscale up` and authenticate
- [ ] Get Tailscale IP: `tailscale ip -4` (save this!)

### On INTRAK Server:
- [ ] Install Tailscale: `curl -fsSL https://tailscale.com/install.sh | sh`
- [ ] Run `sudo tailscale up` and authenticate (same account)
- [ ] Install SMB tools: `sudo apt install cifs-utils` (Linux)
- [ ] Create mount point: `sudo mkdir -p /mnt/nas/intrak/documents`
- [ ] Mount NAS (see commands below)
- [ ] Update `.env` file (see below)

## Server Configuration

### 1. Create Credentials File (Linux)

```bash
sudo nano /etc/samba/nas-credentials
```

Add:
```
username=intrak_nas
password=YOUR_NAS_PASSWORD
domain=WORKGROUP
```

Save and secure:
```bash
sudo chmod 600 /etc/samba/nas-credentials
```

### 2. Mount NAS

**Test mount first:**
```bash
sudo mount -t cifs //100.64.x.x/documents /mnt/nas/intrak/documents \
  -o credentials=/etc/samba/nas-credentials,uid=1000,gid=1000,iocharset=utf8,file_mode=0775,dir_mode=0775
```

**Make permanent (add to /etc/fstab):**
```bash
echo "//100.64.x.x/documents /mnt/nas/intrak/documents cifs credentials=/etc/samba/nas-credentials,uid=1000,gid=1000,iocharset=utf8,file_mode=0775,dir_mode=0775,_netdev 0 0" | sudo tee -a /etc/fstab

sudo mount -a
```

**Replace `100.64.x.x` with your Raspberry Pi's Tailscale IP!**

### 3. Update `.env` File

Add these lines to your server `.env`:

```env
# NAS Configuration (Tailscale)
USE_NAS=true
NAS_HOST=100.64.x.x
NAS_PATH=/mnt/nas/intrak/documents
NAS_USERNAME=intrak_nas
NAS_PASSWORD=your_nas_password_here
NAS_SHARE_NAME=documents
```

**Important:** Replace `100.64.x.x` with your actual Tailscale IP!

## Test Connection

```bash
# 1. Test Tailscale connectivity
ping 100.64.x.x

# 2. Test SMB connection
smbclient -L //100.64.x.x -U intrak_nas

# 3. Test mount
ls -la /mnt/nas/intrak/documents

# 4. Test write access
touch /mnt/nas/intrak/documents/test.txt
rm /mnt/nas/intrak/documents/test.txt
```

## Restart INTRAK Server

After configuration, restart your server:
```bash
# The system will automatically validate NAS connection on startup
npm start
# or
node dist/index.js
```

Check logs for: "NAS connection validation successful"

## Troubleshooting

**Can't connect?**
- Verify Tailscale is running: `sudo tailscale status`
- Check both devices are in same Tailscale network
- Ping the Tailscale IP: `ping 100.64.x.x`

**Permission denied?**
- Check user permissions in OpenMediaVault
- Verify mount ownership: `ls -la /mnt/nas/intrak/documents`
- Check credentials file: `cat /etc/samba/nas-credentials`

**Mount fails?**
- Test manual mount first (see Step 2)
- Check SMB service is running in OpenMediaVault
- Verify share name matches: `documents`

## That's It! 🎉

Your INTRAK system will now store all documents on the Raspberry Pi NAS via Tailscale's secure VPN connection.

