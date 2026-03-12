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
import { validateNASConnection, getStoragePath, syncLocalToNAS } from './config/nas';
import { startNASSyncJob } from './jobs/nasSync.job';
import { testDatabaseConnection, prisma } from './config/database';

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
import companyProposalRoutes from './routes/companyProposal.routes';
import notificationRoutes from './routes/notification.routes';
import coordinatorRoutes from './routes/coordinator.routes';
import aiRoutes from './routes/ai.routes';

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

// Trust proxy - required when running behind nginx/reverse proxy
// This fixes express-rate-limit X-Forwarded-For header issues
app.set('trust proxy', 1);

// Middleware
app.use(helmet());

// IMPROVED CORS CONFIGURATION
const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const envOrigins = (process.env.CORS_ORIGIN || '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);

    const allowedOrigins = [
      ...envOrigins,
      'http://localhost:5173',
      'http://localhost:3000',
      'https://intrak-v2.onrender.com',
      'https://intrak.site',
      'https://www.intrak.site'
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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate limiting for auth routes (general protection, very lenient)
// Note: Login now uses per-account lockout instead of IP-based rate limiting
app.use('/api/auth', rateLimiter);

// Static files (uploaded documents) with CORS headers
// Use storage path (supports both local and NAS)
const storagePath = getStoragePath();
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(storagePath));

// Serve profile photos with proper headers
app.use('/api/users/profile-photo', (req, res, next) => {
  // Let the global CORS middleware set the correct origin when credentials are used.
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

// Favicon handler
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});



// Health check endpoint with database connection test
app.get('/health', async (req, res) => {
  try {
    const dbConnected = await testDatabaseConnection();
    res.json({
      status: dbConnected ? 'OK' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: dbConnected ? 'connected' : 'disconnected'
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: 'error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      errorCode: process.env.NODE_ENV === 'development' ? error.code : undefined
    });
  }
});

// API health check endpoint (for frontend compatibility)
app.get('/api/health', async (req, res) => {
  try {
    const dbConnected = await testDatabaseConnection();
    res.json({
      status: dbConnected ? 'OK' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: dbConnected ? 'connected' : 'disconnected'
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: 'error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      errorCode: process.env.NODE_ENV === 'development' ? error.code : undefined
    });
  }
});

// Debug endpoint for troubleshooting (only in development or with special header)
app.get('/api/debug/health', async (req, res) => {
  // Only allow in development or with debug header
  if (process.env.NODE_ENV === 'production' && req.headers['x-debug-key'] !== process.env.DEBUG_KEY) {
    return res.status(404).json({ message: 'Not found' });
  }

  const checks: any = {
    database: 'unknown',
    prisma: 'unknown',
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL: !!process.env.DATABASE_URL,
      JWT_SECRET: !!process.env.JWT_SECRET,
      NODE_ENV: process.env.NODE_ENV,
      USE_NAS: process.env.USE_NAS
    }
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'connected';
    checks.prisma = 'working';
  } catch (error: any) {
    checks.database = `error: ${error.message}`;
    checks.prisma = `error: ${error.code || 'unknown'}`;
    checks.errorDetails = {
      code: error.code,
      message: error.message,
      meta: error.meta
    };
  }

  res.json(checks);
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
app.use('/api/company-proposals', companyProposalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/coordinator', coordinatorRoutes);
app.use('/api/ai', aiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  // Test database connection on startup
  const initializeDatabase = async () => {
    console.log('🔌 Testing database connection...');
    try {
      const connected = await testDatabaseConnection();
      if (!connected) {
        console.error('❌ Database connection failed. Server will start but may have issues.');
        console.error('   Please check your DATABASE_URL environment variable.');
        console.error('   Current DATABASE_URL:', process.env.DATABASE_URL ? 'Set (hidden)' : 'NOT SET');
      }
    } catch (error: any) {
      console.error('❌ Database initialization error:', error.message);
      console.error('   Error code:', error.code);
      console.error('   This may cause 500 errors on all database queries.');
    }
  };

  // Wait for NAS to be ready (if enabled) and sync local files
  const waitForNAS = async () => {
    if (process.env.USE_NAS === 'true') {
      console.log('🔌 Checking NAS connection...');
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        const isValid = await validateNASConnection();
        if (isValid) {
          console.log('✅ NAS connection validated successfully');

          // Sync local files to NAS if any exist
          console.log('🔄 Checking for local files to sync to NAS...');
          const syncResult = await syncLocalToNAS();
          if (syncResult.synced > 0) {
            console.log(`✅ Synced ${syncResult.synced} files from local storage to NAS (${syncResult.hashVerified} hash-verified)`);
          }
          if (syncResult.failed > 0) {
            console.warn(`⚠️  Failed to sync ${syncResult.failed} files`);
          }
          if (syncResult.hashFailed > 0) {
            console.warn(`⚠️  ${syncResult.hashFailed} files failed hash verification after sync`);
          }

          return;
        }
        attempts++;
        if (attempts < maxAttempts) {
          console.log(`⏳ Waiting for NAS... (attempt ${attempts}/${maxAttempts})`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      console.error('❌ NAS connection failed after 10 attempts - continuing with local storage');
      process.env.USE_NAS = 'false';
    }
  };

  const startServer = async () => {
    await initializeDatabase();
    await waitForNAS();

    const http = require('http');
    const { initializeSocketServer } = require('./socket');

    const httpServer = http.createServer(app);

    // Initialize Socket.IO
    initializeSocketServer(httpServer);

    // Start scheduled NAS sync job (runs every 30 min by default)
    if (process.env.USE_NAS === 'true') {
      startNASSyncJob();
    }

    httpServer.listen(PORT, () => {
      console.log('========================================');
      console.log(`🚀 INTRAK Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
      if (process.env.USE_NAS === 'true') {
        console.log(`💾 Storage: NAS (${process.env.NAS_PATH})`);
        console.log(`⏰ NAS Sync: Scheduled (${process.env.NAS_SYNC_CRON || '*/30 * * * *'})`);
      } else {
        console.log(`💾 Storage: Local (${process.env.UPLOAD_PATH || './uploads'})`);
      }
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
  };

  startServer().catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });
}

export default app;