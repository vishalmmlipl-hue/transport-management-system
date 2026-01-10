# Setup Database for TMS - Prevent Data Loss

## Problem
Data was lost when browser cache was cleared because data was stored in `localStorage`.

## Solution
Set up a SQLite database with Node.js backend to store all data permanently.

## Quick Setup

### Step 1: Install Backend Dependencies

```bash
cd server
npm install
```

### Step 2: Initialize Database

```bash
npm run init-db
```

This creates `tms_database.db` with all necessary tables.

### Step 3: Start Backend Server

```bash
npm start
```

Server will run on `http://localhost:3001`

### Step 4: Update Frontend to Use Database

The frontend will automatically use the database API when the server is running.

## How It Works

### Before (localStorage - Data Lost on Cache Clear)
```
Frontend → localStorage → Browser Storage → ❌ Lost when cache cleared
```

### After (Database - Data Persists)
```
Frontend → API → Backend Server → SQLite Database → ✅ Data persists forever
```

## Database Location

**Database file:** `server/tms_database.db`

**Important:** Backup this file regularly! It contains all your data.

## Backup Database

### Manual Backup
```bash
# Copy database file
cp server/tms_database.db server/backups/tms_database_$(date +%Y%m%d_%H%M%S).db
```

### Automatic Backup Script
Create `server/backup.sh`:
```bash
#!/bin/bash
BACKUP_DIR="backups"
mkdir -p $BACKUP_DIR
cp tms_database.db $BACKUP_DIR/tms_database_$(date +%Y%m%d_%H%M%S).db
echo "✅ Backup created"
```

## Restore Database

```bash
# Stop server first
# Copy backup file
cp server/backups/tms_database_YYYYMMDD_HHMMSS.db server/tms_database.db
# Start server
npm start
```

## Running Server Automatically

### Option 1: Keep Terminal Open
Just run `npm start` and keep terminal open.

### Option 2: Run in Background (macOS/Linux)
```bash
nohup npm start > server.log 2>&1 &
```

### Option 3: Use PM2 (Recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Start server with PM2
cd server
pm2 start server.js --name tms-backend

# Save PM2 configuration
pm2 save
pm2 startup
```

## Verify Database is Working

### Check Server Status
```bash
curl http://localhost:3001/api/health
```

Should return:
```json
{
  "success": true,
  "message": "TMS Backend API is running",
  "database": "/path/to/tms_database.db",
  "timestamp": "2026-01-06T..."
}
```

### Check Database File
```bash
ls -lh server/tms_database.db
```

Should show the database file exists.

## API Endpoints

All data operations go through API:

- `GET /api/{tableName}` - Get all records
- `POST /api/{tableName}` - Create record
- `PUT /api/{tableName}/:id` - Update record
- `DELETE /api/{tableName}/:id` - Delete record

**Available tables:**
- users, branches, cities, vehicles, drivers, staff
- lrBookings, ftlLRBookings, ptlLRBookings
- manifests, trips, invoices, payments, pods
- clients, accounts, expenseTypes, branchExpenses
- marketVehicleVendors, otherVendors

## Frontend Integration

The frontend automatically uses the database API when the server is running. If the server is not available, it falls back to localStorage.

## Troubleshooting

### Server Won't Start
```bash
# Check if port 3001 is in use
lsof -i :3001

# Kill process if needed
kill -9 <PID>
```

### Database Not Found
```bash
# Initialize database
cd server
npm run init-db
```

### Data Not Saving
1. Check server is running: `curl http://localhost:3001/api/health`
2. Check browser console for API errors
3. Verify API_BASE_URL in frontend

## Summary

✅ **Database Setup:**
1. `cd server && npm install`
2. `npm run init-db`
3. `npm start`

✅ **Data Now Persists:**
- Stored in SQLite database
- Survives browser cache clear
- Survives browser restart
- Survives system restart

✅ **Backup Regularly:**
- Copy `server/tms_database.db`
- Store backups safely
- Restore if needed

Your data is now safe! 🎉

