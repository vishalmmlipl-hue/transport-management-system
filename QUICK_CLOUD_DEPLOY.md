# Quick Cloud Deployment Guide

## ⚡ Fastest Option: Railway (5 minutes)

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Click "Start a New Project"
3. Sign up with GitHub

### Step 2: Deploy Your Server
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your repository: `transport-management-system`
4. Railway will detect it's a Node.js project
5. **Important:** Set **Root Directory** to: `server`
6. Click "Deploy"

### Step 3: Get Your API URL
1. After deployment, Railway gives you a URL like: `https://your-app.up.railway.app`
2. Your API will be at: `https://your-app.up.railway.app/api`
3. Test it: Visit `https://your-app.up.railway.app/api/health`

### Step 4: Initialize Database
1. In Railway dashboard, go to your service
2. Click "Settings" → "Deploy"
3. Update **Build Command** to: `npm install && npm run init-db`
4. Click "Redeploy"

### Step 5: Update Frontend
Update `src/utils/database-api.js` to use your Railway URL:

```javascript
// Replace the getAPIBaseURL function with:
const getAPIBaseURL = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'mmlipl.info' || hostname === 'www.mmlipl.info') {
      return 'https://YOUR-RAILWAY-APP.up.railway.app/api'; // ← Your Railway URL
    }
  }
  return process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
};
```

Or set environment variable in Netlify:
- Go to Netlify → Site Settings → Environment Variables
- Add: `REACT_APP_API_URL` = `https://YOUR-RAILWAY-APP.up.railway.app/api`

### Step 6: Deploy Frontend Changes
```bash
git add .
git commit -m "Update API URL for Railway"
git push origin main
```

**Done!** Your database server is now in the cloud! 🎉

---

## 🆓 Alternative: Render (Free Forever)

### Step 1: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub

### Step 2: Create Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Settings:
   - **Name**: `tms-database-server`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run init-db`
   - **Start Command**: `npm start`
   - **Plan**: Free

### Step 3: Deploy
1. Click "Create Web Service"
2. Wait 5-10 minutes for deployment
3. Get your URL: `https://tms-database-server.onrender.com/api`

### Step 4: Update Frontend
Same as Railway - update API URL in `database-api.js`

---

## 📊 Comparison

| Platform | Free Tier | Setup Time | Best For |
|----------|-----------|------------|----------|
| **Railway** | ✅ $5 credit/month | 5 min | **Easiest** |
| **Render** | ✅ Free forever | 10 min | Long-term free |
| **Fly.io** | ✅ Free tier | 15 min | Global distribution |

---

## ✅ What I've Prepared

1. ✅ `server/railway.json` - Railway configuration
2. ✅ `server/render.yaml` - Render configuration  
3. ✅ `server/Procfile` - Heroku/Fly.io compatibility
4. ✅ Server already uses `process.env.PORT` (cloud-ready)

---

## 🚀 Recommended: Railway

**Why Railway?**
- ✅ Easiest setup (5 minutes)
- ✅ Free $5 credit monthly
- ✅ Automatic HTTPS
- ✅ GitHub integration
- ✅ No credit card needed for free tier

**Start here:** https://railway.app

---

## Need Help?

1. **Railway Issues?** Check `DEPLOY_SERVER_TO_CLOUD.md` for detailed steps
2. **API Not Working?** Make sure:
   - Database is initialized (`npm run init-db`)
   - CORS is enabled (already done in server.js)
   - Frontend API URL is correct

---

## Next Steps After Deployment

1. ✅ Deploy server to Railway/Render
2. ✅ Get your API URL
3. ✅ Update frontend API URL
4. ✅ Test data sync across systems
5. ✅ Done! Data now syncs across all systems

