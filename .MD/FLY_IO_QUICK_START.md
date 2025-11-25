# Fly.io Quick Start Guide

## 🚀 Quick Deployment Steps

### 1. Install Fly CLI

**Windows (PowerShell):**
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

**Mac/Linux:**
```bash
curl -L https://fly.io/install.sh | sh
```

### 2. Login to Fly.io

```bash
fly auth login
```

### 3. Navigate to Server Directory

```bash
cd server
```

### 4. Launch App (First Time)

```bash
fly launch
```

**When prompted:**
- App name: `intrak-server` (or your choice)
- Region: `sin` (Singapore - closest to your NAS)
- PostgreSQL: `No` (you have your own)
- Redis: `No`

### 5. Set Environment Variables

```bash
# Database
fly secrets set DATABASE_URL="your-postgresql-url"

# JWT Secrets
fly secrets set JWT_SECRET="your-secret"
fly secrets set JWT_REFRESH_SECRET="your-refresh-secret"

# CORS
fly secrets set CORS_ORIGIN="https://your-client-url"

# NAS Configuration
fly secrets set USE_NAS="true"
fly secrets set NAS_PATH="/mnt/nas/intrak"
fly secrets set NAS_HOST="100.121.34.91"
fly secrets set NAS_USERNAME="don"
fly secrets set NAS_PASSWORD="brandongani725"
fly secrets set NAS_SHARE_NAME="Serber"

# Tailscale
fly secrets set TAILSCALE_AUTH_KEY="tskey-auth-khnGPGtJt211CNTRL-TAvCTQnv4FYp5AREYwjsFYCfea4c68VK"
```

### 6. Deploy

```bash
fly deploy
```

### 7. Check Logs

```bash
fly logs
```

Look for:
- ✅ Tailscale connected successfully
- ✅ NAS mounted successfully

### 8. Get Your App URL

```bash
fly status
```

Your app will be at: `https://intrak-server.fly.dev`

## 📋 Useful Commands

```bash
# View logs
fly logs

# SSH into container
fly ssh console

# Check status
fly status

# View secrets
fly secrets list

# Scale app
fly scale count 2

# Restart app
fly apps restart intrak-server
```

## 🔍 Troubleshooting

### Check Tailscale Connection
```bash
fly ssh console -C "tailscale status"
```

### Check NAS Mount
```bash
fly ssh console -C "mount | grep nas"
```

### View All Logs
```bash
fly logs --all
```

## 💰 Pricing

- **Free tier**: 3 shared-cpu-256mb VMs
- **Your setup**: ~$3-4/month for 1 shared-cpu-512mb VM

## 📚 Full Documentation

See `docs/FLY_IO_DEPLOYMENT.md` for detailed instructions.


