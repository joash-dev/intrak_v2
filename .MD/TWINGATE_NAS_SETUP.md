# Twingate NAS Setup Guide for INTRAK System

## Quick Setup Overview

This guide walks you through setting up a Raspberry Pi NAS with OpenMediaVault and connecting it to your INTRAK server using Twingate.

## Why Twingate?

- ✅ Zero-trust network access (no VPN needed)
- ✅ Works behind firewalls/NAT (no port forwarding)
- ✅ Free Starter plan (up to 5 users, 10 resources)
- ✅ Web-based admin console
- ✅ More granular access control
- ✅ Better for enterprise/organizational use

## Prerequisites

- Raspberry Pi 4B (4GB+ RAM recommended)
- External USB 3.0 drive (1TB+)
- MicroSD card (32GB+)
- Twingate account (free Starter plan works)
- Docker installed on Raspberry Pi (for Twingate Connector)

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
   - Note this IP - you'll need it for Twingate configuration

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

## Step 3: Set Up Twingate Account

1. **Sign Up for Twingate**:
   - Go to https://www.twingate.com
   - Sign up for the free Starter plan
   - Complete the setup wizard

2. **Access Admin Console**:
   - Log into your Twingate Admin Console
   - Note your Network name (e.g., `your-network.twingate.com`)

## Step 4: Install Twingate Connector on Raspberry Pi

The Connector allows Twingate to access your local network resources.

### Install Docker (if not already installed)

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (optional, for non-sudo usage)
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
```

### Deploy Twingate Connector

1. **In Twingate Admin Console**:
   - Go to **Connectors** → **Add Connector**
   - Name it (e.g., "Raspberry Pi NAS")
   - Copy the deployment token

2. **On Raspberry Pi**, run the Connector:

```bash
# Run Twingate Connector using Docker
# Replace YOUR_TOKEN and YOUR_NETWORK with your actual values
docker run -d \
  --name twingate-connector \
  --restart unless-stopped \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e TWINGATE_TOKEN=YOUR_TOKEN \
  -e TWINGATE_NETWORK=YOUR_NETWORK \
  twingate/connector:latest
```

**Or use the official install script:**
```bash
# Get your token from Twingate Admin Console
# Then run:
curl -f https://binaries.twingate.com/connector/setup.sh | sh
# Follow the prompts to enter your token
```

3. **Verify Connector Status**:
   - Check in Twingate Admin Console → Connectors
   - Status should show "Connected" (green)
   - Or check locally: `docker ps | grep twingate`

## Step 5: Configure Twingate Resources

In Twingate Admin Console, you need to create a Resource for your SMB share.

1. **Go to Resources → Add Resource**

2. **Configure SMB Resource**:
   - **Name**: `NAS Documents Share` (or any name)
   - **Address**: `192.168.1.100` (your Raspberry Pi's local IP)
   - **Port**: `445` (SMB port)
   - **Protocol**: TCP
   - **Connector**: Select your Raspberry Pi connector

3. **Advanced Settings** (if needed):
   - **FQDN**: Leave empty (using IP)
   - **Aliases**: Can add friendly names

4. **Save the Resource**

## Step 6: Install Twingate Client on INTRAK Server

### For Linux Server:

```bash
# Download and install Twingate client
# Check latest version at: https://www.twingate.com/download

# For Debian/Ubuntu:
curl -f https://binaries.twingate.com/client/debian/twingate_amd64.deb -o twingate.deb
sudo dpkg -i twingate.deb

# Or for RPM-based systems:
curl -f https://binaries.twingate.com/client/rpm/twingate.x86_64.rpm -o twingate.rpm
sudo rpm -i twingate.rpm
```

### Authenticate Client:

```bash
# Start Twingate service
sudo systemctl start twingate
sudo systemctl enable twingate

# Authenticate (you'll need to log in via browser)
twingate auth login
# This will open a browser window for authentication
```

### Verify Connection:

```bash
# Check status
twingate status

# Should show: "Connected to YOUR_NETWORK"
```

## Step 7: Configure INTRAK Server to Mount NAS

### Install Required Packages

```bash
# Install SMB client utilities
sudo apt install cifs-utils  # For Linux
```

### Create Credentials File

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

**Important**: Use the **Twingate Resource address**, not the local IP directly.

```bash
# Test mount using Twingate resource
# The address should be accessible through Twingate
# Use the Resource name or the local IP (Twingate routes it)
sudo mount -t cifs //192.168.1.100/documents /mnt/nas/intrak/documents \
  -o credentials=/etc/samba/nas-credentials,uid=1000,gid=1000,iocharset=utf8,file_mode=0775,dir_mode=0775

# Test write access
touch /mnt/nas/intrak/documents/test.txt
rm /mnt/nas/intrak/documents/test.txt

# If successful, unmount for permanent setup
sudo umount /mnt/nas/intrak/documents
```

**Note**: With Twingate, you can use the local IP address because Twingate routes the traffic through the Connector. The traffic is encrypted and secure.

### Make Mount Permanent

```bash
# Add to /etc/fstab for automatic mounting
# Use the local IP (Twingate handles routing)
echo "//192.168.1.100/documents /mnt/nas/intrak/documents cifs credentials=/etc/samba/nas-credentials,uid=1000,gid=1000,iocharset=utf8,file_mode=0775,dir_mode=0775,_netdev 0 0" | sudo tee -a /etc/fstab

