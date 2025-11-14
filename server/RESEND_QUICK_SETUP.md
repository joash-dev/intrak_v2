# Resend API Quick Setup Guide

## ✅ Code is Already Set Up!

The email service already supports Resend API. You just need to configure the environment variables.

## Required Environment Variables

Add these to your `.env` file (local) and Render.com environment variables:

```env
# Resend API Configuration (Priority 1 - Recommended for Render.com)
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=INTRAK System
```

## How It Works

1. **Priority System**: The code checks for Resend first, then falls back to SMTP
   - If `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are set → Uses Resend API ✅
   - Otherwise, tries SMTP (may not work on Render.com)

2. **No Code Changes Needed**: Just set the environment variables!

## Getting Your Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Go to **API Keys** in dashboard
3. Click **"Create API Key"**
4. Name it (e.g., "INTRAK Production")
5. Permission: **"Sending access"**
6. Copy the key (starts with `re_`)

## Setting the FROM Email

The `RESEND_FROM_EMAIL` must be from a domain you've verified in Resend:

- If you have a domain: `noreply@yourdomain.com`
- If using Resend's test domain: `onboarding@resend.dev` (for testing only)

## Domain Verification (If Using Your Own Domain)

1. In Resend dashboard → **Domains**
2. Click **"Add Domain"**
3. Enter your domain
4. Add the DNS records Resend provides to your domain registrar
5. Click **"Verify"** in Resend dashboard
6. Wait for verification (usually 5-30 minutes)

## Testing

Once environment variables are set:

1. **Via Admin UI**: Go to Admin Settings → Email Service Testing
2. **Via API**: `POST /api/email/test-send` with `{ "email": "test@example.com" }`

## Example Environment Variables

```env
# Resend (Recommended - Works on Render)
RESEND_API_KEY=re_1234567890abcdef
RESEND_FROM_EMAIL=noreply@intrak.site
RESEND_FROM_NAME=INTRAK System

# SMTP (Optional - Comment out if using Resend)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
```

## Benefits of Resend

✅ Works on Render.com (no SMTP port blocking)  
✅ 3,000 emails/month free  
✅ Better deliverability  
✅ Professional emails from your domain  
✅ No connection timeout issues  

## Troubleshooting

### "Resend client not initialized"
- Check `RESEND_API_KEY` is set correctly
- Check `RESEND_FROM_EMAIL` is set correctly
- Restart your server after adding environment variables

### "Resend API error: Domain not verified"
- Verify your domain in Resend dashboard
- Make sure DNS records are added correctly
- Wait for DNS propagation (can take up to 48 hours)

### "Invalid API key"
- Check the API key starts with `re_`
- Make sure you copied the full key
- Regenerate if needed

## Code Location

- Email Service: `server/src/services/email.service.ts`
- Resend is already integrated and ready to use!

