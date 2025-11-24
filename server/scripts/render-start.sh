#!/bin/bash
set -e

echo "🚀 Starting INTRAK Server with NAS support..."

# Check if packages are installed (they should be from Dockerfile)
if ! command -v mount.cifs &> /dev/null; then
    echo "⚠️  cifs-utils not found. Attempting to install..."
    # Try to install if we have permissions (will fail gracefully if not)
    apt-get update -qq 2>/dev/null && apt-get install -y cifs-utils tailscale 2>/dev/null || {
        echo "❌ Cannot install packages. Ensure Dockerfile installs cifs-utils and tailscale."
        echo "⚠️  Continuing without NAS mount..."
        USE_NAS=false
    }
fi

# Start Tailscale if auth key is provided
if [ -n "$TAILSCALE_AUTH_KEY" ]; then
    echo "🔗 Connecting to Tailscale..."
    tailscale up --authkey="$TAILSCALE_AUTH_KEY" --accept-routes || true
    sleep 5
fi

# Create mount point
echo "📁 Setting up NAS mount..."
mkdir -p /mnt/nas/intrak

# Create credentials file
CREDS_FILE="/tmp/nas-creds"
echo "username=$NAS_USERNAME" > "$CREDS_FILE"
echo "password=$NAS_PASSWORD" >> "$CREDS_FILE"
echo "domain=WORKGROUP" >> "$CREDS_FILE"
chmod 600 "$CREDS_FILE"

# Mount NAS share
if [ "$USE_NAS" = "true" ]; then
    echo "🔌 Mounting NAS share..."
    # Try to mount (requires root/sudo permissions)
    if mount -t cifs "//$NAS_HOST/$NAS_SHARE_NAME" /mnt/nas/intrak \
        -o credentials="$CREDS_FILE",uid=1000,gid=1000,iocharset=utf8,file_mode=0777,dir_mode=0777,vers=3.0 2>/dev/null; then
        # Create directory structure
        mkdir -p /mnt/nas/intrak/documents/temp
        mkdir -p /mnt/nas/intrak/profile-photos
        mkdir -p /mnt/nas/intrak/templates
        echo "✅ NAS mounted successfully"
    else
        echo "⚠️  NAS mount failed (permission denied or connection issue)"
        echo "⚠️  Continuing with local storage..."
        echo "💡 Tip: Ensure Render is using Dockerfile for proper permissions"
        USE_NAS=false
        export USE_NAS=false
    fi
fi

# Start Node.js server
echo "🚀 Starting Node.js server..."
exec node dist/index.js

