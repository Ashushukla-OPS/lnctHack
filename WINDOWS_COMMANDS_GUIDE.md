# Windows Terminal Commands & Troubleshooting Guide

## 🔍 Finding & Killing Port 3000

### Quick Command
```powershell
# Find the process
netstat -ano | findstr :3000

# Kill it (replace PID with the number from above)
taskkill /PID 12345 /F
```

### One-Liner (Find + Kill)
```powershell
$PID = (netstat -ano | findstr :3000 | ForEach-Object { $_.Split()[-1] } | Select-Object -First 1); if ($PID) { taskkill /PID $PID /F; Write-Host "Process killed" } else { Write-Host "No process found on port 3000" }
```

### Advanced PowerShell Script
```powershell
# Save as Kill-Port.ps1
param(
    [int]$Port = 3000
)

$netstat = netstat -ano | findstr ":$Port"
if ($netstat) {
    $PID = $netstat.Split()[-1]
    Write-Host "Found process on port $Port with PID: $PID"
    taskkill /PID $PID /F
    Write-Host "Process killed successfully"
} else {
    Write-Host "No process found on port $Port"
}

# Usage:
# .\Kill-Port.ps1 3000
```

---

## 📋 Common netstat Commands

### See All Listening Ports
```powershell
netstat -aon | findstr LISTENING
```

### See Specific Port Status
```powershell
# Check if port 3000 is listening
netstat -ano | findstr "3000"

# Check multiple ports
netstat -ano | findstr ":3000\|:5173\|:27017"
```

### See All Node.js Processes
```powershell
tasklist | findstr node.exe
```

### See All npm Processes
```powershell
tasklist | findstr npm.exe
```

---

## 🚀 Starting Your Server

### Normal Start (Windows PowerShell)
```powershell
cd "C:\Users\ASHUTOSH SHUKLA\Desktop\ProvenStack"
npm run dev
```

### Run as Administrator (if needed)
```powershell
# Right-click PowerShell → Run as Administrator
cd "C:\Users\ASHUTOSH SHUKLA\Desktop\ProvenStack"
npm run dev
```

### Check Node.js Version
```powershell
node --version
npm --version
```

### Update npm (if needed)
```powershell
npm install -g npm@latest
```

---

## 🔧 Installation & Setup

### First-Time Setup
```powershell
# Navigate to project
cd "C:\Users\ASHUTOSH SHUKLA\Desktop\ProvenStack"

# Install dependencies
npm install

# Copy environment template
Copy-Item .env.example .env

# Edit .env with your values
notepad .env
```

### After Installing New Dependencies
```powershell
# Remove old modules
Remove-Item -Recurse node_modules

# Reinstall everything
npm install

# Start server
npm run dev
```

---

## 📊 Testing Endpoints

### Using PowerShell (Invoke-WebRequest)
```powershell
# Health check
Invoke-WebRequest -Uri "http://localhost:3000/health" | Select-Object -ExpandProperty Content

# With JSON formatting
(Invoke-WebRequest -Uri "http://localhost:3000/health").Content | ConvertFrom-Json | ConvertTo-Json

# Readiness check
Invoke-WebRequest -Uri "http://localhost:3000/health/ready" | Select-Object -ExpandProperty Content
```

### Using curl (if installed)
```powershell
curl http://localhost:3000/health
curl http://localhost:3000/health/ready
```

### Using Invoke-RestMethod (cleaner output)
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/health"
Invoke-RestMethod -Uri "http://localhost:3000/health/ready"
```

---

## 🛑 Stopping the Server

### Graceful Shutdown
```powershell
# Press Ctrl+C in the terminal where server is running
# It will gracefully close all connections

# Output:
# ⏹️  SIGINT SIGNAL RECEIVED
#   Initiating graceful shutdown...
# ✅ HTTP server closed
# 👋 GRACEFUL SHUTDOWN COMPLETE
```

### Force Kill
```powershell
# Find the process
$PID = (netstat -ano | findstr ":3000" | ForEach-Object { $_.Split()[-1] } | Select-Object -First 1)

# Kill it
taskkill /PID $PID /F

# Or kill all node processes
taskkill /IM node.exe /F
```

---

## 🚨 EADDRINUSE Error - Complete Fix

### Error Message
```
Error: listen EADDRINUSE: address already in use :::3000
code: 'EADDRINUSE'
errno: -4091
syscall: 'listen'
address: '::'
port: 3000
```

### Step 1: Find the Process
```powershell
netstat -ano | findstr :3000
```

**Output Example:**
```
TCP    [::]:3000               [::]:0              LISTENING       12345
```

### Step 2: Kill the Process
```powershell
# Replace 12345 with your actual PID
taskkill /PID 12345 /F

# Verification
netstat -ano | findstr :3000
# Should return nothing if successful
```

### Step 3: Start Server Again
```powershell
npm run dev
```

### Alternative: Let Server Find Available Port

The new server automatically finds an available port:
```
⚠️  Port 3000 is already in use. Trying port 3001...
✅ Server running at http://localhost:3001
```

---

## 🔗 MongoDB Connection Issues

### Issue 1: Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Fix:**
```powershell
# Check if MongoDB is running (if local)
# Add IP to MongoDB Atlas whitelist:
# 1. Go to MongoDB Atlas
# 2. Network Access
# 3. Add IP Address (use 0.0.0.0/0 for development)
# 4. Or use the auto-detected IP
```

### Issue 2: Invalid URI
```
Error: Invalid connection string
```

**Fix:**
```powershell
# Check your .env file
notepad .env

