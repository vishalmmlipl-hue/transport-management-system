# Verify Branch Sync Between Browsers

## 🧪 Quick Test

### Step 1: Create Branch in Browser A

1. Open Browser A (Chrome/Firefox/Safari)
2. Go to mmlipl.info
3. Open Branch Master
4. Create a new branch
5. **Check console** - Should see: `✅ Branch saved to Render.com: {...}`

### Step 2: Check Network Tab (Browser A)

1. Open DevTools → Network tab
2. Create the branch
3. **Look for:** POST request to `render.com/api/branches`
4. **Check response:** Should be `{ success: true, data: {...} }`

### Step 3: Verify on Server

**In Browser A console, run:**

```javascript
fetch('https://transport-management-system-wzhx.onrender.com/api/branches')
  .then(r => r.json())
  .then(d => {
    console.log('✅ Server has', d.data?.length || 0, 'branches');
    console.log('Latest branch:', d.data?.[d.data.length - 1]);
  });
```

**Should show the branch you just created.**

### Step 4: Check Browser B

1. Open Browser B (different browser or incognito)
2. Go to mmlipl.info
3. Open Branch Master
4. **Branch should appear** ✅

**If it doesn't appear:**

1. **Check console** for errors
2. **Check Network tab** - should see GET to `render.com/api/branches`
3. **Check localStorage:**
```javascript
const local = JSON.parse(localStorage.getItem('branches') || '[]');
console.log('localStorage:', local.length);
// Should be 0 ✅
```

## 🔧 Debug Commands

### Check API URL Being Used

```javascript
// Should show Render.com URL
console.log('API URL:', 'https://transport-management-system-wzhx.onrender.com/api');
```

### Check localStorage

```javascript
// Should be empty
['branches', 'cities', 'lrBookings'].forEach(key => {
  const data = localStorage.getItem(key);
  if (data) {
    console.warn(`⚠️ ${key} in localStorage:`, JSON.parse(data).length, 'items');
  } else {
    console.log(`✅ ${key} cleared`);
  }
});
```

### Test Direct API Call

```javascript
// Create branch directly (bypasses component)
const test = {
  branchName: 'DIRECT TEST',
  branchCode: 'DIRECT' + Date.now(),
  status: 'Active'
};

fetch('https://transport-management-system-wzhx.onrender.com/api/branches', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(test)
})
.then(r => r.json())
.then(d => {
  console.log('✅ Direct save result:', d);
  console.log('🔄 Now refresh Browser B to see it');
});
```

## ✅ Expected Results

**Browser A (after creating branch):**
- ✅ Console: "✅ Branch saved to Render.com"
- ✅ Network: POST to render.com/api/branches
- ✅ Response: { success: true, data: {...} }
- ✅ localStorage: Empty (0 branches)

**Browser B (after refresh):**
- ✅ Console: "✅ Loaded X branches from Render.com server"
- ✅ Network: GET to render.com/api/branches
- ✅ Response: { success: true, data: [...] }
- ✅ Branch appears in list ✅

## 🚨 If Still Not Working

1. **Check Render.com is running:**
```javascript
fetch('https://transport-management-system-wzhx.onrender.com/api/health')
  .then(r => r.json())
  .then(d => console.log('Server status:', d));
```

2. **Check CORS errors** in console

3. **Check Network tab** for failed requests

4. **Clear cache and reload:**
```javascript
localStorage.clear();
sessionStorage.clear();
window.location.reload();
```

---

**Run the test and check Network tab to see where the API call is going!**
