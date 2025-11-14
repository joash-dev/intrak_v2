# Email API Testing Guide

## 🔐 Authentication Required

All email endpoints require authentication. You need to:
1. **Login first** to get an access token
2. **Use the token** in the Authorization header

---

## 📋 Available Endpoints

### 1. Test Email Connection
**GET** `/api/email/test`
- **Auth**: Admin only
- **Purpose**: Test if SMTP connection is working

### 2. Send Test Email
**POST** `/api/email/test-send`
- **Auth**: Admin only
- **Purpose**: Send a test welcome email

### 3. Send Welcome Email (General User)
**POST** `/api/email/welcome-user`
- **Auth**: Admin, Coordinator, or Instructor
- **Purpose**: Send welcome email to any user role

### 4. Send Welcome Email (Student)
**POST** `/api/email/welcome`
- **Auth**: Admin, Coordinator, or Instructor
- **Purpose**: Send welcome email to a student

---

## 🌐 Production vs Development

### For Local Development:
- **Base URL**: `http://localhost:5000`
- Use when testing on your local machine

### For Production (Render.com):
- **Base URL**: `https://intrak-v2.onrender.com`
- Use when testing the live/production server

**Note**: Replace `http://localhost:5000` with `https://intrak-v2.onrender.com` in all examples below when testing production.

---

## 🧪 Testing Methods

### Method 1: Using cURL (Command Line)

#### Step 1: Login to Get Access Token

**For Local Development:**
```bash
# Replace with your actual credentials
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your-password"
  }'
```

**For Production:**
```bash
# Replace with your actual credentials
curl -X POST https://intrak-v2.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your-password"
  }'
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

**Save the accessToken** for the next steps.

#### Step 2: Test Email Connection

**For Local Development:**
```bash
# Replace YOUR_ACCESS_TOKEN with the token from Step 1
curl -X GET http://localhost:5000/api/email/test \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**For Production:**
```bash
# Replace YOUR_ACCESS_TOKEN with the token from Step 1
curl -X GET https://intrak-v2.onrender.com/api/email/test \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response (Success):**
```json
{
  "message": "Email service connection successful",
  "connected": true
}
```

**Expected Response (Failed):**
```json
{
  "message": "Email service connection failed",
  "connected": false
}
```

#### Step 3: Send Test Email

**For Local Development:**
```bash
# Replace YOUR_ACCESS_TOKEN and YOUR_EMAIL
curl -X POST http://localhost:5000/api/email/test-send \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@gmail.com"
  }'
```

**For Production:**
```bash
# Replace YOUR_ACCESS_TOKEN and YOUR_EMAIL
curl -X POST https://intrak-v2.onrender.com/api/email/test-send \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@gmail.com"
  }'
```

**Expected Response:**
```json
{
  "message": "Test email sent successfully",
  "emailSent": true
}
```

#### Step 4: Send Welcome Email (General User)

**For Local Development:**
```bash
curl -X POST http://localhost:5000/api/email/welcome-user \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "newuser@example.com",
    "userName": "John Doe",
    "userRole": "INSTRUCTOR",
    "temporaryPassword": "TempPass123!",
    "additionalInfo": {
      "department": "Computer Science"
    }
  }'
```

**For Production:**
```bash
curl -X POST https://intrak-v2.onrender.com/api/email/welcome-user \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "newuser@example.com",
    "userName": "John Doe",
    "userRole": "INSTRUCTOR",
    "temporaryPassword": "TempPass123!",
    "additionalInfo": {
      "department": "Computer Science"
    }
  }'
```

#### Step 5: Send Welcome Email (Student)

**For Local Development:**
```bash
curl -X POST http://localhost:5000/api/email/welcome \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentEmail": "student@example.com",
    "studentName": "Jane Student",
    "studentNumber": "22-UR-0592",
    "temporaryPassword": "TempPass123!"
  }'
```

**For Production:**
```bash
curl -X POST https://intrak-v2.onrender.com/api/email/welcome \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentEmail": "student@example.com",
    "studentName": "Jane Student",
    "studentNumber": "22-UR-0592",
    "temporaryPassword": "TempPass123!"
  }'
```

---

### Method 2: Using Postman

#### Step 1: Login Request

**For Local Development:**
1. **Method**: POST
2. **URL**: `http://localhost:5000/api/auth/login`

**For Production:**
1. **Method**: POST
2. **URL**: `https://intrak-v2.onrender.com/api/auth/login`
3. **Headers**: 
   - `Content-Type: application/json`
4. **Body** (raw JSON):
   ```json
   {
     "email": "admin@example.com",
     "password": "your-password"
   }
   ```
5. **Send** and copy the `accessToken` from response

#### Step 2: Test Email Connection

**For Local Development:**
1. **Method**: GET
2. **URL**: `http://localhost:5000/api/email/test`

**For Production:**
1. **Method**: GET
2. **URL**: `https://intrak-v2.onrender.com/api/email/test`
3. **Headers**:
   - `Authorization: Bearer YOUR_ACCESS_TOKEN`
4. **Send**

#### Step 3: Send Test Email

**For Local Development:**
1. **Method**: POST
2. **URL**: `http://localhost:5000/api/email/test-send`

**For Production:**
1. **Method**: POST
2. **URL**: `https://intrak-v2.onrender.com/api/email/test-send`
3. **Headers**:
   - `Authorization: Bearer YOUR_ACCESS_TOKEN`
   - `Content-Type: application/json`
4. **Body** (raw JSON):
   ```json
   {
     "email": "your-email@gmail.com"
   }
   ```
5. **Send**

---

### Method 3: Using Browser Console (JavaScript)

Open browser console (F12) and run:

**For Local Development:**
```javascript
const BASE_URL = 'http://localhost:5000';
```

