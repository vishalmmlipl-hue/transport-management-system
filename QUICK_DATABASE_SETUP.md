# Quick Database Setup - Prevent Data Loss

## 🚨 Problem Solved
Your data was lost because it was stored in `localStorage` (browser storage), which gets cleared when you clear browser cache.

## ✅ Solution: SQLite Database

All data is now stored in a SQLite database file that persists even if browser cache is cleared.

## 🚀 Quick Start (3 Steps)

### Step 1: Install Dependencies
```bash
cd server
npm install
```

### Step 2: Initialize Database
```bash
npm run init-db
```

### Step 3: Start Server
```bash
npm start
```

**Or use the quick start script:**
```bash
./START_DATABASE.sh
```

## 📍 Server Details

- **URL:** http://localhost:3001
- **Database File:** `server/tms_database.db`
- **API Health:** http://localhost:3001/api/health

## ✅ Verify It's Working

### Check Server Status
```bash
curl http://localhost:3001/api/health
```

Should return:
```json
{
  "success": true,
  "message": "TMS Backend API is running"
}
```

### Check Database File
```bash
ls -lh server/tms_database.db
```

Should show the database file exists.

## 🔄 How It Works Now

### Before (Data Lost):
```
Frontend → localStorage → ❌ Lost when cache cleared
```

### After (Data Safe):
```
Frontend → API → Backend Server → SQLite Database → ✅ Data persists forever
```

## 💾 Backup Your Database

**Important:** Backup the database file regularly!

```bash
# Manual backup
cp server/tms_database.db server/backups/tms_database_$(date +%Y%m%d_%H%M%S).db
```

## 🔧 Keep Server Running

### Option 1: Keep Terminal Open
Just run `npm start` and keep terminal open.

### Option 2: Run in Background
```bash
cd server
nohup npm start > server.log 2>&1 &
```

### Option 3: Use PM2 (Recommended)
```bash
npm install -g pm2
cd server
pm2 start server.js --name tms-backend
pm2 save
```

## 📝 What's Stored in Database

All your TMS data:
- ✅ Users, Branches, Cities
- ✅ Vehicles, Drivers, Staff
- ✅ LR Bookings (FTL & PTL)
- ✅ Manifests, Trips
- ✅ Invoices, Payments, PODs
- ✅ Clients, Accounts, Expenses
- ✅ Vendors, etc.

## 🎯 Next Steps

1. ✅ Start the database server
2. ✅ Keep it running while using TMS
3. ✅ Your data will now persist!
4. ✅ Backup database regularly

## ⚠️ Important Notes

- **Keep server running:** Database server must be running for data to save
- **Backup regularly:** Copy `server/tms_database.db` to safe location
- **Port 3001:** Make sure port 3001 is available
- **Auto-start:** Set up PM2 or system service for auto-start

## 🆘 Troubleshooting

### Server Won't Start
```bash
# Check if port is in use
lsof -i :3001

# Kill process if needed
kill -9 $(lsof -ti:3001)
```

### Database Not Found
```bash
cd server
npm run init-db
```

### Data Not Saving
1. Check server is running: `curl http://localhost:3001/api/health`
2. Check browser console for errors
3. Verify server logs

## ✅ Success!

Once server is running:
- ✅ All data saves to database
- ✅ Data persists even if cache cleared
- ✅ Data survives browser/system restart
- ✅ Your data is safe! 🎉

