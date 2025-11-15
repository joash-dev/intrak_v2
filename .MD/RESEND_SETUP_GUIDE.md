# Resend Email Setup Guide

## Step 1: Get a Domain

### Option A: Free Domain (Not Recommended for Production)
- **Freenom** (freenom.com) - Free .tk, .ml, .ga, .cf domains
  - ⚠️ Not very reliable, may be blocked by some services
  - Good for testing only

### Option B: Cheap Domain (Recommended)
- **Cloudflare Registrar** (cloudflare.com/products/registrar/)
  - At-cost pricing (~$8-10/year for .com)
  - No markup, very reliable
  - Free privacy protection

- **Namecheap** (namecheap.com)
  - ~$1-2/year for .xyz domains
  - ~$8-12/year for .com domains
  - Often has promotions

- **Google Domains** (now Squarespace Domains)
  - ~$12/year for .com
  - Simple interface

**Recommendation:** Use Cloudflare Registrar or Namecheap for best reliability.

## Step 2: Sign Up for Resend

1. Go to [resend.com](https://resend.com)
2. Click "Sign Up" and create an account
3. Verify your email address

## Step 3: Get Your Resend API Key

1. After logging in, go to **API Keys** in the sidebar
2. Click **"Create API Key"**
3. Give it a name (e.g., "INTRAK Production")
4. Select permission: **"Sending access"**
5. Click **"Add"**
6. **Copy the API key immediately** - you won't be able to see it again!

## Step 4: Add and Verify Your Domain in Resend

1. In Resend dashboard, go to **"Domains"** in the sidebar
2. Click **"Add Domain"**
3. Enter your domain (e.g., `intrak.edu.ph` or `yourdomain.com`)
4. Click **"Add"**

### Add DNS Records

Resend will show you DNS records to add. You need to add these to your domain's DNS settings:

**Example DNS Records:**
```
Type: TXT
Name: @
Value: v=spf1 include:resend.com ~all

Type: TXT
Name: resend._domainkey
Value: [long DKIM key from Resend]

Type: CNAME
Name: resend
Value: [value from Resend]
```

**How to Add DNS Records:**

1. **If using Cloudflare:**
   - Go to your domain in Cloudflare dashboard
   - Click "DNS" → "Records"
   - Click "Add record"
   - Add each record type shown by Resend

2. **If using Namecheap:**
   - Go to Domain List → Manage
   - Click "Advanced DNS"
   - Add the records

3. **If using other registrars:**
   - Look for "DNS Management" or "DNS Settings"
   - Add the records provided by Resend

**Wait for DNS Propagation:**
- DNS changes can take 5 minutes to 48 hours
- Usually takes 10-30 minutes
- You can check propagation at: [whatsmydns.net](https://www.whatsmydns.net)

## Step 5: Verify Domain in Resend

1. After adding DNS records, go back to Resend dashboard
2. Click **"Verify"** next to your domain
3. Wait for verification (usually 5-30 minutes)
4. Once verified, you'll see a green checkmark ✅

## Step 6: Configure Environment Variables

Add these to your `.env` file and Render environment variables:

```env
# Resend Configuration
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=INTRAK System
```

**Important:**
- Replace `yourdomain.com` with your actual domain
- Use an email address from your verified domain (e.g., `noreply@yourdomain.com`)
- The `from` email must be from your verified domain

## Step 7: Test Email Sending

1. Use the email testing feature in Admin Settings
2. Or use the API endpoint: `POST /api/email/test-send`
3. Check your inbox (and spam folder)

## Troubleshooting

### Domain Verification Failed
- **Check DNS records:** Make sure all records are added correctly
- **Wait longer:** DNS propagation can take up to 48 hours
- **Check record values:** Copy-paste exactly from Resend (no extra spaces)

### Emails Not Sending
- **Check API key:** Make sure `RESEND_API_KEY` is set correctly
- **Check from email:** Must be from your verified domain
- **Check Resend dashboard:** Look for error messages in the logs

### Emails Going to Spam
- **Verify domain:** Make sure domain is fully verified in Resend
- **Check SPF/DKIM:** Resend automatically sets these up when you verify
- **Warm up domain:** Send a few test emails first

## Resend Free Tier Limits

- **3,000 emails/month** for free
- **100 emails/day** limit
- Perfect for most applications!

## Need Help?

- Resend Docs: [resend.com/docs](https://resend.com/docs)
- Resend Support: [resend.com/support](https://resend.com/support)

