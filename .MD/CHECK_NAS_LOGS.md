# How to Check NAS Logs Only

## Quick Command

### View NAS-Related Logs Only
```bash
# Filter server logs for NAS-related messages
docker compose -f docker-compose.prod.yml logs server | grep -i nas

# Follow NAS logs in real-time
docker compose -f docker-compose.prod.yml logs -f server | grep -i nas
```

---

## More Specific Filters

### NAS Connection Logs
```bash
# Check NAS connection status
docker compose -f docker-compose.prod.yml logs server | grep -i "nas\|connection\|mount"

# Follow NAS connection in real-time
docker compose -f docker-compose.prod.yml logs -f server | grep -i "nas\|connection\|mount"
```

### NAS Mount Logs
```bash
# Check NAS mount status
docker compose -f docker-compose.prod.yml logs server | grep -i "mount\|nas\|cifs"

# Check if NAS is mounted successfully
docker compose -f docker-compose.prod.yml logs server | grep -i "mounted\|accessible"
```

### NAS Validation Logs
```bash
# Check NAS validation
docker compose -f docker-compose.prod.yml logs server | grep -i "validate\|nas\|check"

# Check NAS connection attempts
docker compose -f docker-compose.prod.yml logs server | grep -i "waiting\|attempt\|nas"
```

### NAS Errors Only
```bash
# Check NAS errors
docker compose -f docker-compose.prod.yml logs server | grep -i "nas.*error\|error.*nas\|failed.*nas\|nas.*failed"

# Check NAS warnings
docker compose -f docker-compose.prod.yml logs server | grep -i "nas.*warn\|warn.*nas"
```

### Tailscale + NAS Logs
```bash
# Check Tailscale and NAS together
docker compose -f docker-compose.prod.yml logs server | grep -i "tailscale\|nas"

# Follow Tailscale and NAS logs
docker compose -f docker-compose.prod.yml logs -f server | grep -i "tailscale\|nas"
```

---

## View Recent NAS Logs

### Last 100 Lines with NAS Filter
```bash
# View last 100 lines, then filter for NAS
docker compose -f docker-compose.prod.yml logs --tail=100 server | grep -i nas

# View last 50 lines with NAS filter
docker compose -f docker-compose.prod.yml logs --tail=50 server | grep -i nas
```

### NAS Logs Since Last 10 Minutes
```bash
# View NAS logs from last 10 minutes
docker compose -f docker-compose.prod.yml logs --since 10m server | grep -i nas

# View NAS logs from last hour
docker compose -f docker-compose.prod.yml logs --since 1h server | grep -i nas
```

---

## Save NAS Logs to File

### Save NAS Logs
```bash
# Save NAS logs to file
docker compose -f docker-compose.prod.yml logs server | grep -i nas > nas-logs.txt

# Save with timestamps
docker compose -f docker-compose.prod.yml logs -t server | grep -i nas > nas-logs-with-time.txt
```

---

## Common NAS Log Messages

### Successful NAS Connection:
```
✅ NAS connection validated successfully
✅ NAS mounted successfully at /mnt/nas/intrak
✅ NAS already accessible at /mnt/nas/intrak (bind mount)
🔄 Checking for local files to sync to NAS...
✅ Synced X files from local storage to NAS
```

### NAS Errors:
```
❌ NAS connection failed after 10 attempts - continuing with local storage
⚠️  NAS mount failed
⚠️  NAS not available, using local storage
⚠️  NAS path exists but not writable
```

### NAS Startup:
```
🔌 Checking NAS connection...
⏳ Waiting for NAS... (attempt X/10)
📁 Setting up NAS mount...
```

---

## Advanced Filtering

### Multiple Keywords
```bash
# Search for NAS, mount, or tailscale
docker compose -f docker-compose.prod.yml logs server | grep -iE "nas|mount|tailscale"

# Search with context (5 lines before and after)
docker compose -f docker-compose.prod.yml logs server | grep -A 5 -B 5 -i nas
```

### Exclude Certain Messages
```bash
# Show NAS logs but exclude "local storage"
docker compose -f docker-compose.prod.yml logs server | grep -i nas | grep -v "local storage"
```

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `docker compose logs server \| grep -i nas` | View NAS logs only |
| `docker compose logs -f server \| grep -i nas` | Follow NAS logs (real-time) |
| `docker compose logs --tail=100 server \| grep -i nas` | Last 100 lines, NAS only |
| `docker compose logs server \| grep -iE "nas\|mount"` | NAS and mount logs |
| `docker compose logs server \| grep -i "nas.*error"` | NAS errors only |

---

## Summary

**Pinakamadaling command para makita lang ang NAS logs:**

```bash
# View NAS logs only
docker compose -f docker-compose.prod.yml logs server | grep -i nas

# Follow NAS logs in real-time
docker compose -f docker-compose.prod.yml logs -f server | grep -i nas
```

Ito ay magpapakita lang ng logs na may "nas" sa message (case-insensitive).

