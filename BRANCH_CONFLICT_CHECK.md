# Branch Master Conflict Check

## ⚠️ Issue Found

The `branch-master-form.jsx` is using both:
1. `syncService.load('branches')` - May point to Render.com API
2. `localStorage.setItem('branches')` - Stores data locally

This can cause conflicts:
- **Duplicate data** - Same branch in both localStorage and server
- **ID conflicts** - Different IDs for same branch
- **Data mismatch** - Different data for same branch ID
- **Code conflicts** - Duplicate branch codes

## 🔍 How to Check for Conflicts

### Option 1: Run in Browser Console

```javascript
// Check for conflicts
const checkBranchConflicts = async () => {
  console.log('🔍 Checking for branch data conflicts...\n');
  
  const localBranches = JSON.parse(localStorage.getItem('branches') || '[]');
  console.log(`📦 localStorage has ${localBranches.length} branches`);
  
  const response = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
  const result = await response.json();
  const serverBranches = result.data || [];
  console.log(`🌐 Server has ${serverBranches.length} branches`);
  
  // Find conflicts
  const localIds = new Set(localBranches.map(b => b.id));
  const serverIds = new Set(serverBranches.map(b => b.id));
  
  const onlyInLocal = localBranches.filter(b => !serverIds.has(b.id));
  const onlyInServer = serverBranches.filter(b => !localIds.has(b.id));
  
  console.log(`\n⚠️ Branches only in localStorage: ${onlyInLocal.length}`);
  console.log(`✅ Branches only on server: ${onlyInServer.length}`);
  
  if (onlyInLocal.length > 0) {
    console.log('\nBranches not on server:');
    onlyInLocal.forEach(b => console.log(`  - ${b.branchName} (${b.branchCode})`));
  }
  
  return { onlyInLocal, onlyInServer };
};

// Run it
checkBranchConflicts();
```

### Option 2: Use the Script

1. Open browser console (F12)
2. Copy and paste the script from `src/utils/checkBranchConflicts.js`
3. Run: `checkBranchConflicts()`
4. To fix: `fixBranchConflicts()`

## 🔧 How to Fix Conflicts

### Method 1: Clear localStorage and Reload from Server (Recommended)

```javascript
// Clear old localStorage data
localStorage.removeItem('branches');

// Reload page - branch-master-form will load from server
window.location.reload();
```

### Method 2: Sync localStorage with Server

```javascript
// Get fresh data from server
const response = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
const result = await response.json();
const serverBranches = result.data || [];

// Replace localStorage
localStorage.setItem('branches', JSON.stringify(serverBranches));

// Trigger reload
window.dispatchEvent(new CustomEvent('dataSyncedFromServer'));
```

### Method 3: Update branch-master-form.jsx to Use Hooks

The best solution is to update `branch-master-form.jsx` to use the new hooks:

```javascript
// Replace syncService with hooks
import { useBranches } from './hooks/useDataSync';

const { data: branches, loading, create, update, remove } = useBranches();
```

This will:
- ✅ Always use server data
- ✅ No localStorage conflicts
- ✅ Automatic sync
- ✅ Consistent data

## 📋 Current Issues in branch-master-form.jsx

1. **Line 67**: Updates localStorage with server data (good, but should be removed)
2. **Line 77**: Falls back to localStorage (okay for offline, but can cause conflicts)
3. **Line 191-198**: Manually updates localStorage after server save (conflict risk)
4. **Line 208-210**: Saves to localStorage if server fails (conflict risk)

## ✅ Recommended Fix

Update `branch-master-form.jsx` to:
1. Use `useBranches()` hook instead of `syncService`
2. Remove all `localStorage.setItem('branches')` calls
3. Only use localStorage as read-only fallback if server is unavailable
4. Clear localStorage on successful server operations

## 🚀 Quick Fix Script

Run this in browser console to immediately fix conflicts:

```javascript
(async () => {
  console.log('🔧 Fixing branch conflicts...');
  
  // Get server data
  const response = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
  const result = await response.json();
  const serverBranches = result.data || [];
  
  // Replace localStorage
  localStorage.setItem('branches', JSON.stringify(serverBranches));
  
  console.log(`✅ Updated localStorage with ${serverBranches.length} branches from server`);
  console.log('✅ Reload the page to see changes');
  
  // Reload page
  window.location.reload();
})();
```

---

**Next Step:** Update `branch-master-form.jsx` to use `useBranches()` hook to prevent future conflicts.
