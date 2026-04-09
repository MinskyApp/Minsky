/**
 * Global error handling middleware
 */

const logger = require('../utils/logger');

/**
 * Custom error class for application errors
 */
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle operational errors (send to client)
 * @param {Error} err - Error object
 * @param {Object} res - Express response object
 */
const handleOperationalError = (err, res) => {
  const response = {
    success: false,
    error: err.message,
    statusCode: err.statusCode || 500
  };

  // Include additional details in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.details = err.details || null;
  }

  res.status(err.statusCode || 500).json(response);
};

/**
 * Handle programming errors (log and send generic message)
 * @param {Error} err - Error object
 * @param {Object} res - Express response object
 */
const handleProgrammingError = (err, res) => {
  logger.error('Programming error occurred', {
    error: err.message,
    stack: err.stack
  });

  const response = {
    success: false,
    error: 'Something went wrong on our end. Please try again later.',
    statusCode: 500
  };

  if (process.env.NODE_ENV === 'development') {
    response.error = err.message;
    response.stack = err.stack;
  }

  res.status(500).json(response);
};

/**
 * Global error handler middleware
 */
const globalErrorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Determine error type and handle accordingly
  if (err.isOperational) {
    return handleOperationalError(err, res);
  } else {
    return handleProgrammingError(err, res);
  }
};

/**
 * Handle 404 errors
 */
const notFoundHandler = (req, res, next) => {
  const err = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(err);
};

/**
 * Async error wrapper
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Express middleware function
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  globalErrorHandler,
  notFoundHandler,
  catchAsync
};
