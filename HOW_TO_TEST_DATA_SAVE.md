# ✅ How to Test if Data is Saving to Cloud

## ⚠️ Important: Run in Browser Console, NOT Terminal!

The test code is **JavaScript** - it must run in your **browser**, not in the terminal.

---

## 📋 Step-by-Step Instructions

### Step 1: Open Your Website

1. **Open your browser** (Chrome, Firefox, Safari, etc.)
2. **Go to:** `https://mmlipl.info`
3. **Make sure you're logged in**

---

### Step 2: Open Browser Console

**On Windows/Linux:**
- Press `F12` OR
- Press `Ctrl + Shift + J` OR
- Right-click → "Inspect" → "Console" tab

**On Mac:**
- Press `Cmd + Option + J` OR
- Right-click → "Inspect" → "Console" tab

---

### Step 3: Paste the Test Code

**In the browser console** (NOT terminal), paste this:

```javascript
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
  console.log('Create result:', d);
  if (d.success) {
    console.log('✅ Direct API save works!');
    // Check if it's on server
    fetch('https://transport-management-system-wzhx.onrender.com/api/branches')
      .then(r => r.json())
      .then(d => console.log('Branches on server now:', d.data?.length || 0));
  } else {
    console.log('❌ Save failed:', d.error || d.message);
  }
});
```

**Then press Enter**

---

### Step 4: Check Results

**You should see:**
- `Create result: {success: true, data: {...}}` → ✅ Works!
- `✅ Direct API save works!` → ✅ Data is saving!
- `Branches on server now: 1` → ✅ Verified!

**OR:**
- `Create result: {success: false, error: ...}` → ❌ Error
- `❌ Save failed: ...` → ❌ Not working

---

## 🎯 Alternative: Test by Creating Data in App

### Easier Method:

1. **Open browser console** (F12) on `https://mmlipl.info`
2. **Create a branch** in your app (use the Branch Master form)
3. **Watch the console** for:
   - `🌐 API Call: POST https://transport-management-system-wzhx.onrender.com/api/branches`
   - `✅ API Response: {success: true, data: {...}}`

**If you see:**
- ✅ `✅ API Response` → Data IS saving!
- ❌ `❌ API Call Failed` → Data is NOT saving

---

## 📸 Visual Guide

### Where to Run Code:

```
❌ WRONG: Terminal/Command Prompt
   bash-3.2$ fetch(...)  ← This won't work!

✅ CORRECT: Browser Console
   > fetch(...)  ← This works!
```

### How to Open Browser Console:

1. **Chrome/Edge:**
   - Press `F12`
   - Click "Console" tab

2. **Firefox:**
   - Press `F12`
   - Click "Console" tab

3. **Safari:**
   - Enable Developer menu first:
     - Safari → Preferences → Advanced → Check "Show Develop menu"
   - Then: Develop → Show JavaScript Console

---

## 🔍 Quick Check: Is API Fix Deployed?

**In browser console on https://mmlipl.info:**

```javascript
// Check API URL
console.log('Hostname:', window.location.hostname);
console.log('Expected API:', 'https://transport-management-system-wzhx.onrender.com/api');
```

**Then create a branch and look for:**
- `🔗 API Base URL: https://transport-management-system-wzhx.onrender.com/api`

**If you see a different URL:** API fix hasn't deployed yet.

---

## ✅ Summary

1. **Open:** `https://mmlipl.info` in browser
2. **Press:** `F12` to open console
3. **Paste:** The test code above
4. **Press:** Enter
5. **Check:** Results in console

---

**Remember: Browser Console, NOT Terminal!** 🚀
