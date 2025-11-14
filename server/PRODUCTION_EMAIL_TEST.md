# Production Email API Testing - Quick Guide

## 🚀 Testing Email Service on Production (Render.com)

### Base URL
```
https://intrak-v2.onrender.com
```

---

## 📋 Quick Test Steps

### Step 1: Login to Get Token

```bash
curl -X POST https://intrak-v2.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-admin-email@example.com",
    "password": "your-password"
  }'
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "...",
  "user": { ... }
}
```

**Copy the `accessToken`** - you'll need it for the next steps.

---

### Step 2: Test Email Connection

```bash
curl -X GET https://intrak-v2.onrender.com/api/email/test \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

**Success Response:**
```json
{
  "message": "Email service connection successful",
  "connected": true
}
```

**Failed Response:**
```json
{
  "message": "Email service connection failed",
  "connected": false
}
```

---

### Step 3: Send Test Email

```bash
curl -X POST https://intrak-v2.onrender.com/api/email/test-send \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@gmail.com"
  }'
```

**Success Response:**
```json
{
  "message": "Test email sent successfully",
  "emailSent": true
}
```

---

## 🔧 Using Postman for Production

### 1. Login Request
- **Method**: `POST`
- **URL**: `https://intrak-v2.onrender.com/api/auth/login`
- **Headers**: 
  - `Content-Type: application/json`
- **Body** (raw JSON):
  ```json
  {
    "email": "admin@example.com",
    "password": "your-password"
  }
  ```
- **Save** the `accessToken` from response

### 2. Test Connection
- **Method**: `GET`
- **URL**: `https://intrak-v2.onrender.com/api/email/test`
- **Headers**:
  - `Authorization: Bearer YOUR_ACCESS_TOKEN`

### 3. Send Test Email
- **Method**: `POST`
- **URL**: `https://intrak-v2.onrender.com/api/email/test-send`
- **Headers**:
  - `Authorization: Bearer YOUR_ACCESS_TOKEN`
  - `Content-Type: application/json`
- **Body** (raw JSON):
  ```json
  {
    "email": "your-email@gmail.com"
  }
  ```

---

## 🌐 Using Browser Console (Production)

Open browser console (F12) on any page and run:

```javascript
// Production Base URL
const BASE_URL = 'https://intrak-v2.onrender.com';

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
console.log('✅ Login successful! Token:', accessToken);

// Step 2: Test Email Connection
const testResponse = await fetch(`${BASE_URL}/api/email/test`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const testData = await testResponse.json();
console.log('📧 Connection Test:', testData);

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
console.log('📨 Email Send Result:', emailData);
```

---

## ⚠️ Important Notes for Production

### 1. Environment Variables
Make sure these are set in **Render Dashboard → Environment**:
```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-brevo-smtp-user@brevo.com
SMTP_PASS=your-brevo-smtp-password
SMTP_FROM=intraksystem@gmail.com
SMTP_FROM_NAME=INTRAK System
CLIENT_URL=https://intrak-v2.onrender.com
```

### 2. CORS Configuration
If testing from browser console, make sure your origin is allowed in CORS settings.

### 3. Cold Start
- First request after inactivity may take 30-60 seconds (Render free tier)
- Subsequent requests are faster

### 4. HTTPS Only
- Production uses `https://` (secure connection)
- Never use `http://` for production

### 5. Token Expiry
- Access tokens expire after 15 minutes
- If you get 401 Unauthorized, login again to get a new token

---

## 🔍 Troubleshooting Production Issues

### Issue: 401 Unauthorized
**Solution**: 
- Token expired - login again
- Check if token is correctly included in Authorization header

### Issue: 403 Forbidden
**Solution**: 
- You need ADMIN role for test endpoints
- Use an admin account to login

### Issue: Connection Timeout
**Solution**: 
- Check if SMTP credentials are set in Render environment
- Verify SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS are correct
- Check Render logs for detailed error messages

### Issue: Email Not Received
**Solution**: 
- Check spam/junk folder
- Verify email address is correct
- Check server logs in Render dashboard
- Test connection first using `/api/email/test`

---

## 📊 Check Server Logs

In Render Dashboard:
1. Go to your service
2. Click on **Logs** tab
3. Look for:
   - `📧 Initializing SMTP transporter`
   - `✅ SMTP connection verified` or `❌ SMTP connection failed`
   - `📧 Email sent successfully` or `❌ Email sending failed`

---

## ✅ Complete Production Test Script

Save as `test-production-email.sh`:

```bash
#!/bin/bash

# Production Configuration
BASE_URL="https://intrak-v2.onrender.com"
ADMIN_EMAIL="your-admin-email@example.com"
ADMIN_PASSWORD="your-password"
TEST_EMAIL="your-test-email@gmail.com"

echo "🚀 Testing Email Service on Production..."
echo ""

# Step 1: Login
echo "🔐 Step 1: Logging in..."
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
echo "📧 Step 2: Testing email connection..."
TEST_RESPONSE=$(curl -s -X GET "$BASE_URL/api/email/test" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo $TEST_RESPONSE
echo ""

# Step 3: Send Test Email
echo "📨 Step 3: Sending test email to $TEST_EMAIL..."
EMAIL_RESPONSE=$(curl -s -X POST "$BASE_URL/api/email/test-send" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\"}")

echo $EMAIL_RESPONSE
echo ""

echo "✅ Production test complete!"
echo "Check your email inbox ($TEST_EMAIL) for the test email."
```

Make executable and run:
```bash
chmod +x test-production-email.sh
./test-production-email.sh
```

---

## 🎯 Quick Copy-Paste Commands

### All-in-One Production Test

```bash
# 1. Login and get token
TOKEN=$(curl -s -X POST https://intrak-v2.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}' \
  | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

# 2. Test connection
curl -X GET https://intrak-v2.onrender.com/api/email/test \
  -H "Authorization: Bearer $TOKEN"

# 3. Send test email
curl -X POST https://intrak-v2.onrender.com/api/email/test-send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com"}'
```

**Remember to replace:**
- `admin@example.com` with your admin email
- `your-password` with your admin password
- `your-email@gmail.com` with your test email

