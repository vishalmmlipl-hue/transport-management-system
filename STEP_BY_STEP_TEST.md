# Step-by-Step Test Guide

## ✅ Good News: API URL is Correct!
Your console shows: `🔗 API Base URL: https://transport-management-system-wzhx.onrender.com/api`

This means the system knows where to send data.

## Test 1: Simple API Test (Copy ONE line at a time)

### Step 1: Test if you can CREATE data
Copy this line into console:
```javascript
fetch('https://transport-management-system-wzhx.onrender.com/api/branches', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({branchName: 'Test Branch', branchCode: 'TEST' + Date.now(), address: 'Test', city: 'Test', state: 'Test', status: 'Active'})}).then(r => r.json()).then(d => console.log('✅ Created:', d));
```

### Step 2: Check if it's on server
Copy this line:
```javascript
fetch('https://transport-management-system-wzhx.onrender.com/api/branches').then(r => r.json()).then(d => console.log('Server has:', d.data.length, 'branches', d.data));
```

## Test 2: Test syncService (Copy line by line)

### Step 1: Import syncService
```javascript
const syncService = await import('./src/utils/sync-service');
```

### Step 2: Test saving
```javascript
const result = await syncService.default.save('branches', {branchName: 'SyncTest', branchCode: 'SYNC' + Date.now(), address: 'Test', city: 'Test', state: 'Test', status: 'Active'});
console.log('Result:', result);
```

### Step 3: Check if synced
```javascript
console.log('Synced?', result.synced);
```

## Test 3: Check what happens when you CREATE a branch in the app

1. Open browser console (F12)
2. Go to Branch Master form
3. Fill in branch details
4. Click Save
5. Watch console - you should see:
   - `💾 Saving branches to server...`
   - `🌐 API Call: POST ...`
   - Either `✅ Successfully saved` OR `⚠️ Saved to localStorage only`

## What to Report Back

Tell me:
1. What happens in Test 1? (Does it create successfully?)
2. What happens in Test 2? (Does syncService work?)
3. What do you see in console when creating a branch in the app?