# Test the fstab entry
sudo mount -a

# Verify it's mounted
df -h | grep nas
```

## Step 8: Update INTRAK Server Configuration

### Update `.env` File

Add or update these environment variables in your server `.env` file:

```env
# NAS Configuration (Twingate)
USE_NAS=true
NAS_HOST=192.168.1.100  # Your Raspberry Pi's local IP (Twingate routes it)
NAS_PATH=/mnt/nas/intrak/documents
NAS_USERNAME=intrak_nas
NAS_PASSWORD=your_nas_password_here
NAS_SHARE_NAME=documents
```

**Important Notes:**
- `NAS_HOST`: Use the Raspberry Pi's **local IP** (e.g., `192.168.1.100`)
- Twingate automatically routes traffic through the Connector
- The connection is encrypted and secure
- `NAS_PATH`: 
  - Linux: `/mnt/nas/intrak/documents`
  - Windows: `Z:\intrak\documents` (if mapped)
- `NAS_USERNAME`: The user you created in OpenMediaVault
- `NAS_PASSWORD`: The password for that user

### Verify Configuration

```bash
# Restart your INTRAK server
# Check logs for NAS connection validation
# The system should automatically validate the connection on startup
```

## Step 9: Assign Access in Twingate

1. **In Twingate Admin Console**:
   - Go to **Resources** → Select your NAS resource
   - Click **Access** tab
   - **Add Users/Groups**: Add yourself or create a group
   - Save

2. **Verify Access**:
   - The INTRAK server should now have access to the resource
   - Test connectivity: `ping 192.168.1.100` (should work if Twingate client is connected)

## Step 10: Test the Integration

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

### Twingate Connection Issues

```bash
# Check Twingate client status
twingate status

# Restart Twingate client
sudo systemctl restart twingate

# Check Connector status in Twingate Admin Console
# Verify it shows "Connected" (green)
```

### Connector Issues

```bash
# Check Connector container status
docker ps | grep twingate

# View Connector logs
docker logs twingate-connector

# Restart Connector
docker restart twingate-connector
```

### SMB Connection Issues

```bash
# Test connectivity (should work through Twingate)
ping 192.168.1.100

# Test SMB port
telnet 192.168.1.100 445

# Test SMB authentication
smbclient -L //192.168.1.100 -U intrak_nas

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
1. Check Twingate client is connected: `twingate status`
2. Verify Connector is online in Twingate Admin Console
3. Check Resource access is assigned to your user
4. Verify NAS_HOST IP is correct in `.env`
5. Test manual mount (Step 7)
6. Check OpenMediaVault SMB service is running
7. Verify user permissions in OpenMediaVault

## Security Best Practices

1. **Strong Passwords**: Use strong passwords for both Twingate and NAS user
2. **Regular Updates**: Keep Raspberry Pi OS, OpenMediaVault, and Twingate updated
3. **Access Control**: Use Twingate's access policies to restrict who can access the NAS
4. **Resource Policies**: Configure resource-specific policies in Twingate
5. **Backup**: Regularly backup NAS data
6. **Monitoring**: Monitor disk space and connection status

## Twingate vs Tailscale

| Feature | Twingate | Tailscale |
|---------|----------|-----------|
| Architecture | Connector-based (relay) | Mesh network |
| Setup Complexity | Moderate | Easy |
| Access Control | More granular | Simpler |
| Free Tier | 5 users, 10 resources | Unlimited devices |
| Best For | Organizations, teams | Personal, small teams |
| Admin Console | Web-based | Web-based |
| Performance | Good (relay-based) | Excellent (direct mesh) |

## Maintenance

### Keep Twingate Running

```bash
# Enable Twingate to start on boot (should be automatic)
sudo systemctl enable twingate

# Check status
sudo systemctl status twingate

# Keep Connector running
docker update --restart unless-stopped twingate-connector
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

### Raspberry Pi Local IP
```bash
hostname -I
# or
ip addr show
```

### Server Configuration (.env)
```env
USE_NAS=true
NAS_HOST=<raspberry-pi-local-ip>
NAS_PATH=/mnt/nas/intrak/documents
NAS_USERNAME=intrak_nas
NAS_PASSWORD=<password>
NAS_SHARE_NAME=documents
```

### Test Commands
```bash
# Test Twingate connection
twingate status

# Test connectivity
ping <raspberry-pi-ip>

# Test SMB
smbclient -L //<raspberry-pi-ip> -U intrak_nas

# Check mount
df -h | grep nas
```

## Summary

✅ **Raspberry Pi**: OpenMediaVault + Twingate Connector  
✅ **Server**: Twingate Client + SMB mount  
✅ **Configuration**: Update `.env` with Raspberry Pi local IP  
✅ **Result**: Secure, zero-trust NAS access from anywhere  

Your INTRAK system will now use the Raspberry Pi NAS over Twingate's secure zero-trust network connection!

