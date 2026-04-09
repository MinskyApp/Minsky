/**
 * Main application entry point
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const logger = require('./utils/logger');

// Import controllers and middleware
const ContentController = require('./controllers/contentController');
const { validateContentGeneration } = require('./middleware/validation');
const { globalErrorHandler, notFoundHandler } = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');

// Create Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Initialize controllers
const contentController = new ContentController();

// Health check endpoint (no logging for frequent checks)
app.get('/health', contentController.healthCheck);

// API info endpoint
app.get('/api/info', contentController.getApiInfo);

// Main content generation endpoint
app.post('/ai/generate-content', 
  validateContentGeneration,
  contentController.generateContent
);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'AI Content Generator API is running',
    version: '1.0.0',
    documentation: '/api/info'
  });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(globalErrorHandler);

// Start server
const PORT = config.PORT;
const server = app.listen(PORT, () => {
  logger.info(`Server started successfully`, {
    port: PORT,
    environment: config.NODE_ENV,
    pid: process.pid
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

module.exports = app;
