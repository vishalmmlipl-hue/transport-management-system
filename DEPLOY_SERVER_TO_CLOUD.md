# Deploy Database Server to Cloud

## Why GitHub/Mega/Netlify Won't Work

- **GitHub**: Code hosting only, can't run servers
- **Mega**: Cloud storage, not a hosting platform
- **Netlify**: Static sites/serverless only, can't run persistent Node.js servers with databases

## Best Cloud Options for Your Database Server

### Option 1: Railway (Recommended - Easiest) ⭐

**Why Railway?**
- ✅ Free tier available
- ✅ Easy deployment from GitHub
- ✅ Supports Node.js and SQLite
- ✅ Automatic HTTPS
- ✅ Simple setup

**Steps:**

1. **Create Railway Account:**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Deploy from GitHub:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `transport-management-system` repository
   - Select the `server` folder as root directory

3. **Configure Environment:**
   - Railway auto-detects Node.js
   - Set build command: `npm install`
   - Set start command: `npm start`
   - Add environment variable: `PORT` (Railway sets this automatically)

4. **Initialize Database:**
   - Go to project settings
   - Open terminal/console
   - Run: `npm run init-db`

5. **Get Your API URL:**
   - Railway provides a URL like: `https://your-app.railway.app`
   - Your API will be at: `https://your-app.railway.app/api`

---

### Option 2: Render (Free Tier Available)

**Steps:**

1. **Create Render Account:**
   - Go to https://render.com
   - Sign up with GitHub

2. **Create New Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Settings:
     - **Name**: `tms-database-server`
     - **Root Directory**: `server`
     - **Environment**: `Node`
     - **Build Command**: `npm install && npm run init-db`
     - **Start Command**: `npm start`
     - **Plan**: Free

3. **Environment Variables:**
   - `PORT`: (auto-set by Render)
   - `NODE_ENV`: `production`

4. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)

5. **Get Your API URL:**
   - Render provides: `https://tms-database-server.onrender.com`
   - API: `https://tms-database-server.onrender.com/api`

---

### Option 3: Fly.io (Good for Global Distribution)

**Steps:**

1. **Install Fly CLI:**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Create Fly App:**
   ```bash
   cd server
   fly launch
   ```

3. **Deploy:**
   ```bash
   fly deploy
   ```

4. **Get URL:**
   - Fly provides: `https://your-app.fly.dev`
   - API: `https://your-app.fly.dev/api`

---

### Option 4: DigitalOcean App Platform

**Steps:**

1. **Create Account:** https://www.digitalocean.com
2. **Create App:**
   - Connect GitHub
   - Select `server` folder
   - Auto-detects Node.js
3. **Deploy**
4. **Cost:** ~$5/month

---

## Recommended: Railway (Easiest Setup)

### Complete Railway Setup Guide

#### Step 1: Prepare Server for Deployment

Create these files in the `server` folder:

**`server/railway.json`** (optional):
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Update `server/package.json`** to ensure start script exists:
```json
{
  "scripts": {
    "start": "node server.js",
    "init-db": "node init-db.js"
  }
}
```

#### Step 2: Deploy to Railway

1. **Go to Railway:** https://railway.app
2. **Login with GitHub**
3. **New Project** → **Deploy from GitHub repo**
4. **Select your repository**
5. **Configure:**
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

#### Step 3: Initialize Database

After first deployment:

1. Go to your Railway project
2. Click on your service
3. Go to **Settings** → **Service**
4. Click **Generate Domain** (or use provided domain)
5. Open **Logs** tab
6. In **Deploy Logs**, you should see database initialization

Or manually initialize:
1. Go to **Settings** → **Deploy**
2. Add build command: `npm install && npm run init-db`

#### Step 4: Get Your API URL

1. Railway provides a domain like: `your-app.up.railway.app`
2. Your API base URL: `https://your-app.up.railway.app/api`
3. Health check: `https://your-app.up.railway.app/api/health`

#### Step 5: Update Frontend API URL

Update `src/utils/database-api.js`:

```javascript
const getAPIBaseURL = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    if (hostname === 'mmlipl.info' || hostname === 'www.mmlipl.info') {
      // Use your Railway URL
      return 'https://your-app.up.railway.app/api';
    }
  }
  return process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
};
```

Or set environment variable in Netlify:
- `REACT_APP_API_URL=https://your-app.up.railway.app/api`

---

## Alternative: Use Cloud Database (No Server Needed)

Instead of running your own server, use a cloud database service:

### Option A: Supabase (Recommended)

You already have Supabase code in your project! Just configure it:

1. **Create Supabase Project:** https://supabase.com
2. **Get API keys**
3. **Update `src/supabaseClient.js`** with your keys
4. **Forms will automatically use Supabase** (code already exists)

### Option B: Firebase

1. Create Firebase project
2. Use Firestore database
3. Update forms to use Firebase SDK

---

## Quick Comparison

| Service | Free Tier | Ease | Database Support | Best For |
|---------|-----------|------|------------------|----------|
| **Railway** | ✅ Yes | ⭐⭐⭐⭐⭐ | ✅ SQLite/PostgreSQL | **Recommended** |
| **Render** | ✅ Yes | ⭐⭐⭐⭐ | ✅ PostgreSQL | Good alternative |
| **Fly.io** | ✅ Yes | ⭐⭐⭐ | ✅ SQLite | Global distribution |
| **DigitalOcean** | ❌ No | ⭐⭐⭐ | ✅ PostgreSQL | Production |
| **Supabase** | ✅ Yes | ⭐⭐⭐⭐⭐ | ✅ PostgreSQL | **Easiest** |

---

## My Recommendation

**For Quick Setup:** Use **Supabase** (you already have the code!)
- No server to manage
- Free tier
- Automatic backups
- Works immediately

**For Custom Server:** Use **Railway**
- Easiest deployment
- Free tier
- GitHub integration
- 5-minute setup

---

## Next Steps

1. Choose a platform (Railway or Supabase recommended)
2. Follow the setup guide above
3. Update frontend API URL
4. Test data sync across systems

Would you like me to help you set up Railway or Supabase?

