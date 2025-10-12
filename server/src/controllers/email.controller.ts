import { Request, Response } from 'express';
import { emailService } from '../services/email.service';

export const sendStudentWelcomeEmail = async (req: Request, res: Response) => {
  try {
    const { studentEmail, studentName, studentNumber, temporaryPassword } = req.body;

    if (!studentEmail || !studentName || !studentNumber || !temporaryPassword) {
      return res.status(400).json({ 
        message: 'Missing required fields: studentEmail, studentName, studentNumber, temporaryPassword' 
      });
    }

    const emailSent = await emailService.sendStudentWelcomeEmail(
      studentEmail,
      studentName,
      studentNumber,
      temporaryPassword
    );

    if (emailSent) {
      res.json({ 
        message: 'Welcome email sent successfully',
        emailSent: true 
      });
    } else {
      res.status(500).json({ 
        message: 'Failed to send welcome email',
        emailSent: false 
      });
    }
  } catch (error) {
    console.error('Error sending welcome email:', error);
    res.status(500).json({ 
      message: 'Failed to send welcome email', 
      error: process.env.NODE_ENV === 'development' ? error : undefined 
    });
  }
};

export const testEmailConnection = async (req: Request, res: Response) => {
  try {
    const isConnected = await emailService.testConnection();
    
    if (isConnected) {
      res.json({ 
        message: 'Email service connection successful',
        connected: true 
      });
    } else {
      res.status(500).json({ 
        message: 'Email service connection failed',
        connected: false 
      });
    }
  } catch (error) {
    console.error('Error testing email connection:', error);
    res.status(500).json({ 
      message: 'Failed to test email connection', 
      error: process.env.NODE_ENV === 'development' ? error : undefined 
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

    const emailSent = await emailService.sendStudentWelcomeEmail(
      email,
      'Test Student',
      '99-TEST-9999',
      'testpass123'
    );

    if (emailSent) {
      res.json({ 
        message: 'Test email sent successfully',
        emailSent: true 
      });
    } else {
      res.status(500).json({ 
        message: 'Failed to send test email',
        emailSent: false 
      });
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ 
      message: 'Failed to send test email', 
      error: process.env.NODE_ENV === 'development' ? error : undefined 
    });
  }
};