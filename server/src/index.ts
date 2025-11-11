import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter, loginRateLimiter } from './middleware/rateLimiter';
import { authenticate, AuthRequest } from './middleware/auth';
import { checkMaintenanceMode } from './middleware/maintenance';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import adminRoutes from './routes/admin.routes';
import studentRoutes from './routes/student.routes';
import companyRoutes from './routes/company.routes';
import documentRoutes from './routes/document.routes';
import attendanceRoutes from './routes/attendance.routes';
import evaluationRoutes from './routes/evaluation.routes';
import announcementRoutes from './routes/announcement.routes';
import reportRoutes from './routes/report.routes';
import auditRoutes from './routes/audit.routes';
import emailRoutes from './routes/email.routes';
import templateRoutes from './routes/template.routes';
import activityRoutes from './routes/activity.routes';
import alertRoutes from './routes/alert.routes';
import companyApplicationRoutes from './routes/companyApplication.routes';
import notificationRoutes from './routes/notification.routes';
import coordinatorRoutes from './routes/coordinator.routes';

dotenv.config();

// Verify JWT secrets
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'test') {
    process.env.JWT_SECRET = 'test-secret';
  } else {
    console.error('❌ JWT_SECRET missing in .env!');
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());

// IMPROVED CORS CONFIGURATION
const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      process.env.CORS_ORIGIN || 'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5173'
    ];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting for auth routes
app.use('/api/auth', rateLimiter);

// More specific rate limiting for login endpoint
app.use('/api/auth/login', loginRateLimiter);

// Static files (uploaded documents) with CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '../uploads')));

// Serve profile photos with proper headers
app.use('/api/users/profile-photo', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

// Health check (no auth required)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Favicon handler
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// TEST ENDPOINT - Add this to verify auth is working
app.get('/api/test-auth', authenticate, (req: AuthRequest, res) => {
  res.json({
    message: '✅ Authentication successful!',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes (temporarily disabling maintenance mode to allow login)
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/company-applications', companyApplicationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/coordinator', coordinatorRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log('========================================');
    console.log(`🚀 INTRAK Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
    console.log('========================================');
    console.log('');
    console.log('📋 Available endpoints:');
    console.log('   POST   /api/auth/login');
    console.log('   POST   /api/auth/register');
    console.log('   GET    /api/test-auth (test authentication)');
    console.log('   GET    /api/users (requires auth)');
    console.log('   GET    /health');
    console.log('');
  });
}

export default app;