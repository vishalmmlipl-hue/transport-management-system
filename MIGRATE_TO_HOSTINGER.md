# Complete Guide: Migrate TMS to Hostinger VPS

## 🎯 Goal
Move your Transport Management System from Netlify + Render to Hostinger VPS (everything in one place)

---

## 📋 Prerequisites Checklist

Before starting, make sure you have:
- ✅ Hostinger account (sign up at hostinger.com)
- ✅ VPS 1 plan ordered ($4.99/month)
- ✅ Domain `mmlipl.info` (or your domain)
- ✅ SSH access to VPS (IP, username, password)
- ✅ Your code ready on your Mac

---

## Part 1: Order Hostinger VPS (15 minutes)

### Step 1: Sign Up / Login
1. Go to **hostinger.com**
2. Sign up or log in

### Step 2: Order VPS
1. Go to **VPS Hosting** section
2. Choose **VPS 1** plan ($4.99/month)
   - 1 vCPU
   - 1GB RAM
   - 20GB SSD
   - Full root access
3. Complete purchase
4. Wait for VPS to be provisioned (5-10 minutes)

### Step 3: Get VPS Details
After VPS is ready, you'll receive:
- ✅ VPS IP address (e.g., `123.45.67.89`)
- ✅ Root password (or SSH key)
- ✅ Control panel access

**Save these details!**

---

## Part 2: Initial VPS Setup (30 minutes)

### Step 1: Connect to VPS via SSH

**On your Mac terminal:**

```bash
# Connect to VPS (replace with your VPS IP)
ssh root@your-vps-ip

# Enter password when prompted
# First time: Type 'yes' to accept fingerprint
```

**If connection successful, you'll see:**
```
Welcome to Ubuntu...
root@vps:~#
```

### Step 2: Update System

```bash
# Update package list
apt update

# Upgrade system
apt upgrade -y
```

### Step 3: Install Node.js

```bash
# Install Node.js 18.x (LTS version)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify installation
node --version   # Should show v18.x.x
npm --version    # Should show 9.x.x
```

**Expected output:**
```
v18.17.0
9.6.7
```

### Step 4: Install Nginx (Web Server)

```bash
# Install Nginx
apt install -y nginx

# Start Nginx
systemctl start nginx

# Enable Nginx to start on boot
systemctl enable nginx

# Check status
systemctl status nginx
```

**Press `q` to exit status view**

### Step 5: Install PM2 (Process Manager)

```bash
# Install PM2 globally
npm install -g pm2

# Verify
pm2 --version
```

### Step 6: Install Git

```bash
# Install Git
apt install -y git

# Verify
git --version
```

### Step 7: Set Up Firewall

```bash
# Allow SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

**✅ Part 2 Complete!** Your VPS is ready.

---

## Part 3: Deploy Backend Server (20 minutes)

### Step 1: Create App Directory

```bash
# Create directory for your app
mkdir -p /var/www/tms
cd /var/www/tms
```

### Step 2: Upload Backend Code

**Option A: Using SCP (from your Mac)**

```bash
# On your Mac (open NEW terminal, keep VPS SSH session open)
cd /Users/macbook/transport-management-system

# Upload server folder
scp -r server root@your-vps-ip:/var/www/tms/
```

**Option B: Using Git (if your code is on GitHub)**

```bash
# On VPS (in SSH session)
cd /var/www/tms
git clone https://github.com/your-username/transport-management-system.git .

# Or clone just the server folder
git clone https://github.com/your-username/transport-management-system.git temp
mv temp/server .
rm -rf temp
```

**Option C: Manual Upload via Hostinger File Manager**
1. Log in to Hostinger control panel
2. Go to File Manager
3. Upload `server` folder to `/var/www/tms/`

### Step 3: Install Backend Dependencies

```bash
# On VPS
cd /var/www/tms/server

# Install dependencies
npm install

# This may take 2-3 minutes
```

### Step 4: Initialize Database

```bash
# Create database and tables
npm run init-db

