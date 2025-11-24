# Render.com Setup Steps for NAS

## Your NAS Details:
- **IP:** 100.121.34.91
- **Share:** Serber
- **Username:** don
- **Password:** brandongani725

## Step 1: Get Tailscale Auth Key

1. Go to: https://login.tailscale.com/admin/settings/keys
2. Click "Generate auth key"
3. Select "Reusable" (or "Ephemeral" for one-time)
4. Copy the key (you'll need it in Step 3)

## Step 2: Deploy to Render

### Create Web Service:
1. Go to Render Dashboard: https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name:** intrak-server
   - **Environment:** Node
   - **Build Command:** `cd server && npm install && npm run build`
   - **Start Command:** `cd server && npm start`
   - **Root Directory:** `server`

### OR Use Dockerfile:
If Render detects the Dockerfile, it will use it automatically.

## Step 3: Set Environment Variables

In Render Dashboard → Your Service → Environment → Add Environment Variable:

```env
USE_NAS=true
NAS_PATH=/mnt/nas/intrak
NAS_HOST=100.121.34.91
NAS_USERNAME=don
NAS_PASSWORD=brandongani725
NAS_SHARE_NAME=Serber
TAILSCALE_AUTH_KEY=tskey-auth-xxxxxxxxxxxxx
```

**Important:** Replace `tskey-auth-xxxxxxxxxxxxx` with your actual Tailscale auth key from Step 1.

## Step 4: Deploy

1. Click "Save Changes"
2. Render will automatically deploy
3. Check logs for:
   - ✅ "NAS connection validated successfully"
   - ✅ "INTRAK Server running on port 5000"

## Step 5: Test

1. Upload a test document through your application
2. Check if it appears on your NAS at: `\\100.121.34.91\Serber\intrak\documents\`

## Troubleshooting

### If NAS mount fails:
- Check Render logs for error messages
- Verify Tailscale auth key is correct
- Verify NAS credentials are correct
- Check if NAS is accessible from Tailscale network

### If server won't start:
- Check all environment variables are set
- Verify build completed successfully
- Check logs for specific errors

## Files Created:
- ✅ `server/scripts/render-start.sh` - Startup script
- ✅ `server/Dockerfile` - Docker configuration
- ✅ `server/package.json` - Updated start script
- ✅ `server/src/index.ts` - Added NAS validation

