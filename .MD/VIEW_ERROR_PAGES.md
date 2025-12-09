# How to View Error Pages

## Method 1: Direct URL Navigation (Easiest)

After building and running your application, you can directly navigate to error pages:

### Local Development:
```
http://localhost:5173/error/404
http://localhost:5173/error/500
http://localhost:5173/error/502
http://localhost:5173/error/503
http://localhost:5173/error/504
```

### Production:
```
https://intrak.site/error/404
https://intrak.site/error/500
https://intrak.site/error/502
https://intrak.site/error/503
https://intrak.site/error/504
```

## Method 2: Trigger Errors

### Test 404 (Page Not Found):
- Navigate to any non-existent route:
  - `http://localhost:5173/this-page-does-not-exist`
  - `http://localhost:5173/student/invalid-page`

### Test 502/503/504 (Server Errors):
- These will automatically show when:
  - Backend server is down
  - Backend server is overloaded
  - Network timeout occurs
  - API calls fail with these status codes

## Method 3: Build and Run Locally

```bash
# 1. Navigate to client directory
cd client

# 2. Install dependencies (if not done)
npm install

# 3. Start development server
npm run dev

# 4. Open browser to:
# http://localhost:5173/error/404
# http://localhost:5173/error/502
# etc.
```

## Method 4: Test in Production

After deploying:

1. **Build the frontend:**
   ```bash
   cd ~/intrak_v2/client
   npm run build
   ```

2. **Rebuild Docker containers:**
   ```bash
   cd ~/intrak_v2
   docker-compose -f docker-compose.prod.yml build --no-cache client
   docker-compose -f docker-compose.prod.yml up -d client
   ```

3. **Visit error pages:**
   - `https://intrak.site/error/404`
   - `https://intrak.site/error/502`
   - etc.

## Method 5: Simulate Errors (For Testing)

You can temporarily modify the code to force errors:

### In `client/src/App.tsx`, add a test route:
```typescript
<Route path="/test-error/:code" element={<ErrorPage />} />
```

Then visit:
- `/test-error/404`
- `/test-error/502`
- etc.

## Quick Preview Commands

```bash
# Start dev server
cd client && npm run dev

# Then open these URLs in your browser:
# http://localhost:5173/error/404
# http://localhost:5173/error/500
# http://localhost:5173/error/502
# http://localhost:5173/error/503
# http://localhost:5173/error/504
```

## What You'll See

Each error page includes:
- ✅ Large error code (404, 502, etc.)
- ✅ Error title and description
- ✅ Color-coded design (purple, red, orange, yellow, blue)
- ✅ Helpful suggestions
- ✅ Action buttons (Go Back, Refresh, Go Home)
- ✅ Dark mode support
- ✅ Responsive design