# Verify database was created
ls -lh tms_database.db
```

**Expected output:**
```
-rw-r--r-- 1 root root 12K ... tms_database.db
```

### Step 5: Test Backend Locally

```bash
# Start server manually (test)
node server.js
```

**You should see:**
```
✅ Connected to SQLite database
🚀 TMS Backend Server running on http://0.0.0.0:3001
```

**Press `Ctrl+C` to stop**

### Step 6: Start Backend with PM2

```bash
# Start with PM2 (runs in background)
pm2 start server.js --name tms-backend

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
# Copy and run the command it shows you

# Check status
pm2 status
pm2 logs tms-backend
```

**Press `Ctrl+C` to exit logs**

**✅ Backend is running!** Test: `curl http://localhost:3001/api/health`

---

## Part 4: Deploy Frontend (20 minutes)

### Step 1: Build Frontend (on your Mac)

```bash
# On your Mac terminal
cd /Users/macbook/transport-management-system

# Install dependencies (if not done)
npm install

# Build production version
npm run build

# This creates optimized files in build/ folder
```

**Wait for build to complete (1-2 minutes)**

### Step 2: Update API URL for Production

**Before deploying, update API URL:**

```bash
# Check current API URL configuration
grep -r "REACT_APP_API_URL\|transport-management-system-wzhx.onrender.com" src/
```

**Update `src/utils/database-api.js`:**

```javascript
// Change from Render URL to your domain
const getAPIBaseURL = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'mmlipl.info' || hostname === 'www.mmlipl.info') {
      return 'https://mmlipl.info/api';  // ← Use your domain
    }
  }
  
  return 'http://localhost:3001/api';
};
```

**Or create `.env.production`:**
```env
REACT_APP_API_URL=https://mmlipl.info/api
```

**Rebuild:**
```bash
npm run build
```

### Step 3: Upload Frontend to VPS

```bash
# On your Mac
cd /Users/macbook/transport-management-system

# Upload build folder
scp -r build/* root@your-vps-ip:/var/www/html/
```

### Step 4: Configure Nginx

```bash
# On VPS (SSH session)
nano /etc/nginx/sites-available/mmlipl.info
```

**Paste this configuration:**

```nginx
server {
    listen 80;
    server_name mmlipl.info www.mmlipl.info;

    # Frontend (React app)
    root /var/www/html;
    index index.html;

    # Serve React app (handle client-side routing)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API (reverse proxy)
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Save and exit:**
- Press `Ctrl+X`
- Press `Y` to confirm
- Press `Enter`

### Step 5: Enable Site

```bash
# Create symlink
ln -s /etc/nginx/sites-available/mmlipl.info /etc/nginx/sites-enabled/

# Remove default site
rm /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

# Should show: "syntax is ok" and "test is successful"

# Reload Nginx
systemctl reload nginx
```

**✅ Frontend is deployed!**

---

## Part 5: Configure Domain & SSL (15 minutes)

### Step 1: Point Domain to VPS

**In your domain registrar (where you bought mmlipl.info):**

1. Go to DNS settings
2. Add/Update A record:
   - **Type:** A
   - **Name:** @ (or blank)
   - **Value:** Your VPS IP address
   - **TTL:** 3600

3. Add/Update CNAME for www:
   - **Type:** CNAME
   - **Name:** www
   - **Value:** mmlipl.info
   - **TTL:** 3600

**Wait 5-10 minutes for DNS to propagate**

**Verify DNS:**
```bash
# On your Mac
nslookup mmlipl.info
# Should show your VPS IP
```

### Step 2: Install SSL Certificate (HTTPS)

```bash
# On VPS
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d mmlipl.info -d www.mmlipl.info
```

**Follow prompts:**
- Enter email address
- Agree to terms (type `A`)
- Choose redirect HTTP to HTTPS (type `2`)
- Wait for certificate (30 seconds)

**✅ HTTPS is enabled!**

### Step 3: Test SSL

```bash
# Test auto-renewal
certbot renew --dry-run
```

**Auto-renewal is already configured!**

---

## Part 6: Final Configuration (10 minutes)

### Step 1: Set File Permissions

```bash
# On VPS
chown -R www-data:www-data /var/www/html
chown -R root:root /var/www/tms
chmod 644 /var/www/tms/server/tms_database.db
```

### Step 2: Set Up Backups

```bash
# On VPS
# Create backup directory
mkdir -p /root/backups

