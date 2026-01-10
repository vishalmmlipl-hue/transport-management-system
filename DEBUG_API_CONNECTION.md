# Debug API Connection Issues

## Quick Test

Open browser console (F12) and run:

```javascript
// Check current API URL
console.log('API URL:', window.location.hostname);

// Test API connection
fetch('https://transport-management-system-wzhx.onrender.com/api/health')
  .then(r => r.json())
  .then(data => console.log('✅ Server Response:', data))
  .catch(err => console.error('❌ Error:', err));
```

## Common Issues

### 1. API URL Not Detected Correctly

**Problem:** App is using `localhost:3001` instead of Render URL

**Solution:** 
- Check if `REACT_APP_API_URL` environment variable is set in Netlify
- Or the app should auto-detect production domain

### 2. CORS Errors

**Problem:** Browser blocks API requests due to CORS

**Check:** Open browser console, look for CORS errors

**Solution:** Server already has CORS enabled, but verify:
```javascript
app.use(cors()); // Should be in server.js
```

### 3. Server Sleeping (Free Tier)

**Problem:** Render free tier sleeps after 15 min inactivity

**Solution:** 
- Wait 30-60 seconds for server to wake up
- Or upgrade to paid tier ($7/month)

### 4. Network/Firewall Issues

**Problem:** Can't reach Render server

**Test:** 
```bash
curl https://transport-management-system-wzhx.onrender.com/api/health
```

## Debug Steps

### Step 1: Check API URL in Browser

1. Open your app in browser
2. Press F12 (Developer Tools)
3. Go to Console tab
4. Look for: `🔗 API Base URL: ...`
5. Should show: `https://transport-management-system-wzhx.onrender.com/api`

### Step 2: Test API Directly

In browser console, run:
```javascript
fetch('https://transport-management-system-wzhx.onrender.com/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

### Step 3: Check Network Tab

1. Open Developer Tools (F12)
2. Go to Network tab
3. Try to save some data
4. Look for requests to `/api/...`
5. Check if they're successful (200) or failing

### Step 4: Check Server Logs

1. Go to Render Dashboard
2. Click on your service
3. Go to "Logs" tab
4. Look for incoming requests
5. Check for errors

## Force Use Render API

If auto-detection isn't working, set environment variable:

**In Netlify:**
1. Go to Site Settings → Environment Variables
2. Add: `REACT_APP_API_URL = https://transport-management-system-wzhx.onrender.com/api`
3. Redeploy

## Test Script

Run this in browser console to test everything:

```javascript
(async () => {
  const API_URL = 'https://transport-management-system-wzhx.onrender.com/api';
  
  console.log('🧪 Testing API Connection...');
  console.log('API URL:', API_URL);
  
  // Test 1: Health Check
  try {
    const health = await fetch(`${API_URL.replace('/api', '')}/api/health`);
    const healthData = await health.json();
    console.log('✅ Health Check:', healthData);
  } catch (e) {
    console.error('❌ Health Check Failed:', e);
  }
  
  // Test 2: Get Branches
  try {
    const branches = await fetch(`${API_URL}/branches`);
    const branchesData = await branches.json();
    console.log('✅ Branches API:', branchesData);
  } catch (e) {
    console.error('❌ Branches API Failed:', e);
  }
  
  // Test 3: Create Test Data
  try {
    const testData = await fetch(`${API_URL}/branches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ branchName: 'Test Branch', location: 'Test' })
    });
    const testResult = await testData.json();
    console.log('✅ Create Test:', testResult);
  } catch (e) {
    console.error('❌ Create Test Failed:', e);
  }
})();
```

## Expected Results

✅ **Success:**
- Health check returns: `{success: true, message: "..."}`
- API calls return data or success messages
- No CORS errors in console

❌ **Failure:**
- Network errors (server down, sleeping, or unreachable)
- CORS errors (server CORS not configured)
- 404 errors (wrong API URL)
- 500 errors (server error)

## Next Steps

1. Run the test script above
2. Check what errors you get
3. Share the results for further debugging
