/**
 * R-GRAM Backend Server
 * Main entry point for the Instagram-like social media API
 * Focused on spiritual/religious content
 */

const app = require('./app');
const connectDB = require('./config/database');

// Load environment variables
require('dotenv').config();

const PORT = process.env.PORT || 5001;

// Connect to MongoDB
console.log('MONGODB_URI:', process.env.MONGODB_URI);
connectDB();

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 R-GRAM Server running on port ${PORT}`);
  console.log(`📱 API Base URL: http://localhost:${PORT}/api/v1`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`📊 Database: Connected to MongoDB`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`❌ Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log(`❌ Error: ${err.message}`);
  console.log('Shutting down the server due to uncaught exception');
  process.exit(1);
});

module.exports = server;
