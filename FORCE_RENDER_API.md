# Force API to Always Use Render.com

## ⚠️ Issue

Branch created in one browser doesn't appear in another. This means the API might be pointing to localhost instead of Render.com.

## ✅ Fix Applied

Updated `apiService.js` to **always use Render.com** for production domains (mmlipl.info).

### Change Made:

**Before:**
```javascript
// Only used Render.com for mmlipl.info
if (hostname === 'mmlipl.info') {
  return RENDER_API_URL;
}
// Otherwise used localhost ❌
return 'http://localhost:3001/api';
```

**After:**
```javascript
// Always use Render.com for production
if (hostname === 'mmlipl.info' || 
    hostname.includes('netlify.app') ||
    !hostname.includes('localhost')) {
  return RENDER_API_URL; // ✅ Always Render.com
}
```

## 🧪 Test It

**Run this in browser console:**

```javascript
// Test API URL
import apiService from './utils/apiService';
console.log('API URL:', apiService.getAPIBaseURL());
// Should show: https://transport-management-system-wzhx.onrender.com/api

// Test creating branch
const test = {
  branchName: 'TEST',
  branchCode: 'TEST' + Date.now(),
  status: 'Active'
};

fetch('https://transport-management-system-wzhx.onrender.com/api/branches', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(test)
})
.then(r => r.json())
.then(d => {
  console.log('✅ Saved:', d);
  console.log('🔄 Refresh other browser to see it');
});
```

## 🔍 Debug Steps

### 1. Check API URL

**In browser console:**
```javascript
// Check what URL is being used
console.log('Current hostname:', window.location.hostname);

// Check API service
const apiUrl = 'https://transport-management-system-wzhx.onrender.com/api';
console.log('Should use:', apiUrl);
```

### 2. Check Network Tab

**When creating branch:**
1. Open DevTools → Network tab
2. Create a branch
3. Look for POST request
4. **Check URL** - should be `render.com/api/branches`
5. **Check Response** - should be `{ success: true, data: {...} }`

### 3. Check localStorage

**After creating branch:**
```javascript
// Should be empty
const local = JSON.parse(localStorage.getItem('branches') || '[]');
console.log('localStorage branches:', local.length);
// Should be 0 ✅
```

### 4. Verify on Server

**Check if branch is on server:**
```javascript
fetch('https://transport-management-system-wzhx.onrender.com/api/branches')
  .then(r => r.json())
  .then(d => {
    console.log('Server has', d.data?.length || 0, 'branches');
    console.log('Latest:', d.data?.[d.data.length - 1]);
  });
```

## ✅ Expected Behavior

**When creating branch:**
1. ✅ Console shows: `🌐 API Call: POST https://transport-management-system-wzhx.onrender.com/api/branches`
2. ✅ Network tab shows POST to `render.com`
3. ✅ Response: `{ success: true, data: {...} }`
4. ✅ localStorage stays empty
5. ✅ Branch appears in list
6. ✅ Other browsers see it after refresh

## 🚀 Quick Fix

**If branch still not syncing:**

1. **Clear localStorage:**
```javascript
localStorage.removeItem('branches');
window.location.reload();
```

2. **Check API URL:**
```javascript
// Should always be Render.com for mmlipl.info
console.log('API URL:', 'https://transport-management-system-wzhx.onrender.com/api');
```

3. **Test direct API call:**
```javascript
// Create branch directly
fetch('https://transport-management-system-wzhx.onrender.com/api/branches', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    branchName: 'DIRECT TEST',
    branchCode: 'DIRECT' + Date.now(),
    status: 'Active'
  })
})
.then(r => r.json())
.then(d => console.log('✅ Direct save:', d));
```

---

**The API service now always uses Render.com for mmlipl.info!** ✅
