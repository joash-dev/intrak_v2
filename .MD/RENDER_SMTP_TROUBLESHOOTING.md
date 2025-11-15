# Render.com SMTP Connection Troubleshooting

## ❌ Connection Timeout Error

If you're seeing this error on Render:
```
❌ SMTP connection failed: Error: Connection timeout
code: 'ETIMEDOUT'
```

## 🔍 Common Causes

### 1. Port 465 (SSL) is Blocked
**Solution**: Use port 587 (TLS) instead

```env
SMTP_PORT=587  # ✅ Use this
# SMTP_PORT=465  # ❌ Don't use this on Render
```

### 2. Render Blocks Outbound SMTP
Render.com's free tier often blocks outbound SMTP connections.

**Solutions:**

#### Option A: Use Port 587 with TLS
```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-email@brevo.com
SMTP_PASS=your-password
```

#### Option B: Use Gmail SMTP (More Reliable)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Generate from Google Account
```

#### Option C: Use SendGrid API (Recommended for Production)
Instead of SMTP, use SendGrid's Web API which doesn't require SMTP ports.

#### Option D: Use Mailgun API
Similar to SendGrid, Mailgun offers API-based email sending.

## ✅ Quick Fixes

### 1. Verify Environment Variables in Render

Go to Render Dashboard → Your Service → Environment

Make sure these are set:
```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-email@brevo.com
SMTP_PASS=your-password
SMTP_FROM=intraksystem@gmail.com
```

### 2. Check Render Logs

1. Go to Render Dashboard
2. Click on your service
3. Go to **Logs** tab
4. Look for:
   - `📧 Initializing SMTP transporter`
   - `❌ SMTP connection failed`
   - Connection timeout errors

### 3. Test Connection

Use the test endpoint:
```bash
GET /api/email/test
```

## 🔧 Alternative Solutions

### Use Gmail SMTP (Free, Reliable)

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate App Password**:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. **Update Environment Variables**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   SMTP_FROM=your-email@gmail.com
   ```

### Use SendGrid (Production Recommended)

1. Sign up at https://sendgrid.com
2. Get API key (not SMTP password)
3. Use SendGrid's Node.js SDK instead of SMTP

### Use Mailtrap (For Testing)

1. Sign up at https://mailtrap.io
2. Get SMTP credentials
3. Use for development/testing only

## 📝 Current Configuration

The email service has been updated to:
- ✅ Use port 587 (TLS) by default
- ✅ Increased timeout to 30 seconds (Render needs more time)
- ✅ Lazy connection verification (only when sending)
- ✅ Better error messages with troubleshooting tips

## 🚀 Next Steps

1. **Verify SMTP_PORT is 587** in Render environment variables
2. **Check SMTP credentials** are correct
3. **Try Gmail SMTP** if Brevo doesn't work
4. **Consider API-based email** (SendGrid/Mailgun) for production

## ⚠️ Important Notes

- **Port 465 (SSL)** is often blocked on Render
- **Port 587 (TLS)** works better but may still timeout
- **API-based email** (SendGrid, Mailgun) is most reliable on Render
- **Gmail SMTP** is free and usually works on Render

