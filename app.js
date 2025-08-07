/**
 * R-GRAM Express Application
 * Main application setup with middleware, routes, and error handling
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const reelRoutes = require('./routes/reelRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const searchRoutes = require('./routes/searchRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

// Import middleware
const notFound = require('./middleware/notFound');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// ========================================
// SECURITY MIDDLEWARE
// ========================================

// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      mediaSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ========================================
// PARSING MIDDLEWARE
// ========================================

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ========================================
// LOGGING
// ========================================

// HTTP request logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ========================================
// STATIC FILES
// ========================================

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ========================================
// HEALTH CHECK
// ========================================

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'R-GRAM API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ========================================
// API ROUTES
// ========================================

// Mount API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/post', postRoutes);
app.use('/api/v1/reel', reelRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/settings', settingsRoutes);

// Log all registered routes
app._router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log(`👉 ${Object.keys(r.route.methods)[0].toUpperCase()} ${r.route.path}`);
  }
});

// ========================================
// ROOT ROUTE
// ========================================

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to R-GRAM API',
    version: '1.0.0',
    description: 'Instagram-like social media API focused on spiritual/religious content',
    documentation: '/api/v1/docs',
    health: '/health'
  });
});

// ========================================
// ERROR HANDLING
// ========================================

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

module.exports = app;
