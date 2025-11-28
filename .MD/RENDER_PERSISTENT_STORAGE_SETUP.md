# Render Persistent Storage Setup Guide

## Problem
When you deploy updates to Render, uploaded files (templates, documents, profile photos) are lost because they're stored in the container's filesystem, which gets wiped on each deployment.

## Solution
The system supports two storage options:

1. **NAS Storage** (when available) - Set `USE_NAS=true` in environment variables
2. **Persistent Disk** (fallback) - Use Render's Persistent Disk feature when NAS is not available

Both options ensure files survive deployments.

---

## Step-by-Step Setup

### 1. Add Persistent Disk to Your Render Service

1. Go to your Render Dashboard
2. Select your **Web Service** (the server)
3. Go to **Settings** → Scroll down to **Persistent Disk**
4. Click **Add Persistent Disk**
5. Configure:
   - **Mount Path**: `/persistent`
   - **Size**: Start with **10GB** (you can increase later)
6. Click **Save**

### 2. Set Environment Variables

In your Render service **Environment** settings, add/update:

#### Option A: Using NAS (if available)
```env
# Storage Configuration - NAS
USE_NAS=true
NAS_PATH=/mnt/nas/intrak/documents
NAS_HOST=your-nas-host
NAS_USERNAME=your-nas-username
NAS_PASSWORD=your-nas-password
NAS_SHARE_NAME=documents
UPLOAD_PATH=./uploads  # Fallback if NAS fails
MAX_FILE_SIZE=10485760
ALLOWED_MIMETYPES=application/pdf,image/jpeg,image/png,image/jpg,application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

#### Option B: Using Persistent Disk (fallback)
```env
# Storage Configuration - Persistent Disk
USE_NAS=false
UPLOAD_PATH=/persistent/uploads
MAX_FILE_SIZE=10485760
ALLOWED_MIMETYPES=application/pdf,image/jpeg,image/png,image/jpg,application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

**Important**: 
- **If NAS is available**: Set `USE_NAS=true` and configure NAS settings
- **If NAS is not available**: Set `USE_NAS=false` and use persistent disk with `UPLOAD_PATH=/persistent/uploads`
- The system automatically uses the appropriate storage based on `USE_NAS` setting

### 3. Verify Directory Creation

The application will automatically create the necessary directories on startup:
- `/persistent/uploads/documents/` - Student documents
- `/persistent/uploads/templates/` - Document templates
- `/persistent/uploads/profile-photos/` - User profile photos
- `/persistent/uploads/temp/` - Temporary upload files

### 4. Deploy

After setting up the persistent disk and environment variables:
1. **Redeploy** your service
2. Files uploaded after this deployment will persist across future deployments

---

## Important Notes

### ⚠️ Existing Files
- Files uploaded **before** setting up persistent storage are **lost** (they were in the container filesystem)
- You'll need to **re-upload** any templates or documents that were uploaded before this setup
- This is a one-time migration

### ✅ After Setup
- All new uploads will be stored in `/persistent/uploads/`
- Files will **survive** deployments
- Files will **survive** service restarts
- Files will **perside** until you manually delete them or delete the persistent disk

### 📊 Storage Limits
- Render Persistent Disks have size limits based on your plan
- Monitor disk usage in Render dashboard
- You can increase disk size later if needed

### 🔄 Migration Path
If you have important files that need to be preserved:
1. Download them before redeploying
2. Set up persistent storage
3. Re-upload them after deployment

---

## Verification

After deployment, check the logs for:

**If using NAS:**
```
💾 Storage: NAS (/mnt/nas/intrak/documents)
```

**If using Persistent Disk:**
```
💾 Storage: Local (/persistent/uploads)
```

This confirms which storage method is active.

---

## Alternative: Cloud Storage (S3, etc.)

For production systems with large storage needs, consider using cloud storage:
- **AWS S3**
- **Google Cloud Storage**
- **Azure Blob Storage**

This requires additional code changes but provides:
- Unlimited scalability
- Better reliability
- Automatic backups
- Lower costs for large storage

See `.MD/RENDER_DEPLOYMENT_NAS.md` for cloud storage setup options.

