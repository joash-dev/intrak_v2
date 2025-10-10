# Email Service Setup

The INTRAK system now includes an email service for sending welcome emails to new students with their temporary passwords.

## Configuration

Add the following environment variables to your `.env` file:

```env
# Client URL (for email links)
CLIENT_URL=http://localhost:5173

# Email Configuration
# For development, you can use Ethereal Email (free test service)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=ethereal.user@ethereal.email
SMTP_PASS=ethereal.pass
SMTP_FROM=noreply@intrak.edu.ph
```

## Email Service Options

### 1. Ethereal Email (Development/Testing)

- **Free test email service**
- Perfect for development and testing
- Emails are captured and can be viewed at https://ethereal.email
- No real emails are sent

### 2. Gmail (Production)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```

**Note**: For Gmail, you need to:

1. Enable 2-factor authentication
2. Generate an "App Password" (not your regular password)
3. Use the app password in `SMTP_PASS`

### 3. SendGrid (Production)

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=noreply@intrak.edu.ph
```

### 4. Mailgun (Production)

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
SMTP_FROM=noreply@intrak.edu.ph
```

## Testing the Email Service

1. **Start the server** with the email configuration
2. **Create a new student** through the coordinator interface
3. **Check the email status** in the confirmation modal

### For Ethereal Email:

1. Check the console logs for the email preview URL
2. Visit the URL to see the sent email

### For Real Email Services:

1. Check the student's email inbox
2. Look for the welcome email with login credentials

## Email Template

The welcome email includes:

- Professional HTML design
- Student's name and credentials
- Login instructions
- Security reminders
- Direct link to the login page

## Troubleshooting

### Common Issues:

1. **"Email could not be sent"**
   - Check SMTP configuration
   - Verify credentials
   - Check network connectivity

2. **Authentication errors**
   - Verify SMTP_USER and SMTP_PASS
   - For Gmail, ensure you're using an App Password

3. **Connection timeouts**
   - Check SMTP_HOST and SMTP_PORT
   - Verify firewall settings

### Testing Connection:

Use the test endpoint: `GET /api/email/test` (Admin only)

## Security Notes

- Temporary passwords are generated securely
- Students are instructed to change passwords after first login
- Email credentials are stored securely in environment variables
- No passwords are logged or stored in plain text
