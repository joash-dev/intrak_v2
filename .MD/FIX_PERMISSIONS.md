# Fix Permission Denied Errors

## Quick Fix Commands

Run these commands on your server:

```bash
cd ~/intrak_v2/server

# Fix permissions for all binaries in node_modules
chmod -R +x node_modules/.bin/

# Also fix permissions for the entire node_modules if needed
chmod -R u+w node_modules/

# Try again
npx prisma generate
npx tsc
```

## Alternative: Use npm scripts directly

```bash
cd ~/intrak_v2/server

# Use npm run which handles permissions better
npm run build
```

## If that doesn't work: Reinstall dependencies

```bash
cd ~/intrak_v2/server

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Then try again
npm run build
```

## Check filesystem mount options

If you're using a mounted filesystem (like NAS), it might have `noexec` flag:

```bash
# Check mount options
mount | grep intrak

# If you see 'noexec', you need to remount or use a different location
```

## Complete Fix Script

```bash
#!/bin/bash
cd ~/intrak_v2/server

echo "Fixing permissions..."
chmod -R +x node_modules/.bin/ 2>/dev/null || true
chmod -R u+w node_modules/ 2>/dev/null || true

echo "Generating Prisma client..."
npm run build || {
    echo "Build failed, trying direct commands..."
    node_modules/.bin/prisma generate
    node_modules/.bin/tsc
}
```

