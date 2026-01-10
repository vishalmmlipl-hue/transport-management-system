# Quick Environment Variables Setup

## For Your Database Server (Railway/Render)

### Add This One Variable:

**Variable Name:** `NODE_ENV`  
**Variable Value:** `production`

That's it! The `PORT` is usually set automatically by the platform.

---

## For Your Frontend (Netlify)

### Add This Variable:

**Variable Name:** `REACT_APP_API_URL`  
**Variable Value:** `https://YOUR-SERVER-URL/api`

**Replace `YOUR-SERVER-URL` with:**
- Railway: `your-app.up.railway.app`
- Render: `your-app.onrender.com`

**Example:**
```
REACT_APP_API_URL = https://tms-server.up.railway.app/api
```

---

## How to Add in Railway

1. Click on your service
2. Go to **"Variables"** tab
3. Click **"New Variable"**
4. Name: `NODE_ENV`
5. Value: `production`
6. Click **"Add"**

---

## How to Add in Netlify

1. Go to **Site Settings**
2. Click **"Environment Variables"**
3. Click **"Add variable"**
4. Key: `REACT_APP_API_URL`
5. Value: `https://your-server-url/api`
6. Click **"Save"**

---

## That's All!

After setting these variables:
1. **Redeploy your server** (if you added NODE_ENV)
2. **Redeploy your frontend** (if you added REACT_APP_API_URL)
3. **Test** - Data should now sync!

---

## Need Your Server URL?

**Railway:**
- Dashboard → Your Service → Settings → Networking → Copy domain

**Render:**
- Dashboard → Your Service → Copy URL from top

Then add `/api` at the end for the API URL!

