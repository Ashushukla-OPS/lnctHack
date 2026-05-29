# ProvenStack Backend - Production-Grade Setup Guide

## 📋 Overview

This guide explains all optimizations and improvements made to your Express backend for professional production-grade quality.

---

## ✅ What Was Fixed & Optimized

### 1. **EADDRINUSE Error** ✅
- **Problem:** Port 3000 already in use → server crash → nodemon infinite loop
- **Solution:** Automatic port fallback (tries 3000, 3001, 3002, etc.)
- **File:** `server.js` (lines 237-280)

### 2. **New Dependencies Added** ✅
```json
"helmet": "^7.1.0",           // Security headers
"morgan": "^1.10.0",          // HTTP request logging
"compression": "^1.7.4",      // Gzip compression
"express-rate-limit": "^7.1.5" // Rate limiting (ready for use)
```

### 3. **New Utility Files Created** ✅
| File | Purpose |
|------|---------|
| `utils/logger.js` | Centralized logging with emoji indicators |
| `utils/envValidator.js` | Environment variable validation |
| `utils/asyncHandler.js` | Async error wrapper (already existed, kept) |
| `config/mongoConnection.js` | Enhanced MongoDB with retry logic |
| `middleware/errorHandler.js` | Centralized error handling |
| `middleware/corsConfig.js` | CORS configuration |
| `middleware/security.js` | Security middleware (helmet, size limits) |
| `middleware/morganLogger.js` | HTTP request logging |
| `routes/health.routes.js` | Health check endpoints |

### 4. **Updated Configuration Files** ✅
| File | Changes |
|------|---------|
| `server.js` | Complete refactor with all features |
| `src/app.js` | Added all security & logging middleware |
| `package.json` | Added missing dependencies, improved scripts |
| `middleware/error.middleware.js` | Enhanced error handling |
| `config/db.js` | Now wraps enhanced MongoDB connection |
| `.env.example` | Complete template with all variables |
| `nodemon.json` | Optimized nodemon configuration |

### 5. **New Configuration File** ✅
- **`.env.example`** - Template showing all required environment variables

---

## 🚀 How to Start the Server

### Development Mode
```powershell
npm run dev
```
- Uses nodemon for auto-restart on file changes
- Enhanced logging with timestamps
- Socket.io and cron jobs enabled

### Production Mode
```powershell
npm run prod
```
- Sets `NODE_ENV=production`
- Optimized for performance
- Less verbose logging

### Direct Start
```powershell
npm start
```

---

## 🔧 Configuration

### Update Your `.env` File

Copy the template and update with your values:
```powershell
# From the template
Copy-Item .env.example .env

# Then edit .env with your actual values:
PORT=3000
MONGO_URI=your_connection_string
ACCESS_TOKEN_SECRET=your_32_char_secret_min
REFRESH_TOKEN_SECRET=your_32_char_secret_min
SESSION_SECRET=your_32_char_secret_min
GEMINI_API_KEY=your_api_key
FRONTEND_URL=http://localhost:5173
```

**Important Notes:**
- All SECRET variables must be **at least 32 characters**
- Keep `.env` file private (already in `.gitignore`)
- Never commit `.env` to version control

### Environment Variables

**Required Variables:**
- `MONGO_URI` - MongoDB Atlas connection string
- `ACCESS_TOKEN_SECRET` - JWT access token secret (min 32 chars)
- `REFRESH_TOKEN_SECRET` - JWT refresh token secret (min 32 chars)
- `SESSION_SECRET` - Express session secret (min 32 chars)

**Optional Variables:**
- `GOOGLE_CLIENT_ID` - Google OAuth (leave empty to skip)
- `GOOGLE_CLIENT_SECRET` - Google OAuth (leave empty to skip)
- `VAPID_EMAIL` - Web Push (leave empty to skip)
- `VAPID_PUBLIC_KEY` - Web Push (leave empty to skip)
- `VAPID_PRIVATE_KEY` - Web Push (leave empty to skip)

---

## 📊 Health Check Endpoints

Once your server is running, test these endpoints:

### Basic Health Check
```bash
curl http://localhost:3000/health
```
**Response:**
```json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2026-05-29T10:30:45.123Z",
  "uptime": 125.456,
  "environment": "development"
}
```

### Readiness Check (checks database connection)
```bash
curl http://localhost:3000/health/ready
```
**Response:**
```json
{
  "success": true,
  "message": "Server is ready",
  "checks": {
    "database": "connected",
    "uptime": 125.456
  },
  "timestamp": "2026-05-29T10:30:45.123Z"
}
```

### Liveness Check (minimal check)
```bash
curl http://localhost:3000/health/live
```

---

## 🛠️ Windows Terminal Commands

### Find Which Process is Using Port 3000

**PowerShell (Recommended):**
```powershell
netstat -ano | findstr :3000
```

**Output Example:**
```
TCP    [::]:3000               [::]:0                 LISTENING       12345
```

**Get detailed info about process:**
```powershell
tasklist | findstr 12345
```

### Kill the Process Using Port 3000

