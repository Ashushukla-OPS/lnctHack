/**
 * Health Check Routes
 * Provides endpoints for monitoring server and dependency health
 */

const express = require("express");
const mongoose = require("mongoose");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

/**
 * GET /health
 * Basic health check - returns 200 if server is running
 */
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

/**
 * GET /health/ready
 * Readiness check - returns 200 only if server and DB are ready
 */
router.get(
  "/ready",
  asyncHandler(async (req, res) => {
    const mongoStatus = mongoose.connection.readyState;
    const isReady = mongoStatus === 1; // 1 = connected

    res.status(isReady ? 200 : 503).json({
      success: isReady,
      message: isReady ? "Server is ready" : "Server is not ready",
      checks: {
        database: isReady ? "connected" : "disconnected",
        uptime: process.uptime(),
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /health/live
 * Liveness check - basic check if process is alive
 */
router.get("/live", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Process is alive",
    pid: process.pid,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
