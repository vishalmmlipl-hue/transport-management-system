# Fix Render Settings - Correct Configuration

## ❌ Error
Render is treating "npm run build" as Root Directory. This is wrong!

## ✅ Correct Settings

In Render Dashboard → Settings → Build & Deploy:

### Root Directory:
```
server
```
**NOT** `npm run build` - that goes in Build Command!

### Build Command:
```
npm run build
```

### Start Command:
```
npm start
```

---

## Step-by-Step Fix

1. **Go to Render Dashboard**
2. **Click on your service:** `transport-management-system`
3. **Go to "Settings" tab**
4. **Scroll to "Build & Deploy" section**

5. **Find "Root Directory" field:**
   - **Current (WRONG):** `npm run build`
   - **Change to:** `server`
   - ⚠️ This is the folder name, not a command!

6. **Find "Build Command" field:**
   - **Should be:** `npm run build`
   - This is the command to run, not a directory!

7. **Find "Start Command" field:**
   - **Should be:** `npm start`

8. **Click "Save Changes"**

---

## Correct Configuration Summary

| Field | Value | Notes |
|-------|-------|-------|
| **Root Directory** | `server` | Folder name where your server code is |
| **Build Command** | `npm run build` | Command to install and setup |
| **Start Command** | `npm start` | Command to start the server |
| **Environment** | `Node` | Runtime environment |

---

## Visual Guide

```
Root Directory:     [server                    ]  ← Folder name
Build Command:      [npm run build             ]  ← Command
Start Command:      [npm start                 ]  ← Command
Environment:        [Node                      ]
```

---

## After Fixing

1. **Save Changes**
2. **Render will automatically redeploy**
3. **Watch the build logs**
4. **Should see:**
   - ✅ Cloning repository
   - ✅ Changing to `server` directory
   - ✅ Running `npm run build`
   - ✅ Database initialized
   - ✅ Server starting

---

## Common Mistake

❌ **WRONG:** Putting commands in Root Directory field  
✅ **RIGHT:** Root Directory = folder name, Commands = in their own fields

---

## Quick Checklist

- [ ] Root Directory = `server` (folder name)
- [ ] Build Command = `npm run build` (command)
- [ ] Start Command = `npm start` (command)
- [ ] Environment = `Node`
- [ ] Clicked "Save Changes"

Fix the Root Directory to `server` and it should work!

