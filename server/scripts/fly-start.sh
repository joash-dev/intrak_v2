#!/bin/bash
set -e

echo "🚀 Starting INTRAK Server with NAS support on Fly.io..."

# Check if packages are installed
NAS_AVAILABLE=true
if ! command -v mount.cifs &> /dev/null; then
    echo "⚠️  cifs-utils not found"
    NAS_AVAILABLE=false
fi

if ! command -v tailscale &> /dev/null; then
    echo "⚠️  tailscale not found"
    NAS_AVAILABLE=false
fi

if [ "$NAS_AVAILABLE" = "false" ]; then
    echo "❌ NAS packages not available. Disabling NAS support."
    export USE_NAS=false
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
    
    # Check if /dev/net/tun exists (Fly.io should provide this)
    if [ ! -e /dev/net/tun ]; then
        echo "⚠️  /dev/net/tun not available - attempting to create..."
        mkdir -p /dev/net
        if mknod /dev/net/tun c 10 200 2>/dev/null; then
            echo "✅ Created /dev/net/tun"
            chmod 666 /dev/net/tun
        else
            echo "❌ Cannot create /dev/net/tun"
            echo "💡 Fly.io should provide TUN device access with privileged mode"
            export USE_NAS=false
        fi
    else
        echo "✅ /dev/net/tun available"
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
            
            # Wait for connection to establish
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

# Create mount point
echo "📁 Setting up NAS mount..."
MOUNT_POINT="/mnt/nas/intrak"
mkdir -p "$MOUNT_POINT"

# Create credentials file
CREDS_FILE="/tmp/nas-creds"
echo "username=$NAS_USERNAME" > "$CREDS_FILE"
echo "password=$NAS_PASSWORD" >> "$CREDS_FILE"
echo "domain=WORKGROUP" >> "$CREDS_FILE"
chmod 600 "$CREDS_FILE"

# Check if NAS is already mounted (via bind mount from host)
if [ "$USE_NAS" = "true" ]; then
    # Check if NAS path is already accessible (bind mount from host)
    if [ -d "$MOUNT_POINT" ] && [ -w "$MOUNT_POINT" ]; then
        # Test write access
        if touch "$MOUNT_POINT/.test_write" 2>/dev/null && rm -f "$MOUNT_POINT/.test_write" 2>/dev/null; then
            echo "✅ NAS already accessible at $MOUNT_POINT (bind mount)"
            export NAS_PATH="$MOUNT_POINT"
            # Create directory structure if needed
            mkdir -p "$MOUNT_POINT/documents/temp"
            mkdir -p "$MOUNT_POINT/profile-photos"
            mkdir -p "$MOUNT_POINT/templates"
        else
            echo "⚠️  NAS path exists but not writable"
            if [ "$NAS_AVAILABLE" = "true" ]; then
                echo "🔌 Attempting to mount NAS share..."
                if mount -t cifs "//$NAS_HOST/$NAS_SHARE_NAME" "$MOUNT_POINT" \
                    -o credentials="$CREDS_FILE",uid=1000,gid=1000,file_mode=0777,dir_mode=0777,vers=3.0 2>/dev/null; then
                    mkdir -p "$MOUNT_POINT/documents/temp"
                    mkdir -p "$MOUNT_POINT/profile-photos"
                    mkdir -p "$MOUNT_POINT/templates"
                    echo "✅ NAS mounted successfully at $MOUNT_POINT"
                    export NAS_PATH="$MOUNT_POINT"
                else
                    echo "⚠️  NAS mount failed"
                    echo "⚠️  Continuing with local storage..."
                    export USE_NAS=false
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
        fi
    elif [ "$NAS_AVAILABLE" = "true" ]; then
        # Path doesn't exist, try to mount
        echo "🔌 Mounting NAS share..."
        if mount -t cifs "//$NAS_HOST/$NAS_SHARE_NAME" "$MOUNT_POINT" \
            -o credentials="$CREDS_FILE",uid=1000,gid=1000,file_mode=0777,dir_mode=0777,vers=3.0 2>/dev/null; then
            mkdir -p "$MOUNT_POINT/documents/temp"
            mkdir -p "$MOUNT_POINT/profile-photos"
            mkdir -p "$MOUNT_POINT/templates"
            echo "✅ NAS mounted successfully at $MOUNT_POINT"
            export NAS_PATH="$MOUNT_POINT"
        else
            echo "⚠️  NAS mount failed"
            echo "⚠️  Continuing with local storage..."
            export USE_NAS=false
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
else
    echo "⚠️  NAS not enabled, using local storage"
    export USE_NAS=false
    mkdir -p ./uploads/documents/temp
    mkdir -p ./uploads/profile-photos
    mkdir -p ./uploads/templates
fi

# Start Node.js server
echo "🚀 Starting Node.js server..."
exec node dist/src/index.js


