# ⚡ ProvenStack Backend - Quick Reference Card

## 🚀 Start Server

```powershell
npm run dev       # Development mode (with nodemon)
npm start         # Production start
npm run prod      # Production with NODE_ENV set
```

## 🛑 Stop Server

```powershell
Ctrl+C            # Graceful shutdown
rs                # Restart in nodemon
```

## 🔍 Port Troubleshooting

### Check if Port is in Use

```powershell
netstat -ano | findstr :3000
```

### Kill Process Using Port

```powershell
taskkill /PID 12345 /F
```

### One-Liner: Find & Kill

```powershell
$PID = (netstat -ano | findstr :3000 | ForEach-Object { $_.Split()[-1] } | Select-Object -First 1); if ($PID) { taskkill /PID $PID /F }
```

## 🏥 Health Checks

### Test Server Health

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/health"
```

### Test Database Connection

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/health/ready"
```

### Expected Response

```json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2026-05-29T08:59:05.881Z",
  "uptime": 50.42,
  "environment": "development"
}
```

## 📦 Dependencies

### Install All

```powershell
npm install
```

### Install Single Package

```powershell
npm install package-name
```

### Check Outdated Packages

```powershell
npm outdated
```

### Audit Security

```powershell
npm audit
npm audit fix
```

## 🔧 Environment Setup

### Copy .env Template

```powershell
Copy-Item .env.example .env
```

### Edit .env

```powershell
notepad .env
```

### View MONGO_URI

```powershell
Write-Host $env:MONGO_URI
```

## 📊 Monitoring

### View Process List

```powershell
tasklist | findstr node.exe
tasklist | findstr npm.exe
```

### View All Listening Ports

```powershell
netstat -aon | findstr LISTENING
```

### Monitor Port Continuously

```powershell
while ($true) {
    Clear-Host
    netstat -ano | findstr ":3000\|:5173\|:27017"
    Start-Sleep -Seconds 5
}
```

## 📝 Logs & Debugging

### Save Logs to File

```powershell
npm run dev | Tee-Object server.log
```

### Follow Logs in Real-Time

```powershell
Get-Content server.log -Wait
```

### Filter Logs (Errors Only)

```powershell
Get-Content server.log | Select-String "❌|ERROR"
```

### Filter Logs (Success Only)

```powershell
Get-Content server.log | Select-String "✅|SUCCESS"
```

## 🗑️ Cleanup

### Delete Node Modules

```powershell
Remove-Item -Recurse node_modules
```

### Clear npm Cache

```powershell
npm cache clean --force
```

### Full Reinstall

```powershell
Remove-Item -Recurse node_modules
npm cache clean --force
npm install
```

## 🚨 Force Kill All Node

### Kill All Node Processes

```powershell
taskkill /IM node.exe /F
taskkill /IM npm.exe /F
```

## 📍 Navigation

### Go to Project Directory

```powershell
cd "C:\Users\ASHUTOSH SHUKLA\Desktop\ProvenStack"
```

### List Files

```powershell
Get-ChildItem
ls
dir
```

### List Recursively

```powershell
Get-ChildItem -Recurse
tree
```

## 🔐 MongoDB

### Check Connection String

```powershell
Write-Host $env:MONGO_URI
```

### Test Connection (if mongosh installed)

```powershell
mongosh "mongodb+srv://user:password@cluster.mongodb.net/dbname"
```

## 🌐 API Routes

### Health Endpoints

```
GET /health           → Basic health
GET /health/ready     → Database status
GET /health/live      → Process alive check
```

### API Routes (v1)

```
/api/v1/auth
/api/v1/users
/api/v1/teams
/api/v1/requests
/api/v1/score
/api/v1/message
/api/v1/hackathon
/api/v1/join-request
/api/v1/notifications
/api/v1/request-chat
/api/v1/tasks
/api/v1/meet
/api/v1/summary
/api/v1/ai
```

### Backward Compatible (v0)

```
/api/auth
/api/users
/api/teams
... (same as above without /v1)
```

## 📂 Important Files

| File           | Purpose                 |
| -------------- | ----------------------- |
| `server.js`    | Main server entry point |
| `src/app.js`   | Express app config      |
| `.env`         | Environment variables   |
| `.env.example` | Env template            |
| `package.json` | Dependencies            |
| `nodemon.json` | Nodemon config          |

## 🎯 Common Issues

### Port Already in Use

1. `netstat -ano | findstr :3000`
2. `taskkill /PID <pid> /F`
3. `npm run dev`

### MongoDB Connection Failed

1. Check MONGO_URI in .env
2. Add IP to MongoDB Atlas whitelist
3. Verify internet connection
4. Check username/password

### Environment Variables Not Found

1. Ensure .env exists: `Test-Path .env`
2. Restart PowerShell
3. Check file format (UTF-8, LF line endings)

### Nodemon Not Restarting

1. Check file paths in nodemon.json
2. Check .gitignore rules
3. Try `rs` in nodemon terminal
4. Restart: `npm run dev`

## 📚 Documentation

- `BACKEND_SETUP_GUIDE.md` - Complete setup guide
- `WINDOWS_COMMANDS_GUIDE.md` - Windows-specific commands
- `COMPLETION_SUMMARY.md` - Full summary of changes

## 💡 Pro Tips

### Create Batch File

Save as `start.bat`:

```batch
@echo off
cd "C:\Users\ASHUTOSH SHUKLA\Desktop\ProvenStack"
npm run dev
pause
```

### PowerShell Alias

Add to PowerShell profile:

```powershell
function Start-ProvenStack {
    cd "C:\Users\ASHUTOSH SHUKLA\Desktop\ProvenStack"
    npm run dev
}
```

### Auto-Restart on Crash

```powershell
while ($true) {
    Write-Host "Starting server..." -ForegroundColor Green
    npm run dev
    Write-Host "Restarting in 5 seconds..." -ForegroundColor Red
    Start-Sleep -Seconds 5
}
```

## 🆘 Support

1. **Check logs** - Server prints detailed errors
2. **Test health** - `Invoke-RestMethod -Uri "http://localhost:3001/health"`
3. **Verify .env** - `notepad .env`
4. **Kill lingering processes** - `taskkill /IM node.exe /F`
5. **Restart everything** - Close PowerShell and reopen

---

**Your server is running on port 3001 ✅**

Need help? Check the comprehensive guides in the project root!
