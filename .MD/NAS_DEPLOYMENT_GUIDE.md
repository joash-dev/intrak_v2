# NAS Setup for Deployment Environments

The quick setup script (`setup-nas.ps1`) is **Windows-specific** and works for:
- ✅ Local Windows development
- ✅ Windows Server deployment

For other deployment environments, you'll need different approaches.

## Deployment Scenarios

### 1. Windows Server Deployment ✅ (Quick Setup Works)

**Use the quick setup script:**
```powershell
.\setup-nas.ps1 -TailscaleIP "100.121.34.91" -ShareName "Serber" -Username "user" -Password "pass"
```

**Additional considerations:**
- Ensure drive mapping persists after reboot
- Set up scheduled task to remap drive on startup (if needed)
- Use Windows service account with proper permissions

**Environment Variables:**
```env
USE_NAS=true
NAS_PATH=Z:\intrak
NAS_HOST=100.121.34.91
NAS_USERNAME=your_username
NAS_PASSWORD=your_password
NAS_SHARE_NAME=Serber
```

---

### 2. Linux Server Deployment ❌ (Different Approach)

**The PowerShell script won't work.** Use Linux mount commands instead:

#### Step 1: Install Required Packages
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y cifs-utils tailscale

# CentOS/RHEL
sudo yum install -y cifs-utils tailscale
```

#### Step 2: Connect to Tailscale
```bash
# Login to Tailscale
sudo tailscale up

# Verify connectivity
ping 100.121.34.91
```

#### Step 3: Create Mount Point
```bash
sudo mkdir -p /mnt/nas/intrak
```

#### Step 4: Create Credentials File
```bash
# Create secure credentials file
sudo nano /etc/samba/nas-credentials
```

Add:
```
username=your_username
password=your_password
domain=WORKGROUP
```

Set permissions:
```bash
sudo chmod 600 /etc/samba/nas-credentials
```

#### Step 5: Mount NAS Share
```bash
# Mount the share
sudo mount -t cifs //100.121.34.91/Serber /mnt/nas/intrak \
  -o credentials=/etc/samba/nas-credentials,uid=1000,gid=1000,iocharset=utf8,file_mode=0777,dir_mode=0777

# Verify mount
df -h | grep intrak
```

#### Step 6: Make Mount Persistent
```bash
# Add to /etc/fstab
sudo nano /etc/fstab
```

Add this line:
```
//100.121.34.91/Serber /mnt/nas/intrak cifs credentials=/etc/samba/nas-credentials,uid=1000,gid=1000,iocharset=utf8,file_mode=0777,dir_mode=0777 0 0
```

#### Step 7: Create Directory Structure
```bash
sudo mkdir -p /mnt/nas/intrak/documents/temp
sudo mkdir -p /mnt/nas/intrak/profile-photos
sudo mkdir -p /mnt/nas/intrak/templates
sudo chown -R $USER:$USER /mnt/nas/intrak
```

#### Step 8: Configure Environment Variables
```env
USE_NAS=true
NAS_PATH=/mnt/nas/intrak
NAS_HOST=100.121.34.91
NAS_USERNAME=your_username
NAS_PASSWORD=your_password
NAS_SHARE_NAME=Serber
```

#### Step 9: Test Connection
```bash
# Test write access
echo "test" > /mnt/nas/intrak/documents/test.txt
rm /mnt/nas/intrak/documents/test.txt
```

---

### 3. Docker Deployment ❌ (Volume Mount Approach)

**The PowerShell script won't work.** Use Docker volumes:

#### Option A: Mount from Host (Recommended)

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  intrak-server:
    build: ./server
    volumes:
      # Mount NAS from host (host must have NAS mounted first)
      - /mnt/nas/intrak:/app/uploads
    environment:
      - USE_NAS=false  # Use local path since it's mounted
      - UPLOAD_PATH=./uploads
    # ... other config
```

**Host Setup:**
1. Mount NAS on Docker host (Linux) using steps from "Linux Server Deployment"
2. Docker will use the mounted path

#### Option B: Direct SMB Mount in Container (Advanced)

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  intrak-server:
    build: ./server
    volumes:
      - nas-storage:/app/uploads
    environment:
      - USE_NAS=true
      - NAS_PATH=/app/uploads
      - NAS_HOST=100.121.34.91
      - NAS_USERNAME=your_username
      - NAS_PASSWORD=your_password
      - NAS_SHARE_NAME=Serber
    # Install cifs-utils in Dockerfile
