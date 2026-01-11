# mmlipl.in - Troubleshooting Guide

## 🔍 Common Issues

### Issue 1: Blank Page
**Symptoms:** Site loads but shows blank page

**Diagnosis:**
1. Check browser console (F12) for errors
2. Check Network tab for failed requests (404)
3. Verify files are in `/public/` directory

**Fix:**
```bash
# SSH into VPS
ssh root@31.97.107.232

# Check if files exist
ls -la /home/cloudpanel/htdocs/mmlipl.in/public/
ls -la /home/cloudpanel/htdocs/mmlipl.in/public/static/js/

# Check file permissions
chmod -R 755 /home/cloudpanel/htdocs/mmlipl.in/public
chown -R mmlipl:mmlipl /home/cloudpanel/htdocs/mmlipl.in/public
```

---

### Issue 2: 404 Errors for Static Files
**Symptoms:** Console shows 404 for `main.xxx.js` or `main.xxx.css`

**Fix:**
1. Verify files exist in `/public/static/`
2. Check Nginx configuration
3. Verify file permissions

```bash
# Check Nginx config
nano /etc/nginx/sites-enabled/mmlipl.in

# Test Nginx config
nginx -t

# Reload Nginx
systemctl reload nginx
```

---

### Issue 3: API Not Working
**Symptoms:** API calls return 404 or 500

**Diagnosis:**
1. Check if backend server is running
2. Verify PM2 status
3. Check Nginx proxy configuration

**Fix:**
```bash
# Check PM2 status
pm2 status

# Check server logs
pm2 logs mmlipl-api

# Restart server
pm2 restart mmlipl-api

# Check Nginx config for /api proxy
grep -A 10 "location /api" /etc/nginx/sites-enabled/mmlipl.in
```

---

### Issue 4: Database Errors
**Symptoms:** Data not saving or loading

**Fix:**
```bash
# Check if database exists
ls -la /home/cloudpanel/htdocs/mmlipl.in/server/data/tms.db

# Reinitialize database
cd /home/cloudpanel/htdocs/mmlipl.in/server
npm run init-db

# Check database permissions
chmod 644 /home/cloudpanel/htdocs/mmlipl.in/server/data/tms.db
```

---

### Issue 5: SSL Certificate Errors
**Symptoms:** Browser shows SSL warning

**Fix:**
1. Check SSL certificate in CloudPanel
2. Verify domain DNS settings
3. Renew certificate if expired

---

## 🔧 Quick Diagnostic Commands

### Check Server Status
```bash
# Check if Nginx is running
systemctl status nginx

# Check if PM2 is running
pm2 status

# Check disk space
df -h

# Check memory
free -h
```

### Check Logs
```bash
# Nginx error logs
tail -f /var/log/nginx/error.log

# PM2 logs
pm2 logs mmlipl-api

# System logs
journalctl -xe
```

---

## 📞 Support Information

- **Server IP:** 31.97.107.232
- **Control Panel:** CloudPanel (https://31.97.107.232:8443)
- **Domain:** mmlipl.in

---

**For deployment steps, see:** `mmlipl.in/DEPLOYMENT.md`
