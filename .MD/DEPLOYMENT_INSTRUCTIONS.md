# VPS Deployment Instructions

## Quick Deployment

### Step 1: Copy Script to VPS

From your local machine, copy the deployment script to VPS:

```bash
scp deploy-vps.sh root@72.62.67.78:/root/
```

### Step 2: SSH to VPS

```bash
ssh root@72.62.67.78
```

### Step 3: Make Script Executable

```bash
chmod +x ~/deploy-vps.sh
```

### Step 4: Run Deployment

```bash
~/deploy-vps.sh
```

---

## Manual Deployment (Alternative)

If you prefer to run commands manually:

```bash
cd ~/intrak_v2

# Start containers
docker compose -f docker-compose.prod.yml up -d --build

# Wait for initialization
sleep 30

# Run migrations
docker compose -f docker-compose.prod.yml exec server npx prisma migrate deploy

# Generate Prisma Client
docker compose -f docker-compose.prod.yml exec server npx prisma generate

# Check status
docker compose -f docker-compose.prod.yml ps
```

---

## Verify Deployment

### Check Containers:
```bash
docker compose -f docker-compose.prod.yml ps
```

### Check Logs:
```bash
docker compose -f docker-compose.prod.yml logs -f server
```

### Test Access:
- Frontend: `https://intrak.site` or `http://72.62.67.78`
- Backend: `https://intrak.site:5000/health` or `http://72.62.67.78:5000/health`

---

## Troubleshooting

### If containers fail:
```bash
docker compose -f docker-compose.prod.yml logs
docker compose -f docker-compose.prod.yml restart
```

### If database error:
```bash
docker compose -f docker-compose.prod.yml logs db
grep DATABASE_URL .env
```

### If NAS error:
```bash
docker compose -f docker-compose.prod.yml logs server | grep -i nas
```

