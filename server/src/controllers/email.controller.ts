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

    console.log('[Email] Email controller: Attempting to send welcome email to:', userEmail);

    const result = await emailService.sendUserWelcomeEmail(
      userEmail,
      userName,
      userRole,
      temporaryPassword,
      additionalInfo
    );

    console.log('[Email] Email controller: Email send result:', result);

    res.status(200).json({
      message: result.success
        ? 'Welcome email sent successfully'
        : (result.error || 'User created but email failed to send'),
      emailSent: result.success,
      error: result.error
    });
  } catch (error) {
    console.error('[Email] Error sending welcome email:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      response: (error as any)?.response
    });
    res.status(500).json({
      message: 'Failed to send welcome email',
      emailSent: false,
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
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

    console.log('[Email] Email controller: Attempting to send student welcome email to:', studentEmail);

    const result = await emailService.sendStudentWelcomeEmail(
      studentEmail,
      studentName,
      studentNumber,
      temporaryPassword
    );

    console.log('[Email] Email controller: Email send result:', result);

    res.status(200).json({
      message: result.success
        ? 'Welcome email sent successfully'
        : (result.error || 'User created but email failed to send'),
      emailSent: result.success,
      error: result.error
    });
  } catch (error) {
    console.error('[Email] Error sending welcome email:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      response: (error as any)?.response
    });
    res.status(500).json({
      message: 'Failed to send welcome email',
      emailSent: false,
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
};

export const testEmailConnection = async (req: Request, res: Response) => {
  try {
    console.log('[Email] Email controller: Testing email connection...');
    const result = await emailService.testConnection();

    console.log('[Email] Email controller: Connection test result:', result);

    if (result.success) {
      res.json({
        message: 'Email service connection successful',
        connected: true
      });
    } else {
      // Return 200 with connected: false and error message
      res.status(200).json({
        message: result.error || 'Email service connection failed. Check server logs for details.',
        connected: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('[Email] Error testing email connection:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as any)?.code
    });

    // Return 200 with error details instead of 500
    res.status(200).json({
      message: `Email connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
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

    console.log('[Email] Email controller: Attempting to send test email to:', email);

    const result = await emailService.sendStudentWelcomeEmail(
      email,
      'Test Student',
      '99-TEST-9999',
      'testpass123'
    );

    console.log('[Email] Email controller: Test email send result:', result);

    if (result.success) {
      res.json({
        message: 'Test email sent successfully',
        emailSent: true
      });
    } else {
      // Return 200 with emailSent: false and error message
      res.status(200).json({
        message: result.error || 'Failed to send test email. Check server logs for details.',
        emailSent: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('[Email] Error sending test email:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as any)?.code
    });

    // Return 200 with error details instead of 500
    res.status(200).json({
      message: `Failed to send test email: ${error instanceof Error ? error.message : 'Unknown error'}`,
      emailSent: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};