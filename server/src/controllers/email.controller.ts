import { Request, Response } from 'express';
import { emailService } from '../services/email.service';

export const sendUserWelcomeEmail = async (req: Request, res: Response) => {
  try {
    const { 
      userEmail, 
      userName, 
      userRole, 
      temporaryPassword, 
      additionalInfo 
    } = req.body;

    if (!userEmail || !userName || !userRole || !temporaryPassword) {
      return res.status(400).json({ 
        message: 'Missing required fields: userEmail, userName, userRole, temporaryPassword' 
      });
    }

    console.log('📧 Email controller: Attempting to send welcome email to:', userEmail);
    
    const emailSent = await emailService.sendUserWelcomeEmail(
      userEmail,
      userName,
      userRole,
      temporaryPassword,
      additionalInfo
    );

    console.log('📧 Email controller: Email send result:', emailSent);

    res.status(200).json({
      message: emailSent
        ? 'Welcome email sent successfully'
        : 'User created but email failed to send',
      emailSent
    });
  } catch (error: any) {
    console.error('❌ Error sending welcome email:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      response: error?.response
    });
    res.status(500).json({ 
      message: 'Failed to send welcome email', 
      emailSent: false,
      error: process.env.NODE_ENV === 'development' ? (error?.message || error) : undefined 
    });
  }
};

export const sendStudentWelcomeEmail = async (req: Request, res: Response) => {
  try {
    const { studentEmail, studentName, studentNumber, temporaryPassword } = req.body;

    if (!studentEmail || !studentName || !studentNumber || !temporaryPassword) {
      return res.status(400).json({ 
        message: 'Missing required fields: studentEmail, studentName, studentNumber, temporaryPassword' 
      });
    }

    console.log('📧 Email controller: Attempting to send student welcome email to:', studentEmail);
    
    const emailSent = await emailService.sendStudentWelcomeEmail(
      studentEmail,
      studentName,
      studentNumber,
      temporaryPassword
    );

    console.log('📧 Email controller: Email send result:', emailSent);

    res.status(200).json({
      message: emailSent
        ? 'Welcome email sent successfully'
        : 'User created but email failed to send',
      emailSent
    });
  } catch (error: any) {
    console.error('❌ Error sending welcome email:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      response: error?.response
    });
    res.status(500).json({ 
      message: 'Failed to send welcome email', 
      emailSent: false,
      error: process.env.NODE_ENV === 'development' ? (error?.message || error) : undefined 
    });
  }
};

export const testEmailConnection = async (req: Request, res: Response) => {
  try {
    console.log('📧 Email controller: Testing email connection...');
    const isConnected = await emailService.testConnection();
    
    console.log('📧 Email controller: Connection test result:', isConnected);
    
    if (isConnected) {
      res.json({ 
        message: 'Email service connection successful',
        connected: true 
      });
    } else {
      // Return 200 with connected: false instead of 500
      // This way the UI can show the error message properly
      res.status(200).json({ 
        message: 'Email service connection failed. Check server logs for details.',
        connected: false 
      });
    }
  } catch (error: any) {
    console.error('❌ Error testing email connection:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      code: (error as any)?.code
    });
    
    // Return 200 with error details instead of 500
    res.status(200).json({ 
      message: `Email connection test failed: ${error?.message || 'Unknown error'}`,
      connected: false,
      error: process.env.NODE_ENV === 'development' ? (error?.message || error) : undefined 
    });
  }
};

export const sendTestEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        message: 'Email address is required' 
      });
    }

    console.log('📧 Email controller: Attempting to send test email to:', email);

    const emailSent = await emailService.sendStudentWelcomeEmail(
      email,
      'Test Student',
      '99-TEST-9999',
      'testpass123'
    );

    console.log('📧 Email controller: Test email send result:', emailSent);

    if (emailSent) {
      res.json({ 
        message: 'Test email sent successfully',
        emailSent: true 
      });
    } else {
      // Return 200 with emailSent: false instead of 500
      // This way the UI can show the error message properly
      res.status(200).json({ 
        message: 'Failed to send test email. Check server logs for details.',
        emailSent: false 
      });
    }
  } catch (error: any) {
    console.error('❌ Error sending test email:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      code: (error as any)?.code
    });
    
    // Return 200 with error details instead of 500
    // This prevents the UI from showing a generic 500 error
    res.status(200).json({ 
      message: `Failed to send test email: ${error?.message || 'Unknown error'}`,
      emailSent: false,
      error: process.env.NODE_ENV === 'development' ? (error?.message || error) : undefined 
    });
  }
};