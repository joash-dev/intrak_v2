# NAS Quick Start Guide - Tailscale Setup

## Quick Setup (5 Minutes)

### Prerequisites
- ✅ Tailscale installed on both Windows server and NAS
- ✅ SMB/CIFS share configured on NAS
- ✅ NAS Tailscale IP address

### Step 1: Get NAS Tailscale IP
```powershell
# On NAS or check Tailscale admin console
tailscale ip
# Note: Usually starts with 100.x.x.x
```

### Step 2: Run Setup Script
```powershell
cd server\scripts
.\setup-nas.ps1 -TailscaleIP "100.x.x.x" -ShareName "documents" -Username "nas_user" -Password "your_password"
```

**Parameters:**
- `-TailscaleIP`: Your NAS Tailscale IP (e.g., `100.64.1.5`)
- `-ShareName`: SMB share name on NAS (e.g., `documents`, `intrak`)
- `-Username`: NAS username with write permissions
- `-Password`: NAS password
- `-DriveLetter`: Optional, defaults to `Z:`
- `-BasePath`: Optional, defaults to `intrak`

### Step 3: Verify
```powershell
# Check if drive is mapped
Test-Path Z:\intrak

# Test write access
echo "test" > Z:\intrak\documents\test.txt
del Z:\intrak\documents\test.txt
```

### Step 4: Restart Server
```powershell
cd server
npm run dev
```

Look for: `✅ NAS connection validated successfully`

---

## Manual Setup (Alternative)

### 1. Map Network Drive
- File Explorer → This PC → Map network drive
- Drive: `Z:`
- Folder: `\\100.x.x.x\share_name`
- ✅ Reconnect at sign-in

### 2. Create Folders
```
Z:\intrak\
  ├── documents\
  │   └── temp\
  ├── profile-photos\
  └── templates\
```

### 3. Configure .env
Add to `server/.env`:
```env
USE_NAS=true
NAS_PATH=Z:\intrak
NAS_HOST=100.x.x.x
NAS_USERNAME=your_username
NAS_PASSWORD=your_password
NAS_SHARE_NAME=your_share_name
```

---

## Troubleshooting

### Drive Not Mapping
```powershell
# Check Tailscale connectivity
ping 100.x.x.x

# Test SMB port
Test-NetConnection -ComputerName 100.x.x.x -Port 445

# Check existing mappings
net use
```

### Permission Errors
- Right-click `Z:\intrak` → Properties → Security
- Add your Windows user with Full Control
- Apply to all subfolders

### Server Can't Access NAS
- Ensure drive is mapped before starting server
- Check `.env` file has correct paths
- Verify NAS credentials are correct

---

## Common Share Names

**TrueNAS:**
- Check: Storage → SMB Shares
- Common: `documents`, `files`, `intrak`

**OpenMediaVault:**
- Check: Services → SMB/CIFS → Shares
- Common: `documents`, `shared`, `intrak`

---

## Security Notes

1. **Use dedicated NAS user** for the application
2. **Limit permissions** to only the `intrak` folder
3. **Never commit** `.env` file to git
4. **Use Tailscale ACLs** to restrict access

---

For detailed instructions, see: `NAS_TAILSCALE_SETUP.md`

