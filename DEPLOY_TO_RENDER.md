# Deploy Database Server to Render.com

## Step-by-Step Guide

### Step 1: Create Render Account

1. Go to https://render.com
2. Click **"Get Started for Free"**
3. Sign up with **GitHub** (recommended) or email
4. Verify your email if needed

---

### Step 2: Create New Web Service

1. In Render dashboard, click **"New +"** button (top right)
2. Select **"Web Service"**
3. Connect your GitHub account (if not already connected)
4. Select your repository: `transport-management-system`
5. Click **"Connect"**

---

### Step 3: Configure Service Settings

Fill in these settings:

#### Basic Settings:
- **Name**: `tms-database-server` (or any name you like)
- **Region**: Choose closest to you (e.g., `Oregon (US West)`)
- **Branch**: `main` (or your default branch)
- **Root Directory**: `server` ⚠️ **IMPORTANT!**
- **Environment**: `Node`
- **Build Command**: `npm install && npm run init-db`
- **Start Command**: `npm start`
- **Plan**: **Free** (or choose paid if you want)

#### Advanced Settings (Optional):
- **Auto-Deploy**: `Yes` (deploys automatically on git push)
- **Health Check Path**: `/api/health`

---

### Step 4: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add this variable:
- **Key**: `NODE_ENV`
- **Value**: `production`
- Click **"Save Changes"**

---

### Step 5: Deploy

1. Scroll down and click **"Create Web Service"**
2. Render will start building your service
3. Wait 5-10 minutes for deployment
4. You'll see build logs in real-time

---

### Step 6: Get Your API URL

After deployment completes:

1. At the top of your service page, you'll see a URL like:
   ```
   https://tms-database-server.onrender.com
   ```
2. Your **API URL** will be:
   ```
   https://tms-database-server.onrender.com/api
   ```
3. Copy this URL - you'll need it for the frontend!

---

### Step 7: Test Your Server

1. Click on your service URL (or add `/api/health`)
2. Should see: `{"success": true, "message": "Server is running"}`
3. Or test in browser: `https://your-app.onrender.com/api/health`

---

### Step 8: Update Frontend to Use Render API

#### Option A: Update Code (Recommended)

Edit `src/utils/database-api.js`:

Find this function:
```javascript
const getAPIBaseURL = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    if (hostname === 'mmlipl.info' || hostname === 'www.mmlipl.info') {
      return `${protocol}//${hostname}:3001/api`; // Change this line
    }
  }
  return process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
};
```

Replace with:
```javascript
const getAPIBaseURL = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'mmlipl.info' || hostname === 'www.mmlipl.info') {
      return 'https://YOUR-RENDER-APP.onrender.com/api'; // ← Your Render URL
    }
  }
  return process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
};
```

**Replace `YOUR-RENDER-APP` with your actual Render app name!**

#### Option B: Use Environment Variable (Netlify)

1. Go to **Netlify Dashboard**
2. Select your site (mmlipl.info)
3. Go to **Site Settings** → **Environment Variables**
4. Click **"Add variable"**
5. **Key**: `REACT_APP_API_URL`
6. **Value**: `https://YOUR-RENDER-APP.onrender.com/api`
7. Click **"Save"**
8. **Redeploy** your site

---

### Step 9: Commit and Deploy Frontend Changes

If you updated the code:

```bash
cd /Users/macbook/transport-management-system
git add src/utils/database-api.js
git commit -m "Update API URL to use Render server"
git push origin main
```

Netlify will automatically redeploy.

---

## Important Notes

### Free Tier Limitations:
- ⚠️ **Sleeps after 15 minutes of inactivity**
- ⚠️ **Takes 30-60 seconds to wake up** when first accessed
- ✅ **Free forever** - no credit card needed
- ✅ **Perfect for testing and small projects**

### To Keep Server Always Awake:
1. Use **Paid Plan** ($7/month) - always running
2. Or set up a **cron job** to ping your server every 10 minutes
3. Or use a service like **UptimeRobot** (free) to ping every 5 minutes

---

## Troubleshooting

### Server Not Starting?
- Check **build logs** in Render dashboard
- Verify **Root Directory** is set to `server`
- Check **Start Command** is `npm start`
- Verify **Build Command** includes `npm run init-db`

### Database Not Working?
- Check if `init-db` ran successfully in build logs
- Verify database file was created
- Check service logs for errors

### Frontend Can't Connect?
- Verify API URL is correct (ends with `/api`)
- Check CORS settings (already enabled in server.js)
- Test API URL directly: `https://your-app.onrender.com/api/health`
- Make sure you're using `https://` not `http://`

### Server Sleeping?
- First request after sleep takes 30-60 seconds
- This is normal for free tier
- Consider upgrading to paid plan for always-on

---

## Quick Checklist

- [ ] Render account created
- [ ] Web service created with correct settings
- [ ] Root Directory set to `server`
- [ ] Build Command: `npm install && npm run init-db`
- [ ] Start Command: `npm start`
- [ ] Environment variable `NODE_ENV=production` added
- [ ] Service deployed successfully
- [ ] API URL copied
- [ ] Frontend updated with Render API URL
- [ ] Tested API health endpoint
- [ ] Data sync working across systems

---

## Your Render API URL Format

After deployment, your API will be at:
```
https://YOUR-APP-NAME.onrender.com/api
```

Example:
```
https://tms-database-server.onrender.com/api
```

---

## Next Steps

1. ✅ Deploy to Render (follow steps above)
2. ✅ Get your API URL
3. ✅ Update frontend
4. ✅ Test data sync
5. ✅ Done! 🎉

Your database server is now in the cloud and accessible from all systems!

