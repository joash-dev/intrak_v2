# Environment Variables Check

## ✅ Your Current Configuration

Based on your environment variables, here's what I see:

### Email Configuration (Gmail SMTP)
```env
SMTP_HOST=smtp.gmail.com          ✅ Correct
SMTP_PORT=587                     ✅ Correct (TLS port)
SMTP_USER=intraksystem@gmail.com  ✅ Correct
SMTP_PASS=skkptmbggbxagote        ✅ Looks like Gmail App Password (16 chars)
SMTP_FROM=intraksystem@gmail.com  ✅ Correct
```

### Other Important Variables
```env
CLIENT_URL=https://intrak-v2.onrender.com  ✅ Correct
NODE_ENV=development                        ⚠️ Should be 'production' on Render
PORT=5000                                    ✅ Correct
```

## ✅ Configuration Status: **CORRECT**

Your SMTP configuration looks good! All the required variables are set correctly.

## 🔍 Potential Issues to Check

### 1. Gmail App Password
- Make sure `skkptmbggbxagote` is a valid **App Password** (not your regular Gmail password)
- App Passwords are 16 characters without spaces
- Generate from: Google Account → Security → 2-Step Verification → App passwords

### 2. Gmail Account Settings
- ✅ 2-Factor Authentication must be enabled
- ✅ "Less secure app access" is NOT needed (App Passwords replace this)
- ✅ The account `intraksystem@gmail.com` must exist and be accessible

### 3. Render.com Environment
- Make sure these variables are set in **Render Dashboard → Environment**
- Not just in your local `.env` file
- Render uses its own environment variables

### 4. NODE_ENV
- Currently set to `development`
- On Render, it should be `production` or `development` (both work, but `production` is recommended)

## 🧪 Testing Steps

1. **Test Connection** (in Admin Settings → System → Email Testing):
   - Click "Test Connection"
   - Should show: "Email service connection successful"

2. **Send Test Email**:
   - Enter your email address
   - Click "Send Test Email"
   - Check your inbox (and spam folder)

## 📝 If Still Not Working

Check Render logs for:
- `❌ SMTP connection failed`
- `ETIMEDOUT` - Connection timeout
- `EAUTH` - Authentication failed (wrong password)
- `ECONNREFUSED` - Connection refused

## 💡 Quick Fixes

### If Authentication Fails:
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Generate a new App Password for "Mail"
4. Update `SMTP_PASS` in Render with the new password

### If Connection Times Out:
- This is a Render.com limitation
- Consider using SendGrid API or Mailgun API instead of SMTP
- Or use a different hosting provider that allows SMTP

## ✅ Your Configuration is Valid!

The setup looks correct. If emails still fail, the issue is likely:
1. Gmail App Password needs to be regenerated
2. Render.com blocking SMTP connections (common on free tier)
3. Network/firewall issues on Render

Try testing again and check the Render logs for the specific error message.

