#!/bin/bash
set -e

echo "🚀 Starting INTRAK Server with NAS support..."

# Check if packages are installed (they should be from Dockerfile)
NAS_AVAILABLE=true
if ! command -v mount.cifs &> /dev/null; then
    echo "⚠️  cifs-utils not found. Dockerfile may not be in use."
    echo "⚠️  Render is using native Node.js build instead of Docker."
    NAS_AVAILABLE=false
fi

if ! command -v tailscale &> /dev/null; then
    echo "⚠️  tailscale not found."
    NAS_AVAILABLE=false
fi

if [ "$NAS_AVAILABLE" = "false" ]; then
    echo "❌ NAS packages not available. Disabling NAS support."
    echo "💡 To enable NAS: Configure Render to use Dockerfile (see instructions)"
    export USE_NAS=false
    # Create local uploads directory instead
    mkdir -p ./uploads/documents/temp
    mkdir -p ./uploads/profile-photos
    mkdir -p ./uploads/templates
    echo "✅ Using local storage: ./uploads"
    echo "🚀 Starting Node.js server..."
    exec node dist/src/index.js
    exit 0
fi

# Start Tailscale if auth key is provided
if [ -n "$TAILSCALE_AUTH_KEY" ]; then
    echo "🔗 Starting Tailscale daemon..."
    
    # Create necessary directories for tailscaled
    mkdir -p /var/lib/tailscale
    mkdir -p /var/run/tailscale
    
    # Check if /dev/net/tun exists (required for TUN mode)
    if [ ! -e /dev/net/tun ]; then
        echo "⚠️  /dev/net/tun not available"
        echo "💡 Attempting to create TUN device..."
        # Try to create /dev/net/tun (requires mknod capability)
        mkdir -p /dev/net
        if mknod /dev/net/tun c 10 200 2>/dev/null; then
            echo "✅ Created /dev/net/tun"
            chmod 666 /dev/net/tun
        else
            echo "❌ Cannot create /dev/net/tun - TUN device access required"
            echo "💡 Render.com Docker containers need TUN device access for Tailscale"
            echo "💡 Contact Render support to enable: --cap-add=NET_ADMIN --device=/dev/net/tun"
            echo "⚠️  Continuing without Tailscale/NAS - using local storage"
            export USE_NAS=false
        fi
    fi
    
    if [ "$USE_NAS" != "false" ]; then
        # Start tailscaled in the background
        echo "⏳ Starting tailscaled..."
        tailscaled --state=/var/lib/tailscale/tailscaled.state \
                   --socket=/var/run/tailscale/tailscaled.sock 2>&1 &
        TAILSCALED_PID=$!
        
        # Wait for tailscaled to start
        echo "⏳ Waiting for tailscaled to initialize..."
        for i in {1..15}; do
            if [ -S /var/run/tailscale/tailscaled.sock ] 2>/dev/null; then
                echo "✅ tailscaled socket ready"
                break
            fi
            if [ $i -eq 15 ]; then
                echo "⚠️  tailscaled failed to start after 15 seconds"
                echo "💡 This usually means TUN device access is not available"
                export USE_NAS=false
                break
            fi
            sleep 1
        done
        
        if [ "$USE_NAS" != "false" ]; then
            echo "🔗 Connecting to Tailscale network..."
            tailscale up --authkey="$TAILSCALE_AUTH_KEY" \
                        --accept-routes \
                        --advertise-exit-node=false \
                        --reset 2>&1 || {
                echo "⚠️  Tailscale connection failed"
                export USE_NAS=false
            }
            
            # Wait a bit for connection to establish
            sleep 5
            
            # Check if Tailscale is connected
            if tailscale status &>/dev/null 2>&1; then
                echo "✅ Tailscale connected successfully"
                TS_IP=$(tailscale ip -4 2>/dev/null || echo "unknown")
                echo "📍 Tailscale IP: $TS_IP"
            else
                echo "⚠️  Tailscale status check failed - continuing without NAS"
                export USE_NAS=false
            fi
        fi
    fi
fi

# Create mount point (try in user-writable location first)
echo "📁 Setting up NAS mount..."
MOUNT_POINT="/mnt/nas/intrak"
if [ ! -w "/mnt" ]; then
    # Try alternative location if /mnt is not writable
    MOUNT_POINT="/tmp/nas/intrak"
    echo "⚠️  /mnt not writable, using $MOUNT_POINT instead"
fi
mkdir -p "$MOUNT_POINT"

# Create credentials file
CREDS_FILE="/tmp/nas-creds"
echo "username=$NAS_USERNAME" > "$CREDS_FILE"
echo "password=$NAS_PASSWORD" >> "$CREDS_FILE"
echo "domain=WORKGROUP" >> "$CREDS_FILE"
chmod 600 "$CREDS_FILE"

# Mount NAS share
if [ "$USE_NAS" = "true" ] && [ "$NAS_AVAILABLE" = "true" ]; then
    echo "🔌 Mounting NAS share..."
    # Try to mount (requires root/sudo permissions)
    if mount -t cifs "//$NAS_HOST/$NAS_SHARE_NAME" "$MOUNT_POINT" \
        -o credentials="$CREDS_FILE",uid=1000,gid=1000,iocharset=utf8,file_mode=0777,dir_mode=0777,vers=3.0 2>/dev/null; then
        # Create directory structure
        mkdir -p "$MOUNT_POINT/documents/temp"
        mkdir -p "$MOUNT_POINT/profile-photos"
        mkdir -p "$MOUNT_POINT/templates"
        echo "✅ NAS mounted successfully at $MOUNT_POINT"
        # Update NAS_PATH if using alternative location
        if [ "$MOUNT_POINT" != "/mnt/nas/intrak" ]; then
            export NAS_PATH="$MOUNT_POINT"
        fi
    else
        echo "⚠️  NAS mount failed (permission denied or connection issue)"
        echo "⚠️  Continuing with local storage..."
        echo "💡 Tip: Configure Render to use Dockerfile for proper permissions"
        export USE_NAS=false
        # Create local uploads directory
        mkdir -p ./uploads/documents/temp
        mkdir -p ./uploads/profile-photos
        mkdir -p ./uploads/templates
    fi
else
    echo "⚠️  NAS not available, using local storage"
    export USE_NAS=false
    mkdir -p ./uploads/documents/temp
    mkdir -p ./uploads/profile-photos
    mkdir -p ./uploads/templates
fi

# Generate Prisma Client if not already generated (safety check)
if [ ! -d "node_modules/.prisma/client" ]; then
    echo "📦 Generating Prisma Client..."
    npx prisma generate
fi

# Run database migrations (add this)
echo "🗄️  Running database migrations..."
npx prisma migrate deploy || echo "⚠️  Migration failed or already applied"

# Start Node.js server
echo "🚀 Starting Node.js server..."
exec node dist/src/index.js

