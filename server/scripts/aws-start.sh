#!/bin/bash
set -e

echo "🚀 Starting INTRAK Server (AWS EC2)..."

# ===========================================
# 1. Setup storage directories
# ===========================================
UPLOAD_PATH="${UPLOAD_PATH:-/app/uploads}"

echo "💾 Checking storage at $UPLOAD_PATH..."

if [ -d "$UPLOAD_PATH" ] && [ -w "$UPLOAD_PATH" ]; then
    # Test if this is a real NAS mount or just an empty directory
    if touch "$UPLOAD_PATH/.health_check" 2>/dev/null && rm -f "$UPLOAD_PATH/.health_check" 2>/dev/null; then
        echo "✅ Storage is writable at $UPLOAD_PATH"
        
        # Check if it's a mount point (NAS) or local directory
        if mountpoint -q "$UPLOAD_PATH" 2>/dev/null || mountpoint -q "/mnt/nas" 2>/dev/null; then
            echo "📡 NAS storage detected (mounted from host)"
        else
            echo "📁 Using local storage (NAS not mounted on host)"
            # If USE_NAS is true but no NAS is mounted, fall back
            if [ "$USE_NAS" = "true" ]; then
                echo "⚠️  USE_NAS=true but NAS is not mounted. Falling back to local storage."
                export USE_NAS=false
            fi
        fi
    else
        echo "⚠️  Storage path exists but is not writable. Falling back."
        export USE_NAS=false
    fi
else
    echo "⚠️  Storage path not found. Creating local directories..."
    mkdir -p "$UPLOAD_PATH"
    export USE_NAS=false
fi

# Create required subdirectories
mkdir -p "$UPLOAD_PATH/documents/temp"
mkdir -p "$UPLOAD_PATH/profile-photos"
mkdir -p "$UPLOAD_PATH/templates"
echo "✅ Upload directories ready"

# ===========================================
# 2. Database migrations
# ===========================================
echo "🗄️  Running database migrations..."
npx prisma migrate deploy || echo "⚠️  Migration failed or already applied"

# ===========================================
# 3. Start the server
# ===========================================
echo "🚀 Starting Node.js server..."
echo "   PORT: ${PORT:-5000}"
echo "   NODE_ENV: ${NODE_ENV:-production}"
echo "   USE_NAS: ${USE_NAS:-false}"
exec node dist/src/index.js
