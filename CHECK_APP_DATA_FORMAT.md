# 🔍 Check What App is Sending to Server

## ✅ Good News

- ✅ Server CAN save and persist data (test proved it!)
- ✅ Direct API calls work
- ❌ But app-created branches don't appear

**This means:** The app might be sending data in wrong format or missing required fields.

---

## 🔍 Check App's POST Request

### Step 1: Network Tab Check

1. **Open Network tab** (F12 → Network)
2. **Clear log** (🚫 icon)
3. **Create a branch** in your app
4. **Find POST request** to `/branches`
5. **Click on it**

---

### Step 2: Check Request Payload

**In the POST request, check Payload tab:**

**What fields are being sent?**
- `branchName` ✅
- `branchCode` ✅
- `status` ✅
- Any other fields?

**Compare with test that worked:**
```javascript
{
  branchName: 'Persistence Test',
  branchCode: 'PERSIST' + Date.now(),
  status: 'Active'
}
```

---

### Step 3: Check Response

**In the POST request, check Response tab:**

**What does server return?**
- `{"success": true, "data": {...}}` ✅
- `{"success": false, "error": "..."}` ❌
- Any error messages?

---

## 🎯 Possible Issues

### Issue 1: Missing Required Fields

**Server requires:**
- `branchName` (NOT NULL)
- `branchCode` (UNIQUE, NOT NULL)

**Check if app is sending:**
- Correct field names
- All required fields
- Valid data types

---

### Issue 2: Duplicate branchCode

**If `branchCode` already exists:**
- Server will reject with error
- Check response for: `"UNIQUE constraint failed"`

---

### Issue 3: Extra Fields Causing Issues

**App might be sending:**
- `id` field (should be removed)
- Invalid data types
- Extra fields that cause errors

---

## ✅ Quick Test: Check Response

**After creating branch in app, check Network tab:**

1. **Find POST request**
2. **Click Response tab**
3. **Copy the response**
4. **Share it here**

**Look for:**
- `"success": true` or `false`
- `"error"` field
- `"data"` field

---

## 📝 What to Share

After creating a branch in app:

1. **Request Payload** (what app sent)
2. **Response** (what server returned)
3. **Status code** (200, 500, etc.)

**This will show why app data isn't appearing!** 🔍
