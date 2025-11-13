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
    const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT, SMTP_FROM } = process.env;

    this.fromEmail = SMTP_FROM || SMTP_USER || 'intraksystem@gmail.com';

    // Initialize SMTP transporter
    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      const port = parseInt(SMTP_PORT || '465');
      const secure = port === 465; // true for 465 (SSL), false for 587 (TLS)

      console.log('📧 Initializing SMTP transporter:', {
        host: SMTP_HOST,
        port: port,
        secure: secure,
        user: SMTP_USER.substring(0, 10) + '...',
        hasPassword: !!SMTP_PASS,
        from: this.fromEmail
      });

      const smtpConfig = {
        host: SMTP_HOST,
        port: port,
        secure: secure, // true for 465, false for 587
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS
        }
      };

      this.transporter = nodemailer.createTransport(smtpConfig);

      // Verify connection
      this.transporter.verify((error: Error | null) => {
        if (error) {
          console.error('❌ SMTP connection failed:', error);
          console.error('Error details:', {
            message: error.message,
            code: (error as any).code,
            command: (error as any).command
          });
        } else {
          console.log('✅ SMTP connection verified');
        }
      });
    } else {
      console.warn('📧 SMTP not configured. Email sending is disabled.');
      console.warn('📧 Required environment variables: SMTP_HOST, SMTP_USER, SMTP_PASS');
      if (!SMTP_HOST) console.warn('   - SMTP_HOST: NOT SET');
      if (!SMTP_USER) console.warn('   - SMTP_USER: NOT SET');
      if (!SMTP_PASS) console.warn('   - SMTP_PASS: NOT SET');
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      console.error('❌ Email sending skipped (SMTP transporter not configured).');
      console.error('📧 Environment variables check:');
      console.error('   SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');
      console.error('   SMTP_USER:', process.env.SMTP_USER ? process.env.SMTP_USER.substring(0, 10) + '...' : 'NOT SET');
      console.error('   SMTP_PASS:', process.env.SMTP_PASS ? 'SET' : 'NOT SET');
      console.error('📧 Email content would be:');
      console.error('   To:', options.to);
      console.error('   Subject:', options.subject);
      return false;
    }

    try {
      console.log('📧 Attempting to send email via SMTP:', {
        to: options.to,
        from: this.fromEmail,
        subject: options.subject
      });

      const info = await this.transporter.sendMail({
        from: this.fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      });

      console.log('📧 Email sent successfully:', {
        to: options.to,
        messageId: info.messageId
      });
      return true;
    } catch (error: any) {
      console.error('❌ Email sending failed:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode
      });
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
      <h1>Welcome to INTRAK, ${userName}!</h1>
      <p>Your ${roleDisplayName} account has been successfully created.</p>
      
      <h2>Account Credentials:</h2>
      <p><strong>Email:</strong> ${userEmail}</p>
      <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
      <p><strong>Role:</strong> ${roleDisplayName}</p>
      ${additionalInfoHtml}
      
      <p><strong>Important:</strong> This is a temporary password that you must change on your first login.</p>
      
      <p><a href="${process.env.CLIENT_URL || 'https://intrak-v2.onrender.com'}/login">Login to INTRAK</a></p>
      
      <p>If you have any questions, please contact your system administrator.</p>
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

Login at: ${process.env.CLIENT_URL || 'https://intrak-v2.onrender.com'}/login

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
  ): Promise<boolean> {
    return this.sendUserWelcomeEmail(
      studentEmail,
      studentName,
      'STUDENT',
      temporaryPassword,
      { studentNumber }
    );
  }

  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      console.warn('📧 SMTP transporter not configured.');
      return false;
    }

    return new Promise((resolve) => {
      this.transporter!.verify((error) => {
        if (error) {
          console.error('❌ SMTP connection failed:', error);
          resolve(false);
        } else {
          console.log('✅ SMTP connection verified');
          resolve(true);
        }
      });
    });
  }
}

export const emailService = new EmailService();
