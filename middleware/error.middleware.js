const Logger = require("../utils/logger");

/**
 * Centralized Error Handler Middleware
 * Catches and formats all errors consistently
 */
const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  const errors = err.errors || [];

  // Log error with appropriate level
  if (statusCode >= 500) {
    Logger.error(`[${req.method}] ${req.path} - ${statusCode}:`, err);
  } else if (statusCode >= 400) {
    Logger.warn(`[${req.method}] ${req.path} - ${statusCode}: ${message}`);
  }

  // Build error response
  const errorResponse = {
    success: false,
    statusCode,
    message,
    timestamp: new Date().toISOString(),
  };

  // Include errors array if present (validation errors)
  if (errors && Array.isArray(errors) && errors.length > 0) {
    errorResponse.errors = errors;
  }

  // Include stack trace only in development
  if (process.env.NODE_ENV === "development") {
    errorResponse.stack = err.stack;
  }

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    const validationErrors = Object.values(err.errors).map((e) => e.message);
    errorResponse.statusCode = 400;
    errorResponse.message = "Validation Error";
    errorResponse.errors = validationErrors;
  }

  // Handle Mongoose cast errors
  if (err.name === "CastError") {
    errorResponse.statusCode = 400;
    errorResponse.message = `Invalid ${err.path}: ${err.value}`;
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    errorResponse.statusCode = 401;
    errorResponse.message = "Invalid or expired token";
  }

  if (err.name === "TokenExpiredError") {
    errorResponse.statusCode = 401;
    errorResponse.message = "Token has expired";
  }

  return res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found Handler
 */
const notFoundMiddleware = (req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
};

module.exports = { errorMiddleware, notFoundMiddleware };
