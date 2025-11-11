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
    const port = parseInt(process.env.SMTP_PORT || '587');
    const secure =
      (process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port,
      secure,
      auth: {
        user: process.env.SMTP_USER || 'ethereal.user@ethereal.email',
        pass: process.env.SMTP_PASS || 'ethereal.pass'
      }
    });

    this.transporter
      .verify()
      .then(() => {
        console.log('✅ Email transporter verified successfully');
      })
      .catch((error) => {
        console.error('❌ Email transporter verification failed:', error);
        console.error('❌ Check SMTP_HOST/PORT/USER/PASS/SECURE environment variables');
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
        from:
          process.env.SMTP_FROM ||
          process.env.SMTP_USER ||
          'intraksystem@gmail.com',
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