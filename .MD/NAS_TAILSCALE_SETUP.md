# NAS Setup with Tailscale VPN - Step by Step Guide

This guide will help you connect your TrueNAS/OpenMediaVault to the INTRAK application using Tailscale VPN.

## Prerequisites

- ✅ TrueNAS or OpenMediaVault running
- ✅ Tailscale installed and configured on both NAS and Windows server
- ✅ Both devices connected to the same Tailscale network
- ✅ SMB/CIFS share configured on your NAS

## Step 1: Get Your NAS Tailscale IP Address

1. **On your NAS (TrueNAS/OpenMediaVault):**
   - Open Tailscale admin console or SSH into your NAS
   - Run: `tailscale ip` or check the Tailscale web interface
   - Note down the Tailscale IP (e.g., `100.x.x.x`)

2. **Verify connectivity from Windows:**
   ```powershell
   # Test ping to NAS Tailscale IP
   ping 100.x.x.x
   ```

## Step 2: Map Network Drive on Windows

### Option A: Using Windows File Explorer (Recommended)

1. Open **File Explorer**
2. Right-click on **This PC** → **Map network drive...**
3. Configure:
   - **Drive:** Choose a drive letter (e.g., `Z:`)
   - **Folder:** `\\100.x.x.x\share_name` (replace with your NAS Tailscale IP and share name)
   - ✅ **Reconnect at sign-in** (checked)
   - ✅ **Connect using different credentials** (if needed)
4. Click **Finish**
5. Enter credentials if prompted:
   - Username: Your NAS username
   - Password: Your NAS password
   - ✅ **Remember my credentials**

### Option B: Using PowerShell (Alternative)

```powershell
# Map network drive
New-PSDrive -Name "Z" -PSProvider FileSystem -Root "\\100.x.x.x\share_name" -Persist -Credential (Get-Credential)

# Or using net use command
net use Z: \\100.x.x.x\share_name /persistent:yes /user:username password
```

**Common Share Names:**
- TrueNAS: Usually the share name you created (e.g., `documents`, `intrak`, `files`)
- OpenMediaVault: Check in Services → SMB/CIFS → Shares

## Step 3: Create Directory Structure on NAS

