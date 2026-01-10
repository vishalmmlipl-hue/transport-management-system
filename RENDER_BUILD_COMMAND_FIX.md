# Fix Render Build Command Error

## Problem
Render doesn't allow `&&` in the build command field.

## Solution: Use npm script instead

### Step 1: Update package.json (Already Done ✅)

I've added a `build` script to `server/package.json`:
```json
"build": "npm install && npm run init-db"
```

### Step 2: Update Render Build Command

In Render Dashboard:

1. **Go to Settings → Build & Deploy**
2. **Build Command field:**
   - **Remove:** `npm install && npm run init-db`
   - **Enter:** `npm run build`
3. **Click "Save Changes"**

---

## Alternative: Use Separate Commands

If `npm run build` doesn't work, try:

### Option A: Just npm install
- **Build Command:** `npm install`
- **Then manually run init-db** in the Render shell/console after first deploy

### Option B: Use semicolon (if supported)
- **Build Command:** `npm install; npm run init-db`
- (Some platforms allow `;` instead of `&&`)

---

## Recommended: Use npm run build

**In Render Settings:**
- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Root Directory:** `server`

This will:
1. Install dependencies (`npm install`)
2. Initialize database (`npm run init-db`)
3. Then start the server (`npm start`)

---

## After Saving

1. Render will automatically redeploy
2. Watch the build logs
3. Should see both `npm install` and `npm run init-db` running
4. Then server will start

---

## Verify It Worked

After deployment, check logs for:
- ✅ `npm install` completed
- ✅ `npm run init-db` completed (database created)
- ✅ Server started successfully

---

## Quick Fix Summary

**Change Build Command from:**
```
npm install && npm run init-db
```

**To:**
```
npm run build
```

**Then click "Save Changes"**

