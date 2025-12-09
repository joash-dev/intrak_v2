# How to Check Docker Logs for INTRAK System

## Quick Commands

### Check Server Logs (Most Common)
```bash
# View server logs
docker compose -f docker-compose.prod.yml logs server

# Follow logs in real-time (like tail -f)
docker compose -f docker-compose.prod.yml logs -f server

# View last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100 server

# View logs with timestamps
docker compose -f docker-compose.prod.yml logs -t server
```

---

## All Container Logs

### Check All Services
```bash
# View all logs (db, server, client)
docker compose -f docker-compose.prod.yml logs

# Follow all logs in real-time
docker compose -f docker-compose.prod.yml logs -f

# View last 50 lines of all services
docker compose -f docker-compose.prod.yml logs --tail=50
```

### Check Specific Services
```bash
# Database logs
docker compose -f docker-compose.prod.yml logs db

# Server logs
docker compose -f docker-compose.prod.yml logs server

# Client logs
docker compose -f docker-compose.prod.yml logs client
```

---

## Advanced Log Commands

### Filter Logs by Time
```bash
# View logs since last 10 minutes
docker compose -f docker-compose.prod.yml logs --since 10m server

# View logs since specific time
docker compose -f docker-compose.prod.yml logs --since 2024-01-01T00:00:00 server

# View logs until specific time
docker compose -f docker-compose.prod.yml logs --until 2024-01-01T12:00:00 server
```

### Search Logs
```bash
# View logs and search for specific text
docker compose -f docker-compose.prod.yml logs server | grep "error"

# Case-insensitive search
docker compose -f docker-compose.prod.yml logs server | grep -i "nas"

# Search with context (show 5 lines before and after)
docker compose -f docker-compose.prod.yml logs server | grep -A 5 -B 5 "error"
```

### Save Logs to File
```bash
# Save logs to file
docker compose -f docker-compose.prod.yml logs server > server-logs.txt

# Save with timestamps
docker compose -f docker-compose.prod.yml logs -t server > server-logs-with-time.txt

# Append to existing file
docker compose -f docker-compose.prod.yml logs server >> server-logs.txt
```

---

## Using Docker Commands (Alternative)

### Direct Docker Commands
```bash
# View server logs
docker logs intrak_v2-server-1

# Follow logs
docker logs -f intrak_v2-server-1

# View last 100 lines
docker logs --tail 100 intrak_v2-server-1

# View with timestamps
docker logs -t intrak_v2-server-1
```

### Find Container Name
```bash
# List all running containers
docker ps

# List all containers (including stopped)
docker ps -a
```

---

## Common Use Cases

### 1. Check Server Startup
```bash
# View server logs from start
docker compose -f docker-compose.prod.yml logs server

# Follow server startup in real-time
docker compose -f docker-compose.prod.yml logs -f server
```

### 2. Debug Errors
```bash
# View recent errors
docker compose -f docker-compose.prod.yml logs --tail=200 server | grep -i error

# View all errors with context
docker compose -f docker-compose.prod.yml logs server | grep -A 10 -B 5 "error"
```

### 3. Check NAS Connection
```bash
# View NAS-related logs
docker compose -f docker-compose.prod.yml logs server | grep -i nas

# View Tailscale connection logs
docker compose -f docker-compose.prod.yml logs server | grep -i tailscale
```

### 4. Monitor Real-Time Activity
```bash
# Follow all logs in real-time
docker compose -f docker-compose.prod.yml logs -f

# Follow only server logs
docker compose -f docker-compose.prod.yml logs -f server
```

### 5. Check Database Connection
```bash
# View database-related logs
docker compose -f docker-compose.prod.yml logs server | grep -i database

# View database container logs
docker compose -f docker-compose.prod.yml logs db
```

---

## Log File Locations

### Docker Logs Location (Host)
```bash
# Docker stores logs in:
/var/lib/docker/containers/[container-id]/[container-id]-json.log

# Find container ID
docker ps --format "{{.ID}} {{.Names}}"

# View log file directly (requires root)
sudo tail -f /var/lib/docker/containers/[container-id]/[container-id]-json.log
```

---

## Useful Log Patterns

### Check for Specific Patterns
```bash
# Check for startup errors
docker compose -f docker-compose.prod.yml logs server | grep -i "error\|failed\|exception"

# Check for successful startup
docker compose -f docker-compose.prod.yml logs server | grep -i "started\|ready\|listening"

# Check for warnings
docker compose -f docker-compose.prod.yml logs server | grep -i "warn"

# Check for NAS connection
docker compose -f docker-compose.prod.yml logs server | grep -i "nas\|mount\|tailscale"
```

---

## Troubleshooting Commands

### If Logs Are Too Long
```bash
# View only last 50 lines
docker compose -f docker-compose.prod.yml logs --tail=50 server

# View logs since container restart
docker compose -f docker-compose.prod.yml logs --since 1h server
```

### If Container Is Not Running
```bash
# Check container status
docker compose -f docker-compose.prod.yml ps

# View logs of stopped container
docker compose -f docker-compose.prod.yml logs server

# Check why container stopped
docker compose -f docker-compose.prod.yml ps -a
```

### Clear Old Logs
```bash
# Note: This doesn't clear logs, just rotates them
# To actually clear, you need to prune containers

# Prune stopped containers (removes their logs)
docker container prune

# Prune all unused data (be careful!)
docker system prune
```

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `docker compose logs server` | View server logs |
| `docker compose logs -f server` | Follow logs (real-time) |
| `docker compose logs --tail=100 server` | Last 100 lines |
| `docker compose logs -t server` | With timestamps |
| `docker compose logs --since 10m server` | Since 10 minutes ago |
| `docker compose logs server \| grep error` | Search for errors |
| `docker compose logs > logs.txt` | Save to file |

---

## Example Output

### Server Startup Logs:
```
🚀 Starting INTRAK Server with NAS support on Fly.io...
✅ /dev/net/tun available
🔗 Starting Tailscale daemon...
✅ tailscaled socket ready
🔗 Connecting to Tailscale network...
✅ Tailscale connected successfully
📍 Tailscale IP: 100.121.34.91
📁 Setting up NAS mount...
✅ NAS already accessible at /mnt/nas/intrak (bind mount)
🚀 Starting Node.js server...
Server running on port 5000
✅ NAS connection validated successfully
```

### Error Logs:
```
❌ NAS connection failed after 10 attempts - continuing with local storage
⚠️  NAS mount failed
⚠️  Continuing with local storage...
```

---

## Summary

**Most common commands:**

1. **View logs:**
   ```bash
   docker compose -f docker-compose.prod.yml logs server
   ```

2. **Follow logs (real-time):**
   ```bash
   docker compose -f docker-compose.prod.yml logs -f server
   ```

3. **View last 100 lines:**
   ```bash
   docker compose -f docker-compose.prod.yml logs --tail=100 server
   ```

4. **Search for errors:**
   ```bash
   docker compose -f docker-compose.prod.yml logs server | grep -i error
   ```

These commands work from the VPS where Docker Compose is running!

