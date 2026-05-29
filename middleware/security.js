/**
 * Security Middleware Configuration
 * Includes helmet, rate limiting, and request size limits
 */

const helmet = require("helmet");
const express = require("express");

/**
 * Security Headers Middleware using Helmet
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  frameguard: {
    action: "deny", // Prevent clickjacking
  },
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true, // Prevent MIME type sniffing
  xssFilter: true, // Enable XSS filtering
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
});

/**
 * Request Size Limits
 */
const requestLimits = {
  json: express.json({ limit: "10mb" }),
  urlencoded: express.urlencoded({ limit: "10mb", extended: true }),
};

/**
 * Request Timeout Middleware
 */
const requestTimeout = (req, res, next) => {
  req.setTimeout(30000); // 30 seconds
  res.setTimeout(30000); // 30 seconds
  next();
};

module.exports = {
  securityHeaders,
  requestLimits,
  requestTimeout,
};
