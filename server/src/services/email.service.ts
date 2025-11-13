import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

type EmailProvider = 'resend' | 'sendgrid' | 'mailgun' | 'smtp' | 'brevo';

class EmailService {
  private resend: Resend | null = null;
  private transporter: nodemailer.Transporter | null = null;
  private sendgridApiKey: string | null = null;
  private provider: EmailProvider;
  private fromEmail: string;

  constructor() {
    // Determine which email provider to use
    const { RESEND_API_KEY, SENDGRID_API_KEY, EMAIL_PROVIDER, SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT } = process.env;

    this.fromEmail =
      process.env.SMTP_FROM ||
      process.env.SMTP_USER ||
      'intraksystem@gmail.com';

    // Auto-detect provider based on available API keys
    if (EMAIL_PROVIDER) {
      this.provider = EMAIL_PROVIDER.toLowerCase() as EmailProvider;
    } else if (SENDGRID_API_KEY) {
      this.provider = 'sendgrid';
    } else if (RESEND_API_KEY) {
      this.provider = 'resend';
    } else if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      this.provider = 'smtp';
    } else {
      this.provider = 'smtp'; // Default fallback
    }

    // Initialize SendGrid API (preferred over SMTP for better reliability)
    if (SENDGRID_API_KEY && this.provider === 'sendgrid') {
      this.sendgridApiKey = SENDGRID_API_KEY;
      sgMail.setApiKey(SENDGRID_API_KEY);
      console.log('✅ SendGrid API initialized (using Web API instead of SMTP)');
      console.log('📧 SendGrid API Key:', SENDGRID_API_KEY.substring(0, 10) + '...' + SENDGRID_API_KEY.substring(SENDGRID_API_KEY.length - 4));
      console.log('📧 SendGrid From Email:', this.fromEmail);
    } else if (this.provider === 'sendgrid' && !SENDGRID_API_KEY) {
      console.error('❌ SendGrid provider selected but SENDGRID_API_KEY not found in environment variables');
    }

    // Initialize Resend if API key is provided
    if (RESEND_API_KEY && (this.provider === 'resend' || !EMAIL_PROVIDER)) {
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

    // Initialize SMTP transporter (for Mailgun, Brevo, Gmail, etc. - NOT SendGrid)
    if (this.provider === 'mailgun' || this.provider === 'brevo' || this.provider === 'smtp') {
      const smtpConfig = {
        host: SMTP_HOST || this.getDefaultSMTPHost(this.provider),
        port: parseInt(SMTP_PORT || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
          user: SMTP_USER || this.getDefaultSMTPUser(this.provider),
          pass: SMTP_PASS || ''
        }
      };

      this.transporter = nodemailer.createTransport(smtpConfig);

      // Verify connection
      this.transporter.verify((error: Error | null) => {
        if (error) {
          console.error(`❌ ${this.provider.toUpperCase()} SMTP connection failed:`, error);
        } else {
          console.log(`✅ ${this.provider.toUpperCase()} SMTP connection verified`);
        }
      });
    }

    if (!this.resend && !this.transporter && !this.sendgridApiKey) {
      console.warn('📧 No email provider configured. Email sending is disabled.');
      console.warn('📧 Set EMAIL_PROVIDER and required API keys (SENDGRID_API_KEY, RESEND_API_KEY, or SMTP credentials)');
    }
  }

  private getDefaultSMTPHost(provider: EmailProvider): string {
    const hosts: Record<EmailProvider, string> = {
      sendgrid: 'smtp.sendgrid.net',
      mailgun: 'smtp.mailgun.org',
      brevo: 'smtp-relay.brevo.com',
      smtp: 'smtp.gmail.com',
      resend: ''
    };
    return hosts[provider] || 'smtp.gmail.com';
  }

