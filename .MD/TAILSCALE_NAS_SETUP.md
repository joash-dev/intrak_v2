# Tailscale NAS Setup Guide for INTRAK System

## Quick Setup Overview

This guide walks you through setting up a Raspberry Pi NAS with OpenMediaVault and connecting it to your INTRAK server using Tailscale.

## Prerequisites

- Raspberry Pi 4B (4GB+ RAM recommended)
- External USB 3.0 drive (1TB+)
- MicroSD card (32GB+)
- Tailscale account (free tier works)

## Step 1: Install OpenMediaVault on Raspberry Pi

```bash
# 1. Flash Raspberry Pi OS Lite (64-bit) to microSD card
# 2. Boot Raspberry Pi and connect via SSH

# 3. Update system
sudo apt update && sudo apt upgrade -y

# 4. Install OpenMediaVault
wget -O - https://github.com/OpenMediaVault-Plugin-Developers/installScript/raw/master/install | sudo bash

# 5. Reboot
sudo reboot
```

## Step 2: Initial OpenMediaVault Configuration

1. **Access Web Interface**: `http://raspberry-pi-local-ip`
   - Default: `admin` / `openmediavault`
   - Change password immediately!

2. **Set Static IP** (System → Network → Interfaces)
   - Set a static local IP (e.g., `192.168.1.100`)
   - This helps with local access

3. **Format and Mount Storage**:
   - **Storage → Disks**: Format your USB drive (ext4)
   - **Storage → File Systems**: Create and mount file system
   - **Storage → Shared Folders**: Create folder named `documents`

4. **Enable SMB/CIFS**:
   - **Services → SMB/CIFS**: Enable service
   - **Services → SMB/CIFS → Shares**: Add share for `documents` folder
   - Set "Public" to "No"
   - Save and apply

5. **Create NAS User**:
   - **Access Rights Management → Users**: Add user
   - Username: `intrak_nas` (or your preferred name)
   - Password: Use a strong password (save this!)
   - Groups: `users`
   - **Services → SMB/CIFS → Shares**: Edit share, add user with read/write permissions

## Step 3: Install and Configure Tailscale on Raspberry Pi

```bash
# Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# Start Tailscale
sudo tailscale up

# You'll see a URL - open it in a browser to authenticate
# Example: https://login.tailscale.com/auth/...
```

**After authentication:**
```bash
# Get your Tailscale IP address
tailscale ip -4

# Note this IP address (e.g., 100.64.x.x)
# This is what you'll use in your server configuration
```

## Step 4: Install Tailscale on Your INTRAK Server

```bash
# On your INTRAK server (Linux)
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# Authenticate with the same Tailscale account
# This allows both devices to communicate securely
```

**Verify connection:**
```bash
# On your server, ping the Raspberry Pi
ping 100.64.x.x  # Use the Tailscale IP from Step 3

# Test SMB connection
smbclient -L //100.64.x.x -U intrak_nas
```

## Step 5: Configure INTRAK Server to Mount NAS

### Install Required Packages

```bash
# Install SMB client utilities
sudo apt install cifs-utils  # For Linux
# Or on Windows, SMB is built-in
```

### Create Credentials File (Linux)

```bash
# Create secure credentials file
sudo nano /etc/samba/nas-credentials

# Add these lines (replace with your actual credentials):
username=intrak_nas
password=your_nas_password_here
domain=WORKGROUP

# Save and set secure permissions
sudo chmod 600 /etc/samba/nas-credentials
```

### Create Mount Point

```bash
# Create mount directory
sudo mkdir -p /mnt/nas/intrak/documents

# Set ownership (replace 1000 with your user ID if different)
sudo chown -R 1000:1000 /mnt/nas/intrak/documents
```

### Test Manual Mount

```bash
# Replace 100.64.x.x with your Raspberry Pi's Tailscale IP
sudo mount -t cifs //100.64.x.x/documents /mnt/nas/intrak/documents \
  -o credentials=/etc/samba/nas-credentials,uid=1000,gid=1000,iocharset=utf8,file_mode=0775,dir_mode=0775

# Test write access
touch /mnt/nas/intrak/documents/test.txt
rm /mnt/nas/intrak/documents/test.txt

# If successful, unmount for permanent setup
sudo umount /mnt/nas/intrak/documents
```

### Make Mount Permanent (Linux)

```bash
# Add to /etc/fstab for automatic mounting
# Replace 100.64.x.x with your Tailscale IP
echo "//100.64.x.x/documents /mnt/nas/intrak/documents cifs credentials=/etc/samba/nas-credentials,uid=1000,gid=1000,iocharset=utf8,file_mode=0775,dir_mode=0775,_netdev 0 0" | sudo tee -a /etc/fstab

# Test the fstab entry
sudo mount -a

# Verify it's mounted
df -h | grep nas
```

