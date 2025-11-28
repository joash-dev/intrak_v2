# Fly.io Deployment Guide for INTRAK

This guide will help you deploy INTRAK to Fly.io with NAS support via Tailscale.

## Prerequisites

1. **Fly.io Account**: Sign up at [fly.io](https://fly.io)
2. **Fly CLI**: Install the Fly CLI
   ```bash
   # Windows (PowerShell)
   iwr https://fly.io/install.ps1 -useb | iex
   
   # Mac/Linux
   curl -L https://fly.io/install.sh | sh
   ```
3. **GitHub Repository**: Your code should be on GitHub

## Step 1: Login to Fly.io

```bash
fly auth login
```

## Step 2: Initialize Fly.io App

Navigate to the server directory:

```bash
cd server
fly launch
```

When prompted:
- **App name**: `intrak-server` (or your preferred name)
- **Region**: Choose closest to your NAS (e.g., `sin` for Singapore)
- **PostgreSQL**: Choose "No" (you'll use your own database)
- **Redis**: Choose "No" (optional)

## Step 3: Configure Environment Variables

Set all your environment variables:

```bash
# Database
fly secrets set DATABASE_URL="your-postgresql-connection-string"

# JWT
fly secrets set JWT_SECRET="your-jwt-secret"
fly secrets set JWT_REFRESH_SECRET="your-refresh-secret"

# CORS
fly secrets set CORS_ORIGIN="https://your-client-domain.fly.dev"

# NAS Configuration
fly secrets set USE_NAS="true"
fly secrets set NAS_PATH="/mnt/nas/intrak"
fly secrets set NAS_HOST="100.121.34.91"
fly secrets set NAS_USERNAME="don"
fly secrets set NAS_PASSWORD="brandongani725"
fly secrets set NAS_SHARE_NAME="Serber"

# Tailscale
fly secrets set TAILSCALE_AUTH_KEY="tskey-auth-khnGPGtJt211CNTRL-TAvCTQnv4FYp5AREYwjsFYCfea4c68VK"

# Add any other environment variables you need
```

## Step 4: Enable Privileged Mode (For TUN Device)

Fly.io needs privileged mode to access TUN devices for Tailscale. Update `fly.toml`:

```toml
[vm]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 512

# Add this section for TUN device access
[[vm.mounts]]
  source = "data"
  destination = "/data"
```

Actually, Fly.io provides TUN device access by default in Docker containers. If you still have issues, you can try:

```bash
# Scale to a machine with more capabilities
fly scale vm shared-cpu-1x --memory 512
```

## Step 5: Update Dockerfile CMD

The Dockerfile should use `fly-start.sh`. It's already configured, but verify:

```dockerfile
CMD ["bash", "scripts/fly-start.sh"]
```

## Step 6: Deploy

```bash
fly deploy
```

Watch the logs:
```bash
fly logs
```

## Step 7: Verify Deployment

Check if everything is working:

```bash
# Check app status
fly status

# Check logs for Tailscale connection
fly logs | grep -i tailscale

# Check if NAS is mounted
fly ssh console -C "ls -la /mnt/nas/intrak"
```

## Step 8: Set Up Health Check

The `fly.toml` already includes a health check endpoint. Make sure your app has a `/health` route:

```typescript
// In your server code
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

## Troubleshooting

### Tailscale Not Connecting

1. **Check TUN device**:
   ```bash
   fly ssh console -C "ls -la /dev/net/tun"
   ```

2. **Check Tailscale logs**:
   ```bash
   fly logs | grep -i tailscale
   ```

3. **Verify auth key**:
   ```bash
   fly secrets list | grep TAILSCALE
   ```

### NAS Mount Failing

1. **Check Tailscale connection first**:
   ```bash
   fly ssh console -C "tailscale status"
   ```

2. **Test NAS connectivity**:
   ```bash
   fly ssh console -C "ping -c 3 100.121.34.91"
   ```

3. **Check mount**:
   ```bash
   fly ssh console -C "mount | grep nas"
   ```

### Database Connection Issues

1. **Verify DATABASE_URL**:
   ```bash
   fly secrets list | grep DATABASE
   ```

2. **Test connection**:
   ```bash
   fly ssh console -C "node -e \"require('pg').Client({connectionString: process.env.DATABASE_URL}).connect().then(() => console.log('OK')).catch(e => console.error(e))\""
   ```

## Scaling

Scale your app:

```bash
# Scale to 2 instances
fly scale count 2

# Scale memory
fly scale memory 1024

# Scale CPU
fly scale vm shared-cpu-2x
```

## Monitoring

```bash
# View metrics
fly metrics

# View logs in real-time
fly logs

# SSH into container
fly ssh console
```

## Cost Estimation

Fly.io pricing (as of 2024):
- **Free tier**: 3 shared-cpu-256mb VMs
- **Paid**: ~$1.94/month per shared-cpu-256mb VM
- **Your setup**: 1 shared-cpu-512mb = ~$3-4/month

## Next Steps

1. Deploy your client to Fly.io or another static hosting
2. Update CORS_ORIGIN to your client URL
3. Set up custom domain (optional)
4. Configure backups for your database

## Support

- Fly.io Docs: https://fly.io/docs
- Fly.io Community: https://community.fly.io
- Your app dashboard: https://fly.io/apps/intrak-server


