# mmlipl.in - Backend API Setup

## 🔧 Setup Backend API on VPS

### Step 1: Upload Server Code
```bash
# From your Mac
cd /Users/macbook/transport-management-system
scp -r server root@31.97.107.232:/home/cloudpanel/htdocs/mmlipl.in/
```

### Step 2: Install Node.js (If Not Installed)
```bash
ssh root@31.97.107.232

# Check if Node.js is installed
node --version

# If not installed, install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verify
node --version
npm --version
```

### Step 3: Install Dependencies
```bash
cd /home/cloudpanel/htdocs/mmlipl.in/server
npm install
```

### Step 4: Initialize Database
```bash
npm run init-db
```

This creates:
- `data/tms.db` - SQLite database
- All required tables (branches, cities, lrBookings, etc.)

### Step 5: Install PM2 (Process Manager)
```bash
# Install PM2 globally
npm install -g pm2

# Start server
pm2 start server.js --name mmlipl-api

# Make PM2 start on server reboot
pm2 startup
pm2 save

# Check status
pm2 status

# View logs
pm2 logs mmlipl-api
```

### Step 6: Configure Nginx Reverse Proxy
```bash
# Edit Nginx config
nano /etc/nginx/sites-enabled/mmlipl.in
```

**Add this inside the server block:**
```nginx
# API proxy
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

### Step 7: Test API
```bash
# Test locally on server
curl http://localhost:3001/api/health

# Test via domain
curl https://mmlipl.in/api/health
```

---

## 📋 API Endpoints

### Available Endpoints
- `GET /api/branches` - Get all branches
- `POST /api/branches` - Create branch
- `PUT /api/branches/:id` - Update branch
- `DELETE /api/branches/:id` - Delete branch

- `GET /api/cities` - Get all cities
- `POST /api/cities` - Create city
- (Similar for other resources)

### Health Check
- `GET /api/health` - Server status

---

## 🔍 Verify Setup

### Check Server Status
```bash
pm2 status
pm2 logs mmlipl-api
```

### Check Database
```bash
ls -la /home/cloudpanel/htdocs/mmlipl.in/server/data/tms.db
```

### Test API
```bash
curl https://mmlipl.in/api/branches
```

---

## 🐛 Troubleshooting

### Server Not Starting
```bash
# Check logs
pm2 logs mmlipl-api

# Restart server
pm2 restart mmlipl-api

# Check if port 3001 is in use
netstat -tulpn | grep 3001
```

### API Returns 404
- Check Nginx config has `/api` location block
- Verify `proxy_pass` points to `http://localhost:3001`
- Reload Nginx: `systemctl reload nginx`

### Database Errors
- Check file permissions: `chmod 644 data/tms.db`
- Reinitialize: `npm run init-db`

---

**For deployment, see:** `mmlipl.in/DEPLOYMENT.md`  
**For troubleshooting, see:** `mmlipl.in/TROUBLESHOOTING.md`
