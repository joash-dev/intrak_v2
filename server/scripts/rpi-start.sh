#!/bin/bash
set -e

echo "🚀 Starting INTRAK Server (RPi Docker Mode)..."

# Ensure upload directories exist
mkdir -p ./uploads/documents/temp
mkdir -p ./uploads/profile-photos
mkdir -p ./uploads/templates

# Validated NAS connection (via Docker Volume)
if [ "$USE_NAS" = "true" ]; then
    echo "💾 Checking NAS mount..."
    if [ -d "$NAS_PATH" ] && [ -w "$NAS_PATH" ]; then
        echo "✅ NAS volume is accessible at $NAS_PATH"
        # Create directory structure on NAS if needed
        mkdir -p "$NAS_PATH/documents/temp"
        mkdir -p "$NAS_PATH/profile-photos"
        mkdir -p "$NAS_PATH/templates"
    else
        echo "⚠️  NAS path ($NAS_PATH) not found or not writable."
        echo "⚠️  Falling back to local storage."
        export USE_NAS=false
    fi
else
    echo "💾 Using local storage."
fi

# Run database migrations
echo "🗄️  Running database migrations..."
# validation for db connection is handled inside the app, but migration needs it too
npx prisma migrate deploy

# Start the server
echo "🚀 Starting Node.js server..."
exec node dist/src/index.js
