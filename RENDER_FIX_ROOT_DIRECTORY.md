# Fix Render Root Directory

## ⚠️ Important: Check Root Directory

Your service is deploying, but you need to verify the **Root Directory** is set to `server`.

### How to Check and Fix:

1. **In Render Dashboard:**
   - Click on your service: `transport-management-system`
   - Go to **"Settings"** tab
   - Scroll down to **"Build & Deploy"** section
   - Check **"Root Directory"** field

2. **If Root Directory is empty or wrong:**
   - Click **"Edit"** or the field
   - Enter: `server`
   - Click **"Save Changes"**
   - This will trigger a new deployment

3. **If Root Directory is already `server`:**
   - ✅ You're good! Just wait for deployment to complete

---

## Current Status

- ✅ Service created: `transport-management-system`
- ✅ URL: `https://transport-management-system-wzhx.onrender.com`
- ⏳ Currently building...
- ⚠️ Need to verify Root Directory = `server`

---

## After Deployment Completes

1. **Check if it's successful:**
   - Status should change from "building" to "live"
   - Check the logs for any errors

2. **Test your API:**
   - Visit: `https://transport-management-system-wzhx.onrender.com/api/health`
   - Should see: `{"success": true, "message": "Server is running"}`

3. **If you see errors:**
   - Check the **"Logs"** tab
   - Common issues:
     - Root Directory not set to `server`
     - Build command missing `npm run init-db`
     - Database initialization failed

---

## Your API URL

Once deployed, your API will be at:
```
https://transport-management-system-wzhx.onrender.com/api
```

---

## Next Steps After Deployment

1. ✅ Verify Root Directory = `server`
2. ✅ Wait for deployment to complete
3. ✅ Test API health endpoint
4. ✅ Update frontend with API URL
5. ✅ Test data sync

---

## Quick Fix if Root Directory is Wrong

1. Go to **Settings** → **Build & Deploy**
2. Set **Root Directory**: `server`
3. Set **Build Command**: `npm install && npm run init-db`
4. Set **Start Command**: `npm start`
5. Click **"Save Changes"**
6. Wait for redeployment