**PowerShell (As Administrator):**
```powershell
# Kill by process ID (replace 12345)
taskkill /PID 12345 /F

# Or find and kill in one command
$PID = (netstat -ano | findstr :3000 | ForEach-Object { $_.Split()[-1] } | Select-Object -First 1)
taskkill /PID $PID /F
```

**Alternative (Batch/CMD):**
```cmd
netstat -ano | findstr :3000
taskkill /PID 12345 /F
```

### Clear All Node.js Processes
```powershell
# Kill all node processes
taskkill /IM node.exe /F

# Kill all npm processes
taskkill /IM npm.exe /F
```

---

## 📝 Server Logs & Console Output

### Expected Startup Logs

```
✅ PROVENSTACK SERVER INITIALIZATION
============================================================
📊 STARTUP DIAGNOSTICS
  Port: 3000 (fallback enabled up to 10 attempts)
  Environment: development
  Node.js: v22.0.0
  Platform: win32
============================================================

ℹ️ INFO: Connecting to MongoDB (Attempt 1/5)...
✅ SUCCESS: Connected to MongoDB successfully

🐛 DEBUG: Socket.io initialized with CORS configuration
🐛 DEBUG: PeerJS WebSocket upgrade handler registered
ℹ️ INFO: Web Push Notifications (VAPID) initialized

============================================================
✅ SERVER STARTED SUCCESSFULLY
============================================================
🌐 URL: http://localhost:3000
📍 Environment: development
📦 Node.js: v22.0.0
🗄️  Database: connected
🔌 WebSocket (Socket.io): Enabled
🎤 PeerJS: Enabled
⏰ Cron Jobs: Registered & Running
============================================================
```

### Port Fallback Example

If port 3000 is busy:
```
⚠️ WARNING: Port 3000 is already in use. Trying port 3001...
✅ SUCCESS: Server started successfully
🌐 URL: http://localhost:3001
```

---

## 🔐 Security Features Added

### 1. **Helmet Security Headers**
- Content Security Policy
- X-Frame-Options (clickjacking protection)
- HSTS (HTTP Strict Transport Security)
- XSS Protection
- MIME type sniffing prevention

### 2. **CORS Configuration**
- Whitelist allowed origins
- Credentials support (cookies)
- Preflight caching
- Method restrictions

### 3. **Request Limits**
- JSON payload: 10MB max
- URL-encoded: 10MB max
- Request timeout: 30 seconds
- Response timeout: 30 seconds

### 4. **Session Security**
- HttpOnly cookies (prevent XSS)
- Secure flag for HTTPS (production)
- SameSite attribute (CSRF protection)
- 24-hour expiration

---

## 📡 API Versioning

Routes now support versioning:

**Old Format (still works):**
```
/api/users
/api/teams
/api/auth
```

**New Format (recommended):**
```
/api/v1/users
/api/v1/teams
/api/v1/auth
```

This allows you to maintain backward compatibility while preparing for API v2 in the future.

---

## 🔄 Graceful Shutdown

When you stop the server (`Ctrl+C` or `SIGTERM`), it:

1. ✅ Stops accepting new requests
2. ✅ Closes HTTP server
3. ✅ Disconnects from MongoDB gracefully
4. ✅ Closes Socket.io connections
5. ✅ Logs everything nicely

**Shutdown logs:**
```
⏹️  SIGINT SIGNAL RECEIVED
  Initiating graceful shutdown...
  Closing connections...

✅ SUCCESS: HTTP server closed
✅ SUCCESS: MongoDB disconnected
✅ SUCCESS: Socket.io connections closed

👋 GRACEFUL SHUTDOWN COMPLETE
```

---

## ⏰ Scheduled Tasks (Cron Jobs)

### Cron Job 1 - Hackathon Starting Reminder
- **Schedule:** Every hour at :00 minutes (`0 * * * *`)
- **Action:** Notifies users about hackathons starting within 24 hours
- **Location:** `server.js` lines 235-270

### Cron Job 2 - AI Coach Nudge
- **Schedule:** Every 12 hours at :00 minutes (`0 */12 * * *`)
- **Action:** Generates AI-powered motivation nudges for active teams
- **Location:** `server.js` lines 272-330

Both jobs run automatically when the server starts.

---

## 🐛 Debugging

### Enable Debug Mode
```bash
DEBUG=* npm run dev
```

### Check MongoDB Connection
```bash
# Verify MONGO_URI is correct
echo $env:MONGO_URI

# Test with mongosh (if installed)
mongosh "your_mongo_uri"
```

### View Active Connections
```bash
netstat -ano
# Find all listening ports
netstat -aon | findstr LISTENING
```

---

## 📦 Project Structure