1. Navigate to the mapped drive (e.g., `Z:\`)
2. Create the following folder structure:
   ```
   Z:\
   └── intrak\
       ├── documents\
       │   └── temp\
       ├── profile-photos\
       └── templates\
   ```

Or use PowerShell:
```powershell
# Navigate to mapped drive
cd Z:\

# Create directory structure
New-Item -ItemType Directory -Path "intrak\documents\temp" -Force
New-Item -ItemType Directory -Path "intrak\profile-photos" -Force
New-Item -ItemType Directory -Path "intrak\templates" -Force
```

## Step 4: Configure Environment Variables

1. Navigate to `server` directory
2. Open or create `.env` file
3. Add the following NAS configuration:

```env
# ============================================
# NAS Configuration (Tailscale VPN)
# ============================================
USE_NAS=true
NAS_PATH=Z:\intrak
NAS_HOST=100.x.x.x
NAS_USERNAME=your_nas_username
NAS_PASSWORD=your_nas_password
NAS_SHARE_NAME=your_share_name

# ============================================
# File Upload Configuration
# ============================================
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_MIMETYPES=application/pdf,image/jpeg,image/png,image/jpg,application/vnd.openxmlformats-officedocument.wordprocessingml.document

# ============================================
# Other existing environment variables...
# ============================================
```

**Important Notes:**
- `NAS_PATH`: Use the Windows drive letter path (e.g., `Z:\intrak`)
- `NAS_HOST`: Your NAS Tailscale IP address
- `NAS_USERNAME`: Username with write permissions on the NAS
- `NAS_PASSWORD`: Password for the NAS user
- `NAS_SHARE_NAME`: The SMB share name on your NAS

## Step 5: Set Permissions

Ensure the Node.js application has write access:

1. **Right-click** on `Z:\intrak` folder
2. Select **Properties** → **Security** tab
3. Click **Edit** → **Add**
4. Add your Windows user account or `Everyone` (for testing)
5. Grant **Full control** or at least:
   - ✅ Read & execute
   - ✅ List folder contents
   - ✅ Read
   - ✅ Write
   - ✅ Modify
6. Click **Apply** → **OK**
7. Check **"Replace all child object permissions"** if prompted

## Step 6: Test the Connection

### Test 1: Manual File Test
```powershell
# Test write access
cd Z:\intrak\documents
echo "Test file" > test.txt
type test.txt
del test.txt
```

### Test 2: Application Test
1. Restart your Node.js server:
   ```powershell
   cd server
   npm run dev
   ```

2. Check server logs for:
   - ✅ "NAS connection validated successfully"
   - ❌ Any error messages about NAS mount

3. Try uploading a test document through the application

### Test 3: Verify NAS Configuration
The application will automatically validate the NAS connection on startup. Check the console output for:
```
✅ NAS enabled: true
✅ NAS mount path: Z:\intrak
✅ NAS connection validated
```

## Step 7: Troubleshooting

### Issue: "NAS mount point not accessible"
**Solution:**
- Verify the mapped drive is connected: `net use`
- Check if the path exists: `Test-Path Z:\intrak`
- Ensure the drive is mapped before starting the server

### Issue: "Permission denied" errors
**Solution:**
- Check folder permissions (Step 5)
- Verify NAS user has write access
- Try running the application as Administrator (not recommended for production)

### Issue: Drive not persistent after reboot
**Solution:**
- Ensure "Reconnect at sign-in" is checked when mapping
- Or add to startup script:
  ```powershell
  net use Z: \\100.x.x.x\share_name /persistent:yes /user:username password
  ```

### Issue: Tailscale connection issues
**Solution:**
- Verify both devices are online in Tailscale: `tailscale status`
- Check firewall rules on NAS allow SMB (port 445)
- Test connectivity: `ping 100.x.x.x`

## Step 8: Production Considerations

### Auto-Mount Script (Optional)
Create a startup script to ensure the drive is always mapped:

**`server/scripts/mount-nas.ps1`**
```powershell
# Check if drive is already mapped
if (-not (Test-Path "Z:\")) {
    # Map network drive
    $username = "your_nas_username"
    $password = ConvertTo-SecureString "your_nas_password" -AsPlainText -Force
    $credential = New-Object System.Management.Automation.PSCredential($username, $password)
    
    New-PSDrive -Name "Z" -PSProvider FileSystem -Root "\\100.x.x.x\share_name" -Persist -Credential $credential
    Write-Host "NAS drive mapped successfully"
} else {
    Write-Host "NAS drive already mapped"
}
```

### Scheduled Task (Optional)
1. Open **Task Scheduler**
2. Create **Basic Task**
3. Set trigger: **When the computer starts**
4. Action: **Start a program**
5. Program: `powershell.exe`
6. Arguments: `-ExecutionPolicy Bypass -File "C:\path\to\mount-nas.ps1"`

## Step 9: Verify Everything Works

1. ✅ Drive is mapped and accessible
2. ✅ `.env` file configured correctly
3. ✅ Server starts without NAS errors
4. ✅ Can upload documents through the application
5. ✅ Files appear on the NAS
6. ✅ Can download/view uploaded files

## Security Best Practices

1. **Use Strong Credentials:**
   - Create a dedicated NAS user for the application
   - Use a strong, unique password
   - Limit permissions to only the `intrak` folder

2. **Tailscale ACLs (Recommended):**
   - Configure Tailscale ACLs to restrict access
   - Only allow necessary ports (445 for SMB)

3. **Environment Variables:**
   - Never commit `.env` file to git
   - Use environment-specific `.env` files
   - Consider using Windows Credential Manager for passwords

4. **Backup Strategy:**
   - Set up automated backups of the NAS
   - Consider versioning for important documents

## Support

If you encounter issues:
1. Check server logs for detailed error messages
2. Verify Tailscale connectivity: `tailscale ping 100.x.x.x`
3. Test SMB connection: `Test-NetConnection -ComputerName 100.x.x.x -Port 445`
4. Review NAS logs for connection attempts

---

**Next Steps:**
- Configure automated backups
- Set up monitoring for NAS connectivity
- Review file retention policies

