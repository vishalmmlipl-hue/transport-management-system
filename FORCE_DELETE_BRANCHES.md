# Force Delete Branches from Server

## Problem
Deleted branches still showing on other systems because:
1. Delete might not be working on server
2. Other systems have cached data
3. Branches might be marked inactive instead of deleted

## Quick Fix: Delete from Server Directly

### Step 1: Find Branch IDs

Run this in browser console to see all branches:

```javascript
fetch('https://transport-management-system-wzhx.onrender.com/api/branches')
  .then(r => r.json())
  .then(data => {
    console.log('All branches:', data.data);
    console.log('Branch IDs:', data.data.map(b => ({ id: b.id, name: b.branchName, status: b.status })));
  });
```

### Step 2: Delete Branches

Replace `BRANCH_ID` with the actual ID and run:

```javascript
const branchId = BRANCH_ID; // Replace with actual ID

fetch(`https://transport-management-system-wzhx.onrender.com/api/branches/${branchId}`, {
  method: 'DELETE'
})
.then(r => r.json())
.then(data => {
  if (data.success) {
    console.log('✅ Branch deleted from server!');
    // Clear localStorage and reload
    localStorage.removeItem('branches');
    window.location.reload();
  } else {
    console.error('❌ Delete failed:', data);
  }
});
```

### Step 3: Delete Multiple Branches

```javascript
const branchIds = [ID1, ID2, ID3]; // Replace with actual IDs

Promise.all(branchIds.map(id => 
  fetch(`https://transport-management-system-wzhx.onrender.com/api/branches/${id}`, {
    method: 'DELETE'
  }).then(r => r.json())
)).then(results => {
  console.log('Delete results:', results);
  const successCount = results.filter(r => r.success).length;
  console.log(`✅ Deleted ${successCount} branches`);
  
  // Clear cache and reload
  localStorage.removeItem('branches');
  window.location.reload();
});
```

## Verify Deletion

After deleting, verify:

```javascript
fetch('https://transport-management-system-wzhx.onrender.com/api/branches')
  .then(r => r.json())
  .then(data => {
    console.log('Remaining branches:', data.data.length);
    console.log('Branches:', data.data.map(b => b.branchName));
  });
```

## On Other Systems

After deleting on server, on each other system:

1. **Clear cache:**
   ```javascript
   localStorage.removeItem('branches');
   window.location.reload();
   ```

2. **Or wait 30 seconds** - AutoDataSync will refresh automatically

## Summary

1. **Find branch IDs** from server
2. **Delete from server** using API
3. **Clear localStorage** on all systems
4. **Refresh** - deleted branches should disappear

Deleted branches will now be removed from all systems! 🎉
