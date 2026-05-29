/**
 * Express Application Configuration
 * Production-grade setup with security, logging, and error handling
 */

const express = require("express");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const passport = require("passport");
const compression = require("compression");
const http = require("http");
const { ExpressPeerServer } = require("peer");

// Load Passport Configuration
require("../config/passport");

// Middleware Imports
const morganLogger = require("../middleware/morganLogger");
const corsConfig = require("../middleware/corsConfig");
const { securityHeaders, requestLimits, requestTimeout } = require("../middleware/security");
const { errorMiddleware, notFoundMiddleware } = require("../middleware/error.middleware");

// Route Imports
const authRoutes = require("../routes/auth.routes");
const userRoutes = require("../routes/user.routes");
const teamRoutes = require("../routes/team.routes");
const requestRoutes = require("../routes/request.routes");
const scoreRoutes = require("../routes/score.routes");
const messageRoutes = require("../routes/message.routes");
const hackathonRoutes = require("../routes/hackathon.routes");
const joinRequestRoutes = require("../routes/joinRequest.routes");
const notificationRoutes = require("../routes/notification.routes");
const requestChatRoutes = require("../routes/requestChat.routes");
const taskRoutes = require("../routes/task.routes");
const meetRoutes = require("../routes/meet.routes");
const summaryRoutes = require("../routes/chatSummary.routes");
const aiMatchRoutes = require("../routes/aiMatch.routes");
const healthRoutes = require("../routes/health.routes");

const app = express();

// ==========================================
// SECURITY & COMPRESSION MIDDLEWARE
// ==========================================

// 1. Security Headers (Helmet)
app.use(securityHeaders);

// 2. CORS Configuration
app.use(corsConfig);

// 3. Compression - Gzip responses
app.use(compression());

// 4. Request Timeout
app.use(requestTimeout);

// ==========================================
// REQUEST PARSING MIDDLEWARE
// ==========================================

// 5. JSON Body Parser with size limit
app.use(requestLimits.json);

// 6. URL Encoded Parser with size limit
app.use(requestLimits.urlencoded);

// 7. Cookie Parser
app.use(cookieParser());

// ==========================================
// REQUEST LOGGING MIDDLEWARE
// ==========================================

// 8. Morgan HTTP Logger
app.use(morganLogger);

// ==========================================
// SESSION & AUTHENTICATION MIDDLEWARE
// ==========================================

// 9. Express Session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "provenstack_session_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      httpOnly: true, // Prevent client-side JS from accessing cookies
      sameSite: "lax", // CSRF protection
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// 10. Passport Initialize
app.use(passport.initialize());

// 11. Passport Session
app.use(passport.session());

// ==========================================
// PEERJS SERVER MOUNT
// ==========================================

// Mount PeerJS server at /peerjs path
// Uses a dummy server here for middleware initialization
// The actual server's upgrade/connection socket binding is handled in server.js
const dummyServer = http.createServer();
const peerServer = ExpressPeerServer(dummyServer, {
  debug: process.env.NODE_ENV === "development",
  path: "/",
});
app.use("/peerjs", peerServer);
app.set("peerServer", peerServer);

// ==========================================
// API ROUTES - v1 VERSIONING PATTERN
// ==========================================

// Health Check Routes (always available)
app.use("/health", healthRoutes);

// Core API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/teams", teamRoutes);
app.use("/api/v1/requests", requestRoutes);
app.use("/api/v1/score", scoreRoutes);
app.use("/api/v1/message", messageRoutes);
app.use("/api/v1/hackathon", hackathonRoutes);
app.use("/api/v1/join-request", joinRequestRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/request-chat", requestChatRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/meet", meetRoutes);
app.use("/api/v1/summary", summaryRoutes);
app.use("/api/v1/ai", aiMatchRoutes);

// Keep old routes for backward compatibility (without /v1)
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/score", scoreRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/hackathon", hackathonRoutes);
app.use("/api/join-request", joinRequestRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/request-chat", requestChatRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/meet", meetRoutes);
app.use("/api/summary", summaryRoutes);
app.use("/api/ai", aiMatchRoutes);

// ==========================================
// 404 & ERROR HANDLING MIDDLEWARE
// ==========================================

// 12. 404 Not Found Handler (must be before error handler)
app.use(notFoundMiddleware);

// 13. Centralized Error Handler (must be LAST)
app.use(errorMiddleware);

module.exports = app;