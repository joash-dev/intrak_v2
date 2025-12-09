# NAS Connection Process for INTRAK System

## Overview

The INTRAK system connects to a Network Attached Storage (NAS) device using Tailscale VPN for secure remote access. This allows the system to store documents, templates, and profile photos on a centralized NAS instead of local server storage.

---

## Architecture Components

### 1. NAS Device (Raspberry Pi with OpenMediaVault)
- Physical storage device
- Runs SMB/CIFS service for file sharing
- Connected via Tailscale VPN

### 2. INTRAK Server
- Application server (Node.js/Express)
- Mounts NAS share as local directory
- Automatically validates connection on startup

### 3. Tailscale VPN
- Secure mesh VPN network
- Connects NAS and server over the internet
- Provides encrypted communication

---

## Step-by-Step Connection Process

### Phase 1: NAS Setup (Raspberry Pi)

#### Step 1.1: Install OpenMediaVault

```bash
# On Raspberry Pi
sudo apt update && sudo apt upgrade -y
wget -O - https://github.com/OpenMediaVault-Plugin-Developers/installScript/raw/master/install | sudo bash
sudo reboot
```

#### Step 1.2: Configure OpenMediaVault

1. **Access Web Interface**: `http://raspberry-pi-local-ip`
   - Default credentials: `admin` / `openmediavault`
   - **Change password immediately!**

2. **Format and Mount Storage**:
   - **Storage → Disks**: Format your USB drive (ext4)
   - **Storage → File Systems**: Create and mount file system
   - **Storage → Shared Folders**: Create folder named `documents`

3. **Enable SMB/CIFS Service**:
   - **Services → SMB/CIFS**: Enable service
   - **Services → SMB/CIFS → Shares**: Add share for `documents` folder
   - Set "Public" to "No"
   - Save and apply

4. **Create NAS User**:
   - **Access Rights Management → Users**: Add user
   - Username: `intrak_nas` (or your preferred name)
   - Password: Use a strong password (save this!)
   - Groups: `users`
   - **Services → SMB/CIFS → Shares**: Edit share, add user with read/write permissions

#### Step 1.3: Install Tailscale on Raspberry Pi

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

# Note this IP address (e.g., 100.121.34.91)
# This is what you'll use in your server configuration
```

---

### Phase 2: Server Setup (INTRAK Server)

#### Step 2.1: Install Tailscale on Server

```bash
# On Linux server
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# Authenticate with the same Tailscale account
# This allows both devices to communicate securely
```

#### Step 2.2: Verify Tailscale Connection

```bash
# Test connectivity to NAS
ping 100.121.34.91  # Replace with your NAS Tailscale IP

# Test SMB port (should be accessible)
telnet 100.121.34.91 445
# Or on Linux:
nc -zv 100.121.34.91 445
```

#### Step 2.3: Install Required Packages (Linux)

```bash
# Install SMB client utilities
sudo apt-get update
sudo apt-get install -y cifs-utils
```

#### Step 2.4: Create Credentials File (Linux)

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

#### Step 2.5: Create Mount Point

```bash
# Create mount directory
sudo mkdir -p /mnt/nas/intrak

# Set ownership (replace 1000 with your user ID if different)
sudo chown -R 1000:1000 /mnt/nas/intrak
```

#### Step 2.6: Test Manual Mount

```bash
# Mount the NAS share manually to test
sudo mount -t cifs //100.121.34.91/Serber /mnt/nas/intrak \
  -o credentials=/etc/samba/nas-credentials,uid=1000,gid=1000,iocharset=utf8,file_mode=0777,dir_mode=0777

# Test write access
touch /mnt/nas/intrak/documents/test.txt
rm /mnt/nas/intrak/documents/test.txt

# If successful, unmount for permanent setup
sudo umount /mnt/nas/intrak
```

#### Step 2.7: Configure Persistent Mount (Linux)

```bash
# Add to /etc/fstab for automatic mounting on boot
echo "//100.121.34.91/Serber /mnt/nas/intrak cifs credentials=/etc/samba/nas-credentials,uid=1000,gid=1000,iocharset=utf8,file_mode=0777,dir_mode=0777,_netdev 0 0" | sudo tee -a /etc/fstab

# Test the fstab entry
sudo mount -a