  private getDefaultSMTPUser(provider: EmailProvider): string {
    const users: Record<EmailProvider, string> = {
      sendgrid: 'apikey',
      mailgun: process.env.MAILGUN_SMTP_USER || process.env.SMTP_USER || '',
      brevo: process.env.SMTP_USER || process.env.BREVO_SMTP_USER || '',
      smtp: process.env.SMTP_USER || '',
      resend: ''
    };
    return users[provider] || 'apikey';
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    // Try SendGrid API first if configured (preferred method)
    if (this.provider === 'sendgrid' && this.sendgridApiKey) {
      try {
        const msg = {
          to: options.to,
          from: this.fromEmail,
          subject: options.subject,
          html: options.html,
          text: options.text
        };

        console.log('📧 Attempting to send email via SendGrid API:', {
          to: options.to,
          from: this.fromEmail,
          provider: this.provider,
          hasApiKey: !!this.sendgridApiKey
        });

        const response = await sgMail.send(msg);

        console.log('📧 Email sent via SendGrid API:', {
          to: options.to,
          statusCode: response[0]?.statusCode
        });
        return true;
      } catch (error: any) {
        console.error('❌ SendGrid email sending failed:', error);
        if (error.response) {
          const errorBody = error.response.body;
          console.error('SendGrid error response:', {
            status: error.response.status,
            statusText: error.response.statusText,
            body: errorBody
          });
          
          // Check for common SendGrid errors
          if (errorBody?.errors) {
            errorBody.errors.forEach((err: any) => {
              console.error(`SendGrid Error: ${err.message}`);
              if (err.message?.includes('sender') || err.message?.includes('from')) {
                console.error('⚠️  IMPORTANT: The "from" email address must be verified in SendGrid!');
                console.error('⚠️  Go to SendGrid Dashboard → Settings → Sender Authentication');
                console.error('⚠️  Verify the email:', this.fromEmail);
              }
            });
          }
        } else {
          console.error('SendGrid error (no response):', error.message || error);
        }
        return false;
      }
    }

    // Log if SendGrid is not properly configured
    if (this.provider === 'sendgrid' && !this.sendgridApiKey) {
      console.error('❌ SendGrid provider selected but API key not found');
      console.error('❌ Check SENDGRID_API_KEY environment variable');
    }

    // Try Resend if configured
    if (this.provider === 'resend' && this.resend) {
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
        console.error('❌ Resend email sending failed:', error);
        return false;
      }
    }

    // Use SMTP transporter (Mailgun, Brevo, Gmail, etc. - NOT SendGrid)
    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: this.fromEmail,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text
        });

        console.log(`📧 Email sent via ${this.provider.toUpperCase()}:`, {
          to: options.to,
          messageId: info.messageId
        });
        return true;
      } catch (error) {
        console.error(`❌ ${this.provider.toUpperCase()} email sending failed:`, error);
        return false;
      }
    }

    // Fallback: log email content
    console.log('📧 Email sending skipped (no provider configured).');
    console.log('📧 Current provider:', this.provider);
    console.log('📧 Has SendGrid API key:', !!this.sendgridApiKey);
    console.log('📧 Has Resend:', !!this.resend);
    console.log('📧 Has SMTP transporter:', !!this.transporter);
    console.log('📧 Email content would be:');
    console.log('   To:', options.to);
    console.log('   Subject:', options.subject);
    console.log('   Content:', options.text?.substring(0, 100) + '...');
    return false; // Return false instead of true to indicate failure
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
    if (this.provider === 'sendgrid' && this.sendgridApiKey) {
      try {
        // Test SendGrid API by checking API key validity
        // We'll do a simple validation - SendGrid API keys start with SG.
        if (this.sendgridApiKey.startsWith('SG.')) {
          console.log('✅ SendGrid API key format verified');
          return true;
        } else {
          console.error('❌ Invalid SendGrid API key format (should start with SG.)');
          return false;
        }
      } catch (error) {
        console.error('❌ SendGrid connection failed:', error);
        return false;
      }
    }

    if (this.provider === 'resend' && this.resend) {
      try {
        await this.resend.domains.list();
        console.log('✅ Resend connection verified');
        return true;
      } catch (error) {
        console.error('❌ Resend connection failed:', error);
        return false;
      }
    }

    if (this.transporter) {
      return new Promise((resolve) => {
        this.transporter!.verify((error) => {
          if (error) {
            console.error(`❌ ${this.provider.toUpperCase()} connection failed:`, error);
            resolve(false);
          } else {
            console.log(`✅ ${this.provider.toUpperCase()} connection verified`);
            resolve(true);
          }
        });
      });
    }

    console.warn('📧 No email provider configured. Set EMAIL_PROVIDER and required API keys.');
    return false;
  }
}

export const emailService = new EmailService();