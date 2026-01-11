# mmlipl.in - Deployment Guide

## 🚀 Deploy Frontend to Hostinger VPS

### Step 1: Build React App Locally
```bash
cd /Users/macbook/transport-management-system
npm run build
```

### Step 2: Upload Build Files to VPS

**Option A: Using SCP**
```bash
# Upload build folder contents to VPS
scp -r build/* root@31.97.107.232:/home/cloudpanel/htdocs/mmlipl.in/public/
```

**Option B: Using CloudPanel File Manager**
1. Go to CloudPanel: `https://31.97.107.232:8443`
2. Sites → mmlipl.in → File Manager
3. Navigate to `/home/cloudpanel/htdocs/mmlipl.in/public/`
4. Upload files from `build/` folder

### Step 3: Set Permissions
```bash
ssh root@31.97.107.232
cd /home/cloudpanel/htdocs/mmlipl.in/public
chmod -R 755 .
chown -R mmlipl:mmlipl .
```

### Step 4: Verify Deployment
Visit: `https://mmlipl.in`

---

## 🔧 Deploy Backend API to VPS

### Step 1: Upload Server Code
```bash
# From your Mac
cd /Users/macbook/transport-management-system
scp -r server root@31.97.107.232:/home/cloudpanel/htdocs/mmlipl.in/
```

### Step 2: Install Dependencies
```bash
ssh root@31.97.107.232
cd /home/cloudpanel/htdocs/mmlipl.in/server
npm install
```

### Step 3: Initialize Database
```bash
npm run init-db
```

### Step 4: Start Server with PM2
```bash
npm install -g pm2
pm2 start server.js --name mmlipl-api
pm2 save
pm2 startup
```

### Step 5: Configure Nginx
Add API proxy to Nginx config:
```nginx
location /api {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

---

## 📋 Deployment Checklist
- [ ] React app built (`npm run build`)
- [ ] Build files uploaded to `/public/`
- [ ] File permissions set correctly
- [ ] Backend server uploaded (if needed)
- [ ] Dependencies installed
- [ ] Database initialized
- [ ] PM2 running (if backend deployed)
- [ ] Nginx configured (if backend deployed)
- [ ] Site tested and working

---

**For troubleshooting, see:** `mmlipl.in/TROUBLESHOOTING.md`