# Verify it's mounted
df -h | grep nas
```

#### Alternative: Windows Server Setup

1. Open File Explorer
2. Map network drive: `\\100.121.34.91\Serber`
3. Use credentials: `intrak_nas` and your password
4. Note the drive letter (e.g., `Z:`)
5. Create folder structure:
   ```
   Z:\intrak\documents\
   Z:\intrak\templates\
   Z:\intrak\profile-photos\
   ```

---

### Phase 3: INTRAK System Configuration

#### Step 3.1: Update Environment Variables

Add or update these variables in `server/.env`:

```env
# NAS Configuration
USE_NAS=true
NAS_HOST=100.121.34.91  # Your NAS Tailscale IP
NAS_PATH=/mnt/nas/intrak  # Linux: /mnt/nas/intrak, Windows: Z:\intrak
NAS_USERNAME=intrak_nas  # NAS username
NAS_PASSWORD=your_nas_password_here  # NAS password
NAS_SHARE_NAME=Serber  # SMB share name

# File Upload Configuration
UPLOAD_PATH=./uploads  # Local backup path
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_MIMETYPES=application/pdf,image/jpeg,image/png,image/jpg
```

**Important Notes:**
- `NAS_HOST`: Use the Tailscale IP from Step 1.3 (e.g., `100.121.34.91`)
- `NAS_PATH`: 
  - Linux: `/mnt/nas/intrak`
  - Windows: `Z:\intrak` (or your mapped drive path)
- `NAS_USERNAME`: The user you created in OpenMediaVault
- `NAS_PASSWORD`: The password for that user
- `NAS_SHARE_NAME`: The SMB share name configured in OpenMediaVault

#### Step 3.2: Create Directory Structure on NAS

The system automatically creates these directories, but you can create them manually:

**Linux:**
```bash
mkdir -p /mnt/nas/intrak/documents/temp
mkdir -p /mnt/nas/intrak/templates
mkdir -p /mnt/nas/intrak/profile-photos
```

**Windows:**
```powershell
mkdir Z:\intrak\documents\temp
mkdir Z:\intrak\templates
mkdir Z:\intrak\profile-photos
```

#### Step 3.3: Restart INTRAK Server

```bash
# Restart the server
npm run dev  # Development
# or
npm start    # Production

# Check server logs for:
# ✅ "NAS connection validated successfully"
```

---

### Phase 4: System Validation

#### Step 4.1: Automatic Validation

The INTRAK server automatically validates NAS connection on startup:

**Server Startup Process** (`server/src/index.ts`):
1. Checks if `USE_NAS=true`
2. Validates NAS mount point exists
3. Tests write access to NAS
4. Syncs local files to NAS (if any exist)
5. Falls back to local storage if NAS unavailable

**Expected Log Messages:**
```
🔌 Checking NAS connection...
✅ NAS connection validated successfully
🔄 Checking for local files to sync to NAS...
✅ Synced X files from local storage to NAS
💾 Storage: NAS (/mnt/nas/intrak)
```

#### Step 4.2: Manual Testing

```bash
# Test file upload through INTRAK web interface
# 1. Log in as a student
# 2. Upload a test document
# 3. Verify file appears on NAS:

# Linux:
ls -la /mnt/nas/intrak/documents/

# Windows:
dir Z:\intrak\documents\
```

#### Step 4.3: Verify File Structure

Files are organized by student ID:

```
/mnt/nas/intrak/documents/
  ├── {studentId1}/
  │   ├── document1.pdf
  │   └── document2.pdf
  ├── {studentId2}/
  │   └── document1.pdf
  └── temp/
      └── temporary_files...
```

---

## System Features

### 1. Automatic Fallback
- If NAS is unavailable, system uses local storage (`./uploads`)
- Files are automatically synced to NAS when it reconnects
- No data loss during NAS disconnection

### 2. Dual Storage
- Files are saved to NAS (primary storage)
- Local backup is created automatically
- Ensures redundancy and availability

### 3. Connection Validation
- Server validates NAS connection on startup
- Retries up to 10 times with 5-second intervals
- Logs connection status for monitoring

### 4. File Path Resolution
- System checks both NAS and local storage
- Automatically resolves file paths
- Handles path differences between environments

---

## Troubleshooting Guide

### Issue 1: Tailscale Connection Failed

**Symptoms:**
- Cannot ping NAS Tailscale IP
- Server cannot reach NAS

**Solutions:**
```bash
# Check Tailscale status on both devices
sudo tailscale status

# Restart Tailscale if needed
sudo systemctl restart tailscale

# Verify both devices are in the same Tailscale network
# Check Tailscale admin console: https://login.tailscale.com/admin/machines
```

### Issue 2: SMB Connection Failed

**Symptoms:**
- Cannot mount NAS share
- Permission denied errors

**Solutions:**
```bash
# Test connectivity
ping 100.121.34.91

# Test SMB port
telnet 100.121.34.91 445
# Or
nc -zv 100.121.34.91 445

