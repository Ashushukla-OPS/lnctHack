/**
 * Environment Variables Validator
 * Ensures all required environment variables are set with proper validation
 */

const Logger = require("./logger");

const REQUIRED_VARS = {
  NODE_ENV: { required: false, default: "development" },
  PORT: { required: false, default: 3000 },
  MONGO_URI: { required: true, type: "string" },
  ACCESS_TOKEN_SECRET: { required: true, minLength: 32, type: "string" },
  REFRESH_TOKEN_SECRET: { required: true, minLength: 32, type: "string" },
  SESSION_SECRET: { required: true, minLength: 32, type: "string" },
  GEMINI_API_KEY: { required: false, type: "string" },
  VITE_API_URL: { required: false, default: "http://localhost:3000/api" },
  FRONTEND_URL: { required: false, default: "http://localhost:5173" },
};

/**
 * Validate all environment variables
 */
function validateEnv() {
  Logger.box("🔍 VALIDATING ENVIRONMENT VARIABLES");

  const errors = [];
  const warnings = [];

  Object.entries(REQUIRED_VARS).forEach(([key, config]) => {
    const value = process.env[key];

    // Check if variable is required but missing
    if (config.required && !value) {
      errors.push(`Missing required variable: ${key}`);
      return;
    }

    // If not required and not provided, use default
    if (!value) {
      if (config.default !== undefined) {
        process.env[key] = config.default;
        Logger.debug(`Using default for ${key}:`, config.default);
      }
      return;
    }

    // Type validation
    if (config.type === "string" && typeof value !== "string") {
      errors.push(`${key} must be a string`);
      return;
    }

    // Minimum length validation
    if (config.minLength && value.length < config.minLength) {
      errors.push(`${key} must be at least ${config.minLength} characters long`);
      return;
    }

    // URL validation
    if (key.includes("URL") || key.includes("URI")) {
      try {
        new URL(value);
      } catch (err) {
        errors.push(`${key} is not a valid URL: ${value}`);
      }
    }
  });

  // Add warnings for optional variables
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    warnings.push("⚠️  Google OAuth not configured (optional)");
  }

  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    warnings.push("⚠️  Web Push Notifications not configured (optional)");
  }

  // Report results
  if (errors.length > 0) {
    Logger.error("Environment validation FAILED:");
    errors.forEach((err) => Logger.error(`  • ${err}`));
    process.exit(1);
  }

  if (warnings.length > 0) {
    warnings.forEach((warn) => Logger.warn(warn));
  }

  Logger.success("Environment variables validated ✓");
}

module.exports = { validateEnv };
