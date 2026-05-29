/**
 * Centralized Express Error Handling Middleware
 * Catches all errors and formats them consistently
 */

const Logger = require("../utils/logger");

/**
 * Custom API Error Class
 */
class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Error Handler Middleware
 * Must be the LAST middleware in express app
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Log error details
  if (statusCode >= 500) {
    Logger.error(`${statusCode} - ${message}`, err);
  } else if (statusCode >= 400) {
    Logger.warn(`${statusCode} - ${message}`);
  }

  // Build error response
  const errorResponse = {
    success: false,
    statusCode,
    message,
    timestamp: new Date().toISOString(),
  };

  // Include errors array if present (validation errors, etc.)
  if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
    errorResponse.errors = err.errors;
  }

  // Include stack trace only in development
  if (process.env.NODE_ENV === "development") {
    errorResponse.stack = err.stack;
  }

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    errorResponse.statusCode = 400;
    errorResponse.message = "Validation Error";
    errorResponse.errors = errors;
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

  // Send response
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found Handler
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  ApiError,
  errorHandler,
  notFoundHandler,
};
