/**
 * ==========================================
 * ProvenStack Express Server
 * Production-Grade Backend Server
 * ==========================================
 * Features:
 * - Enhanced error handling
 * - MongoDB connection with retry logic
 * - Graceful shutdown handling
 * - Socket.io for real-time chat
 * - PeerJS for peer-to-peer connections
 * - Cron jobs for scheduled tasks
 * - Comprehensive logging
 * - VAPID initialization for push notifications
 */

// ==========================================
// ENVIRONMENT SETUP
// ==========================================

require("dotenv").config();

const http = require("http");
const cron = require("node-cron");
const webpush = require("web-push");

// Utility & Service Imports
const Logger = require("./utils/logger");
const { validateEnv } = require("./utils/envValidator");

// Database & App Imports
const { connectDB, disconnectDB, getConnectionStatus } = require("./config/mongoConnection");
const app = require("./src/app");
const chatHandler = require("./socket/chatHandler");

// Model Imports for Cron Jobs
const HackathonModel = require("./models/hackathon.model");
const Team = require("./models/team.model");
const UserModel = require("./models/user.model");
const Message = require("./models/message.model");
const Notification = require("./models/Notification");
const { createNotification } = require("./services/notificationService");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ==========================================
// VALIDATION & CONFIGURATION
// ==========================================

Logger.box("🚀 PROVENSTACK SERVER INITIALIZATION");

// Validate environment variables on startup
validateEnv();

// Get configuration from environment
const PORT = parseInt(process.env.PORT, 10) || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";
const MAX_PORT_ATTEMPTS = 10;

// State tracking
let currentPort = PORT;
let isServerStarted = false;
let gracefulShutdownInProgress = false;

// ==========================================
// SERVER CREATION
// ==========================================

const server = http.createServer(app);

// ==========================================
// SOCKET.IO CONFIGURATION
// ==========================================

const io = require("socket.io")(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  pingInterval: 25000,
  pingTimeout: 20000,
});

// Expose io instance to Express app
app.set("io", io);

Logger.info("Socket.io initialized with CORS configuration");

// ==========================================
// PEERJS UPGRADE HANDLER
// ==========================================

const peerServer = app.get("peerServer");
if (peerServer && peerServer._wss) {
  server.on("upgrade", (request, socket, head) => {
    if (request.url.startsWith("/peerjs")) {
      peerServer._wss.handleUpgrade(request, socket, head, (client) => {
        peerServer._wss.emit("connection", client, request);
      });
    }
  });
  Logger.info("PeerJS WebSocket upgrade handler registered");
}

// ==========================================
// SOCKET.IO CONNECTION HANDLER
// ==========================================

io.on("connection", (socket) => {
  Logger.debug(`Socket.io: Client connected - ${socket.id}`);
  chatHandler(io, socket);
});

io.on("disconnect", (socket) => {
  Logger.debug(`Socket.io: Client disconnected - ${socket?.id}`);
});

// ==========================================
// VAPID CONFIGURATION FOR WEB PUSH
// ==========================================

