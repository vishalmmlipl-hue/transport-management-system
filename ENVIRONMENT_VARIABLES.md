# Environment Variables for Cloud Deployment

## Required Environment Variables

### For Database Server (Railway/Render/Fly.io)

Add these environment variables in your cloud platform:

#### 1. PORT (Usually Auto-Set)
- **Name**: `PORT`
- **Value**: (Usually auto-set by platform, but you can set to `3001` if needed)
- **Required**: No (platforms usually set this automatically)
- **Description**: Port number for the server to listen on

#### 2. NODE_ENV
- **Name**: `NODE_ENV`
- **Value**: `production`
- **Required**: Recommended
- **Description**: Sets Node.js to production mode

#### 3. Database Path (Optional)
- **Name**: `DB_PATH`
- **Value**: (Leave empty - uses default: `tms_database.db`)
- **Required**: No
- **Description**: Custom database file path (usually not needed)

---

## For Frontend (Netlify)

Add these in Netlify → Site Settings → Environment Variables:

#### 1. API URL (Required)
- **Name**: `REACT_APP_API_URL`
- **Value**: `https://YOUR-RAILWAY-APP.up.railway.app/api`
  - Replace `YOUR-RAILWAY-APP` with your actual Railway app name
  - Or use your Render URL: `https://YOUR-APP.onrender.com/api`
- **Required**: Yes
- **Description**: Tells frontend where to find the database API

#### 2. Environment (Optional)
- **Name**: `REACT_APP_ENV`
- **Value**: `production`
- **Required**: No
- **Description**: Frontend environment setting

---

## Quick Setup Guide

### Railway Setup

1. **Go to your Railway project**
2. **Click on your service**
3. **Go to "Variables" tab**
4. **Add these variables:**

```
NODE_ENV = production
```

(That's it! PORT is auto-set by Railway)

### Render Setup

1. **Go to your Render service**
2. **Go to "Environment" tab**
3. **Add these variables:**

```
NODE_ENV = production
PORT = (auto-set, but you can set to 3001)
```

### Netlify Setup (Frontend)

1. **Go to Netlify Dashboard**
2. **Select your site (mmlipl.info)**
3. **Go to Site Settings → Environment Variables**
4. **Add:**

```
REACT_APP_API_URL = https://YOUR-RAILWAY-APP.up.railway.app/api
```

**Important:** Replace `YOUR-RAILWAY-APP` with your actual Railway URL!

---

## Example Values

### If Using Railway:
```
NODE_ENV = production
```

### If Using Render:
```
NODE_ENV = production
PORT = 3001
```

### For Netlify Frontend:
```
REACT_APP_API_URL = https://tms-server.up.railway.app/api
```

---

## How to Find Your API URL

### Railway:
1. Go to Railway dashboard
2. Click on your service
3. Go to "Settings" → "Networking"
4. Copy the domain (e.g., `your-app.up.railway.app`)
5. Your API URL: `https://your-app.up.railway.app/api`

### Render:
1. Go to Render dashboard
2. Click on your service
3. Copy the URL (e.g., `your-app.onrender.com`)
4. Your API URL: `https://your-app.onrender.com/api`

---

## Testing Your Variables

### Test Server Health:
```bash
curl https://YOUR-API-URL/api/health
```

Should return:
```json
{"success": true, "message": "Server is running"}
```

### Test from Browser:
Open: `https://YOUR-API-URL/api/health`

---

## Troubleshooting

### Server Not Starting?
- Check if `PORT` is set (or auto-set by platform)
- Check build logs for errors
- Verify `NODE_ENV` is set to `production`

### Frontend Can't Connect?
- Verify `REACT_APP_API_URL` is correct
- Check CORS settings (already enabled in server.js)
- Make sure API URL uses `https://` (not `http://`)
- Test API URL directly in browser

### Database Not Initializing?
- Check build command includes: `npm run init-db`
- Or manually run in platform terminal/console
- Verify database file is being created

---

## Summary

**For Server (Railway/Render):**
- ✅ `NODE_ENV = production` (recommended)
- ✅ `PORT` (usually auto-set)

**For Frontend (Netlify):**
- ✅ `REACT_APP_API_URL = https://your-server-url/api` (required)

That's all you need! 🎉

