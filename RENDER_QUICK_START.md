# Render.com Quick Start Guide

## 🚀 5-Minute Setup

### 1. Go to Render
https://render.com → Sign up with GitHub

### 2. Create Web Service
- Click **"New +"** → **"Web Service"**
- Connect GitHub → Select `transport-management-system`
- Click **"Connect"**

### 3. Configure (IMPORTANT!)
```
Name: tms-database-server
Root Directory: server          ← CRITICAL!
Environment: Node
Build Command: npm install && npm run init-db
Start Command: npm start
Plan: Free
```

### 4. Add Environment Variable
- Click **"Advanced"**
- Add: `NODE_ENV` = `production`

### 5. Deploy
- Click **"Create Web Service"**
- Wait 5-10 minutes
- Copy your URL: `https://your-app.onrender.com`

### 6. Get API URL
Your API: `https://your-app.onrender.com/api`

### 7. Update Frontend
In Netlify → Environment Variables:
- Add: `REACT_APP_API_URL` = `https://your-app.onrender.com/api`

**Done!** 🎉

---

## ⚠️ Important Notes

### Free Tier:
- Sleeps after 15 min inactivity
- Takes 30-60 sec to wake up
- Free forever!

### To Keep Awake:
- Upgrade to paid ($7/month)
- Or use UptimeRobot (free) to ping every 5 min

---

## Test Your Server

Visit: `https://your-app.onrender.com/api/health`

Should see: `{"success": true, "message": "Server is running"}`

---

## Need Help?

Check `DEPLOY_TO_RENDER.md` for detailed instructions!

