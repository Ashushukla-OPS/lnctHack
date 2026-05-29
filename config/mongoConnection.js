/**
 * Enhanced MongoDB Connection with Retry Logic and Graceful Disconnect
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Logger = require("../utils/logger");

const MONGO_URI = process.env.MONGO_URI;
const RETRY_ATTEMPTS = parseInt(process.env.MONGO_RETRY_ATTEMPTS, 10) || 5;
const RETRY_DELAY = parseInt(process.env.MONGO_RETRY_DELAY, 10) || 3000;

let connectionAttempt = 0;

/**
 * Connect to MongoDB with retry logic
 */
async function connectDB() {
  try {
    connectionAttempt++;

    Logger.info(`Connecting to MongoDB (Attempt ${connectionAttempt}/${RETRY_ATTEMPTS})...`);

    const connection = await mongoose.connect(MONGO_URI, {
      retryWrites: true,
      w: "majority",
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    Logger.success("✅ Connected to MongoDB successfully", MONGO_URI.split("@")[1]);

    // Setup event listeners
    setupConnectionListeners();

    return connection;
  } catch (error) {
    Logger.error("MongoDB connection failed:", error);

    if (connectionAttempt < RETRY_ATTEMPTS) {
      Logger.warn(`Retrying in ${RETRY_DELAY}ms...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      return connectDB();
    } else {
      Logger.error(
        `❌ Failed to connect to MongoDB after ${RETRY_ATTEMPTS} attempts`,
        `Error: ${error.message}`
      );
      throw error;
    }
  }
}

/**
 * Setup MongoDB connection event listeners
 */
function setupConnectionListeners() {
  mongoose.connection.on("connected", () => {
    Logger.info("MongoDB: Connection established");
  });

  mongoose.connection.on("disconnected", () => {
    Logger.warn("MongoDB: Connection disconnected");
  });

  mongoose.connection.on("reconnected", () => {
    Logger.success("MongoDB: Reconnected successfully");
  });

  mongoose.connection.on("error", (error) => {
    Logger.error("MongoDB Connection Error:", error);
  });
}

/**
 * Gracefully disconnect from MongoDB
 */
async function disconnectDB() {
  try {
    if (mongoose.connection.readyState === 0) {
      Logger.warn("MongoDB: No active connection to disconnect");
      return;
    }

    await mongoose.disconnect();
    Logger.success("MongoDB: Disconnected successfully");
  } catch (error) {
    Logger.error("Error disconnecting from MongoDB:", error);
    throw error;
  }
}

/**
 * Get MongoDB connection status
 */
function getConnectionStatus() {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  return states[mongoose.connection.readyState] || "unknown";
}

module.exports = {
  connectDB,
  disconnectDB,
  getConnectionStatus,
};
