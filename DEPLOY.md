# TMS Deployment Guide for mmlipl.info

This guide will help you deploy the Transport Management System to your domain `mmlipl.info`.

## Prerequisites

- Node.js and npm installed
- Nginx installed and running
- Domain `mmlipl.info` pointing to your server IP
- SSH access to your server

## Quick Deployment Steps

### 1. Build the Production Version

```bash
cd /Users/macbook/transport-management-system
npm run build
```

This creates an optimized production build in the `build/` folder.

### 2. Deploy Using Nginx (Recommended)

#### Option A: Static File Serving (Simple)

1. Copy the build folder to your web server directory:
```bash
sudo cp -r build/* /var/www/mmlipl.info/
```

2. Configure Nginx (see `nginx.conf` file)

3. Restart Nginx:
```bash
sudo systemctl restart nginx
```

#### Option B: Using PM2 with Serve (For better process management)

1. Install serve globally:
```bash
npm install -g serve
```

2. Use PM2 to run the app (see `ecosystem.config.js`)

3. Configure Nginx as reverse proxy

### 3. Update HTML Title

Update `public/index.html` title to "TMS - Transport Management System"

## Deployment Files

- `nginx.conf` - Nginx configuration for mmlipl.info
- `ecosystem.config.js` - PM2 configuration
- `deploy.sh` - Automated deployment script

## Testing

After deployment, test:
- Visit `http://mmlipl.info` or `https://mmlipl.info`
- Check all features work correctly
- Verify data persistence (localStorage)

## Troubleshooting

- Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`
- Check PM2 logs: `pm2 logs tms`
- Verify domain DNS: `nslookup mmlipl.info`
- Check firewall: Ensure ports 80 and 443 are open