# MONGO_URI should look like:
# MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
```

### Issue 3: Authentication Failed
```
Error: MongoAuthenticationError: Authentication failed
```

**Fix:**
```powershell
# Check username/password in MONGO_URI
# Ensure special characters are URL-encoded:
# ! = %21
# @ = %40
# # = %23
# $ = %24
# % = %25
# etc.
```

### Test MongoDB Connection
```powershell
# Using mongosh (if installed)
mongosh "your_mongo_uri"

# Or check connection string format
Write-Host $env:MONGO_URI
```

---

## 📝 Log Files & Debugging

### View Server Logs
```powershell
# Logs appear in the terminal
# For persistent logs, redirect to file:
npm run dev | Tee-Object server.log
```

### Follow Logs in Real-Time
```powershell
# Save logs to file and watch
npm run dev | Tee-Object -Append server.log

# In another PowerShell window, watch the file
Get-Content server.log -Wait
```

### Filter Logs
```powershell
# Show only errors
Get-Content server.log | Select-String "❌|ERROR"

# Show only success messages
Get-Content server.log | Select-String "✅|SUCCESS"

# Show only warnings
Get-Content server.log | Select-String "⚠️|WARNING"
```

---

## 🔐 Environment Variables

### View All Environment Variables
```powershell
# Your current .env values
Get-Content .env

# As formatted table
Get-Content .env | ForEach-Object {
    $line = $_
    if ($line -match "=") {
        $key, $value = $line -split "=", 2
        [PSCustomObject]@{
            Variable = $key
            Value = if ($value.Length -gt 50) { $value.Substring(0, 50) + "..." } else { $value }
        }
    }
} | Format-Table -AutoSize
```

### Set Environment Variable Temporarily
```powershell
# For current PowerShell session only
$env:PORT = 3001
$env:NODE_ENV = "production"

# Start server with custom port
npm start
```

### Permanently Set Environment Variable
```powershell
# System-wide
[System.Environment]::SetEnvironmentVariable("PORT", "3001", "User")

# Restart PowerShell to apply changes
```

---

## 📦 npm Commands Reference

### Installation
```powershell
npm install                 # Install all dependencies
npm install package-name    # Install single package
npm install -g package-name # Install globally
npm install --save-dev pkg  # Install as dev dependency
```

### Updating
```powershell
npm update                  # Update all packages
npm update package-name     # Update single package
npm outdated                # Show outdated packages
```

### Maintenance
```powershell
npm list                    # Show dependency tree
npm list --depth=0          # Show only top-level
npm audit                   # Check security vulnerabilities
npm audit fix               # Fix vulnerabilities
npm cache clean --force     # Clear npm cache
```

### Scripts
```powershell
npm run                     # List all available scripts
npm run dev                 # Run dev script (nodemon)
npm start                   # Run start script
npm run prod                # Run prod script
```

---

## 🐛 Quick Debugging Checklist

- [ ] Check if port is in use: `netstat -ano | findstr :3000`
- [ ] Check Node.js version: `node --version`
- [ ] Check npm version: `npm --version`
- [ ] Verify .env file exists: `Test-Path .env`
- [ ] Check MONGO_URI: `Write-Host $env:MONGO_URI`
- [ ] Check firewall settings (if needed)
- [ ] Clear npm cache: `npm cache clean --force`
- [ ] Reinstall dependencies: `npm install`
- [ ] Check server logs for errors
- [ ] Test health endpoint: `curl http://localhost:3000/health`

---

## 💡 Pro Tips

### Create a Batch File for Easy Startup
```batch
@echo off
REM Save as start-server.bat
cd C:\Users\ASHUTOSH SHUKLA\Desktop\ProvenStack
npm run dev
pause
```

### Create a PowerShell Profile Alias
```powershell
# Edit your PowerShell profile
notepad $PROFILE

# Add this function:
function Start-ProvenStack {
    cd "C:\Users\ASHUTOSH SHUKLA\Desktop\ProvenStack"
    npm run dev
}

# Now you can just type:
# Start-ProvenStack
```

### Monitor Multiple Ports
```powershell
# Watch all important ports
while ($true) {
    Clear-Host
    Write-Host "=== Port Monitor ===" -ForegroundColor Cyan
    netstat -ano | findstr ":3000\|:5173\|:27017"
    Start-Sleep -Seconds 5
}
```

### Auto-Restart on Crash
```powershell
# Run this in PowerShell
while ($true) {
    Write-Host "Starting server..." -ForegroundColor Green
    npm run dev
    Write-Host "Server crashed. Restarting in 5 seconds..." -ForegroundColor Red
    Start-Sleep -Seconds 5
}
```

---

## 📞 Support Commands

```powershell
# Get help for npm commands
npm help install
npm help start

# Get help for Node.js
node --help

# Check system information
systeminfo

# Check Windows version
[System.Environment]::OSVersion

# Get current user
whoami

# Get current directory
pwd
```

---

## 🎯 Summary

**Most Important Commands:**
```powershell
# 1. Find port usage
netstat -ano | findstr :3000

# 2. Kill process
taskkill /PID <PID> /F

# 3. Start server
npm run dev

# 4. Test health
curl http://localhost:3000/health

# 5. View logs
Get-Content server.log -Wait
```

**Remember:**
- Always run PowerShell as Administrator if you get permission errors
- Use `npm run dev` for development (with nodemon)
- Use `npm start` or `npm run prod` for production
- Keep your `.env` file private and never commit it
- The new server automatically finds available ports!

---

## ❓ Still Having Issues?

1. **Check the logs** - Server prints detailed error messages
2. **Verify environment** - Ensure all .env variables are set
3. **Test connectivity** - Use health endpoints to verify server
4. **Kill any lingering processes** - `taskkill /IM node.exe /F`
5. **Clear and reinstall** - `npm install` after clearing node_modules
6. **Restart PowerShell** - Close and reopen terminal
7. **Restart computer** - Nuclear option that usually works!

**Everything should work smoothly now!** 🚀
