# Tailscale TUN Device Setup for Render.com

## Issue

Tailscale requires access to `/dev/net/tun` (TUN device) to create VPN tunnels. Render.com's Docker containers may not have this access by default.

## Error Message

If you see this error:
```
wgengine.NewUserspaceEngine(tun "tailscale0") error: tstun.New("tailscale0"): CreateTUN("tailscale0") failed; /dev/net/tun does not exist
```

This means the container needs TUN device access.

## Solution

### Option 1: Contact Render Support (Recommended)

1. Go to Render Dashboard → Your Service → Settings
2. Contact Render Support and request:
   - Enable TUN device access for your Docker container
   - Add Docker run flags: `--cap-add=NET_ADMIN --device=/dev/net/tun`

**Message Template:**
```
Hi Render Support,

I'm deploying a Docker container that needs to run Tailscale VPN to connect to a NAS. 
The container requires TUN device access to function properly.

Could you please enable the following Docker capabilities for my service:
- --cap-add=NET_ADMIN
- --device=/dev/net/tun

Service Name: [your-service-name]
Service ID: [your-service-id]

This is required for my thesis project which uses NAS storage via Tailscale VPN.

Thank you!
```

### Option 2: Use Render.yaml (If Supported)

If Render supports custom Docker run options via `render.yaml`, add:

```yaml
services:
  - type: web
    name: intrak-server
    dockerOptions:
      capAdd:
        - NET_ADMIN
      devices:
        - /dev/net/tun:/dev/net/tun
```

### Option 3: Alternative - Direct SMB Connection (If NAS has Public IP)

If your NAS is accessible via public IP (not recommended for security), you can skip Tailscale:

```env
USE_NAS=true
NAS_HOST=[public-ip-or-domain]
NAS_USERNAME=your_username
NAS_PASSWORD=your_password
NAS_SHARE_NAME=Serber
# Don't set TAILSCALE_AUTH_KEY
```

**⚠️ Warning:** This exposes your NAS to the internet. Only use if you have strong firewall rules.

### Option 4: Use Local Storage (Temporary)

For development/testing, you can use local storage:

```env
USE_NAS=false
UPLOAD_PATH=./uploads
```

Files will be stored locally in the container (will be lost on redeploy unless using persistent disk).

## Current Status

The application will automatically:
- ✅ Detect if TUN device is available
- ✅ Try to create TUN device if missing (may fail without proper permissions)
- ✅ Fall back to local storage if Tailscale/NAS is unavailable
- ✅ Continue running even if NAS connection fails

## Verification

After Render enables TUN access, check logs for:
```
✅ Created /dev/net/tun
✅ tailscaled socket ready
✅ Tailscale connected successfully
📍 Tailscale IP: 100.x.x.x
✅ NAS mounted successfully
```

## Next Steps

1. Contact Render support to enable TUN device access
2. Redeploy your service
3. Check logs to verify Tailscale and NAS connection


