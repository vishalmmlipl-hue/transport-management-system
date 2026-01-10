# Test API Connection - Quick Guide

## Step 1: Open Browser Console

1. Open your app in browser (mmlipl.info or wherever it's hosted)
2. Press **F12** to open Developer Tools
3. Go to **Console** tab

## Step 2: Check Current API URL

Run this in console:

```javascript
// Check what API URL is being used
console.log('Current hostname:', window.location.hostname);
console.log('API URL should be: https://transport-management-system-wzhx.onrender.com/api');
```

## Step 3: Test Direct API Connection

Run this to test if the server is accessible:

```javascript
fetch('https://transport-management-system-wzhx.onrender.com/api/health')
  .then(response => {
    console.log('Response status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('✅ Server is accessible!', data);
  })
  .catch(error => {
    console.error('❌ Server not accessible:', error);
  });
```

## Step 4: Test Full API Flow

Run this complete test:

```javascript
(async () => {
  const API_URL = 'https://transport-management-system-wzhx.onrender.com/api';
  
  console.log('🧪 Testing API Connection...\n');
  
  // Test 1: Health Check
  console.log('1️⃣ Testing Health Endpoint...');
  try {
    const health = await fetch(`${API_URL.replace('/api', '')}/api/health`);
    const healthData = await health.json();
    console.log('✅ Health Check:', healthData);
  } catch (e) {
    console.error('❌ Health Check Failed:', e.message);
    return;
  }
  
  // Test 2: Get Branches (should return empty array or data)
  console.log('\n2️⃣ Testing GET /branches...');
  try {
    const branches = await fetch(`${API_URL}/branches`);
    const branchesData = await branches.json();
    console.log('✅ Branches API Response:', branchesData);
  } catch (e) {
    console.error('❌ Branches API Failed:', e.message);
  }
  
  // Test 3: Create Test Branch
  console.log('\n3️⃣ Testing POST /branches...');
  try {
    const testBranch = {
      branchName: 'Test Branch ' + Date.now(),
      location: 'Test Location'
    };
    
    const createResponse = await fetch(`${API_URL}/branches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testBranch)
    });
    
    const createData = await createResponse.json();
    console.log('✅ Create Branch Response:', createData);
    
    if (createData.success) {
      console.log('🎉 API is working! Data can be saved to server!');
    }
  } catch (e) {
    console.error('❌ Create Branch Failed:', e.message);
  }
  
  console.log('\n✅ Test Complete!');
})();
```

## What to Look For

### ✅ Success Signs:
- Health check returns: `{success: true, message: "..."}`
- GET requests return data (even if empty array `[]`)
- POST requests return: `{success: true, data: {...}}`
- No CORS errors in console

### ❌ Failure Signs:
- **Network Error**: Server is down or unreachable
- **CORS Error**: Server CORS not configured (but it should be)
- **404 Error**: Wrong API URL
- **500 Error**: Server error (check Render logs)

## Common Issues

### Issue 1: "Network request failed"
**Cause:** Server is sleeping (free tier) or down  
**Solution:** Wait 30-60 seconds, then try again

### Issue 2: "CORS policy blocked"
**Cause:** Server CORS not enabled  
**Solution:** Check server.js has `app.use(cors());`

### Issue 3: "404 Not Found"
**Cause:** Wrong API URL  
**Solution:** Verify URL: `https://transport-management-system-wzhx.onrender.com/api`

### Issue 4: API URL shows localhost
**Cause:** App not detecting production domain  
**Solution:** Set `REACT_APP_API_URL` environment variable in Netlify

## Next Steps

1. **Run the test script above**
2. **Copy the console output**
3. **Share the results** so we can fix any issues

## Quick Fix: Force API URL

If auto-detection isn't working, add this to Netlify environment variables:

**Variable Name:** `REACT_APP_API_URL`  
**Value:** `https://transport-management-system-wzhx.onrender.com/api`

Then redeploy your frontend.
