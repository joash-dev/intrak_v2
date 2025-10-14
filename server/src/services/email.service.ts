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
      // Check if email configuration is properly set up
      const hasEmailConfig = process.env.SMTP_HOST && 
                            process.env.SMTP_USER && 
                            process.env.SMTP_PASS;

      if (!hasEmailConfig) {
        console.log('📧 EMAIL SETUP REQUIRED:');
        console.log('📧 To enable email sending, create a .env file with:');
        console.log('📧 SMTP_HOST=smtp.gmail.com');
        console.log('📧 SMTP_PORT=587');
        console.log('📧 SMTP_USER=your-email@gmail.com');
        console.log('📧 SMTP_PASS=your-app-password');
        console.log('📧 See EMAIL_SETUP_GUIDE.md for detailed instructions');
        console.log('📧 Email content would be:');
        console.log('   To:', options.to);
        console.log('   Subject:', options.subject);
        console.log('   Content:', options.text?.substring(0, 100) + '...');
        return true; // Return true to not break the student creation flow
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@intrak.edu.ph',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('📧 Email sent successfully to:', options.to);
      console.log('📧 Message ID:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      console.error('❌ Please check your email configuration in .env file');
      console.error('❌ See EMAIL_SETUP_GUIDE.md for troubleshooting');
      return false;
    }
  }

  async sendUserWelcomeEmail(
    userEmail: string,
    userName: string,
    userRole: string,
    temporaryPassword: string,
    additionalInfo?: {
      studentNumber?: string;
      program?: string;
      department?: string;
    }
  ): Promise<boolean> {
    const roleDisplayNames: Record<string, string> = {
      'STUDENT': 'Student',
      'INSTRUCTOR': 'Instructor',
      'COORDINATOR': 'Coordinator',
      'ADMIN': 'Administrator',
      'INDUSTRY_PARTNER': 'Industry Partner'
    };

    const roleDisplayName = roleDisplayNames[userRole] || userRole;
    const subject = `Welcome to INTRAK - Your ${roleDisplayName} Account Credentials`;
    
    const additionalInfoHtml = additionalInfo ? `
      ${additionalInfo.studentNumber ? `<p><strong>Student Number:</strong> ${additionalInfo.studentNumber}</p>` : ''}
      ${additionalInfo.program ? `<p><strong>Program:</strong> ${additionalInfo.program}</p>` : ''}
      ${additionalInfo.department ? `<p><strong>Department:</strong> ${additionalInfo.department}</p>` : ''}
    ` : '';

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
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #3b82f6;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 10px;
          }
          .credentials {
            background-color: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .credentials h3 {
            margin-top: 0;
            color: #1e40af;
          }
          .credential-item {
            margin: 10px 0;
            padding: 10px;
            background-color: #ffffff;
            border-radius: 5px;
            border-left: 4px solid #3b82f6;
          }
          .credential-label {
            font-weight: bold;
            color: #374151;
          }
          .credential-value {
            font-family: 'Courier New', monospace;
            background-color: #f3f4f6;
            padding: 5px 10px;
            border-radius: 3px;
            color: #1f2937;
          }
          .warning {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
          }
          .warning h4 {
            margin-top: 0;
            color: #92400e;
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
            font-weight: bold;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">INTRAK</div>
            <h1>Welcome to INTRAK, ${userName}!</h1>
            <p>Your ${roleDisplayName} account has been successfully created.</p>
          </div>

          <div class="credentials">
            <h3>🔐 Your Account Credentials</h3>
            <div class="credential-item">
              <div class="credential-label">Email Address:</div>
              <div class="credential-value">${userEmail}</div>
            </div>
            <div class="credential-item">
              <div class="credential-label">Temporary Password:</div>
              <div class="credential-value">${temporaryPassword}</div>
            </div>
            <div class="credential-item">
              <div class="credential-label">Role:</div>
              <div class="credential-value">${roleDisplayName}</div>
            </div>
            ${additionalInfoHtml}
          </div>

          <div class="warning">
            <h4>⚠️ Important Security Notice</h4>
            <p>This is a temporary password that you must change on your first login for security reasons. Please keep your credentials secure and do not share them with anyone.</p>
          </div>

          <div style="text-align: center;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/login" class="button">Login to INTRAK</a>
          </div>

          <div class="footer">
            <p>If you have any questions or need assistance, please contact your system administrator.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Welcome to INTRAK, ${userName}!

Your ${roleDisplayName} account has been successfully created.

ACCOUNT CREDENTIALS:
Email: ${userEmail}
Temporary Password: ${temporaryPassword}
Role: ${roleDisplayName}
${additionalInfo ? `
Additional Information:
${additionalInfo.studentNumber ? `Student Number: ${additionalInfo.studentNumber}` : ''}
${additionalInfo.program ? `Program: ${additionalInfo.program}` : ''}
${additionalInfo.department ? `Department: ${additionalInfo.department}` : ''}
` : ''}

IMPORTANT: This is a temporary password that you must change on your first login.

Login at: ${process.env.CLIENT_URL || 'http://localhost:3000'}/login

If you have any questions, please contact your system administrator.

This is an automated message. Please do not reply to this email.
    `;

    return await this.sendEmail({
      to: userEmail,
      subject,
      html,
      text
    });
  }

  async sendStudentWelcomeEmail(
    studentEmail: string,
    studentName: string,
    studentNumber: string,
    temporaryPassword: string
  ): Promise<boolean> {
    return await this.sendUserWelcomeEmail(
      studentEmail,
      studentName,
      'STUDENT',
      temporaryPassword,
      { studentNumber }
    );
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Email service connection successful');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      console.error('❌ See EMAIL_SETUP_GUIDE.md for troubleshooting');
      return false;
    }
  }
}

export const emailService = new EmailService();