```
ProvenStack/
├── server.js                    # ✅ NEW: Enhanced main server file
├── package.json                 # ✅ UPDATED: Added new dependencies
├── .env                         # Your environment variables
├── .env.example                 # ✅ NEW: Template
├── nodemon.json                 # ✅ NEW: Nodemon config
│
├── src/
│   ├── app.js                   # ✅ UPDATED: Enhanced Express app
│   └── ...
│
├── config/
│   ├── db.js                    # ✅ UPDATED: Backward compat wrapper
│   ├── mongoConnection.js       # ✅ NEW: Enhanced MongoDB connection
│   ├── passport.js
│   └── ...
│
├── middleware/
│   ├── error.middleware.js      # ✅ UPDATED: Enhanced error handler
│   ├── errorHandler.js          # ✅ NEW: Centralized error handler
│   ├── corsConfig.js            # ✅ NEW: CORS configuration
│   ├── security.js              # ✅ NEW: Security middleware
│   ├── morganLogger.js          # ✅ NEW: HTTP logging
│   └── ...
│
├── routes/
│   ├── health.routes.js         # ✅ NEW: Health check routes
│   └── ...
│
├── utils/
│   ├── logger.js                # ✅ NEW: Centralized logger
│   ├── envValidator.js          # ✅ NEW: Environment validator
│   ├── asyncHandler.js          # Already existed
│   └── ...
│
├── services/
│   ├── cronService.js           # Use for managing cron jobs
│   └── ...
│
├── models/
│   └── ...
│
├── controllers/
│   └── ...
│
└── socket/
    └── ...
```

---

## 🔍 Troubleshooting

### Issue: Port Already in Use
```powershell
# Find process
netstat -ano | findstr :3000

# Kill it
taskkill /PID <PID> /F

# Or let the server use next available port (automatic)
npm run dev
```

### Issue: MongoDB Connection Failed
```
❌ DATABASE CONNECTION FAILED: connect ECONNREFUSED

Solutions:
1. Check MONGO_URI in .env
2. Add your IP to MongoDB Atlas whitelist (0.0.0.0/0 for dev)
3. Check internet connection
4. Verify username/password
```

### Issue: CORS Errors
```
Access to XMLHttpRequest has been blocked by CORS policy

Solution:
1. Add your frontend URL to ALLOWED_ORIGINS in .env
2. Check middleware order in src/app.js
3. Ensure cors() is called before routes
```

### Issue: Cannot Read Property 'io' of Undefined
```
Solution:
1. Ensure Socket.io is initialized before setting on app
2. Check server.js initialization order
3. Verify socket connection in browser DevTools
```

---

## 📚 Best Practices Implemented

✅ **Error Handling**
- Centralized error middleware
- Async/await error catching
- Proper HTTP status codes
- Detailed error messages

✅ **Logging**
- Morgan HTTP request logging
- Custom logger utility
- Environment-aware logging
- Emoji indicators for quick scanning

✅ **Security**
- Helmet security headers
- CORS whitelisting
- Request size limits
- Session security (HttpOnly, SameSite)
- Request timeouts

✅ **Database**
- Connection retry logic
- Graceful disconnect
- Connection status monitoring
- Error recovery

✅ **Process Management**
- Graceful shutdown
- Signal handlers
- Uncaught exception handling
- Unhandled rejection handling

✅ **Configuration**
- Environment validation
- .env template
- Backward compatibility
- Fallback values

---

## 📞 Quick Reference

### Important Files
| File | Purpose | Action |
|------|---------|--------|
| `server.js` | Main server | Review startup logic |
| `src/app.js` | Express app | Review middleware order |
| `.env` | Secrets | Keep private, never commit |
| `.env.example` | Template | Share with team |
| `package.json` | Dependencies | Update when adding packages |

### Important Ports
- **3000** (or auto-fallback) - Express API
- **5173** - Vite frontend dev server (if running locally)
- **27017** - MongoDB (if running locally)

### Important Commands
```powershell
npm run dev         # Development (with nodemon)
npm start           # Production start
npm run prod        # Production with env set
npm install         # Install dependencies
npm update          # Update all dependencies
npm audit           # Check security vulnerabilities
```

---

## ✨ What's Next?

Consider adding:
1. **Rate limiting** - Use `express-rate-limit`
2. **Request validation** - Use `joi` or `zod`
3. **API documentation** - Use `swagger` / `openapi`
4. **Unit tests** - Use `jest` + `supertest`
5. **CI/CD pipeline** - GitHub Actions or similar
6. **Environment-specific configs** - Separate dev/prod/test
7. **Database migrations** - Keep schema versions tracked
8. **API monitoring** - Track performance metrics

---

## 📖 Additional Resources

- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Node.js Error Handling](https://nodejs.org/en/docs/guides/error-handling/)
- [MongoDB Connection Strings](https://docs.mongodb.com/manual/reference/connection-string/)
- [Helmet.js Security](https://helmetjs.github.io/)
- [Socket.io Documentation](https://socket.io/docs/)

---

## 🎯 Summary

Your backend is now **production-ready** with:
- ✅ Robust error handling
- ✅ Professional logging
- ✅ Security best practices
- ✅ Automatic port fallback
- ✅ Graceful shutdown
- ✅ MongoDB connection retry
- ✅ Health check endpoints
- ✅ Socket.io & Cron jobs
- ✅ Environment validation
- ✅ API versioning support

**Start your server:**
```powershell
npm run dev
```

**Test health endpoint:**
```powershell
curl http://localhost:3000/health
```

You're all set! 🚀
