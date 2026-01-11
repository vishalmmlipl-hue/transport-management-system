# 🚀 Quick Deploy: mmlipl.in on Hostinger

## ✅ Site Location Found
- **Root Path:** `/home/mmlipl/htdocs/mmlipl.in`
- **Public:** `/home/mmlipl/htdocs/mmlipl.in/public`
- **Server:** `/home/mmlipl/htdocs/mmlipl.in/server`

---

## 📋 Deployment Steps

### Step 1: Create Directory Structure (On Server)

**SSH into server and run:**
```bash
# Create directories
mkdir -p /home/mmlipl/htdocs/mmlipl.in/public
mkdir -p /home/mmlipl/htdocs/mmlipl.in/server

# Set permissions
chown -R mmlipl:mmlipl /home/mmlipl/htdocs/mmlipl.in
chmod -R 755 /home/mmlipl/htdocs/mmlipl.in
```

---

### Step 2: Upload Backend Server (From Your Mac)

```bash
cd /Users/macbook/transport-management-system
scp -r server root@31.97.107.232:/home/mmlipl/htdocs/mmlipl.in/
```

---

### Step 3: Install Backend Dependencies (On Server)

```bash
ssh root@31.97.107.232
cd /home/mmlipl/htdocs/mmlipl.in/server
npm install
npm run init-db
```

---

### Step 4: Start Backend with PM2 (On Server)

```bash
# Install PM2 if not installed
npm install -g pm2

# Start server
cd /home/mmlipl/htdocs/mmlipl.in/server
pm2 start server.js --name mmlipl-api

# Make it start on reboot
pm2 save
pm2 startup
```

---

### Step 5: Configure Nginx for API (On Server)

```bash
nano /etc/nginx/sites-enabled/mmlipl.in.conf
```

**Add this inside the `server` block (after the existing `root` line):**
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

### Step 6: Build Frontend (On Your Mac)

```bash
cd /Users/macbook/transport-management-system
npm run build
```

---

### Step 7: Upload Frontend (From Your Mac)

```bash
cd /Users/macbook/transport-management-system
scp -r build/* root@31.97.107.232:/home/mmlipl/htdocs/mmlipl.in/public/
```

---

### Step 8: Set Frontend Permissions (On Server)

```bash
ssh root@31.97.107.232
chmod -R 755 /home/mmlipl/htdocs/mmlipl.in/public
chown -R mmlipl:mmlipl /home/mmlipl/htdocs/mmlipl.in/public
```

---

### Step 9: Test Deployment

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

## ✅ Checklist

- [ ] Directories created
- [ ] Backend uploaded
- [ ] Backend dependencies installed
- [ ] Database initialized
- [ ] PM2 running
- [ ] Nginx configured
- [ ] Frontend built
- [ ] Frontend uploaded
- [ ] Permissions set
- [ ] API tested
- [ ] Frontend tested

---

## 🎯 What's Configured

- ✅ **API Service** - Updated to use `https://mmlipl.in/api` for mmlipl.in domain
- ✅ **Backend** - Ready to upload and configure
- ✅ **Frontend** - Ready to build and upload

---

**Start with Step 1!** 🚀
