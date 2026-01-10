# Quick Setup: Data Sync Across Systems

## The Problem
Data entered on mmlipl.info is not visible on other systems because it's stored in browser localStorage.

## Quick Solution

### Step 1: Start Database Server (5 minutes)

**On your main system (where you want the database):**

```bash
cd /Users/macbook/transport-management-system/server
npm install
npm run init-db
npm start
```

The server will run on `http://localhost:3001` (or your server's IP:3001)

### Step 2: Make Server Accessible (If needed)

If other systems need to access the server:

1. **Find your system's IP address:**
   ```bash
   # On Mac/Linux
   ifconfig | grep "inet "
   
   # Or
   ipconfig getifaddr en0
   ```

2. **Update API URL** - The code auto-detects if you're on mmlipl.info, but for other systems, you may need to set:
   ```bash
   export REACT_APP_API_URL=http://YOUR_SERVER_IP:3001/api
   ```

3. **Open firewall port 3001** (if needed)

### Step 3: Test the Connection

Open browser console on mmlipl.info and run:
```javascript
fetch('http://YOUR_SERVER_IP:3001/api/health')
  .then(r => r.json())
  .then(console.log)
```

### Step 4: Update Forms (Gradually)

Forms need to be updated to use the sync service. I've created `sync-service.js` that:
- ✅ Saves to API server (for sync)
- ✅ Falls back to localStorage (if server unavailable)
- ✅ Loads from API on startup

**Example update for LR Booking:**

```javascript
// Instead of:
localStorage.setItem('lrBookings', JSON.stringify(existingLRs));

// Use:
import syncService from '../utils/sync-service';
const result = await syncService.save('lrBookings', newLR);
```

## Current Status

✅ Sync service created
✅ API URL auto-detects production
⏳ Database server needs to be running
⏳ Forms need to be updated (can be done gradually)

## Immediate Action

**Start the database server now:**
```bash
cd /Users/macbook/transport-management-system/server
npm start
```

Then data entered on mmlipl.info will be saved to the database and can be accessed by other systems!

## For Production Deployment

You'll need to:
1. Deploy the server to a machine accessible by all systems
2. Update the API URL to point to that server
3. Set up HTTPS/SSL for the API (or use a reverse proxy)

See `SETUP_DATA_SYNC.md` for detailed instructions.

