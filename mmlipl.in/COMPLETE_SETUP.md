# 🚀 Complete Fresh Deployment: mmlipl.in on Hostinger

## 🎯 Goal
- Fresh deployment on Hostinger VPS
- All data stored on Hostinger server (NOT browser localStorage)
- Backend API: `https://mmlipl.in/api`
- Frontend: `https://mmlipl.in`

---

## 📋 Step-by-Step Setup

### Step 1: Find Site Location ✅

**Run on server:**
```bash
# Find nginx config
grep -r "mmlipl.in" /etc/nginx/sites-enabled/

# Find site root
grep -r "root" /etc/nginx/sites-enabled/ | grep mmlipl

# Check if site directory exists
ls -la /home/cloudpanel/htdocs/
ls -la /home/clp/htdocs/
```

**Share the results to determine site path.**

---

### Step 2: Create Directory Structure (If Needed)

**If site doesn't exist, create it:**

```bash
# Create directories
mkdir -p /home/cloudpanel/htdocs/mmlipl.in/public
mkdir -p /home/cloudpanel/htdocs/mmlipl.in/server

# Set permissions
chown -R mmlipl:mmlipl /home/cloudpanel/htdocs/mmlipl.in
chmod -R 755 /home/cloudpanel/htdocs/mmlipl.in
```

---

### Step 3: Upload Backend Server

**From your Mac:**
```bash
cd /Users/macbook/transport-management-system
scp -r server root@31.97.107.232:/home/cloudpanel/htdocs/mmlipl.in/
```

**On server, install dependencies:**
```bash
cd /home/cloudpanel/htdocs/mmlipl.in/server
npm install
npm run init-db
```

---

### Step 4: Start Backend with PM2

```bash
# Install PM2 if not installed
npm install -g pm2

# Start server
cd /home/cloudpanel/htdocs/mmlipl.in/server
pm2 start server.js --name mmlipl-api

# Make it start on reboot
pm2 save
pm2 startup
```

---

### Step 5: Configure Nginx for API

**Edit nginx config:**
```bash
nano /etc/nginx/sites-enabled/mmlipl.in
```

**Add API proxy (inside server block):**
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

### Step 6: Update Frontend Code

**✅ Already done:** Updated `apiService.js` to use `https://mmlipl.in/api` for mmlipl.in domain

**Build frontend:**
```bash
cd /Users/macbook/transport-management-system
npm run build
```

---

### Step 7: Upload Frontend

**From your Mac:**
```bash
cd /Users/macbook/transport-management-system
scp -r build/* root@31.97.107.232:/home/cloudpanel/htdocs/mmlipl.in/public/
```

**On server, set permissions:**
```bash
chmod -R 755 /home/cloudpanel/htdocs/mmlipl.in/public
chown -R mmlipl:mmlipl /home/cloudpanel/htdocs/mmlipl.in/public
```

---

### Step 8: Test Deployment

**Test API:**
```bash
curl https://mmlipl.in/api/health
curl https://mmlipl.in/api/branches
```

**Test Frontend:**
- Visit: https://mmlipl.in
- Open console (F12)
- Check that API calls go to `https://mmlipl.in/api`
- Verify data loads from server

---

## ✅ Deployment Checklist

- [ ] Site location found
- [ ] Directory structure created
- [ ] Backend server uploaded
- [ ] Backend dependencies installed
- [ ] Database initialized
- [ ] PM2 running backend
- [ ] Nginx configured for /api
- [ ] Frontend code updated (apiService.js)
- [ ] Frontend built
- [ ] Frontend uploaded
- [ ] Permissions set
- [ ] API tested
- [ ] Frontend tested
- [ ] Data syncing to server (not localStorage)

---

## 🔧 Configuration Summary

### API URLs:
- **mmlipl.in** → `https://mmlipl.in/api` (Hostinger)
- **mmlipl.info** → `https://transport-management-system-wzhx.onrender.com/api` (Render.com)

### Server Paths:
- **Frontend:** `/home/cloudpanel/htdocs/mmlipl.in/public/`
- **Backend:** `/home/cloudpanel/htdocs/mmlipl.in/server/`
- **Database:** `/home/cloudpanel/htdocs/mmlipl.in/server/tms_database.db`

---

**Start with Step 1 - find the site location!** 🔍
