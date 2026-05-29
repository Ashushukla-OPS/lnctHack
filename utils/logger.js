/**
 * Centralized Logger for Production-Grade Logging
 */

const LOG_LEVELS = {
  ERROR: "❌",
  WARN: "⚠️",
  INFO: "ℹ️",
  SUCCESS: "✅",
  DEBUG: "🐛",
  SERVER: "🚀",
};

class Logger {
  /**
   * Log error messages
   */
  static error(message, error = null) {
    console.error(`${LOG_LEVELS.ERROR} ERROR: ${message}`);
    if (error) {
      console.error(`   Details: ${error.message || error}`);
      if (process.env.NODE_ENV === "development" && error.stack) {
        console.error(`   Stack: ${error.stack}`);
      }
    }
  }

  /**
   * Log warning messages
   */
  static warn(message, details = null) {
    console.warn(`${LOG_LEVELS.WARN} WARNING: ${message}`);
    if (details) console.warn(`   Details: ${details}`);
  }

  /**
   * Log info messages
   */
  static info(message, details = null) {
    console.log(`${LOG_LEVELS.INFO} INFO: ${message}`);
    if (details) console.log(`   Details: ${details}`);
  }

  /**
   * Log success messages
   */
  static success(message, details = null) {
    console.log(`${LOG_LEVELS.SUCCESS} SUCCESS: ${message}`);
    if (details) console.log(`   Details: ${details}`);
  }

  /**
   * Log debug messages (only in development)
   */
  static debug(message, details = null) {
    if (process.env.NODE_ENV === "development") {
      console.log(`${LOG_LEVELS.DEBUG} DEBUG: ${message}`);
      if (details) console.log(`   Details:`, details);
    }
  }

  /**
   * Log server messages
   */
  static server(message, details = null) {
    console.log(`${LOG_LEVELS.SERVER} SERVER: ${message}`);
    if (details) console.log(`   Details: ${details}`);
  }

  /**
   * Print a separator line for better readability
   */
  static separator() {
    console.log("=".repeat(60));
  }

  /**
   * Print formatted box with title
   */
  static box(title, content = null) {
    console.log("\n" + "=".repeat(60));
    console.log(`  ${title}`);
    console.log("=".repeat(60));
    if (content) {
      Array.isArray(content)
        ? content.forEach((line) => console.log(`  ${line}`))
        : console.log(`  ${content}`);
    }
  }
}

module.exports = Logger;
