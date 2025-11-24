#!/bin/bash
set -e

echo "🚀 Starting INTRAK Server with NAS support..."

# Install required packages
echo "📦 Installing system packages..."
apt-get update -qq
apt-get install -y cifs-utils tailscale > /dev/null 2>&1

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
    mount -t cifs "//$NAS_HOST/$NAS_SHARE_NAME" /mnt/nas/intrak \
        -o credentials="$CREDS_FILE",uid=1000,gid=1000,iocharset=utf8,file_mode=0777,dir_mode=0777,vers=3.0 || {
        echo "⚠️  NAS mount failed, continuing with local storage..."
        USE_NAS=false
    }
    
    if [ "$USE_NAS" = "true" ]; then
        # Create directory structure
        mkdir -p /mnt/nas/intrak/documents/temp
        mkdir -p /mnt/nas/intrak/profile-photos
        mkdir -p /mnt/nas/intrak/templates
        echo "✅ NAS mounted successfully"
    fi
fi

# Start Node.js server
echo "🚀 Starting Node.js server..."
exec node dist/index.js

