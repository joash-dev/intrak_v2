# Quick NAS Setup - Your Configuration

## Your NAS Details:
- **Tailscale IP:** `100.121.34.91` ✅
- **Share Name:** `Serber` ✅
- **SMB Port:** 445 ✅ (accessible)

## Next Steps:

### 1. Get Credentials from Your Groupmate
Ask for:
- Username: `_____________`
- Password: `_____________`

### 2. Run Setup Script
Once you have credentials, run:

```powershell
cd server\scripts
.\setup-nas.ps1 -TailscaleIP "100.121.34.91" -ShareName "Serber" -Username "YOUR_USERNAME" -Password "YOUR_PASSWORD"
```

### 3. Alternative: Manual Setup

If the script doesn't work, do it manually:

**A. Map Network Drive:**
1. File Explorer → This PC → Map network drive
2. Drive: `Z:`
3. Folder: `\\100.121.34.91\Serber`
4. ✅ Reconnect at sign-in
5. Enter credentials when prompted

**B. Create Folders:**
```powershell
cd Z:\
New-Item -ItemType Directory -Path "intrak\documents\temp" -Force
New-Item -ItemType Directory -Path "intrak\profile-photos" -Force
New-Item -ItemType Directory -Path "intrak\templates" -Force
```

**C. Update .env:**
Add to `server/.env`:
```env
USE_NAS=true
NAS_PATH=Z:\intrak
NAS_HOST=100.121.34.91
NAS_USERNAME=your_username
NAS_PASSWORD=your_password
NAS_SHARE_NAME=Serber
```

## Status:
- ✅ Tailscale connectivity: Working (143ms latency)
- ✅ SMB service: Accessible
- ⏳ Waiting for credentials to complete setup

