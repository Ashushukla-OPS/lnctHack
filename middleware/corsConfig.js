/**
 * CORS Configuration
 * Handles Cross-Origin Resource Sharing with security best practices
 */

const cors = require("cors");

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "").split(",").filter(Boolean);

if (ALLOWED_ORIGINS.length === 0) {
  // Default origins for development
  ALLOWED_ORIGINS.push(
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173"
  );
}

const corsOptions = {
  // Only allow specified origins
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);

    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS not allowed for origin: ${origin}`));
    }
  },

  // Allow credentials (cookies, authorization headers)
  credentials: true,

  // Allowed HTTP methods
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  // Allowed headers
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],

  // Headers to expose to the client
  exposedHeaders: ["Content-Range", "X-Content-Range"],

  // Cache preflight requests for 10 minutes
  maxAge: 600,

  // Allow requests to continue on same-site
  optionsSuccessStatus: 200,
};

module.exports = cors(corsOptions);
