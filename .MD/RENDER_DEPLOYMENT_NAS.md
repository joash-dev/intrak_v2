# NAS Setup for Render.com Deployment

When deploying to Render.com, you have several options for file storage since Render doesn't support direct network drive mounting like Windows.

## Your Setup:
- **Client:** Render (Static Site)
- **Server:** Render (Web Service)
- **Database:** Render PostgreSQL
- **File Storage:** ❓ Need to decide

---

## Option 1: Render Persistent Disk (Recommended for Small Scale)

Render offers persistent disk storage that survives deployments.

### Setup Steps:

#### 1. Add Persistent Disk to Your Service

In Render dashboard:
1. Go to your Web Service
2. Settings → **Persistent Disk**
3. Add a persistent disk (e.g., `/persistent`)
4. Set size (minimum 1GB)

#### 2. Configure Environment Variables

In Render dashboard → Environment:
```env
USE_NAS=false
UPLOAD_PATH=/persistent/uploads
MAX_FILE_SIZE=10485760
ALLOWED_MIMETYPES=application/pdf,image/jpeg,image/png,image/jpg
```

#### 3. Update Application Code

The application will use local storage on the persistent disk. No code changes needed if `USE_NAS=false`.

**Pros:**
- ✅ Simple setup
- ✅ Files persist across deployments
- ✅ No external dependencies

**Cons:**
- ❌ Limited to Render's disk size
- ❌ Not shared across multiple instances
- ❌ No automatic backups
- ❌ Can be expensive for large storage

---

## Option 2: Cloud Storage (AWS S3, Google Cloud Storage, etc.) - Recommended

Use cloud object storage instead of NAS. This is the **best practice** for cloud deployments.

### Setup with AWS S3:

#### 1. Create S3 Bucket
- Go to AWS Console → S3
- Create bucket (e.g., `intrak-documents`)
- Configure CORS and permissions

#### 2. Install AWS SDK
```bash
cd server
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

#### 3. Create S3 Service
Create `server/src/services/s3Storage.ts`:
```typescript
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

export const uploadToS3 = async (filePath: string, key: string, contentType: string): Promise<string> => {
  const fileContent = fs.readFileSync(filePath);
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileContent,
    ContentType: contentType,
  });
  
  await s3Client.send(command);
  return key;
};

export const getS3Url = async (key: string, expiresIn: number = 3600): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  
  return await getSignedUrl(s3Client, command, { expiresIn });
};

