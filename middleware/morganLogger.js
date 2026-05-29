/**
 * Morgan Logger Configuration
 * HTTP request logging for Express.js
 */

const morgan = require("morgan");
const Logger = require("../utils/logger");

// Define custom token for logging
morgan.token("request-id", (req) => req.id || "");

// Create custom morgan format for development
const devFormat =
  ":request-id [:date[clf]] :method :url :status :res[content-length] - :response-time ms";

// Create custom morgan format for production
const prodFormat = ":method :url :status :response-time ms :remote-addr";

// Stream for morgan to use Logger
const stream = {
  write: (message) => {
    // Skip successful requests in production
    if (process.env.NODE_ENV === "production" && message.includes(" 2")) {
      return;
    }
    Logger.debug(message.trim());
  },
};

/**
 * Get appropriate morgan middleware based on environment
 */
const morganMiddleware = morgan(
  process.env.NODE_ENV === "development" ? devFormat : prodFormat,
  {
    stream,
    skip: (req, res) => {
      // Skip health check endpoints
      if (req.path === "/health" || req.path.startsWith("/health/")) {
        return true;
      }
      return false;
    },
  }
);

module.exports = morganMiddleware;
