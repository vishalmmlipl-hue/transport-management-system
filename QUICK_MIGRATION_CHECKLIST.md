# Quick Migration Checklist - TMS to Hostinger

## ⚡ Quick Reference

### Step 1: Order VPS (15 min)
- [ ] Sign up at hostinger.com
- [ ] Order VPS 1 ($4.99/month)
- [ ] Get VPS IP and password

### Step 2: Initial Setup (30 min)
```bash
ssh root@your-vps-ip
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs nginx git
npm install -g pm2
ufw allow 22,80,443/tcp && ufw enable
```

### Step 3: Deploy Backend (20 min)
```bash
mkdir -p /var/www/tms
# Upload server folder (via SCP or Git)
cd /var/www/tms/server
npm install
npm run init-db
pm2 start server.js --name tms-backend
pm2 save && pm2 startup
```

### Step 4: Deploy Frontend (20 min)
```bash
# On Mac: npm run build
# Upload build/* to /var/www/html/
# Configure Nginx (see full guide)
```

### Step 5: SSL & Domain (15 min)
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d mmlipl.info -d www.mmlipl.info
```

---

## 🎯 One-Line Commands

### Connect to VPS
```bash
ssh root@your-vps-ip
```

### Check Backend
```bash
pm2 status && curl http://localhost:3001/api/health
```

### Check Frontend
```bash
systemctl status nginx && curl http://localhost
```

### View Logs
```bash
pm2 logs tms-backend
```

### Restart Everything
```bash
pm2 restart tms-backend && systemctl restart nginx
```

---

## 📝 Important Files

- **Backend:** `/var/www/tms/server/`
- **Frontend:** `/var/www/html/`
- **Database:** `/var/www/tms/server/tms_database.db`
- **Nginx Config:** `/etc/nginx/sites-available/mmlipl.info`
- **Backups:** `/root/backups/`

---

## 🔗 Quick Links

- Full Guide: `MIGRATE_TO_HOSTINGER.md`
- Backup Script: `scripts/backup-tms.sh`
- Restore Script: `scripts/restore-tms.sh`

---

**Start with Step 1!** 🚀
