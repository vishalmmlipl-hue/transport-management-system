# Fix Database Schema Issue

## Problem

The test tried to insert a `location` field, but the `branches` table doesn't have that column.

**Error:**
```
SQLITE_ERROR: table branches has no column named location
```

## Solution

The `branches` table has these columns:
- `branchName` ✅
- `branchCode` ✅
- `address` ✅
- `city` ✅
- `state` ✅
- `pincode` ✅
- `phone` ✅
- `email` ✅
- `gstNumber` ✅
- `status` ✅
- etc.

**NOT:** `location` ❌

## Correct Test

Use this test instead:

```javascript
fetch('https://transport-management-system-wzhx.onrender.com/api/branches', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    branchName: 'Test Branch ' + Date.now(),
    branchCode: 'TB' + Date.now(),
    address: 'Test Address',
    city: 'Test City',
    state: 'Test State',
    status: 'Active'
  })
})
.then(r => r.json())
.then(data => {
  if (data.success) {
    console.log('✅ Data saved to server!', data);
  } else {
    console.error('❌ Save failed:', data);
  }
});
```

## Database Schema Reference

### Branches Table Columns:
- `id` (auto)
- `branchName` (required)
- `branchCode` (required, unique)
- `address`
- `city`
- `state`
- `pincode`
- `phone`
- `email`
- `gstNumber`
- `isHeadOffice`
- `managerName`
- `managerMobile`
- `lrSeriesStart`
- `lrSeriesEnd`
- `lrSeriesCurrent`
- `lrPrefix`
- `nearbyCities`
- `odaLocations`
- `status` (default: 'Active')
- `createdAt` (auto)
- `updatedAt` (auto)

## Next Steps

1. **Use correct column names** when creating data
2. **Check your app forms** - make sure they use correct column names
3. **Test again** with the corrected test above