# Upload backup script (from your Mac)
# On Mac:
scp scripts/backup-tms.sh root@your-vps-ip:/root/
scp scripts/restore-tms.sh root@your-vps-ip:/root/

# On VPS:
chmod +x /root/backup-tms.sh
chmod +x /root/restore-tms.sh

# Test backup
/root/backup-tms.sh

# Set up automatic daily backup
crontab -e
# Add this line:
0 2 * * * /root/backup-tms.sh
```

### Step 3: Verify Everything

**Check backend:**
```bash
# On VPS
pm2 status
curl http://localhost:3001/api/health
```

**Check frontend:**
- Visit: `https://mmlipl.info`
- Should see your TMS app

**Check API:**
- Visit: `https://mmlipl.info/api/health`
- Should see: `{"success":true,...}`

---

## Part 7: Testing Checklist

### ✅ Backend Tests

```bash
# On VPS
# Test health endpoint
curl http://localhost:3001/api/health

# Test branches endpoint
curl http://localhost:3001/api/branches
```

### ✅ Frontend Tests

1. Visit `https://mmlipl.info`
2. Login to your app
3. Create a test branch
4. Verify it saves
5. Check browser console (F12) for errors

### ✅ API Tests

```bash
# From your Mac or browser
curl https://mmlipl.info/api/health
curl https://mmlipl.info/api/branches
```

---

## Part 8: Daily Operations

### Deploy Updates

```bash
# On your Mac
# 1. Make changes in Cursor
# 2. Test locally: npm start
# 3. Build: npm run build
# 4. Deploy: scp -r build/* root@your-vps-ip:/var/www/html/

# Or use the deploy script:
npm run deploy  # (if configured)
```

### View Logs

```bash
# On VPS
# Backend logs
pm2 logs tms-backend

# Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### Restart Services

```bash
# On VPS
# Restart backend
pm2 restart tms-backend

# Restart Nginx
systemctl restart nginx
```

---

## Troubleshooting

### Backend Not Starting?

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs tms-backend

# Test manually
cd /var/www/tms/server
node server.js
```

### Frontend Not Loading?

```bash
# Check Nginx
systemctl status nginx
nginx -t

# Check error logs
tail -f /var/log/nginx/error.log
```

### API Not Working?

```bash
# Check if backend is running
pm2 status

# Test locally
curl http://localhost:3001/api/health

# Check Nginx proxy config
cat /etc/nginx/sites-available/mmlipl.info
```

### SSL Issues?

```bash
# Check certificate
certbot certificates

# Renew manually
certbot renew
```

---

## Migration Checklist

- [ ] Hostinger VPS ordered
- [ ] VPS details received (IP, password)
- [ ] Initial VPS setup completed
- [ ] Backend deployed and running
- [ ] Frontend built and deployed
- [ ] Nginx configured
- [ ] Domain DNS updated
- [ ] SSL certificate installed
- [ ] Backups configured
- [ ] Everything tested and working

---

## Cost Comparison

| Item | Before (Netlify + Render) | After (Hostinger VPS) |
|-----|-------------------------|------------------------|
| Frontend | $0-$19/month | Included |
| Backend | Free (limited) | Included |
| Database | Free | Included |
| **Total** | **$0-$19/month** | **$4.99/month** |

**Savings: $0-$14/month**

---

## Next Steps After Migration

1. ✅ Update all systems to use new domain
2. ✅ Test data sync across systems
3. ✅ Monitor for 24-48 hours
4. ✅ Cancel Netlify/Render (if not needed)
5. ✅ Set up monitoring (optional)

---

## Need Help?

If you get stuck at any step:
1. Check the error message
2. Review the troubleshooting section
3. Check logs (PM2, Nginx)
4. Share the error and I'll help fix it!

**Ready to start? Begin with Part 1!** 🚀