### Windows Server Alternative

If your server is Windows:
1. Open File Explorer
2. Map network drive: `\\100.64.x.x\documents`
3. Use credentials: `intrak_nas` and your password
4. Note the drive letter (e.g., `Z:`)

## Step 6: Update INTRAK Server Configuration

### Update `.env` File

Add or update these environment variables in your server `.env` file:

```env
# NAS Configuration
USE_NAS=true
NAS_HOST=100.64.x.x  # Replace with your Raspberry Pi Tailscale IP
NAS_PATH=/mnt/nas/intrak/documents  # Linux path, or Z:\intrak\documents for Windows
NAS_USERNAME=intrak_nas
NAS_PASSWORD=your_nas_password_here
NAS_SHARE_NAME=documents
```

**Important Notes:**
- `NAS_HOST`: Use the Tailscale IP from Step 3 (e.g., `100.64.1.2`)
- `NAS_PATH`: 
  - Linux: `/mnt/nas/intrak/documents`
  - Windows: `Z:\intrak\documents` (or your mapped drive path)
- `NAS_USERNAME`: The user you created in OpenMediaVault
- `NAS_PASSWORD`: The password for that user

### Verify Configuration

```bash
# Restart your INTRAK server
# Check logs for NAS connection validation
# The system should automatically validate the connection on startup
```

## Step 7: Test the Integration

1. **Start INTRAK Server**
   ```bash
   # Check server logs for:
   # "NAS connection validation successful" or similar
   ```

2. **Test File Upload**
   - Log into INTRAK as a student
   - Upload a test document
   - Verify it appears on the NAS:
     ```bash
     ls -la /mnt/nas/intrak/documents/
     ```

3. **Verify File Structure**
   - Documents should be organized by student ID
   - Check that files are readable/writable

## Troubleshooting

### Tailscale Connection Issues

```bash
# Check Tailscale status on Raspberry Pi
sudo tailscale status

# Check Tailscale status on server
sudo tailscale status

# Restart Tailscale if needed
sudo systemctl restart tailscale
```

### SMB Connection Issues

```bash
# Test connectivity
ping 100.64.x.x  # Tailscale IP

# Test SMB port
telnet 100.64.x.x 445

# Test SMB authentication
smbclient -L //100.64.x.x -U intrak_nas

# Check mount status
mount | grep nas
```

### Permission Issues

```bash
# Check mount permissions
ls -la /mnt/nas/intrak/documents

# Check ownership
stat /mnt/nas/intrak/documents

# Remount if needed
sudo umount /mnt/nas/intrak/documents
sudo mount -a
```

### NAS Not Accessible Error

If you see "Storage system unavailable" in INTRAK:
1. Check Tailscale is running on both devices
2. Verify NAS_HOST IP is correct in `.env`
3. Test manual mount (Step 5)
4. Check OpenMediaVault SMB service is running
5. Verify user permissions in OpenMediaVault

## Security Best Practices

1. **Strong Passwords**: Use strong passwords for both Tailscale and NAS user
2. **Regular Updates**: Keep Raspberry Pi OS and OpenMediaVault updated
3. **Tailscale ACLs**: Configure access control lists in Tailscale admin panel
4. **Backup**: Regularly backup NAS data
5. **Monitoring**: Monitor disk space and connection status

## Maintenance

### Keep Tailscale Running

```bash
# Enable Tailscale to start on boot (should be automatic)
sudo systemctl enable tailscale

# Check status
sudo systemctl status tailscale
```

### Keep NAS Mounted

The `_netdev` option in fstab ensures the mount waits for network. If mount fails:
```bash
# Manually remount
sudo mount -a
```

### Monitor Disk Space

```bash
# Check NAS disk usage
df -h /mnt/nas/intrak/documents

# Set up alerts in OpenMediaVault for low disk space
```

## Quick Reference

### Raspberry Pi Tailscale IP
```bash
tailscale ip -4
```

### Server Configuration (.env)
```env
USE_NAS=true
NAS_HOST=<tailscale-ip>
NAS_PATH=/mnt/nas/intrak/documents
NAS_USERNAME=intrak_nas
NAS_PASSWORD=<password>
NAS_SHARE_NAME=documents
```

### Test Commands
```bash
# Test Tailscale connection
ping <tailscale-ip>

# Test SMB
smbclient -L //<tailscale-ip> -U intrak_nas

# Check mount
df -h | grep nas
```

## Summary

✅ **Raspberry Pi**: OpenMediaVault + Tailscale  
✅ **Server**: Tailscale + SMB mount  
✅ **Configuration**: Update `.env` with Tailscale IP  
✅ **Result**: Secure, encrypted NAS access from anywhere  

Your INTRAK system will now use the Raspberry Pi NAS over Tailscale's secure VPN connection!

