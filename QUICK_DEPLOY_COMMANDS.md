# Quick Deploy Commands for mmlipl.info

## Your Server: root@75.2.60.5

## Step 1: Copy Files from Your Mac

**Open a NEW terminal window on your Mac** (keep the SSH session open in the other terminal), then run:

```bash
cd /Users/macbook/transport-management-system

# Copy build files
scp -r build/* root@75.2.60.5:/tmp/tms-build/

# Copy nginx config
scp nginx.conf root@75.2.60.5:/tmp/nginx.conf
```

## Step 2: On Your Server (in the SSH session)

Run these commands one by one:

```bash
# Create web directory
sudo mkdir -p /var/www/mmlipl.info

# Copy files from temp to web directory
sudo cp -r /tmp/tms-build/* /var/www/mmlipl.info/

# Set correct permissions
sudo chown -R www-data:www-data /var/www/mmlipl.info
sudo chmod -R 755 /var/www/mmlipl.info

# Configure Nginx
sudo mv /tmp/nginx.conf /etc/nginx/sites-available/mmlipl.info

# Enable the site
sudo ln -s /etc/nginx/sites-available/mmlipl.info /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx
```

## Step 3: Verify

```bash
# Check files are in place
ls -la /var/www/mmlipl.info

# Should see: index.html, static/, favicon.ico, etc.
```

## Step 4: Visit Your Site

Open browser: **http://mmlipl.info**

---

## All-in-One Command (Alternative)

If you want to do it all at once from your Mac:

```bash
cd /Users/macbook/transport-management-system

# Copy files
scp -r build/* root@75.2.60.5:/tmp/tms-build/
scp nginx.conf root@75.2.60.5:/tmp/nginx.conf

# Run setup commands on server
ssh root@75.2.60.5 "sudo mkdir -p /var/www/mmlipl.info && sudo cp -r /tmp/tms-build/* /var/www/mmlipl.info/ && sudo chown -R www-data:www-data /var/www/mmlipl.info && sudo chmod -R 755 /var/www/mmlipl.info && sudo mv /tmp/nginx.conf /etc/nginx/sites-available/mmlipl.info && sudo ln -s /etc/nginx/sites-available/mmlipl.info /etc/nginx/sites-enabled/ && sudo nginx -t && sudo systemctl restart nginx"
```

---

## Troubleshooting

### If Nginx is not installed:
```bash
sudo apt-get update
sudo apt-get install nginx
```

### If www-data user doesn't exist:
```bash
# Check what user Nginx uses
ps aux | grep nginx

# Use that user instead, or create www-data
sudo useradd -r -s /bin/false www-data
```

### If port 80 is already in use:
```bash
sudo lsof -i :80
# Kill the process or change Nginx port
```

