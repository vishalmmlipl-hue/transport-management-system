# Quick Deployment Guide for mmlipl.info

## ✅ Production Build Complete!

Your TMS application has been built and is ready for deployment.

## Deployment Options

### Option 1: Simple Static Deployment (Recommended)

1. **Copy files to web server:**
   ```bash
   sudo mkdir -p /var/www/mmlipl.info
   sudo cp -r build/* /var/www/mmlipl.info/
   sudo chown -R www-data:www-data /var/www/mmlipl.info
   ```

2. **Configure Nginx:**
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/mmlipl.info
   sudo ln -s /etc/nginx/sites-available/mmlipl.info /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

3. **Test:**
   Visit `http://mmlipl.info` in your browser

### Option 2: Using PM2 with Serve

1. **Install serve:**
   ```bash
   npm install -g serve
   ```

2. **Start with PM2:**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

3. **Configure Nginx as reverse proxy** (uncomment proxy section in nginx.conf)

### Option 3: Automated Deployment Script

```bash
./deploy.sh
```

This script will:
- Build the application (already done)
- Copy files to `/var/www/mmlipl.info`
- Backup existing deployment
- Set proper permissions

## Important Notes

1. **Domain DNS:** Ensure `mmlipl.info` points to your server's IP address
2. **Firewall:** Open ports 80 (HTTP) and 443 (HTTPS)
3. **SSL Certificate:** For HTTPS, use Let's Encrypt:
   ```bash
   sudo certbot --nginx -d mmlipl.info -d www.mmlipl.info
   ```

## File Locations

- **Build output:** `./build/` (ready to deploy)
- **Nginx config:** `./nginx.conf`
- **PM2 config:** `./ecosystem.config.js`
- **Deploy script:** `./deploy.sh`

## Troubleshooting

- **Check Nginx status:** `sudo systemctl status nginx`
- **View Nginx logs:** `sudo tail -f /var/log/nginx/error.log`
- **Check PM2 logs:** `pm2 logs tms`
- **Test Nginx config:** `sudo nginx -t`

## Next Steps

1. Ensure domain DNS is configured
2. Run the deployment script or manually copy files
3. Configure and restart Nginx
4. Test the application at http://mmlipl.info

