# Fixing Deployment Issues

## Issue 1: Node.js Version Too Old

Your server has Node.js v18.19.1, but Vite 7 requires Node.js 20.19+ or 22.12+.

### Solution: Upgrade Node.js

**Option A: Using NVM (Recommended)**

```bash
# Install NVM if not already installed
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Install Node.js 20 LTS
nvm install 20
nvm use 20
nvm alias default 20

# Verify version
node -v  # Should show v20.x.x
```

**Option B: Using NodeSource Repository**

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify version
node -v  # Should show v20.x.x
```

**Option C: Use Node.js 18 Compatible Vite Version (Quick Fix)**

If you can't upgrade Node.js, downgrade Vite:

```bash
cd ~/intrak_v2/client
npm install vite@^5.0.0 --save-dev
npm run build
```

## Issue 2: Prisma Permission Denied

The `prisma` command doesn't have execute permissions.

### Solution: Fix Prisma Permissions

```bash
cd ~/intrak_v2/server

# Option 1: Use npx (recommended)
npm run build

# If that doesn't work, try:
npx prisma generate
npx tsc

# Option 2: Fix permissions
chmod +x node_modules/.bin/prisma
chmod +x node_modules/.bin/tsc

# Then try again
npm run build
```

## Complete Deployment Steps

After fixing the issues:

```bash
# 1. Upgrade Node.js (if needed)
# See Option A above

# 2. Build Frontend
cd ~/intrak_v2/client
npm install
npm run build

# 3. Build Backend
cd ~/intrak_v2/server
npm install
npm run build

# 4. Restart your server
# If using PM2:
pm2 restart intrak-server

# If using systemd:
sudo systemctl restart intrak-server

# If using Docker:
cd ~/intrak_v2
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

## Quick Fix Script

Create `fix-and-deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🔧 Fixing deployment issues..."

# Fix Prisma permissions
cd ~/intrak_v2/server
chmod +x node_modules/.bin/prisma 2>/dev/null || true
chmod +x node_modules/.bin/tsc 2>/dev/null || true

# Build backend
echo "📦 Building backend..."
npm run build || npx prisma generate && npx tsc

# Build frontend
echo "📦 Building frontend..."
cd ~/intrak_v2/client
npm run build

echo "✅ Build complete!"
```

Make it executable and run:
```bash
chmod +x fix-and-deploy.sh
./fix-and-deploy.sh
```

