# Deploy TMS to Your Own Server (mmlipl.info)

## Quick Start - Deploy to Your Server

### Prerequisites
- Your domain `mmlipl.info` points to your server IP
- SSH access to your server
- Nginx installed on your server

### Step-by-Step Deployment

#### 1. Build the Application (Already Done ✅)
```bash
cd /Users/macbook/transport-management-system
npm run build
```
✅ Build is ready in `build/` folder

#### 2. Transfer Files to Server

**Option A: Using SCP (Secure Copy)**
```bash
# Replace 'user' and 'your-server-ip' with your actual server details
scp -r build/* user@your-server-ip:/tmp/tms-build/

# Then SSH into your server and move files
ssh user@your-server-ip
sudo mkdir -p /var/www/mmlipl.info
sudo cp -r /tmp/tms-build/* /var/www/mmlipl.info/
sudo chown -R www-data:www-data /var/www/mmlipl.info
```

**Option B: Using rsync (Better for updates)**
```bash
rsync -avz --delete build/ user@your-server-ip:/var/www/mmlipl.info/
```

**Option C: Manual Upload**
- Zip the `build` folder
- Upload via FTP/SFTP to `/var/www/mmlipl.info/`
- Extract on server

#### 3. Configure Nginx on Server

SSH into your server and run:

```bash
# Copy Nginx configuration
sudo nano /etc/nginx/sites-available/mmlipl.info
```

Paste the contents from `nginx.conf` file, then:

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/mmlipl.info /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### 4. Set Up SSL (HTTPS) - Optional but Recommended

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d mmlipl.info -d www.mmlipl.info

# Auto-renewal is set up automatically
```

#### 5. Test Your Deployment

Visit:
- `http://mmlipl.info` (HTTP)
- `https://mmlipl.info` (HTTPS, after SSL setup)

---

## Troubleshooting

### Site Not Loading?

1. **Check Nginx status:**
   ```bash
   sudo systemctl status nginx
   ```

2. **Check Nginx error logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

3. **Check file permissions:**
   ```bash
   ls -la /var/www/mmlipl.info
   sudo chown -R www-data:www-data /var/www/mmlipl.info
   ```

4. **Check DNS:**
   ```bash
   nslookup mmlipl.info
   ```

5. **Check firewall:**
   ```bash
   sudo ufw status
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```

### 403 Forbidden Error?

```bash
sudo chmod -R 755 /var/www/mmlipl.info
sudo chown -R www-data:www-data /var/www/mmlipl.info
```

### 502 Bad Gateway?

- Check if Nginx is running: `sudo systemctl status nginx`
- Check Nginx configuration: `sudo nginx -t`
- Check error logs: `sudo tail -f /var/log/nginx/error.log`

---

## Updating Your Deployment

When you make changes:

1. **Rebuild:**
   ```bash
   npm run build
   ```

2. **Upload new build:**
   ```bash
   rsync -avz --delete build/ user@your-server-ip:/var/www/mmlipl.info/
   ```

3. **Clear browser cache** or do a hard refresh (Ctrl+Shift+R)

---

## File Structure on Server

```
/var/www/mmlipl.info/
├── index.html
├── static/
│   ├── css/
│   └── js/
├── favicon.ico
└── ... (other static files)
```

---

## Need Help?

- Check `QUICK_DEPLOY.md` for quick reference
- Check `DEPLOY.md` for detailed deployment guide
- Check `nginx.conf` for Nginx configuration