**For Production:**
```javascript
const BASE_URL = 'https://intrak-v2.onrender.com';
```

**Then run:**
```javascript
// Step 1: Login
const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'your-password'
  })
});

const loginData = await loginResponse.json();
const accessToken = loginData.accessToken;
console.log('Access Token:', accessToken);

// Step 2: Test Email Connection
const testResponse = await fetch(`${BASE_URL}/api/email/test`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const testData = await testResponse.json();
console.log('Connection Test:', testData);

// Step 3: Send Test Email
const emailResponse = await fetch(`${BASE_URL}/api/email/test-send`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'your-email@gmail.com'
  })
});

const emailData = await emailResponse.json();
console.log('Email Send Result:', emailData);
```

---

### Method 4: Using PowerShell (Windows)

**For Local Development:**
```powershell
$BASE_URL = "http://localhost:5000"
```

**For Production:**
```powershell
$BASE_URL = "https://intrak-v2.onrender.com"
```

#### Step 1: Login

```powershell
$loginBody = @{
    email = "admin@example.com"
    password = "your-password"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $loginBody

$accessToken = $loginResponse.accessToken
Write-Host "Access Token: $accessToken"
```

#### Step 2: Test Email Connection

```powershell
$headers = @{
    Authorization = "Bearer $accessToken"
}

$testResponse = Invoke-RestMethod -Uri "$BASE_URL/api/email/test" `
    -Method GET `
    -Headers $headers

Write-Host "Connection Test: $($testResponse | ConvertTo-Json)"
```

#### Step 3: Send Test Email

```powershell
$emailBody = @{
    email = "your-email@gmail.com"
} | ConvertTo-Json

$emailResponse = Invoke-RestMethod -Uri "$BASE_URL/api/email/test-send" `
    -Method POST `
    -ContentType "application/json" `
    -Headers $headers `
    -Body $emailBody

Write-Host "Email Send Result: $($emailResponse | ConvertTo-Json)"
```

---

## 🚀 Production Testing Quick Reference

### Quick Production Test Commands

**1. Login (Production):**
```bash
curl -X POST https://intrak-v2.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}'
```

**2. Test Connection (Production):**
```bash
curl -X GET https://intrak-v2.onrender.com/api/email/test \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**3. Send Test Email (Production):**
```bash
curl -X POST https://intrak-v2.onrender.com/api/email/test-send \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com"}'
```

### Important Notes for Production:

1. **HTTPS Required**: Production uses `https://` (not `http://`)
2. **CORS**: Make sure your origin is allowed in CORS settings
3. **Environment Variables**: SMTP credentials must be set in Render environment variables
4. **Cold Start**: First request may be slower (Render free tier)
5. **Rate Limiting**: Production may have stricter rate limits

---

## 📝 Request/Response Examples

### Test Connection Request
```http
GET /api/email/test HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Test Connection Response (Success)
```json
{
  "message": "Email service connection successful",
  "connected": true
}
```

### Send Test Email Request
```http
POST /api/email/test-send HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "email": "test@example.com"
}
```

### Send Test Email Response (Success)
```json
{
  "message": "Test email sent successfully",
  "emailSent": true
}
```

### Send Welcome Email Request
```http
POST /api/email/welcome-user HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "userEmail": "newuser@example.com",
  "userName": "John Doe",
  "userRole": "INSTRUCTOR",
  "temporaryPassword": "TempPass123!",
  "additionalInfo": {
    "department": "Computer Science"
  }
}
```

### Send Welcome Email Response
```json
{
  "message": "Welcome email sent successfully",
  "emailSent": true
}
```

---

## 🔍 Troubleshooting

### 401 Unauthorized
- **Problem**: Invalid or expired token
- **Solution**: Login again to get a new token

### 403 Forbidden
- **Problem**: User doesn't have required role (needs ADMIN for test endpoints)
- **Solution**: Use an admin account

### 400 Bad Request
- **Problem**: Missing required fields
- **Solution**: Check request body includes all required fields

### 500 Internal Server Error
- **Problem**: SMTP not configured or connection failed
- **Solution**: 
  1. Check server logs for error details
  2. Verify SMTP credentials in `.env` file
  3. Test connection using `/api/email/test` endpoint

---

## ✅ Quick Test Script

Save this as `test-email.sh` (Linux/Mac) or `test-email.ps1` (Windows):

```bash
#!/bin/bash

# Configuration
# For Local: BASE_URL="http://localhost:5000"
# For Production: BASE_URL="https://intrak-v2.onrender.com"
BASE_URL="https://intrak-v2.onrender.com"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="your-password"
TEST_EMAIL="your-email@gmail.com"

# Step 1: Login
echo "🔐 Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Login failed!"
  echo $LOGIN_RESPONSE
  exit 1
fi

echo "✅ Login successful!"
echo ""

# Step 2: Test Connection
echo "📧 Testing email connection..."
TEST_RESPONSE=$(curl -s -X GET "$BASE_URL/api/email/test" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo $TEST_RESPONSE | jq .
echo ""

# Step 3: Send Test Email
echo "📨 Sending test email to $TEST_EMAIL..."
EMAIL_RESPONSE=$(curl -s -X POST "$BASE_URL/api/email/test-send" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\"}")

echo $EMAIL_RESPONSE | jq .
echo ""

echo "✅ Test complete!"
```

Make it executable and run:
```bash
chmod +x test-email.sh
./test-email.sh
```

---

## 📚 Additional Notes

- **Token Expiry**: Access tokens expire after 15 minutes (configurable via `JWT_EXPIRE`)
- **Rate Limiting**: Email endpoints may be rate-limited
- **Logs**: Check server console for detailed email sending logs
- **Email Delivery**: May take a few seconds to minutes depending on SMTP provider

