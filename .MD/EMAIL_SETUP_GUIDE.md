# Email Setup Guide for INTRAK

## Quick Setup for Development

### Option 1: Gmail SMTP (Recommended for Development)

1. **Create a Gmail account** or use an existing one
2. **Enable 2-Factor Authentication** on your Google account
3. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
4. **Create `.env` file** in the server directory with:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/intrak_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-16-character-app-password"
SMTP_FROM="noreply@intrak.edu.ph"

# Client URL
CLIENT_URL="http://localhost:5173"

# Node Environment
NODE_ENV="development"
```

### Option 2: Other SMTP Services

#### SendGrid

```env
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
```

#### Outlook/Hotmail

```env
SMTP_HOST="smtp-mail.outlook.com"
SMTP_PORT="587"
SMTP_USER="your-email@outlook.com"
SMTP_PASS="your-password"
```

#### Yahoo

```env
SMTP_HOST="smtp.mail.yahoo.com"
SMTP_PORT="587"
SMTP_USER="your-email@yahoo.com"
SMTP_PASS="your-app-password"
```

### Option 3: Development Mode (No Real Emails)

If you don't want to set up email, the system will log email content to the console instead of sending real emails.

## Testing Email Configuration

1. Start the server: `npm run dev`
2. Try creating a student through the instructor interface
3. Check the server console for email logs or success messages

## Troubleshooting

### Common Issues:

1. **"Authentication failed"**: Check your email/password
2. **"Connection timeout"**: Check SMTP_HOST and SMTP_PORT
3. **"Invalid credentials"**: Use App Passwords for Gmail (not regular password)
4. **"Less secure app access"**: Enable 2FA and use App Passwords instead

### Gmail App Password Steps:

1. Go to https://myaccount.google.com/
2. Security → 2-Step Verification (enable if not already)
3. Security → App passwords
4. Select "Mail" and generate password
5. Use the 16-character password (not your regular Gmail password)

## Production Setup

### ⭐ Recommended: SendGrid (Best for Production - No Domain Required Initially)

**Why SendGrid?**
- ✅ **No domain verification required** - Can use shared domain initially
- ✅ **Free tier**: 100 emails/day forever
- ✅ **Excellent deliverability** and analytics
- ✅ **Easy setup** - Just need API key
- ✅ **Can add custom domain later** for better branding

**Setup Steps:**

1. **Sign up** at https://sendgrid.com (free account)
2. **Create API Key**:
   - Go to Settings → API Keys
   - Create API Key with "Mail Send" permissions
   - Copy the API key
3. **Add to `.env`**:

```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key-here
SMTP_FROM=noreply@intrak.edu.ph
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key-here
```

**Note**: You can use `noreply@intrak.edu.ph` as the FROM address even without domain verification. SendGrid will use their shared domain for delivery.

---

### Alternative Options

#### 1. Mailgun (Good Alternative)

**Free tier**: 5,000 emails/month (first 3 months), then 1,000/month

```env
EMAIL_PROVIDER=mailgun
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-smtp-username
SMTP_PASS=your-mailgun-smtp-password
SMTP_FROM=noreply@intrak.edu.ph
```

**Setup**: Sign up at https://mailgun.com, get SMTP credentials from dashboard

---

#### 2. Brevo (formerly Sendinblue)

**Free tier**: 300 emails/day

```env
EMAIL_PROVIDER=brevo
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-brevo-smtp-user
SMTP_PASS=your-brevo-smtp-password
SMTP_FROM=noreply@intrak.edu.ph
```

**Setup**: Sign up at https://brevo.com, get SMTP credentials

---

#### 3. Amazon SES (Very Cheap, Pay-as-you-go)

**Cost**: ~$0.10 per 1,000 emails

```env
EMAIL_PROVIDER=smtp
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-aws-ses-smtp-username
SMTP_PASS=your-aws-ses-smtp-password
SMTP_FROM=noreply@intrak.edu.ph
```

**Setup**: Requires AWS account, verify email addresses initially

---

#### 4. Gmail SMTP (Not Recommended for Production)

**Limits**: 500 emails/day, not ideal for production

```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```

---

### Provider Comparison

| Provider | Free Tier | Domain Required? | Best For |
|----------|-----------|------------------|----------|
| **SendGrid** ⭐ | 100/day | No (initially) | **Production (Recommended)** |
| Mailgun | 5K/month (3mo) | No (sandbox) | Development/Production |
| Brevo | 300/day | No | Small scale production |
| Amazon SES | Pay-as-you-go | No (email verify) | High volume |
| Gmail | 500/day | No | Development only |

---

### Quick Start with SendGrid (Recommended)

1. Sign up: https://sendgrid.com/free/
2. Create API Key: Settings → API Keys → Create API Key
3. Add to `.env`:
   ```env
   EMAIL_PROVIDER=sendgrid
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
   SMTP_FROM=noreply@intrak.edu.ph
   ```
4. Restart server - emails will work immediately!

**No domain verification needed** - SendGrid handles delivery through their infrastructure.
