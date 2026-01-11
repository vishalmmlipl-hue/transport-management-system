# 🚀 Fresh Deploy: mmlipl.in on Hostinger

## 🎯 Goal
- Fresh deployment on Hostinger VPS
- All data stored on Hostinger server (not browser localStorage)
- Backend API running on Hostinger
- Frontend pointing to Hostinger API

---

## 📋 Step-by-Step Deployment

### Step 1: Prepare Server Code

**Backend API will run on:** `https://mmlipl.in/api`

**Database location:** `/home/cloudpanel/htdocs/mmlipl.in/server/data/tms.db`

---

### Step 2: Update Frontend to Use Hostinger API

**Change API URL from Render.com to Hostinger:**
- Update `src/utils/apiService.js` to use `https://mmlipl.in/api`
- Remove all localStorage fallbacks
- Ensure all data comes from server

---

### Step 3: Upload Backend to Hostinger

**Upload server directory:**
```bash
cd /Users/macbook/transport-management-system
scp -r server root@31.97.107.232:/home/cloudpanel/htdocs/mmlipl.in/
```

---

### Step 4: Install Backend Dependencies

**SSH into server:**
```bash
ssh root@31.97.107.232
cd /home/cloudpanel/htdocs/mmlipl.in/server
npm install
npm run init-db
```

---

### Step 5: Start Backend with PM2

```bash
npm install -g pm2
pm2 start server.js --name mmlipl-api
pm2 save
pm2 startup
```

---

### Step 6: Configure Nginx for API

**Add API proxy to Nginx:**
```bash
nano /etc/nginx/sites-enabled/mmlipl.in
```

**Add this location block:**
```nginx
location /api {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

**Test and reload:**
```bash
nginx -t
systemctl reload nginx
```

---

### Step 7: Build and Upload Frontend

**Build React app:**
```bash
cd /Users/macbook/transport-management-system
npm run build
```

**Upload to Hostinger:**
```bash
scp -r build/* root@31.97.107.232:/home/cloudpanel/htdocs/mmlipl.in/public/
```

**Set permissions:**
```bash
ssh root@31.97.107.232
chmod -R 755 /home/cloudpanel/htdocs/mmlipl.in/public
chown -R mmlipl:mmlipl /home/cloudpanel/htdocs/mmlipl.in/public
```

---

### Step 8: Test Deployment

1. **Test API:**
   ```bash
   curl https://mmlipl.in/api/health
   curl https://mmlipl.in/api/branches
   ```

2. **Test Frontend:**
   - Visit: https://mmlipl.in
   - Check console (F12) - should use Hostinger API
   - Verify data loads from server

---

## ✅ Deployment Checklist

- [ ] Backend code uploaded to Hostinger
- [ ] Backend dependencies installed
- [ ] Database initialized
- [ ] PM2 running backend server
- [ ] Nginx configured for /api proxy
- [ ] Frontend updated to use Hostinger API
- [ ] Frontend built locally
- [ ] Frontend files uploaded to Hostinger
- [ ] Permissions set correctly
- [ ] API tested and working
- [ ] Frontend tested and working
- [ ] Data syncing to server (not localStorage)

---

## 🔧 Configuration Changes Needed

### 1. Update apiService.js
Change API URL to: `https://mmlipl.in/api`

### 2. Remove localStorage Fallbacks
Ensure all components use server data only

### 3. Clear Browser Data
After deployment, clear localStorage to force server sync

---

**Ready to start deployment!** 🚀
