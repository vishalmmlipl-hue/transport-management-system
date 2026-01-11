# 🧪 Test Deployment After Setup

## Step 1: Test Backend API

**On server, check if backend is running:**
```bash
pm2 status
pm2 logs mmlipl-api
```

**Test API locally on server:**
```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/branches
```

**Test API via domain:**
```bash
curl https://mmlipl.in/api/health
curl https://mmlipl.in/api/branches
```

---

## Step 2: Test Frontend

**Visit in browser:**
- https://mmlipl.in

**Open browser console (F12) and check:**
1. No errors in Console tab
2. Network tab shows API calls to `https://mmlipl.in/api`
3. Data loads from server (not localStorage)

---

## Step 3: Verify Data Sync

**Create test data:**
1. Login to app
2. Create a branch or city
3. Check if it saves

**Verify on server:**
```bash
# Check database
sqlite3 /home/mmlipl/htdocs/mmlipl.in/server/tms_database.db "SELECT * FROM branches;"
```

**Verify in another browser:**
1. Open app in different browser (or incognito)
2. Data should be there (synced from server)

---

## Step 4: Check Logs

**Backend logs:**
```bash
pm2 logs mmlipl-api
```

**Nginx logs:**
```bash
tail -f /home/mmlipl/logs/nginx/access.log
tail -f /home/mmlipl/logs/nginx/error.log
```

---

## ✅ Success Criteria

- [ ] Backend API responds to `/api/health`
- [ ] Backend API responds to `/api/branches`
- [ ] Frontend loads at https://mmlipl.in
- [ ] No console errors
- [ ] API calls go to `https://mmlipl.in/api`
- [ ] Data saves to server database
- [ ] Data syncs across browsers
- [ ] No localStorage used for business data

---

**Run these tests after deployment!** 🧪
