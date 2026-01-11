# 🔧 Fix "Cannot GET /api" Error

## Problem
The `/api` endpoint is not working. This could be:
1. Nginx proxy not configured correctly
2. Backend routes not set up
3. Backend not responding

## 🔍 Diagnosis

### Step 1: Test Backend Directly

**On server:**
```bash
curl http://localhost:3001/api/health
```

**If this works:**
- Backend is running correctly
- Issue is with Nginx proxy

**If this fails:**
- Backend routes not set up
- Need to check server.js

---

### Step 2: Check Nginx Configuration

**Verify `/api` location block exists:**
```bash
grep -A 10 "location /api" /etc/nginx/sites-enabled/mmlipl.in.conf
```

**Should show:**
```nginx
location /api {
    proxy_pass http://localhost:3001;
    ...
}
```

---

### Step 3: Check Backend Routes

**Check if backend has `/api` routes:**
```bash
cd /home/mmlipl/htdocs/mmlipl.in/server
grep -n "app.get\|app.post" server.js | head -5
```

---

## 🔧 Fixes

### Fix 1: Verify Nginx Config

**Check the full server block:**
```bash
cat /etc/nginx/sites-enabled/mmlipl.in.conf
```

**Make sure `/api` location is BEFORE `/` location:**
```nginx
location /api {
    proxy_pass http://localhost:3001;
    ...
}

location / {
    try_files $uri $uri/ /index.html;
}
```

---

### Fix 2: Test Nginx Config

```bash
nginx -t
systemctl reload nginx
```

---

### Fix 3: Check Backend Routes

**Backend should have routes like:**
- `app.get('/api/health', ...)`
- `app.get('/api/branches', ...)`

**If routes are missing `/api` prefix, need to add it or change Nginx proxy.**

---

**Start with Step 1 - test backend directly!** 🔍
