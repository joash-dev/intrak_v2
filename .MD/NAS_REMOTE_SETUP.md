# Remote NAS Setup - Connecting to Groupmate's Raspberry Pi

Since your groupmate has the NAS setup on a Raspberry Pi with Tailscale, you'll need to connect remotely. Follow these steps:

## Step 1: Get Connection Details from Your Groupmate

Ask your groupmate for the following information:

### Required Information:
1. **NAS Tailscale IP Address**
   - Format: `100.x.x.x` (Tailscale IP)
   - How to get: `tailscale ip` on the RPi

2. **SMB/CIFS Share Name**
   - Common names: `documents`, `intrak`, `files`, `shared`
   - Check on RPi: `smbclient -L localhost` or check Samba config

3. **NAS Username & Password**
   - The SMB/CIFS user credentials
   - Should have write permissions

4. **Share Path (if custom)**
   - Default is usually the share name
   - Full path format: `\\100.x.x.x\share_name`

### Optional but Helpful:
- RPi hostname in Tailscale
- Confirmation that SMB/CIFS service is running
- Any firewall rules or special configurations

## Step 2: Verify Tailscale Connection

Before proceeding, ensure you can reach the RPi:

```powershell
# Test Tailscale connectivity
ping 100.x.x.x

# If ping works, test SMB port
Test-NetConnection -ComputerName 100.x.x.x -Port 445
```

**If ping fails:**
- Ensure Tailscale is installed and running on your Windows machine
- Verify you're logged into the same Tailscale network
- Check: `tailscale status` (if Tailscale CLI is installed)
- Ask your groupmate to verify RPi is online in Tailscale

## Step 3: Test SMB Connection

Try to access the share manually:

```powershell
# Test SMB connection (replace with actual values)
Test-Path "\\100.x.x.x\share_name"

# Or try to list shares
net view \\100.x.x.x
```

**If connection fails:**
- Verify SMB/CIFS service is running on RPi
- Check if firewall allows port 445
- Confirm share name is correct
- Ask groupmate to verify share is accessible

## Step 4: Run Setup Script

Once you can ping the RPi, run the setup script:

```powershell
cd server\scripts
.\setup-nas.ps1 -TailscaleIP "100.x.x.x" -ShareName "share_name" -Username "username" -Password "password"
```

**Example:**
```powershell
.\setup-nas.ps1 -TailscaleIP "100.64.1.5" -ShareName "intrak" -Username "pi" -Password "raspberry"
```

## Step 5: Manual Setup (If Script Fails)

If the automated script doesn't work, do it manually:

### A. Map Network Drive
1. Open **File Explorer**
2. Right-click **This PC** → **Map network drive...**
3. Drive: `Z:`
4. Folder: `\\100.x.x.x\share_name`
5. ✅ **Reconnect at sign-in**
6. ✅ **Connect using different credentials**
7. Enter username and password when prompted

### B. Create Directory Structure
```powershell
# Navigate to mapped drive
cd Z:\

# Create folders
New-Item -ItemType Directory -Path "intrak\documents\temp" -Force
New-Item -ItemType Directory -Path "intrak\profile-photos" -Force
New-Item -ItemType Directory -Path "intrak\templates" -Force
```

### C. Configure .env File
Edit `server/.env` and add:

```env
USE_NAS=true
NAS_PATH=Z:\intrak
NAS_HOST=100.x.x.x
NAS_USERNAME=your_username
NAS_PASSWORD=your_password
NAS_SHARE_NAME=share_name
```

## Step 6: Verify Setup

```powershell
# Check drive is mapped
Test-Path Z:\intrak

# Test write access
echo "test" > Z:\intrak\documents\test.txt
del Z:\intrak\documents\test.txt

# If successful, you're good to go!
```

## Troubleshooting Remote Connection

### Issue: Can't ping RPi
**Solutions:**
- Verify Tailscale is running: Check system tray icon
- Check Tailscale status: Open Tailscale app → Check if RPi appears
- Ask groupmate to verify RPi is online
- Try pinging RPi hostname instead of IP

### Issue: SMB port 445 not accessible
**Solutions:**
- Ask groupmate to check Samba service: `sudo systemctl status smbd`
- Verify firewall allows port 445: `sudo ufw allow 445`
- Check Samba is configured correctly

### Issue: Authentication fails
**Solutions:**
- Verify username/password are correct
- Ask groupmate to check SMB user exists
- Try creating a new SMB user on RPi
- Check if user has write permissions

### Issue: Drive maps but can't write
**Solutions:**
- Check folder permissions on RPi
- Verify SMB user has write access
- Ask groupmate to check: `sudo chmod -R 775 /path/to/share`

## What to Ask Your Groupmate

If you're having issues, ask them to check:

1. **Tailscale Status:**
   ```bash
   tailscale status
   ```

2. **Samba Service:**
   ```bash
   sudo systemctl status smbd
   sudo systemctl status nmbd
   ```

3. **Samba Configuration:**
   ```bash
   sudo cat /etc/samba/smb.conf
   ```

4. **Share Permissions:**
   ```bash
   ls -la /path/to/share
   ```

5. **Firewall Rules:**
   ```bash
   sudo ufw status
   ```

## Security Considerations

Since you're connecting remotely:

1. **Use Strong Credentials**
   - Don't share passwords in plain text
   - Use secure communication channel

2. **Tailscale ACLs**
   - Configure Tailscale ACLs to restrict access
   - Only allow necessary devices

3. **SMB Security**
   - Use SMB 3.0+ if possible
   - Consider SMB over VPN (already using Tailscale)

4. **Network Isolation**
   - Tailscale provides encrypted tunnel
   - RPi should only expose necessary ports

## Quick Checklist

Before contacting your groupmate, verify:

- [ ] Tailscale is installed and running on your Windows machine
- [ ] You're logged into the same Tailscale network
- [ ] You have the RPi Tailscale IP address
- [ ] You have SMB share name
- [ ] You have username and password
- [ ] You can ping the RPi: `ping 100.x.x.x`
- [ ] SMB port is accessible: `Test-NetConnection -ComputerName 100.x.x.x -Port 445`

## Alternative: Ask Groupmate to Run Setup

If you're having trouble, your groupmate can:

1. **Share the mapped drive path** if they've already set it up
2. **Provide a pre-configured `.env` file** (without passwords, you add those)
3. **Set up the directory structure** on the RPi beforehand
4. **Create a test file** to verify write permissions

---

**Next Steps:**
1. Contact your groupmate for the connection details
2. Verify Tailscale connectivity
3. Run the setup script or manual setup
4. Test file uploads through the application

