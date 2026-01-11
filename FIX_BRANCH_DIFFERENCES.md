# Fix: Different Branches in Different Browsers

## 🔍 Problem

You're seeing different branches in different browsers:
- **Browser 1:** Mumbai Head Office, Delhi Branch, indore (IDR001)
- **Browser 2:** Mumbai Head Office, Delhi Branch, Bangalore Branch (BR003)

This means branches are still being loaded from localStorage or the server has different data.

## ✅ Solution Steps

### Step 1: Check What's on the Server

**Run this in BOTH browsers (console F12):**

```javascript
// Copy from CHECK_SERVER_BRANCHES.js
fetch('https://transport-management-system-wzhx.onrender.com/api/branches')
  .then(r => r.json())
  .then(d => {
    console.log('Server has', d.data?.length || 0, 'branches:');
    d.data?.forEach(b => {
      console.log(`  - ${b.branchName} (${b.branchCode})`);
    });
  });
```

**This will show what branches are actually on the server.**

### Step 2: Sync All Branches to Server

**Run this in Browser 1 (the one with "indore"):**

```javascript
// Copy entire script from SYNC_ALL_BRANCHES_TO_SERVER.js
// This will sync all branches from localStorage to server
```

**Then run it in Browser 2 (the one with "Bangalore Branch"):**

```javascript
// Copy entire script from SYNC_ALL_BRANCHES_TO_SERVER.js
// This will sync all branches from localStorage to server
```

**This merges all branches from both browsers to the server.**

### Step 3: Clear localStorage on Both Browsers

**Run this on EACH browser:**

```javascript
localStorage.removeItem('branches');
console.log('✅ Cleared - reloading...');
window.location.reload();
```

### Step 4: Verify Both Browsers Show Same Data

**After reloading both browsers:**

1. **Check console** - Should see:
   - `🔄 Loading branches from Render.com server...`
   - `✅ Loaded X branches from server`

2. **Check Branch Master** - Both browsers should show the same branches

3. **Verify on server:**
```javascript
fetch('https://transport-management-system-wzhx.onrender.com/api/branches')
  .then(r => r.json())
  .then(d => console.log('Server branches:', d.data?.map(b => b.branchName)));
```

## 🔧 If Still Different

### Check 1: Verify Hook is Loading

**Open console and look for:**
- `🔄 useDataSync: Loading branches on mount...`
- `🔄 Loading branches from Render.com server...`
- `✅ Loaded X branches from server`

**If you don't see these messages, the hook isn't loading.**

### Check 2: Check Network Tab

**When page loads:**
1. Open DevTools → Network tab
2. Reload page
3. Look for GET request to `render.com/api/branches`
4. Check response - should show all branches

### Check 3: Check localStorage

**After page loads:**
```javascript
const local = JSON.parse(localStorage.getItem('branches') || '[]');
console.log('localStorage branches:', local.length);
// Should be 0 ✅
```

**If it's not 0, something is still saving to localStorage.**

### Check 4: Force Reload from Server

**In branch-master-form, add this temporarily:**

```javascript
// Force reload on mount
useEffect(() => {
  loadBranches(); // Force reload from server
}, []);
```

## 🎯 Expected Result

**After fixing:**
- ✅ Both browsers show the same branches
- ✅ All branches are on the server
- ✅ localStorage is empty
- ✅ Console shows "Loaded X branches from server"

## 📋 Quick Fix Script

**Run this in BOTH browsers to fix everything:**

```javascript
(async () => {
  console.log('🔧 Fixing branch differences...\n');
  
  // 1. Get server branches
  const serverRes = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
  const serverData = await serverRes.json();
  console.log('Server has', serverData.data?.length || 0, 'branches');
  
  // 2. Get local branches
  const localBranches = JSON.parse(localStorage.getItem('branches') || '[]');
  console.log('localStorage has', localBranches.length, 'branches');
  
  // 3. Sync missing branches
  if (localBranches.length > 0) {
    const serverCodes = (serverData.data || []).map(b => b.branchCode?.toUpperCase());
    const toSync = localBranches.filter(b => {
      const code = b.branchCode?.toUpperCase();
      return code && !serverCodes.includes(code);
    });
    
    console.log(`Syncing ${toSync.length} branches...`);
    for (const branch of toSync) {
      await fetch('https://transport-management-system-wzhx.onrender.com/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branch)
      });
    }
  }
  
  // 4. Clear localStorage
  localStorage.removeItem('branches');
  console.log('✅ Cleared localStorage');
  
  // 5. Reload
  console.log('🔄 Reloading...');
  window.location.reload();
})();
```

---

**Run the sync script in both browsers, then reload!**
