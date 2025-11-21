# Twingate NAS Quick Start Guide

## What You Need

1. **Raspberry Pi** with OpenMediaVault installed
2. **Twingate account** (free Starter plan)
3. **Twingate Connector** installed on Raspberry Pi
4. **Twingate Client** installed on INTRAK server
5. **Raspberry Pi local IP** (e.g., `192.168.1.100`)

## Quick Setup Checklist

### On Raspberry Pi:
- [ ] Install OpenMediaVault
- [ ] Create SMB share named `documents`
- [ ] Create user `intrak_nas` with read/write access
- [ ] Install Docker: `curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh`
- [ ] Deploy Twingate Connector (see Step 4 below)
- [ ] Note local IP: `hostname -I`

### On INTRAK Server:
- [ ] Install Twingate Client (see Step 6 below)
- [ ] Authenticate: `twingate auth login`
- [ ] Install SMB tools: `sudo apt install cifs-utils` (Linux)
- [ ] Create mount point: `sudo mkdir -p /mnt/nas/intrak/documents`
- [ ] Mount NAS (see commands below)
- [ ] Update `.env` file (see below)

## Step-by-Step Commands

### 1. Deploy Twingate Connector on Raspberry Pi

```bash
# Get your token from Twingate Admin Console → Connectors → Add Connector
# Then run:
curl -f https://binaries.twingate.com/connector/setup.sh | sh
# Follow prompts to enter your token

# Or using Docker:
docker run -d \
  --name twingate-connector \
  --restart unless-stopped \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e TWINGATE_TOKEN=YOUR_TOKEN \
  -e TWINGATE_NETWORK=YOUR_NETWORK \
  twingate/connector:latest
```

### 2. Create Twingate Resource

In Twingate Admin Console:
1. **Resources → Add Resource**
2. **Name**: `NAS Documents Share`
3. **Address**: `192.168.1.100` (your Raspberry Pi IP)
4. **Port**: `445`
5. **Protocol**: TCP
6. **Connector**: Select your Raspberry Pi connector
7. **Save**

### 3. Install Twingate Client on Server

```bash
# For Debian/Ubuntu:
curl -f https://binaries.twingate.com/client/debian/twingate_amd64.deb -o twingate.deb
sudo dpkg -i twingate.deb

# Start and authenticate
sudo systemctl start twingate
sudo systemctl enable twingate
twingate auth login
```

### 4. Create Credentials File (Linux)

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

### 5. Mount NAS

**Test mount first:**
```bash
sudo mount -t cifs //192.168.1.100/documents /mnt/nas/intrak/documents \
  -o credentials=/etc/samba/nas-credentials,uid=1000,gid=1000,iocharset=utf8,file_mode=0775,dir_mode=0775
```

**Make permanent (add to /etc/fstab):**
```bash
echo "//192.168.1.100/documents /mnt/nas/intrak/documents cifs credentials=/etc/samba/nas-credentials,uid=1000,gid=1000,iocharset=utf8,file_mode=0775,dir_mode=0775,_netdev 0 0" | sudo tee -a /etc/fstab

sudo mount -a
```

**Replace `192.168.1.100` with your Raspberry Pi's local IP!**

### 6. Update `.env` File

Add these lines to your server `.env`:

```env
# NAS Configuration (Twingate)
USE_NAS=true
NAS_HOST=192.168.1.100
NAS_PATH=/mnt/nas/intrak/documents
NAS_USERNAME=intrak_nas
NAS_PASSWORD=your_nas_password_here
NAS_SHARE_NAME=documents
```

**Important:** Replace `192.168.1.100` with your actual Raspberry Pi local IP!

### 7. Assign Access in Twingate

In Twingate Admin Console:
- **Resources** → Select your NAS resource
- **Access** tab → Add your user/group
- Save

## Test Connection

```bash
# 1. Check Twingate status
twingate status

# 2. Test connectivity
ping 192.168.1.100

# 3. Test SMB connection
smbclient -L //192.168.1.100 -U intrak_nas

# 4. Test mount
ls -la /mnt/nas/intrak/documents

# 5. Test write access
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

**Twingate not connected?**
- Check status: `twingate status`
- Restart: `sudo systemctl restart twingate`
- Re-authenticate: `twingate auth login`

**Connector not working?**
- Check in Twingate Admin Console → Connectors
- View logs: `docker logs twingate-connector`
- Restart: `docker restart twingate-connector`

**Can't access NAS?**
- Verify Resource access is assigned in Twingate
- Check Twingate client is connected: `twingate status`
- Test connectivity: `ping 192.168.1.100`
- Verify SMB service is running in OpenMediaVault

**Permission denied?**
- Check user permissions in OpenMediaVault
- Verify mount ownership: `ls -la /mnt/nas/intrak/documents`
- Check credentials file: `cat /etc/samba/nas-credentials`

**Mount fails?**
- Test manual mount first (see Step 5)
- Check Twingate is connected: `twingate status`
- Verify Resource is configured correctly in Twingate
- Check share name matches: `documents`

## Key Differences from Tailscale

- **Uses local IP**: With Twingate, you use the Raspberry Pi's local IP (e.g., `192.168.1.100`), not a Twingate IP
- **Connector required**: Must deploy Connector on Raspberry Pi
- **Resource-based**: Access is controlled through Resources in Twingate Admin Console
- **More granular**: Better access control and policies

## That's It! 🎉

Your INTRAK system will now store all documents on the Raspberry Pi NAS via Twingate's secure zero-trust network connection.

