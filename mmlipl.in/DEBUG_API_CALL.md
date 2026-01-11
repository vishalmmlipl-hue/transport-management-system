# 🔍 Debug "Cannot GET /api" Error

## ✅ Confirmed Working
- Backend API is running: `curl http://localhost:3001/api/health` ✅
- Nginx proxy is working: `curl https://mmlipl.in/api/health` ✅

## 🔍 The Issue
The error "Cannot GET /api" means something is trying to access `/api` without a specific endpoint.

## 🧪 Debug Steps

### Step 1: Check Browser Console

**Visit:** https://mmlipl.in

**Open browser console (F12):**
1. Go to **Network** tab
2. Reload the page
3. Look for failed requests
4. Check what URL is being called

**Look for:**
- Requests to `https://mmlipl.in/api` (wrong - no endpoint)
- Requests to `https://mmlipl.in/api/health` (correct)
- Requests to `https://mmlipl.in/api/branches` (correct)

---

### Step 2: Check Browser Console Errors

**In Console tab, look for:**
- Red error messages
- What exact URL is failing
- Any JavaScript errors

---

### Step 3: Check Nginx Access Logs

**On server:**
```bash
tail -f /home/mmlipl/logs/nginx/access.log
```

**Then reload the page in browser and watch the logs.**

**Look for:**
- `GET /api HTTP/1.1` (wrong - no endpoint)
- `GET /api/health HTTP/1.1` (correct)
- `GET /api/branches HTTP/1.1` (correct)

---

### Step 4: Check if Frontend is Calling Wrong Endpoint

**The frontend should be calling:**
- `/api/branches` ✅
- `/api/cities` ✅
- `/api/health` ✅
- NOT just `/api` ❌

---

## 🔧 Possible Causes

1. **Frontend code calling `/api` directly**
   - Need to find and fix the code

2. **Browser trying to fetch `/api` for some reason**
   - Check Network tab to see what's making the request

3. **Service worker or cached code**
   - Hard refresh: `Ctrl+F5` or `Cmd+Shift+R`
   - Clear browser cache

---

## 🚀 Quick Fix: Add Root /api Route (Temporary)

**If needed, add this to backend `server.js`:**

```javascript
// Root API endpoint
app.get('/api', (req, res) => {
  res.json({ 
    success: true, 
    message: 'TMS API is running',
    endpoints: [
      '/api/health',
      '/api/branches',
      '/api/cities',
      // ... other endpoints
    ]
  });
});
```

**Then restart:**
```bash
pm2 restart mmlipl-api
```

---

**First, check the browser Network tab to see what's calling `/api`!** 🔍
