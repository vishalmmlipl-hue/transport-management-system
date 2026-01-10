# Complete VPS Setup Guide for TMS

## Quick Answer: Choose VPS 1 ($4.99/month) ⭐

**Why:** Only option that can run your Node.js backend + frontend + database all in one place.

---

## Step-by-Step Setup (1-2 hours)

### Prerequisites
- ✅ Hostinger VPS 1 account ($4.99/month)
- ✅ Domain `mmlipl.info` (or your domain)
- ✅ SSH access to VPS
- ✅ Basic terminal knowledge

---

## Part 1: Initial VPS Setup (30 minutes)

### 1. Get VPS Details
After ordering VPS, you'll receive:
- VPS IP address
- Root password (or SSH key)
- Control panel access

### 2. SSH into VPS

```bash
# On your Mac terminal:
ssh root@your-vps-ip

# Enter password when prompted
```

### 3. Update System

```bash
apt update
apt upgrade -y
```

### 4. Install Node.js

```bash
# Install Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x
```

### 5. Install Nginx (Web Server)

```bash
apt install -y nginx

# Start and enable Nginx
systemctl start nginx
systemctl enable nginx

# Check status
systemctl status nginx
```

### 6. Install PM2 (Process Manager)

```bash
npm install -g pm2

# Verify
pm2 --version
```

### 7. Install Git (for deployment)

```bash
apt install -y git
```

**✅ Part 1 Complete!** Your VPS is ready.

---

## Part 2: Deploy Backend Server (20 minutes)

### 1. Create App Directory

```bash
mkdir -p /var/www/tms
cd /var/www/tms
```

### 2. Upload Your Code

**Option A: Using SCP (from your Mac)**

```bash
# On your Mac (in new terminal):
cd /Users/macbook/transport-management-system
scp -r server root@your-vps-ip:/var/www/tms/
```

**Option B: Using Git (recommended)**

```bash
# On VPS:
cd /var/www/tms
git clone https://github.com/your-username/transport-management-system.git .
# Or upload via Hostinger File Manager
```

### 3. Install Backend Dependencies

```bash
cd /var/www/tms/server
npm install
```

### 4. Initialize Database

```bash
npm run init-db
```

### 5. Start Backend with PM2

```bash
# Start server
pm2 start server.js --name tms-backend

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
# (Follow the command it shows you)

# Check status
pm2 status
pm2 logs tms-backend
```

**✅ Backend is running!** Test: `curl http://localhost:3001/api/health`

---

## Part 3: Deploy Frontend (20 minutes)

### 1. Build Frontend (on your Mac)

```bash
cd /Users/macbook/transport-management-system
npm install
npm run build
```

### 2. Upload Build to VPS

```bash
# On your Mac:
scp -r build/* root@your-vps-ip:/var/www/html/
```

### 3. Configure Nginx

```bash
# On VPS:
nano /etc/nginx/sites-available/mmlipl.info
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name mmlipl.info www.mmlipl.info;

    # Frontend (React app)
    root /var/www/html;
    index index.html;

    # Serve React app
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

Save and exit (Ctrl+X, then Y, then Enter)

### 4. Enable Site

```bash
# Create symlink
ln -s /etc/nginx/sites-available/mmlipl.info /etc/nginx/sites-enabled/

# Remove default site
rm /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

**✅ Frontend is deployed!**

---

## Part 4: Set Up SSL (HTTPS) - 15 minutes

### 1. Install Certbot

```bash
apt install -y certbot python3-certbot-nginx
```

### 2. Get SSL Certificate

```bash
certbot --nginx -d mmlipl.info -d www.mmlipl.info
```

Follow prompts:
- Enter email
- Agree to terms
- Choose redirect HTTP to HTTPS

### 3. Auto-Renewal (already set up)

```bash
# Test renewal
certbot renew --dry-run
```

**✅ HTTPS is enabled!**

---

## Part 5: Configure Environment Variables

### 1. Update Frontend API URL

On your Mac, update `.env` or `src/utils/database-api.js`:

```javascript
// For production, use your domain
const API_BASE_URL = 'https://mmlipl.info/api';
```

### 2. Rebuild and Redeploy

```bash
# On your Mac:
npm run build
scp -r build/* root@your-vps-ip:/var/www/html/
```

---

## Part 6: Firewall Setup

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

---

## Verification Checklist

✅ Backend running: `pm2 status` shows `tms-backend` online  
✅ Frontend accessible: Visit `https://mmlipl.info`  
✅ API working: Visit `https://mmlipl.info/api/health`  
✅ SSL working: Green lock in browser  
✅ Database created: Check `/var/www/tms/server/tms_database.db` exists  

---

## Daily Operations

### View Backend Logs
```bash
pm2 logs tms-backend
```

### Restart Backend
```bash
pm2 restart tms-backend
```

### Deploy Updates
```bash
# On your Mac:
npm run build
scp -r build/* root@your-vps-ip:/var/www/html/

# On VPS (if backend changed):
cd /var/www/tms/server
git pull  # or upload new files
pm2 restart tms-backend
```

---

## Troubleshooting

### Backend Not Starting?
```bash
pm2 logs tms-backend
cd /var/www/tms/server
node server.js  # Test manually
```

### Frontend Not Loading?
```bash
nginx -t  # Check config
systemctl status nginx
tail -f /var/log/nginx/error.log
```

### Database Issues?
```bash
cd /var/www/tms/server
npm run init-db  # Reinitialize
```

---

## Backup Strategy

### Daily Database Backup

```bash
# Create backup script
nano /root/backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp /var/www/tms/server/tms_database.db /root/backups/tms_db_$DATE.db
# Keep only last 7 days
find /root/backups -name "tms_db_*.db" -mtime +7 -delete
```

```bash
chmod +x /root/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /root/backup-db.sh
```

---

## Cost Summary

- **VPS 1:** $4.99/month
- **Domain:** Already have `mmlipl.info`
- **SSL:** Free (Let's Encrypt)
- **Total:** $4.99/month

**vs Current:**
- Netlify Pro: $19/month
- Render: Free (but limited)
- **Total:** $19/month

**Savings: $14/month = $168/year!**

---

## Next Steps

1. ✅ Order Hostinger VPS 1
2. ✅ Follow this guide
3. ✅ Test everything
4. ✅ Point domain to VPS IP
5. ✅ Enjoy your all-in-one hosting!

**Need help with any step? Let me know!**