# Test SMB authentication
smbclient -L //100.121.34.91 -U intrak_nas

# Check mount status
mount | grep nas  # Linux
net use           # Windows
```

### Issue 3: Permission Errors

**Symptoms:**
- Cannot write files to NAS
- Access denied errors

**Solutions:**
```bash
# Check mount permissions
ls -la /mnt/nas/intrak/documents

# Check ownership
stat /mnt/nas/intrak/documents

# Remount if needed
sudo umount /mnt/nas/intrak
sudo mount -a
```

### Issue 4: NAS Not Accessible in INTRAK

**Symptoms:**
- Server logs show "NAS connection failed"
- Files not saving to NAS

**Checklist:**
1. Verify `USE_NAS=true` in `.env`
2. Check `NAS_HOST` IP is correct (Tailscale IP)
3. Verify `NAS_PATH` matches mount point
4. Test manual mount (Step 2.6)
5. Check OpenMediaVault SMB service is running
6. Verify user permissions in OpenMediaVault

---

## Security Considerations

### 1. Tailscale VPN
- Encrypted mesh network
- No open ports required
- Access control via Tailscale ACLs

### 2. Credentials Management
- Credentials stored in secure file (`/etc/samba/nas-credentials`)
- File permissions: `600` (read/write for owner only)
- Never commit credentials to version control

### 3. Network Security
- SMB/CIFS over Tailscale VPN (encrypted)
- No public internet exposure
- Tailscale authentication required

---

## Maintenance

### Keep Tailscale Running

```bash
# Enable Tailscale to start on boot (should be automatic)
sudo systemctl enable tailscale

# Check status
sudo systemctl status tailscale
```

### Keep NAS Mounted

```bash
# The _netdev option in fstab ensures mount waits for network
# If mount fails, manually remount:
sudo mount -a

# Check mount status
df -h | grep nas
```

### Monitor Disk Space

```bash
# Check NAS disk usage
df -h /mnt/nas/intrak

# Set up alerts in OpenMediaVault for low disk space
```

---

## Quick Reference

### NAS Tailscale IP
```bash
tailscale ip -4  # On Raspberry Pi
```

### Server Configuration (.env)
```env
USE_NAS=true
NAS_HOST=100.121.34.91
NAS_PATH=/mnt/nas/intrak
NAS_USERNAME=intrak_nas
NAS_PASSWORD=your_password
NAS_SHARE_NAME=Serber
```

### Test Commands
```bash
# Test Tailscale connection
ping 100.121.34.91

# Test SMB
smbclient -L //100.121.34.91 -U intrak_nas

# Check mount
df -h | grep nas  # Linux
net use           # Windows
```

---

## Automated Setup Scripts

### Linux Server Setup

Use the provided setup script for automated configuration:

```bash
cd server/scripts
chmod +x setup-nas-linux.sh
sudo ./setup-nas-linux.sh \
  -i 100.121.34.91 \
  -s Serber \
  -u intrak_nas \
  -p your_password \
  -m /mnt/nas/intrak
```

### Windows Server Setup

Use the PowerShell script for automated configuration:

```powershell
cd server\scripts
.\setup-nas.ps1 `
  -TailscaleIP "100.121.34.91" `
  -ShareName "Serber" `
  -Username "intrak_nas" `
  -Password "your_password" `
  -DriveLetter "Z:" `
  -BasePath "intrak"
```

---

## Summary

The NAS connection process involves:

1. ✅ **Setting up NAS device** (Raspberry Pi + OpenMediaVault)
2. ✅ **Installing Tailscale** on both NAS and server
3. ✅ **Configuring SMB/CIFS share** on NAS
4. ✅ **Mounting NAS share** on server
5. ✅ **Configuring INTRAK system** environment variables
6. ✅ **Validating connection** and testing file operations

**Result:** Secure, encrypted NAS access from anywhere via Tailscale VPN, with automatic fallback to local storage if NAS is unavailable.

This setup provides:
- ✅ Centralized storage
- ✅ Scalability
- ✅ Improved backup capabilities
- ✅ Secure remote access
- ✅ Automatic failover

---

## Additional Resources

- [Tailscale Documentation](https://tailscale.com/kb/)
- [OpenMediaVault Documentation](https://openmediavault.readthedocs.io/)
- [SMB/CIFS Configuration Guide](https://www.samba.org/samba/docs/)
- [INTRAK System Architecture](./SYSTEM_ARCHITECTURE.md)

---

**Document Version:** 1.0  
**Last Updated:** December 2025  
**Maintained By:** INTRAK Development Team

