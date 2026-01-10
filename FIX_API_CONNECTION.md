# 🔧 Fix API Connection - Data Not Saving to Cloud Server

## ❌ Problem

Your app at `mmlipl.info` is trying to use `https://mmlipl.info/api` but your backend is on Render at:
`https://transport-management-system-wzhx.onrender.com/api`

---

## ✅ Solution 1: Set Netlify Environment Variable (Easiest)

### Step 1: Go to Netlify Dashboard

1. Visit: https://app.netlify.com
2. Click on your site (mmlipl.info)
3. Go to **Site Settings** → **Environment Variables**

### Step 2: Add Environment Variable

Click **"Add variable"** and add:

- **Key:** `REACT_APP_API_URL`
- **Value:** `https://transport-management-system-wzhx.onrender.com/api`
- **Scopes:** Production, Deploy Preview, Branch Deploys (check all)

Click **"Save"**

### Step 3: Redeploy

1. Go to **Deploys** tab
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Wait 2-5 minutes for rebuild

### Step 4: Test

1. Visit `https://mmlipl.info`
2. Open browser console (F12)
3. You should see: `🔗 API Base URL: https://transport-management-system-wzhx.onrender.com/api`
4. Try creating data - it should save to cloud server!

---

## ✅ Solution 2: Update Code Directly

### Step 1: Update database-api.js

Edit `src/utils/database-api.js`:

Find this section (around line 15):
```javascript
if (hostname === 'mmlipl.info' || hostname === 'www.mmlipl.info') {
  // Use same domain for API (Hostinger VPS)
  return `${window.location.protocol}//${hostname}/api`;
}
```

**Change it to:**
```javascript
if (hostname === 'mmlipl.info' || hostname === 'www.mmlipl.info') {
  // Use Render API server
  return 'https://transport-management-system-wzhx.onrender.com/api';
}
```

### Step 2: Commit and Push

```bash
cd /Users/macbook/transport-management-system
git add src/utils/database-api.js
git commit -m "Fix API URL to use Render server"
git push origin main
```

Netlify will auto-deploy!

---

## ✅ Solution 3: Check if Render Server is Running

### Test Render Server

Visit in browser:
```
https://transport-management-system-wzhx.onrender.com/api/health
```

**Expected response:**
```json
{"success": true, "message": "Server is running"}
```

**If you get an error:**
- Server might be sleeping (Render free tier)
- Wait 30 seconds and refresh
- Or check Render dashboard

---

## 🔍 Verify It's Working

### 1. Check Browser Console

1. Visit `https://mmlipl.info`
2. Press F12 (open console)
3. Look for: `🔗 API Base URL: https://transport-management-system-wzhx.onrender.com/api`

### 2. Test Data Save

1. Create a new branch (or any data)
2. Check console for API calls
3. Should see: `🌐 API Call: POST https://transport-management-system-wzhx.onrender.com/api/branches`
4. Should see: `✅ API Response: {success: true, data: {...}}`

### 3. Verify on Server

Visit:
```
https://transport-management-system-wzhx.onrender.com/api/branches
```

Should show your saved data!

---

## 🎯 Recommended: Use Solution 1 (Environment Variable)

**Why?**
- ✅ No code changes needed
- ✅ Easy to update later
- ✅ Works immediately after redeploy

**Steps:**
1. Add `REACT_APP_API_URL` in Netlify
2. Redeploy
3. Done! 🎉

---

## 🐛 Troubleshooting

### Still Not Working?

1. **Check Render Server:**
   - Visit: `https://transport-management-system-wzhx.onrender.com/api/health`
   - If error, server might be down

2. **Check CORS:**
   - Render server should allow requests from `mmlipl.info`
   - Check server.js CORS settings

3. **Check Browser Console:**
   - Look for CORS errors
   - Look for network errors
   - Check API URL is correct

4. **Clear Browser Cache:**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

---

**Try Solution 1 first - it's the quickest fix!** 🚀