```

**Dockerfile addition:**
```dockerfile
# Install SMB client
RUN apt-get update && apt-get install -y cifs-utils && rm -rf /var/lib/apt/lists/*

# Mount script (run on container start)
COPY scripts/mount-nas.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/mount-nas.sh
```

**scripts/mount-nas.sh:**
```bash
#!/bin/bash
mkdir -p /app/uploads
mount -t cifs //${NAS_HOST}/${NAS_SHARE_NAME} /app/uploads \
  -o username=${NAS_USERNAME},password=${NAS_PASSWORD},uid=1000,gid=1000
```

**Note:** This approach is complex and not recommended. Prefer mounting on host.

---

### 4. Cloud Deployment (AWS, Azure, GCP)

**Options:**

#### Option A: Use Cloud Storage (Recommended)
- **AWS:** S3 with S3FS or use AWS SDK
- **Azure:** Azure Files (SMB compatible)
- **GCP:** Cloud Storage with FUSE

**Example - AWS S3:**
```env
USE_NAS=false
UPLOAD_PATH=./uploads
# Use S3 SDK for file operations instead
```

#### Option B: VPN + NAS Mount
1. Set up VPN connection (Tailscale, WireGuard, etc.)
2. Mount NAS as network drive
3. Follow Linux Server Deployment steps

---

## Deployment Checklist

### Windows Server ✅
- [ ] Run `setup-nas.ps1` script
- [ ] Verify drive mapping persists after reboot
- [ ] Configure `.env` file
- [ ] Test file uploads
- [ ] Set up monitoring

### Linux Server
- [ ] Install `cifs-utils` and `tailscale`
- [ ] Connect to Tailscale network
- [ ] Create mount point
- [ ] Create credentials file
- [ ] Mount NAS share
- [ ] Add to `/etc/fstab` for persistence
- [ ] Create directory structure
- [ ] Configure `.env` file
- [ ] Test file uploads
- [ ] Set up monitoring

### Docker
- [ ] Mount NAS on Docker host (if using host mount)
- [ ] Configure `docker-compose.yml` volumes
- [ ] Set environment variables
- [ ] Test file uploads
- [ ] Set up monitoring

### Cloud
- [ ] Choose storage solution (S3, Azure Files, etc.)
- [ ] Configure storage credentials
- [ ] Update application code if needed
- [ ] Test file uploads
- [ ] Set up monitoring

---

## Environment Variables Summary

### Windows Server
```env
USE_NAS=true
NAS_PATH=Z:\intrak
NAS_HOST=100.121.34.91
NAS_USERNAME=username
NAS_PASSWORD=password
NAS_SHARE_NAME=Serber
```

### Linux Server / Docker
```env
USE_NAS=true
NAS_PATH=/mnt/nas/intrak
NAS_HOST=100.121.34.91
NAS_USERNAME=username
NAS_PASSWORD=password
NAS_SHARE_NAME=Serber
```

---

## Troubleshooting Deployment

### Issue: Mount fails after reboot
**Solution:**
- Windows: Check "Reconnect at sign-in" in drive mapping
- Linux: Verify `/etc/fstab` entry is correct
- Test mount manually: `sudo mount -a`

### Issue: Permission denied
**Solution:**
- Check file permissions on NAS
- Verify user has write access
- Check mount options (uid/gid)

### Issue: Connection timeout
**Solution:**
- Verify Tailscale connectivity
- Check firewall rules
- Test SMB port: `telnet 100.121.34.91 445`

---

## Security Best Practices for Deployment

1. **Credentials:**
   - Use environment variables, not hardcoded passwords
   - Use secrets management (AWS Secrets Manager, Azure Key Vault)
   - Rotate credentials regularly

2. **Network:**
   - Use Tailscale ACLs to restrict access
   - Enable SMB encryption if possible
   - Use VPN for all connections

3. **Permissions:**
   - Use dedicated service account
   - Limit permissions to required folders only
   - Regular permission audits

---

## Quick Reference

| Environment | Script Works? | Mount Method |
|------------|---------------|--------------|
| Windows Dev | ✅ Yes | Network Drive (Z:) |
| Windows Server | ✅ Yes | Network Drive (Z:) |
| Linux Server | ❌ No | CIFS mount (`/mnt/nas/intrak`) |
| Docker | ❌ No | Volume mount from host |
| Cloud | ❌ No | Cloud storage or VPN mount |

---

**For your current setup (Windows):** The quick setup script will work perfectly! 🎉

