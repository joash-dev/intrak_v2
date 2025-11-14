import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private fromEmail: string;

  constructor() {
    // Option 1: SMTP_* variables (primary/preferred)
    // Option 2: MAIL_* variables (Laravel style, fallback)
    const SMTP_HOST = process.env.SMTP_HOST || process.env.MAIL_HOST;
    const SMTP_PORT = process.env.SMTP_PORT || process.env.MAIL_PORT || '587';
    const SMTP_USER = process.env.SMTP_USER || process.env.MAIL_USERNAME;
    const SMTP_PASS = process.env.SMTP_PASS || process.env.MAIL_PASSWORD;
    const SMTP_FROM = process.env.SMTP_FROM || process.env.MAIL_FROM_ADDRESS;
    const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || process.env.MAIL_FROM_NAME || 'INTRAK System';

    this.fromEmail = SMTP_FROM || SMTP_USER || 'intraksystem@gmail.com';

    // Initialize SMTP transporter (same pattern as Laravel mailers)
    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      const port = parseInt(SMTP_PORT);
      // Port 465 = SSL (secure: true), Port 587 = TLS (secure: false, requiresTLS: true)
      const secure = port === 465;
      const requiresTLS = port === 587; // Explicitly require TLS for port 587

      console.log('📧 Initializing SMTP transporter (Laravel mailer pattern):', {
        host: SMTP_HOST,
        port: port,
        secure: secure,
        requiresTLS: requiresTLS,
        user: SMTP_USER.substring(0, 10) + '...',
        hasPassword: !!SMTP_PASS,
        from: `${SMTP_FROM_NAME} <${this.fromEmail}>`
      });

      const smtpConfig: any = {
        host: SMTP_HOST,
        port: port,
        secure: secure, // true for 465 (SSL), false for 587 (TLS)
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS
        },
        // Timeout settings - Increased for Render.com (can be slow)
        connectionTimeout: 30000, // 30 seconds (Render needs more time)
        greetingTimeout: 15000, // 15 seconds
        socketTimeout: 30000, // 30 seconds
        // For port 587, explicitly require TLS upgrade
        ...(requiresTLS && {
          requireTLS: true,
          tls: {
            rejectUnauthorized: false // Allow self-signed certificates if needed
          }
        }),
        // Additional options for Render.com compatibility
        pool: false, // Don't use connection pooling (can cause issues on Render)
        maxConnections: 1,
        maxMessages: 1
      };

      this.transporter = nodemailer.createTransport(smtpConfig);

      // Don't verify connection on startup (Render blocks initial connections)
      // Connection will be verified when actually sending emails
      console.log('📧 SMTP transporter created (connection will be verified on first email send)');
    } else {
      console.warn('📧 SMTP not configured. Email sending is disabled.');
      console.warn('📧 Required environment variables: SMTP_HOST, SMTP_USER, SMTP_PASS');
      if (!SMTP_HOST) console.warn('   - SMTP_HOST: NOT SET');
      if (!SMTP_USER) console.warn('   - SMTP_USER: NOT SET');
      if (!SMTP_PASS) console.warn('   - SMTP_PASS: NOT SET');
    }
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    if (!this.transporter) {
      const errorMsg = 'SMTP transporter not configured. Please check SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.';
      console.error('❌ Email sending skipped (SMTP transporter not configured).');
      console.error('📧 Environment variables check:');
      console.error('   SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');
      console.error('   SMTP_USER:', process.env.SMTP_USER ? process.env.SMTP_USER.substring(0, 10) + '...' : 'NOT SET');
      console.error('   SMTP_PASS:', process.env.SMTP_PASS ? 'SET' : 'NOT SET');
      console.error('📧 Email content would be:');
      console.error('   To:', options.to);
      console.error('   Subject:', options.subject);
      return { success: false, error: errorMsg };
    }

    try {
      console.log('📧 Attempting to send email via SMTP:', {
        to: options.to,
        from: this.fromEmail,
        subject: options.subject,
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || '587'
      });

      // Use "From Name <email>" format
      // Priority: SMTP_FROM_NAME > MAIL_FROM_NAME
      const fromName = process.env.SMTP_FROM_NAME || process.env.MAIL_FROM_NAME || 'INTRAK System';
      const fromAddress = fromName ? `${fromName} <${this.fromEmail}>` : this.fromEmail;

      // Verify connection before sending (lazy verification)
      try {
        await this.transporter.verify();
        console.log('✅ SMTP connection verified before sending');
      } catch (verifyError: any) {
        console.warn('⚠️ SMTP verification failed, but attempting to send anyway:', verifyError.message);
        // Continue anyway - sometimes verification fails but sending works
      }

      const info = await this.transporter.sendMail({
        from: fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      });

      console.log('📧 Email sent successfully:', {
        to: options.to,
        messageId: info.messageId
      });
      return { success: true };
    } catch (error: any) {
      console.error('❌ Email sending failed:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode,
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT
      });
      
      // Build user-friendly error message
      let errorMessage = error.message || 'Unknown error occurred';
      
      if (error.code === 'ETIMEDOUT') {
        errorMessage = `Connection timeout: Unable to connect to SMTP server (${process.env.SMTP_HOST}:${process.env.SMTP_PORT || '587'}). This may be due to network issues or Render.com blocking outbound SMTP connections.`;
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = `Connection refused: SMTP server refused the connection. Please verify SMTP_HOST and SMTP_PORT are correct.`;
      } else if (error.code === 'EAUTH') {
        errorMessage = `Authentication failed: Invalid SMTP credentials. Please check SMTP_USER and SMTP_PASS.`;
      } else if (error.responseCode) {
        errorMessage = `SMTP error ${error.responseCode}: ${error.response || error.message}`;
      }
      
      // Provide helpful troubleshooting tips in logs
      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
        console.error('💡 Troubleshooting tips:');
        console.error('   1. Check if SMTP_PORT is set to 587 (TLS) not 465 (SSL)');
        console.error('   2. Verify SMTP_HOST is correct');
        console.error('   3. Check if Render.com is blocking outbound SMTP connections');
        console.error('   4. Try using a different SMTP provider (Gmail, SendGrid API, etc.)');
      }
      
      return { success: false, error: errorMessage };
    }
  }

  private generateEmailTemplate(content: string, bannerText: string, bannerIcon?: string): string {
    const clientUrl = process.env.CLIENT_URL || 'https://intrak-v2.onrender.com';
    const logoUrl = `${clientUrl}/logo_intrak.png`;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>INTRAK Email</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Montserrat', sans-serif;
      background-color: #F3F8FF;
    }
    .container {
      max-width: 600px;
      margin: 30px auto;
      background: #FFFFFF;
      border: 1px solid #cfd9e0;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    }
    .header {
      padding: 20px 30px 10px;
      display: flex;
      align-items: center;
    }
    .logo {
      width: 60px;
      height: 60px;
      margin-right: 15px;
      object-fit: contain;
    }
    .title-text {
      color: #002c63;
    }
    .title-text h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      line-height: 1.3;
    }
    .banner {
      background-color: #002C76;
      color: white;
      padding: 15px 30px;
      margin: 15px 15px 0px 15px;
      font-size: 18px;
      font-weight: 700;
      border-radius: 16px;
      display: flex;
      align-items: center;
    }
    .banner img {
      width: 20px;
      height: 20px;
      margin-right: 10px;
      filter: brightness(0) invert(1);
    }
    .content {
      padding: 0px 30px 15px 30px;
      color: #1a202c;
      font-size: 15px;
      line-height: 1.6;
    }
    .credentials-box {
      margin: 20px 0;
      background-color: #f2f2f2;
      border: 2px dashed #002c63;
      border-radius: 8px;
      padding: 20px;
    }
    .credentials-box p {
      margin: 8px 0;
      font-size: 15px;
    }
    .credentials-box strong {
      color: #002c63;
      font-weight: 700;
    }
    .login-button {
      display: block;
      margin: 20px auto;
      text-align: center;
      text-decoration: none;
      padding: 12px 24px;
      background-color: #002C76;
      color: white !important;
      font-weight: 600;
      border-radius: 8px;
      font-size: 15px;
      width: fit-content;
    }
    .footer {
      padding: 0 30px 30px;
      font-size: 14px;
      color: #2d3748;
    }
    .footer strong {
      font-weight: 700;
    }
    .note {
      font-size: 13px;
      color: #718096;
      margin-top: 10px;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <img src="${logoUrl}" alt="INTRAK Logo" class="logo" onerror="this.style.display='none'">
      <div class="title-text">
        <h2>INTRAK - OJT Management System</h2>
      </div>
    </div>

    <!-- Banner -->
    <div class="banner">
      ${bannerIcon ? `<img src="${bannerIcon}" alt="Icon" />` : ''}
      ${bannerText}
    </div>

    <!-- Content -->
    <div class="content">
      ${content}
    </div>
  </div>
</body>
</html>
    `.trim();
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
  ): Promise<{ success: boolean; error?: string }> {
    const roleDisplayNames: Record<string, string> = {
      'STUDENT': 'Student',
      'INSTRUCTOR': 'Instructor',
      'COORDINATOR': 'Coordinator',
      'ADMIN': 'Administrator',
      'INDUSTRY_PARTNER': 'Industry Partner'
    };

    const roleDisplayName = roleDisplayNames[userRole] || userRole;
    const subject = `Welcome to INTRAK - Your ${roleDisplayName} Account Credentials`;
    const clientUrl = process.env.CLIENT_URL || 'https://intrak-v2.onrender.com';
    
    const additionalInfoHtml = additionalInfo ? `
      ${additionalInfo.studentNumber ? `<p><strong>Student Number:</strong> ${additionalInfo.studentNumber}</p>` : ''}
      ${additionalInfo.program ? `<p><strong>Program:</strong> ${additionalInfo.program}</p>` : ''}
      ${additionalInfo.department ? `<p><strong>Department:</strong> ${additionalInfo.department}</p>` : ''}
    ` : '';

    const content = `
      <p>Hello ${userName}!</p>
      <p>Your ${roleDisplayName} account has been successfully created in the INTRAK OJT Management System.</p>
      
      <div class="credentials-box">
        <p><strong>Account Credentials:</strong></p>
      <p><strong>Email:</strong> ${userEmail}</p>
      <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
      <p><strong>Role:</strong> ${roleDisplayName}</p>
      ${additionalInfoHtml}
      </div>

      <p><strong>Important:</strong> This is a temporary password that you must change on your first login for security purposes.</p>
      
      <a href="${clientUrl}/login" class="login-button">Login to INTRAK</a>
      
      <p class="note">If the button above does not work, copy and paste this link into your browser:<br>
      <span style="word-break: break-all;">${clientUrl}/login</span></p>
      
      <p>If you have any questions or need assistance, please contact your system administrator.</p>
      
      <p><br><strong>– INTRAK System</strong></p>
    `;

    const html = this.generateEmailTemplate(
      content,
      'Welcome to INTRAK',
      'https://img.icons8.com/ios-filled/50/ffffff/user-male-circle.png'
    );

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

Login at: ${clientUrl}/login

If you have any questions, please contact your system administrator.

This is an automated message. Please do not reply to this email.
    `;

    return this.sendEmail({
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
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendUserWelcomeEmail(
      studentEmail,
      studentName,
      'STUDENT',
      temporaryPassword,
      { studentNumber }
    );
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.transporter) {
      const errorMsg = 'SMTP transporter not configured. Please check SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.';
      console.warn('📧 SMTP transporter not configured.');
      return { success: false, error: errorMsg };
    }

    return new Promise((resolve) => {
      this.transporter!.verify((error: Error | null) => {
        if (error) {
          console.error('❌ SMTP connection failed:', error);
          let errorMessage = error.message || 'Unknown error occurred';
          
          if ((error as any).code === 'ETIMEDOUT') {
            errorMessage = `Connection timeout: Unable to connect to SMTP server (${process.env.SMTP_HOST}:${process.env.SMTP_PORT || '587'}). This may be due to network issues or Render.com blocking outbound SMTP connections.`;
          } else if ((error as any).code === 'ECONNREFUSED') {
            errorMessage = `Connection refused: SMTP server refused the connection. Please verify SMTP_HOST and SMTP_PORT are correct.`;
          } else if ((error as any).code === 'EAUTH') {
            errorMessage = `Authentication failed: Invalid SMTP credentials. Please check SMTP_USER and SMTP_PASS.`;
          }
          
          resolve({ success: false, error: errorMessage });
        } else {
          console.log('✅ SMTP connection verified');
          resolve({ success: true });
        }
      });
    });
  }
}

export const emailService = new EmailService();
