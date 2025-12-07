# Hostinger VPS Docker Deployment Guide

## Complete Deployment Steps for Hostinger VPS

### Step 1: Fix Docker Compose Issue

The error you're seeing is due to an old docker-compose version. Use Docker Compose V2:

```bash
cd ~/intrak_v2

# Stop everything
docker-compose -f docker-compose.prod.yml down

# Use Docker Compose V2 (built into Docker)
docker compose -f docker-compose.prod.yml down
```

If `docker compose` (v2) doesn't work, upgrade docker-compose:

```bash
# Remove old version
sudo apt-get remove docker-compose -y

# Install latest docker-compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker-compose --version
```

### Step 2: Pull Latest Code Changes

```bash
cd ~/intrak_v2

# Pull latest changes from git
git pull origin main

# Or if you uploaded files manually, make sure all files are updated
```

### Step 3: Build Backend (Already Done)

```bash
cd ~/intrak_v2/server

# Generate Prisma client
npx prisma generate

# Compile TypeScript
npx tsc

# Verify build
ls -la dist/src/
```

### Step 4: Build Frontend

**First, upgrade Node.js (if not already done):**

```bash
# Check current version
node -v

# If v18, upgrade to v20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node -v  # Should show v20.x.x
```

**Then build frontend:**

```bash
cd ~/intrak_v2/client

# Install dependencies
npm install

# Build
npm run build

# Verify build
ls -la dist/
```

### Step 5: Rebuild and Restart Docker Containers

```bash
cd ~/intrak_v2

# Stop all containers
docker-compose -f docker-compose.prod.yml down

# Remove old containers (optional, but recommended)
docker ps -a | grep intrak | awk '{print $1}' | xargs -r docker rm -f

# Rebuild images with new code
docker-compose -f docker-compose.prod.yml build --no-cache

# Start containers
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Step 6: Verify Deployment

```bash
# Check if containers are running
docker ps

# Check backend health
curl http://localhost:5000/api/health

# Check frontend
curl http://localhost:8080

# View server logs
docker-compose -f docker-compose.prod.yml logs server

# View client logs
docker-compose -f docker-compose.prod.yml logs client
```

## Quick Deployment Script

Create `deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Starting deployment to Hostinger VPS..."

cd ~/intrak_v2

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main || echo "⚠️  Git pull failed, continuing with local changes..."

# Build backend
echo "📦 Building backend..."
cd server
npx prisma generate
npx tsc
cd ..

# Build frontend
echo "📦 Building frontend..."
cd client
npm install
npm run build
cd ..

# Rebuild and restart Docker containers
echo "🐳 Rebuilding Docker containers..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check status
echo "✅ Checking container status..."
docker-compose -f docker-compose.prod.yml ps

echo "✅ Deployment complete!"
echo "🌐 Frontend: http://your-domain:8080"
echo "🔧 Backend: http://your-domain:5000"
```

Make it executable:
```bash
chmod +x deploy.sh
./deploy.sh
```

## Environment Variables

Make sure your `.env` file in `server/` has all required variables:

```env
# Database
DATABASE_URL=postgresql://user:password@db:5432/intrak

# JWT
JWT_SECRET=your_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Server
NODE_ENV=production
PORT=5000
CORS_ORIGIN=http://your-domain:8080
CLIENT_URL=http://your-domain:8080

# AI Configuration
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
AI_MODEL=gemini-2.5-flash
AI_ENABLED=true
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7

# Email (if using)
RESEND_API_KEY=your_resend_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=INTRAK
EMAIL_PROVIDER=resend
```

## Troubleshooting

### Containers won't start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Check if ports are in use
sudo netstat -tulpn | grep -E '5000|8080'

# Restart Docker service
sudo systemctl restart docker
```

### Frontend shows old code

```bash
# Rebuild client container
docker-compose -f docker-compose.prod.yml build --no-cache client
docker-compose -f docker-compose.prod.yml up -d client
```

### Backend errors

```bash
# Check server logs
docker-compose -f docker-compose.prod.yml logs server

# Restart server container
docker-compose -f docker-compose.prod.yml restart server
```

### Database connection issues

```bash
# Check database container
docker-compose -f docker-compose.prod.yml logs db

# Restart database
docker-compose -f docker-compose.prod.yml restart db
```

## Nginx Configuration (If Using Reverse Proxy)

If you're using Nginx as a reverse proxy:

```nginx
# /etc/nginx/sites-available/intrak
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Then enable:
```bash
sudo ln -s /etc/nginx/sites-available/intrak /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

