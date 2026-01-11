# 📊 Render.com Data Storage Information

## ✅ Storage Configuration

### Database Type
**SQLite Database**

### Database Location
```
/opt/render/project/src/server/tms_database.db
```

### Storage Details

1. **Type:** SQLite (file-based database)
2. **Location:** Persistent disk on Render.com
3. **Persistence:** ✅ Data persists across deployments and restarts
4. **Backup:** ⚠️ Manual backup recommended

## 🔍 How to Check Storage

### Method 1: Health Endpoint
```javascript
fetch('https://transport-management-system-wzhx.onrender.com/api/health')
  .then(r => r.json())
  .then(d => console.log('Database:', d.database));
```

### Method 2: Check Data
```javascript
// Check branches
fetch('https://transport-management-system-wzhx.onrender.com/api/branches')
  .then(r => r.json())
  .then(d => console.log('Branches:', d.data?.length || 0));

// Check cities
fetch('https://transport-management-system-wzhx.onrender.com/api/cities')
  .then(r => r.json())
  .then(d => console.log('Cities:', d.data?.length || 0));
```

### Method 3: Test Write
```javascript
// Create test data
fetch('https://transport-management-system-wzhx.onrender.com/api/branches', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    branchName: 'Test Branch',
    branchCode: 'TEST' + Date.now(),
    status: 'Active'
  })
})
.then(r => r.json())
.then(d => {
  console.log('Created:', d);
  // Verify it's stored
  fetch('https://transport-management-system-wzhx.onrender.com/api/branches')
    .then(r => r.json())
    .then(data => {
      const found = data.data?.find(b => b.branchCode === d.data?.branchCode);
      console.log('Stored:', found ? '✅ Yes' : '❌ No');
    });
});
```

## 📋 Storage Features

### ✅ What's Stored
- Branches
- Cities
- Clients
- Vehicles
- Drivers
- Staff
- LR Bookings (FTL & PTL)
- Manifests
- Trips
- Invoices
- PODs
- Users
- Accounts
- Expense Types
- And more...

### ✅ Persistence
- Data survives server restarts
- Data survives deployments
- Data persists on Render.com disk

### ⚠️ Limitations
- **Free Tier:** Server may sleep after inactivity
- **Backup:** No automatic backup (manual backup recommended)
- **Size:** SQLite suitable for small to medium datasets

## 🔧 Backup Recommendations

### Option 1: Manual Backup Script
```javascript
// Run in browser console to export all data
(async () => {
  const resources = ['branches', 'cities', 'clients', 'vehicles', 'drivers', 'staff'];
  const backup = {};
  
  for (const resource of resources) {
    const res = await fetch(`https://transport-management-system-wzhx.onrender.com/api/${resource}`);
    const data = await res.json();
    backup[resource] = data.data || [];
  }
  
  // Download as JSON
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup-${new Date().toISOString()}.json`;
  a.click();
})();
```

### Option 2: Render.com Backup
- Check Render.com dashboard for backup options
- Consider upgrading to paid plan for automated backups

## 🧪 Test Storage Now

**Run this in browser console:**

```javascript
// Copy entire script from CHECK_RENDER_STORAGE.js
```

This will:
1. ✅ Check health endpoint (shows database path)
2. ✅ Check branches storage
3. ✅ Check cities storage
4. ✅ Test write operation
5. ✅ Verify data persistence

---

**Render.com uses SQLite database for persistent storage!** ✅
