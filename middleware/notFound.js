/**
 * Not Found Middleware
 * Handle 404 errors for undefined routes
 */

const { AppError } = require('./errorHandler');

const notFound = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

module.exports = notFound;
