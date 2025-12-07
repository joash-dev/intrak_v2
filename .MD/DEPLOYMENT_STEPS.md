# Deployment Steps for AI Integration Changes

## Quick Checklist

- [ ] Build frontend (`npm run build` in `client/`)
- [ ] Build backend (`npm run build` in `server/`)
- [ ] Commit changes to git
- [ ] Push to repository
- [ ] Rebuild Docker images (if using Docker)
- [ ] Restart server
- [ ] Clear browser cache

## Step-by-Step Deployment

### Option 1: Git-Based Deployment (Render, Fly.io, etc.)

If your deployment automatically builds from git:

1. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Add AI integration to all text fields"
   git push origin main
   ```

2. **Wait for automatic build** - Your platform should automatically:
   - Pull the latest code
   - Build frontend (`npm run build`)
   - Build backend (`npm run build`)
   - Restart services

3. **Check deployment logs** to ensure build succeeded

### Option 2: Manual Docker Deployment

If you're deploying manually with Docker:

1. **Build frontend:**
   ```bash
   cd client
   npm run build
   cd ..
   ```

2. **Build backend:**
   ```bash
   cd server
   npm run build
   cd ..
   ```

3. **Rebuild Docker images:**
   ```bash
   docker-compose -f docker-compose.prod.yml build
   ```

4. **Restart services:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Option 3: Manual Server Deployment (No Docker)

If deploying directly to a server:

1. **Build frontend:**
   ```bash
   cd client
   npm install
   npm run build
   # Copy dist/ folder to web server (nginx, apache, etc.)
   ```

2. **Build backend:**
   ```bash
   cd server
   npm install
   npm run build
   # Restart Node.js process (PM2, systemd, etc.)
   ```

3. **Restart server:**
   ```bash
   # If using PM2:
   pm2 restart intrak-server
   
   # If using systemd:
   sudo systemctl restart intrak-server
   ```

## Common Issues

### 1. Changes Not Appearing (Browser Cache)
- **Solution:** Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Or clear browser cache
- Or use incognito/private mode

### 2. Build Errors
- **Check:** Node.js version (should be 18+)
- **Check:** All dependencies installed (`npm install`)
- **Check:** TypeScript compilation errors

### 3. Server Not Restarting
- **Check:** Server logs for errors
- **Check:** Environment variables are set
- **Check:** Port is not already in use

### 4. Frontend Shows Old Code
- **Verify:** `client/dist/` folder has new files
- **Verify:** Web server is serving from correct directory
- **Verify:** Build completed successfully

## Verification Steps

1. **Check backend is running:**
   ```bash
   curl http://your-server:5000/api/health
   ```

2. **Check frontend is built:**
   ```bash
   ls -la client/dist/
   # Should see index.html and assets/
   ```

3. **Check AI endpoints:**
   ```bash
   # Test AI config endpoint (requires auth)
   curl -H "Authorization: Bearer YOUR_TOKEN" http://your-server:5000/api/ai/config
   ```

4. **Check browser console** for JavaScript errors

## Environment Variables

Make sure these are set in your production environment:

```env
# AI Configuration
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
AI_MODEL=gemini-2.5-flash
AI_ENABLED=true
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7
```

## Quick Deploy Script

Create a `deploy.sh` file:

```bash
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Build frontend
echo "📦 Building frontend..."
cd client
npm run build
cd ..

# Build backend
echo "📦 Building backend..."
cd server
npm run build
cd ..

# If using Docker
if [ -f "docker-compose.prod.yml" ]; then
    echo "🐳 Rebuilding Docker images..."
    docker-compose -f docker-compose.prod.yml build
    echo "🔄 Restarting services..."
    docker-compose -f docker-compose.prod.yml up -d
fi

echo "✅ Deployment complete!"
```

Make it executable:
```bash
chmod +x deploy.sh
./deploy.sh
```

