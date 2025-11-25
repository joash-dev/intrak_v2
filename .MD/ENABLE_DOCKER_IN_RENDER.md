# How to Enable Docker in Render

Render is currently using **native Node.js build** instead of Docker. To use NAS, you need to enable Docker.

## Method 1: Auto-Detect (Easiest)

1. **Delete your current service** (or create a new one)
2. **Create new Web Service**
3. Connect your GitHub repo
4. Render should **auto-detect** the Dockerfile
5. If it asks, select **"Docker"** instead of "Node"

## Method 2: Manual Configuration

1. Go to your service in Render Dashboard
2. Click **Settings**
3. Scroll to **"Build & Deploy"** section
4. Find **"Docker"** or **"Dockerfile Path"**
5. Set:
   - **Dockerfile Path:** `server/Dockerfile`
   - **Docker Context:** `server`
6. **Clear** the Build Command (Dockerfile handles it)
7. **Clear** the Start Command (Dockerfile handles it)
8. Save changes

## Method 3: Use render.yaml (Recommended)

I've created `render.yaml` in your repo. Render should auto-detect it.

1. **Push** `render.yaml` to GitHub
2. **Delete** your current service
3. **Create new service** from GitHub
4. Render will use `render.yaml` configuration

## Current Status

Right now, the app will:
- ✅ **Work without NAS** (uses local storage)
- ⚠️ **NAS disabled** until Docker is enabled

## After Enabling Docker

Once Docker is enabled, you should see in logs:
- ✅ "Installing system packages..." (from Dockerfile)
- ✅ "cifs-utils found"
- ✅ "tailscale found"
- ✅ "NAS mounted successfully"

## Quick Test

After enabling Docker, check logs for:
```
🚀 Starting INTRAK Server with NAS support...
✅ NAS mounted successfully
✅ NAS connection validated successfully
```

If you see "⚠️ NAS not available", Docker is still not enabled.

---

**The app works fine without NAS for now - it just uses local storage instead.**

