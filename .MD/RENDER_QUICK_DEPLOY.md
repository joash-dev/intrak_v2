# Quick Deploy to Render - Ready to Go! 🚀

## ✅ Your Configuration is Ready

All files are set up. Just follow these steps:

## Step 1: Push to GitHub

Make sure all files are committed and pushed:
```bash
git add .
git commit -m "Add NAS support for Render deployment"
git push
```

## Step 2: Create Render Web Service

1. Go to: https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select your repository

## Step 3: Configure Service

**Settings:**
- **Name:** `intrak-server` (or any name)
- **Environment:** `Node`
- **Region:** Choose closest to you
- **Branch:** `main` (or your main branch)
- **Root Directory:** `server`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

**OR** if using Dockerfile (auto-detected):
- Render will automatically use the Dockerfile
- No need to set build/start commands

## Step 4: Add Environment Variables

In Render Dashboard → Your Service → **Environment** → **Add Environment Variable**

Copy ALL of these (from RENDER_ENV_VARIABLES.txt):

```
USE_NAS=true
NAS_PATH=/mnt/nas/intrak
NAS_HOST=100.121.34.91
NAS_USERNAME=don
NAS_PASSWORD=brandongani725
NAS_SHARE_NAME=Serber
TAILSCALE_AUTH_KEY=tskey-auth-khnGPGtJt211CNTRL-TAvCTQnv4FYp5AREYwjsFYCfea4c68VK
```

**Plus your other required variables:**
- `DATABASE_URL` (from Render PostgreSQL)
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `CORS_ORIGIN` (your client URL)
- Any other variables from your `.env`

## Step 5: Deploy

1. Click **"Create Web Service"**
2. Render will start building
3. Watch the logs for:
   - ✅ "Installing system packages..."
   - ✅ "Connecting to Tailscale..."
   - ✅ "Mounting NAS share..."
   - ✅ "NAS connection validated successfully"
   - ✅ "INTRAK Server running on port 5000"

## Step 6: Test

1. Check service is running (green status)
2. Try uploading a document
3. Verify file appears on your NAS at: `\\100.121.34.91\Serber\intrak\documents\`

## What Happens on Deploy:

1. ✅ Container builds with Node.js
2. ✅ Installs `cifs-utils` and `tailscale`
3. ✅ Connects to Tailscale network
4. ✅ Mounts your NAS share
5. ✅ Creates folder structure
6. ✅ Starts Node.js server
7. ✅ Validates NAS connection

## Troubleshooting

### Build fails:
- Check if Dockerfile is in `server/` directory
- Verify all files are pushed to GitHub

### NAS mount fails:
- Check Tailscale auth key is correct
- Verify NAS credentials
- Check Render logs for specific errors

### Server won't start:
- Verify all environment variables are set
- Check DATABASE_URL is correct
- Look at logs for error messages

## Files Ready:
- ✅ `server/scripts/render-start.sh`
- ✅ `server/Dockerfile`
- ✅ `server/package.json` (updated)
- ✅ `server/src/index.ts` (updated)

## Next Steps After Deploy:

1. Deploy your client to Render (Static Site)
2. Update CORS_ORIGIN to your client URL
3. Test full application flow
4. Monitor logs for any issues

---

**You're all set! Just deploy and it should work! 🎉**

