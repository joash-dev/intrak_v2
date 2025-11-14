# Email Service Quick Setup Guide

## ✅ Email Service is Already Integrated!

The email service is **already connected** to the user creation flow. When you create a user through the admin panel, the system will automatically:
1. Create the user account
2. Generate a temporary password
3. Send a welcome email with credentials

## 🔧 Configuration Steps

### Step 1: Set Environment Variables

Add these to your `.env` file in the `server` directory:

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-brevo-smtp-user@brevo.com
SMTP_PASS=your-brevo-smtp-password
SMTP_FROM=intraksystem@gmail.com
SMTP_FROM_NAME=INTRAK System

# Client URL (for email links)
CLIENT_URL=https://intrak-v2.onrender.com
```

### Step 2: For Brevo (Current Setup)

1. **Get your SMTP credentials from Brevo:**
   - Login to Brevo dashboard
   - Go to **SMTP & API** → **SMTP**
   - Copy your SMTP server, port, and credentials

2. **Update your `.env` file:**
   ```env
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_USER=your-email@brevo.com
   SMTP_PASS=your-smtp-password
   ```

### Step 3: Test Email Connection

You can test the email connection using the admin panel or API:

**Via API:**
```bash
GET /api/email/test
```

**Via Admin Panel:**
- Go to Admin Settings
- Look for "Test Email Connection" option

## 📧 How It Works

1. **User Creation Flow:**
   - Admin creates a user → System generates password → Email sent automatically

2. **Email Content:**
   - Professional HTML template
   - Account credentials (email + temporary password)
   - Login link
   - Role-specific information

3. **Email Endpoints:**
   - `POST /api/email/welcome-user` - General user welcome email
   - `POST /api/email/welcome` - Student welcome email
   - `GET /api/email/test` - Test connection
   - `POST /api/email/test-send` - Send test email

## 🔍 Troubleshooting

### Email Not Sending?

1. **Check Environment Variables:**
   ```bash
   # In server directory
   echo $SMTP_HOST
   echo $SMTP_USER
   ```

2. **Check Server Logs:**
   - Look for `📧 Initializing SMTP transporter`
   - Look for `✅ SMTP connection verified` or `❌ SMTP connection failed`

3. **Common Issues:**
   - **Port 465 blocked**: Use port 587 (TLS) instead
   - **Wrong credentials**: Verify SMTP_USER and SMTP_PASS
   - **Firewall**: Ensure outbound SMTP ports are open

### Connection Timeout?

- **Render.com**: Port 465 is often blocked, use port 587
- **Timeout settings**: Already optimized to 10 seconds
- **TLS required**: Port 587 automatically uses TLS

## ✅ Verification

After setting up, create a test user:
1. Go to Admin → User Management
2. Create a new user
3. Check the console logs for email sending status
4. Check the user's email inbox

## 📝 Notes

- The email service uses **Nodemailer** with SMTP
- Supports both **SSL (port 465)** and **TLS (port 587)**
- Automatically detects port and configures accordingly
- Email sending is **non-blocking** - user creation succeeds even if email fails
- All email attempts are logged for debugging

