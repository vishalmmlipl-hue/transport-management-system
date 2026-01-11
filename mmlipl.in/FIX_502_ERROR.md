# 🔧 Fix 502 Bad Gateway Error

## Problem
502 Bad Gateway means Nginx can't connect to the backend server on port 3001.

## 🔍 Diagnosis Steps

### Step 1: Check if Backend is Running

**On server, run:**
```bash
pm2 status
```

**If backend is not running, you'll see:**
- No `mmlipl-api` process
- Or status shows "stopped" or "errored"

---

### Step 2: Check Backend Logs

```bash
pm2 logs mmlipl-api
```

**Look for errors:**
- Database connection errors
- Port already in use
- Missing dependencies
- Syntax errors

---

### Step 3: Test Backend Locally

```bash
curl http://localhost:3001/api/health
```

**If this fails:**
- Backend is not running
- Backend crashed
- Port 3001 is not accessible

---

## 🔧 Fixes

### Fix 1: Start Backend (If Not Running)

```bash
cd /home/mmlipl/htdocs/mmlipl.in/server
pm2 start server.js --name mmlipl-api
pm2 save
```

---

### Fix 2: Check if Port 3001 is in Use

```bash
netstat -tulpn | grep 3001
```

**If nothing shows:**
- Backend is not running
- Start it with PM2

---

### Fix 3: Check Database

**If backend needs database:**
```bash
cd /home/mmlipl/htdocs/mmlipl.in/server
ls -la tms_database.db
```

**If database doesn't exist:**
```bash
npm run init-db
```

---

### Fix 4: Restart Backend

```bash
pm2 restart mmlipl-api
pm2 logs mmlipl-api
```

---

## ✅ Quick Fix Checklist

- [ ] Check `pm2 status` - backend should be running
- [ ] Check `pm2 logs mmlipl-api` - no errors
- [ ] Test `curl http://localhost:3001/api/health` - should work
- [ ] Restart backend: `pm2 restart mmlipl-api`
- [ ] Check Nginx config: `nginx -t`
- [ ] Reload Nginx: `systemctl reload nginx`

---

**Start with Step 1 - check if backend is running!** 🔍