export const deleteFromS3 = async (key: string): Promise<void> => {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  
  await s3Client.send(command);
};
```

#### 4. Update Document Controller
Modify `server/src/controllers/document.controller.ts` to use S3 instead of local storage.

#### 5. Configure Environment Variables
```env
USE_NAS=false
UPLOAD_PATH=./uploads  # Temporary only
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET_NAME=intrak-documents
```

**Pros:**
- ✅ Scalable (unlimited storage)
- ✅ Highly available
- ✅ Automatic backups
- ✅ CDN integration possible
- ✅ Cost-effective for large storage
- ✅ Works with multiple server instances

**Cons:**
- ❌ Requires code changes
- ❌ Additional AWS account needed
- ❌ Slight complexity increase

---

## Option 3: NAS via Tailscale (Complex, Not Recommended)

You *could* connect to your NAS via Tailscale, but it's complex and not ideal for production.

### Why It's Problematic:
1. **Render uses Linux containers** - Need CIFS mount
2. **Ephemeral containers** - Mounts don't persist
3. **Network latency** - Remote NAS adds delay
4. **Reliability** - Network issues affect service
5. **Security** - Exposing NAS to cloud

### If You Still Want to Try:

#### 1. Install Tailscale in Render
Add to your `Dockerfile` or build command:
```dockerfile
# Install Tailscale and CIFS
RUN apt-get update && \
    apt-get install -y tailscale cifs-utils && \
    rm -rf /var/lib/apt/lists/*
```

#### 2. Mount Script
Create startup script that mounts NAS:
```bash
#!/bin/bash
# Mount NAS on startup
tailscale up --authkey=$TAILSCALE_AUTH_KEY
mkdir -p /mnt/nas
mount -t cifs //100.121.34.91/Serber /mnt/nas \
  -o username=$NAS_USERNAME,password=$NAS_PASSWORD,uid=1000,gid=1000
```

#### 3. Environment Variables
```env
USE_NAS=true
NAS_PATH=/mnt/nas/intrak
NAS_HOST=100.121.34.91
NAS_USERNAME=your_username
NAS_PASSWORD=your_password
NAS_SHARE_NAME=Serber
TAILSCALE_AUTH_KEY=your_auth_key
```

**⚠️ Not Recommended Because:**
- Containers restart frequently
- Mounts may fail
- Network latency issues
- Complex error handling needed

---

## Option 4: Hybrid Approach (Best of Both Worlds)

Use **cloud storage for production** (Render) and **NAS for local development**.

### Setup:

#### Development (Local Windows):
```env
# .env.development
USE_NAS=true
NAS_PATH=Z:\intrak
NAS_HOST=100.121.34.91
NAS_USERNAME=dev_user
NAS_PASSWORD=dev_pass
NAS_SHARE_NAME=Serber
```

#### Production (Render):
```env
# .env.production (in Render)
USE_NAS=false
UPLOAD_PATH=/persistent/uploads
# OR use S3
AWS_S3_BUCKET_NAME=intrak-documents-prod
```

The application code already handles both scenarios via `getStoragePath()` function!

---

## Recommended Setup for Render

### For Small Projects (< 10GB storage):
**Use Render Persistent Disk**
- Simple
- No code changes
- Files persist

### For Production/Large Scale:
**Use AWS S3 (or similar)**
- Scalable
- Reliable
- Cost-effective
- Industry standard

---

## Step-by-Step: Render Persistent Disk Setup

### 1. Add Persistent Disk
1. Go to Render Dashboard
2. Select your Web Service
3. Settings → **Persistent Disk**
4. Click **Add Persistent Disk**
5. Mount Path: `/persistent`
6. Size: Start with 10GB (can increase later)

### 2. Create Directory Structure
Add to your server startup (in `server/src/index.ts`):
```typescript
import fs from 'fs';
import path from 'path';

// Ensure upload directories exist
const uploadDirs = [
  '/persistent/uploads/documents',
  '/persistent/uploads/profile-photos',
  '/persistent/uploads/templates',
  '/persistent/uploads/temp',
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});
```

### 3. Set Environment Variables in Render
```env
NODE_ENV=production
USE_NAS=false
UPLOAD_PATH=/persistent/uploads
MAX_FILE_SIZE=10485760
ALLOWED_MIMETYPES=application/pdf,image/jpeg,image/png,image/jpg
```

### 4. Update Static File Serving
In `server/src/index.ts`, update the static file path:
```typescript
// Static files (uploaded documents)
app.use('/uploads', express.static('/persistent/uploads'));
```

---

## Step-by-Step: AWS S3 Setup (Recommended)

### 1. Create S3 Bucket
1. AWS Console → S3
2. Create bucket: `intrak-documents-prod`
3. Region: Choose closest to Render
4. Block public access: ✅ Enabled (for security)
5. Versioning: ✅ Enabled (for backups)

### 2. Create IAM User
1. AWS Console → IAM
2. Create user: `intrak-render-user`
3. Attach policy: `AmazonS3FullAccess` (or custom policy)
4. Create access keys
5. Save credentials securely

### 3. Install Dependencies
Add to `server/package.json`:
```json
{
  "dependencies": {
    "@aws-sdk/client-s3": "^3.0.0",
    "@aws-sdk/s3-request-presigner": "^3.0.0"
  }
}
```

### 4. Create S3 Storage Service
(Code example provided in Option 2 above)

### 5. Update Document Controller
Modify upload/download logic to use S3 instead of local filesystem.

### 6. Set Environment Variables in Render
```env
USE_NAS=false
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET_NAME=intrak-documents-prod
```

---

## Cost Comparison

### Render Persistent Disk:
- **$0.25/GB/month**
- Example: 50GB = $12.50/month
- Limited scalability

### AWS S3:
- **$0.023/GB/month** (Standard)
- Example: 50GB = $1.15/month
- Plus transfer costs
- Highly scalable

**S3 is significantly cheaper for larger storage!**

---

## Migration Path

### Phase 1: Development
- Use NAS locally (your current setup)
- Test with Render Persistent Disk

### Phase 2: Production
- Migrate to AWS S3
- Keep NAS for local development
- Use environment variables to switch

---

## Quick Decision Guide

**Choose Render Persistent Disk if:**
- ✅ Small project (< 10GB)
- ✅ Simple setup preferred
- ✅ Budget allows ($0.25/GB)

**Choose AWS S3 if:**
- ✅ Production deployment
- ✅ Need scalability
- ✅ Want cost efficiency
- ✅ Need automatic backups
- ✅ Multiple server instances

**Don't use NAS with Render if:**
- ❌ You want reliability
- ❌ You need scalability
- ❌ You want simple setup

---

## Next Steps

1. **Decide on storage solution** (S3 recommended)
2. **Set up storage** (S3 bucket or Render disk)
3. **Update code** (if using S3)
4. **Configure environment variables** in Render
5. **Test file uploads**
6. **Monitor storage usage**

---

## Support

For Render-specific issues:
- Render Docs: https://render.com/docs
- Render Community: https://community.render.com

For AWS S3 setup:
- AWS S3 Docs: https://docs.aws.amazon.com/s3/
- AWS Free Tier: 5GB free for 12 months

