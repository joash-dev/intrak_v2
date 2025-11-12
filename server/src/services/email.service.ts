import { Resend } from 'resend';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private resend: Resend | null = null;
  private fromEmail: string;

  constructor() {
    const { RESEND_API_KEY } = process.env;

    this.fromEmail =
      process.env.SMTP_FROM ||
      process.env.SMTP_USER ||
      'intraksystem@gmail.com';

    if (!RESEND_API_KEY) {
      console.warn('📧 RESEND_API_KEY missing. Email sending is disabled.');
      return;
    }

    this.resend = new Resend(RESEND_API_KEY);

    this.resend.domains
      .list()
      .then(() => {
        console.log('✅ Resend API key verified successfully');
      })
      .catch((error: unknown) => {
        console.error('❌ Resend domain verification failed:', error);
        console.error('❌ Check RESEND_API_KEY and domain configuration');
      });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.resend) {
      console.log('📧 Email sending skipped (RESEND_API_KEY not configured).');
      console.log('📧 Email content would be:');
      console.log('   To:', options.to);
      console.log('   Subject:', options.subject);
      console.log('   Content:', options.text?.substring(0, 100) + '...');
      return true;
    }

    try {
      const response = await this.resend.emails.send({
        from: this.fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      });

      console.log('📧 Email sent via Resend:', {
        to: options.to,
        id: response.data?.id
      });
      return true;
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      console.error('❌ Check RESEND_API_KEY and domain settings');
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
    if (!this.resend) {
      console.warn('📧 Resend not configured. Set RESEND_API_KEY to enable email sending.');
      return false;
    }

    try {
      await this.resend.domains.list();
      console.log('✅ Resend connection verified');
      return true;
    } catch (error) {
      console.error('❌ Resend connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();