if (
  process.env.VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY &&
  process.env.VAPID_EMAIL
) {
  try {
    webpush.setVapidDetails(
      `mailto:${process.env.VAPID_EMAIL}`,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    Logger.success("Web Push Notifications (VAPID) initialized");
  } catch (error) {
    Logger.warn("Failed to initialize VAPID details:", error.message);
  }
} else {
  Logger.warn(
    "Web Push Notifications disabled - VAPID keys not configured in .env"
  );
}

// ==========================================
// CRON JOBS DEFINITION
// ==========================================

/**
 * Cron Job 1 - Hackathon Starting Reminder
 * Runs every hour at :00 minutes
 * Notifies users about hackathons starting within 24 hours
 */
cron.schedule("0 * * * *", async () => {
  try {
    Logger.debug("Cron Job 1: Checking for upcoming hackathons...");

    const now = new Date();
    const twentyFourHoursFromNow = new Date(
      now.getTime() + 24 * 60 * 60 * 1000
    );

    const upcomingHackathons = await HackathonModel.find({
      startDate: { $gt: now, $lte: twentyFourHoursFromNow },
      status: "upcoming",
    });

    if (upcomingHackathons.length === 0) {
      Logger.debug("No upcoming hackathons found for 24h window");
      return;
    }

    Logger.info(
      `Found ${upcomingHackathons.length} upcoming hackathons to notify`
    );

    for (const hackathon of upcomingHackathons) {
      for (const studentId of hackathon.registeredStudents) {
        const existing = await Notification.findOne({
          recipient: studentId,
          type: "hackathon_reminder",
          message: { $regex: hackathon.name },
        });

        if (!existing) {
          await createNotification({
            recipient: studentId,
            type: "hackathon_reminder",
            message: `Reminder: The hackathon "${hackathon.name}" is starting in less than 24 hours! Get ready!`,
          });
        }
      }
    }

    Logger.success(
      `Cron Job 1: Notified users about ${upcomingHackathons.length} hackathons`
    );
  } catch (error) {
    Logger.error("Cron Job 1 Error (Hackathon Reminder):", error);
  }
});

/**
 * Cron Job 2 - AI Coach Nudge
 * Runs every 12 hours at :00 minutes
 * Provides AI-powered motivation nudges to active teams
 */
cron.schedule("0 */12 * * *", async () => {
  try {
    Logger.debug("Cron Job 2: Generating AI coach nudges for active teams...");

    const activeTeams = await Team.find({ status: "active" });
    if (activeTeams.length === 0) {
      Logger.debug("No active teams found");
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    let genAI = null;
    let model = null;

    if (apiKey) {
      genAI = new GoogleGenerativeAI(apiKey);
      model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    }

    let nudgedCount = 0;

    for (const team of activeTeams) {
      let nudgeText =
        "Keep up the momentum! Collaborate, track your tasks, and finish strong.";

      if (model) {
        try {
          const recentMessages = await Message.find({
            team: team._id,
            messageType: { $ne: "system" },
          })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate("sender", "name");

          recentMessages.reverse();

          const formattedMsgs = recentMessages
            .map((m) => `${m.sender?.name || "Member"}: ${m.message}`)
            .join("\n");

          const prompt = `You are a friendly hackathon AI coach. Team Name: ${
            team.teamName
          }. Here is the team's recent chat activity:\n${
            formattedMsgs || "No recent chat"
          }\n\nProvide a quick, encouraging 2-sentence nudge/advice to keep them motivated and focused. Do not mention specific usernames.`;

          const result = await model.generateContent(prompt);
          if (result && result.response) {
            const text = result.response.text();
            if (text && text.trim()) {
              nudgeText = text.trim();
            }
          }
        } catch (err) {
          Logger.warn(
            `Gemini failed for team ${team.teamName}, using default nudge:`,
            err.message
          );
        }
      }

      // Notify all team members
      for (const member of team.members) {
        await createNotification({
          recipient: member.userId,
          type: "team_update",
          message: `🤖 Coach Nudge: ${nudgeText}`,
          relatedTeam: team._id,
        });
      }

      nudgedCount++;
    }

    Logger.success(`Cron Job 2: Sent nudges to ${nudgedCount} teams`);
  } catch (error) {
    Logger.error("Cron Job 2 Error (AI Coach Nudge):", error);
  }
});

// ==========================================
// SERVER STARTUP WITH ERROR HANDLING
// ==========================================

/**
 * Start the server with automatic port fallback
 * If a port is busy, tries the next available port
 *
 * @param {number} portAttempt - The port to try
 */
function startServer(portAttempt = PORT) {
  currentPort = portAttempt;

  const serverSuccessHandler = () => {
    isServerStarted = true;

    Logger.box("✅ SERVER STARTED SUCCESSFULLY", [
      `🌐 URL: http://localhost:${currentPort}`,
      `📍 Environment: ${NODE_ENV}`,
      `📦 Node.js: ${process.version}`,
      `🗄️  Database: ${getConnectionStatus()}`,
      `🔌 WebSocket (Socket.io): Enabled`,
      `🎤 PeerJS: Enabled`,
      `⏰ Cron Jobs: Registered & Running`,
    ]);
  };

  const serverErrorHandler = (error) => {
    // Handle EADDRINUSE - port already in use
    if (error.code === "EADDRINUSE") {
      const nextPort = currentPort + 1;
      if (nextPort - PORT < MAX_PORT_ATTEMPTS) {
        Logger.warn(
          `Port ${currentPort} is already in use. Trying port ${nextPort}...`
        );
        server.removeAllListeners("error");
        startServer(nextPort);
      } else {
        Logger.error(
          `Could not find an available port after ${MAX_PORT_ATTEMPTS} attempts`,
          `Tried ports: ${PORT} to ${PORT + MAX_PORT_ATTEMPTS - 1}`
        );
        process.exit(1);
      }
    }
    // Handle EACCES - permission denied
    else if (error.code === "EACCES") {
      Logger.error(
        `Permission denied to listen on port ${currentPort}`,
        "Try running as Administrator or use a port > 1024"
      );
      process.exit(1);
    }
    // Handle other errors
    else {
      Logger.error("Unexpected server error:", error);
      process.exit(1);
    }
  };

  server.once("error", serverErrorHandler);
  server.listen(currentPort, "0.0.0.0", serverSuccessHandler);
}

// ==========================================
// GRACEFUL SHUTDOWN HANDLER
// ==========================================

/**
 * Gracefully shutdown the server
 * Closes connections and cleanly disconnects from database
 *
 * @param {string} signal - The signal that triggered shutdown
 */
async function gracefulShutdown(signal) {
  if (gracefulShutdownInProgress) {
    Logger.warn("Shutdown already in progress...");
    return;
  }

  gracefulShutdownInProgress = true;

  Logger.box(`⏹️  ${signal} SIGNAL RECEIVED`, [
    "Initiating graceful shutdown...",
    "Closing connections...",
  ]);

  // If server never started, exit immediately
  if (!isServerStarted) {
    Logger.warn("Server was never fully started. Exiting immediately.");
    process.exit(0);
  }

  // Close HTTP server
  server.close(async () => {
    Logger.success("✅ HTTP server closed");

    try {
      // Gracefully disconnect from MongoDB
      await disconnectDB();
      Logger.success("✅ MongoDB disconnected");
    } catch (err) {
      Logger.error("Error disconnecting from MongoDB:", err);
    }

    // Close socket.io
    try {
      io.close();
      Logger.success("✅ Socket.io connections closed");
    } catch (err) {
      Logger.error("Error closing Socket.io:", err);
    }

    Logger.box("👋 GRACEFUL SHUTDOWN COMPLETE");
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    Logger.error("Graceful shutdown timeout. Force closing...");
    process.exit(1);
  }, 30000);
}

// ==========================================
// PROCESS EVENT HANDLERS
// ==========================================

// Handle termination signals
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  Logger.error("UNCAUGHT EXCEPTION:", error);
  gracefulShutdown("uncaughtException");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  Logger.error("UNHANDLED PROMISE REJECTION:", reason);
  Logger.error("Promise:", promise);
});

// Handle warning events
process.on("warning", (warning) => {
  Logger.warn(`${warning.name}: ${warning.message}`);
});

// ==========================================
// DATABASE CONNECTION & SERVER BOOT
// ==========================================

Logger.box("📊 STARTUP DIAGNOSTICS", [
  `Port: ${PORT} (fallback enabled up to ${MAX_PORT_ATTEMPTS} attempts)`,
  `Environment: ${NODE_ENV}`,
  `Node.js: ${process.version}`,
  `Platform: ${process.platform}`,
]);

// Connect to database and start server
connectDB()
  .then(() => {
    Logger.success("✅ MongoDB connected successfully");
    startServer(PORT);
  })
  .catch((dbError) => {
    Logger.error(
      "DATABASE CONNECTION FAILED",
      dbError.message
    );

    Logger.box("⚠️  TROUBLESHOOTING", [
      "1. Check your MONGO_URI in .env file",
      "2. Verify MongoDB Atlas connection string",
      "3. Check IP whitelist on MongoDB Atlas (add 0.0.0.0/0 for development)",
      "4. Ensure internet connection is working",
      "5. Test connection with: mongosh <connection_string>",
    ]);

    Logger.error("Server startup aborted.");
    process.exit(1);
  });

module.exports = server;
