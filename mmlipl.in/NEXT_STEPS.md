# ✅ Nginx Configured - Next Steps

## Step 1: Test Nginx Configuration

**Run on server:**
```bash
nginx -t
```

**Expected output:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

---

## Step 2: Reload Nginx

**If test passes:**
```bash
systemctl reload nginx
```

---

## Step 3: Check Backend Status

**Check if backend is running:**
```bash
pm2 status
```

**If not running, start it:**
```bash
cd /home/mmlipl/htdocs/mmlipl.in/server
pm2 start server.js --name mmlipl-api
pm2 save
```

**Check backend logs:**
```bash
pm2 logs mmlipl-api
```

---

## Step 4: Test API

**Test API locally:**
```bash
curl http://localhost:3001/api/health
```

**Test API via domain:**
```bash
curl https://mmlipl.in/api/health
curl https://mmlipl.in/api/branches
```

**Should return JSON responses.**

---

## Step 5: Upload Frontend (From Your Mac)

**Build frontend:**
```bash
cd /Users/macbook/transport-management-system
npm run build
```

**Upload frontend:**
```bash
scp -r build/* root@31.97.107.232:/home/mmlipl/htdocs/mmlipl.in/public/
```

---

## Step 6: Set Frontend Permissions (On Server)

```bash
chmod -R 755 /home/mmlipl/htdocs/mmlipl.in/public
chown -R mmlipl:mmlipl /home/mmlipl/htdocs/mmlipl.in/public
```

---

## Step 7: Test Frontend

**Visit in browser:**
- https://mmlipl.in

**Check:**
1. Site loads correctly
2. Open console (F12) - no errors
3. Network tab shows API calls to `https://mmlipl.in/api`
4. Data loads from server

---

## ✅ Deployment Checklist

- [x] Nginx configured with `/api` proxy
- [x] Nginx configured with React Router support
- [ ] Nginx tested (`nginx -t`)
- [ ] Nginx reloaded
- [ ] Backend running (PM2)
- [ ] API tested (curl)
- [ ] Frontend built
- [ ] Frontend uploaded
- [ ] Permissions set
- [ ] Site tested in browser

---

**Start with Step 1 - test nginx configuration!** 🚀
