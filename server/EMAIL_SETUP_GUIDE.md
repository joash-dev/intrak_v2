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

For production, use a dedicated email service like:

- SendGrid
- Mailgun
- Amazon SES
- Microsoft Graph API

These services provide better deliverability and analytics.
