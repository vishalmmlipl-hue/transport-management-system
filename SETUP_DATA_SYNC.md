# Setup Data Sync Across Multiple Systems

## Problem
Data entered on one system (mmlipl.info) is not visible on other systems because the app currently uses `localStorage`, which is browser-specific.

## Solution
Set up a shared database server that all systems can access.

## Step 1: Start the Database Server

The database server needs to be running on a machine accessible by all systems.

### Option A: Run on Your Main System

1. **Navigate to server directory:**
   ```bash
   cd /Users/macbook/transport-management-system/server
   ```

2. **Install dependencies (if not done):**
   ```bash
   npm install
   ```

3. **Initialize database:**
   ```bash
   npm run init-db
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

   The server will run on `http://localhost:3001`

### Option B: Run on a Server Accessible by All Systems

If you want all systems to access the same database, you need to:

1. **Deploy the server to a machine accessible by all systems**
2. **Update the API URL** in the frontend to point to that server
3. **Configure CORS** to allow requests from mmlipl.info

## Step 2: Configure API URL for Production

The frontend automatically detects if it's running on `mmlipl.info` and uses the production API URL.

**For production (mmlipl.info):**
- API URL: `https://mmlipl.info:3001/api`

**For local development:**
- API URL: `http://localhost:3001/api`

## Step 3: Update Forms to Use Sync Service

Forms need to be updated to use the sync service instead of direct localStorage.

### Example: Update LR Booking Form

**Before:**
```javascript
localStorage.setItem('lrBookings', JSON.stringify(existingLRs));
```

**After:**
```javascript
import syncService from '../utils/sync-service';

// Save to both API and localStorage
const result = await syncService.save('lrBookings', newLR);
if (result.synced) {
  console.log('✅ Data saved to server and synced across systems');
} else {
  console.warn('⚠️ Saved to localStorage only (server unavailable)');
}
```

## Step 4: Load Data on App Start

Add a data sync component that loads all data from the server when the app starts.

### Create Data Sync Component

```javascript
// src/components/DataSync.js
import { useEffect, useState } from 'react';
import syncService from '../utils/sync-service';

export default function DataSync() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    const syncData = async () => {
      setSyncing(true);
      try {
        const results = await syncService.syncAll();
        console.log('Data sync complete:', results);
        setLastSync(new Date());
      } catch (error) {
        console.error('Sync error:', error);
      } finally {
        setSyncing(false);
      }
    };

    // Sync on app load
    syncData();

    // Auto-sync every 30 seconds
    const interval = setInterval(syncData, 30000);
    return () => clearInterval(interval);
  }, []);

  return null; // This component doesn't render anything
}
```

## Step 5: Deploy Server to Production

### Option 1: Run on Same Server as Website

If you have SSH access to the server hosting mmlipl.info:

1. **Upload server files:**
   ```bash
   scp -r server/ user@your-server:/path/to/server/
   ```

2. **SSH into server:**
   ```bash
   ssh user@your-server
   ```

3. **Install and start:**
   ```bash
   cd /path/to/server
   npm install
   npm run init-db
   npm start
   ```

4. **Use PM2 to keep it running:**
   ```bash
   npm install -g pm2
   pm2 start server.js --name tms-api
   pm2 save
   ```

### Option 2: Use a Cloud Service

Deploy the server to:
- **Heroku**
- **Railway**
- **Render**
- **DigitalOcean**
- **AWS EC2**

## Step 6: Configure CORS

The server already has CORS enabled, but make sure it allows requests from your domain:

```javascript
// server/server.js
app.use(cors({
  origin: ['https://mmlipl.info', 'http://localhost:3000'],
  credentials: true
}));
```

## Step 7: Test Data Sync

1. **Enter data on one system** (e.g., create an LR booking)
2. **Check the database server logs** - should show the data being saved
3. **Open another system** - data should appear after sync (or refresh)

## Troubleshooting

### Data not syncing?

1. **Check if server is running:**
   ```bash
   curl http://localhost:3001/api/health
   ```

2. **Check browser console** for API errors

3. **Verify API URL** is correct for your environment

4. **Check CORS settings** on the server

### Server not accessible?

1. **Check firewall** - port 3001 must be open
2. **Check network** - server must be accessible from all systems
3. **Use HTTPS** for production (requires SSL certificate)

## Quick Start Commands

```bash
# 1. Start database server
cd server
npm install
npm run init-db
npm start

# 2. In another terminal, start frontend
cd ..
npm start

# 3. Test API
curl http://localhost:3001/api/health
```

## Current Status

✅ Sync service created (`src/utils/sync-service.js`)
✅ API URL auto-detects production vs development
⏳ Forms need to be updated to use sync service
⏳ Database server needs to be deployed and running

## Next Steps

1. Start the database server
2. Update forms to use `syncService.save()` instead of direct localStorage
3. Add data sync on app startup
4. Deploy server to production
5. Test data sync across systems

