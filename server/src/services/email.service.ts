import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // For development, we'll use a test account
    // In production, you should use a real SMTP service like Gmail, SendGrid, etc.
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || 'ethereal.user@ethereal.email',
        pass: process.env.SMTP_PASS || 'ethereal.pass'
      }
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@intrak.edu.ph',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('📧 Email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      return false;
    }
  }

  async sendStudentWelcomeEmail(
    studentEmail: string,
    studentName: string,
    studentNumber: string,
    temporaryPassword: string
  ): Promise<boolean> {
    const subject = 'Welcome to INTRAK - Your Account Credentials';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to INTRAK</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #3b82f6;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 10px;
          }
          .subtitle {
            color: #6b7280;
            font-size: 16px;
          }
          .content {
            margin-bottom: 30px;
          }
          .credentials-box {
            background-color: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .credential-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .credential-item:last-child {
            border-bottom: none;
          }
          .credential-label {
            font-weight: 600;
            color: #374151;
          }
          .credential-value {
            font-family: 'Courier New', monospace;
            background-color: #ffffff;
            padding: 5px 10px;
            border-radius: 4px;
            border: 1px solid #d1d5db;
            color: #1f2937;
          }
          .password-warning {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #92400e;
          }
          .warning-icon {
            color: #f59e0b;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
          .button {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🎓 INTRAK</div>
            <div class="subtitle">Internship Tracking System</div>
          </div>
          
          <div class="content">
            <h2>Welcome to INTRAK, ${studentName}!</h2>
            
            <p>Your student account has been successfully created. Below are your login credentials:</p>
            
            <div class="credentials-box">
              <div class="credential-item">
                <span class="credential-label">Student Number:</span>
                <span class="credential-value">${studentNumber}</span>
              </div>
              <div class="credential-item">
                <span class="credential-label">Email:</span>
                <span class="credential-value">${studentEmail}</span>
              </div>
              <div class="credential-item">
                <span class="credential-label">Temporary Password:</span>
                <span class="credential-value">${temporaryPassword}</span>
              </div>
            </div>
            
            <div class="password-warning">
              <span class="warning-icon">⚠️</span>
              <strong>Important:</strong> This is a temporary password. Please change it immediately after your first login for security purposes.
            </div>
            
            <p>You can now access the INTRAK system using these credentials. Once logged in, you'll be able to:</p>
            <ul>
              <li>View your internship details and requirements</li>
              <li>Submit required documents</li>
              <li>Track your attendance and progress</li>
              <li>Communicate with your coordinator and supervisor</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login" class="button">
                Login to INTRAK
              </a>
            </div>
          </div>
          
          <div class="footer">
            <p>If you have any questions or need assistance, please contact your internship coordinator.</p>
            <p><strong>INTRAK Team</strong><br>
            PSU Urdaneta Campus</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Welcome to INTRAK, ${studentName}!

Your student account has been successfully created. Below are your login credentials:

Student Number: ${studentNumber}
Email: ${studentEmail}
Temporary Password: ${temporaryPassword}

IMPORTANT: This is a temporary password. Please change it immediately after your first login for security purposes.

You can now access the INTRAK system using these credentials. Once logged in, you'll be able to:
- View your internship details and requirements
- Submit required documents
- Track your attendance and progress
- Communicate with your coordinator and supervisor

Login URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}/login

If you have any questions or need assistance, please contact your internship coordinator.

INTRAK Team
PSU Urdaneta Campus
    `;

    return await this.sendEmail({
      to: studentEmail,
      subject,
      html,
      text
    });
  }

  // Test email configuration
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Email service connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
