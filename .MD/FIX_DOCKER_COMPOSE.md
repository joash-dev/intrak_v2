# Fix Docker Compose Error

## Problem
`KeyError: 'ContainerConfig'` - This is a bug in older docker-compose versions.

## Solution 1: Use Docker Compose V2 (Recommended)

Docker Compose V2 is built into Docker and more stable:

```bash
# Stop and remove old containers
docker-compose -f docker-compose.prod.yml down

# Use 'docker compose' (v2) instead of 'docker-compose' (v1)
docker compose -f docker-compose.prod.yml up -d --build
```

## Solution 2: Upgrade docker-compose

```bash
# Remove old version
sudo apt-get remove docker-compose

# Install latest docker-compose v1
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker-compose --version
```

## Solution 3: Clean Up and Recreate (Quick Fix)

```bash
# Stop all containers
docker-compose -f docker-compose.prod.yml down

# Remove old containers
docker ps -a | grep intrak | awk '{print $1}' | xargs docker rm -f

# Remove volumes (WARNING: This deletes data!)
# docker-compose -f docker-compose.prod.yml down -v

# Rebuild and start
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

## Solution 4: Manual Container Management

If docker-compose keeps failing, manage containers manually:

```bash
# Stop and remove containers
docker stop $(docker ps -aq --filter "name=intrak")
docker rm $(docker ps -aq --filter "name=intrak")

# Build images
docker build -t intrak-server ./server
docker build -t intrak-client ./client

# Run containers manually
docker run -d --name intrak-db -e POSTGRES_PASSWORD=your_password postgres:14-alpine
docker run -d --name intrak-server --link intrak-db:db -p 5000:5000 intrak-server
docker run -d --name intrak-client -p 8080:80 intrak-client
```

## Recommended: Use Docker Compose V2

```bash
# Check if you have Docker Compose V2
docker compose version

# If available, use it:
cd ~/intrak_v2
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```

