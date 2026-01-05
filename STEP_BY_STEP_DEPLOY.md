# Step-by-Step Deployment Explanation

## Overview
You need to do 3 main things:
1. **Copy files** from your local `build/` folder to your server
2. **Configure Nginx** (web server) to serve your files
3. **Visit** your website at http://mmlipl.info

---

## Step 1: Copy the Build Folder to Your Server

### What is the build folder?
The `build/` folder contains your compiled, production-ready website files. It's located at:
```
/Users/macbook/transport-management-system/build/
```

### Where to copy it?
Copy all files from `build/` to `/var/www/mmlipl.info/` on your server.

### How to do it?

#### Method 1: Using SCP (if you have SSH access to your server)

**On your Mac (local machine):**
```bash
# Replace 'username' with your server username
# Replace 'your-server-ip' with your actual server IP address
# Example: scp -r build/* root@192.168.1.100:/tmp/tms-build/

scp -r build/* username@your-server-ip:/tmp/tms-build/
```

**Then SSH into your server:**
```bash
# Connect to your server
ssh username@your-server-ip

# Once connected, create the web directory
sudo mkdir -p /var/www/mmlipl.info

# Copy files from temp location to web directory
sudo cp -r /tmp/tms-build/* /var/www/mmlipl.info/

# Set correct permissions (important!)
sudo chown -R www-data:www-data /var/www/mmlipl.info
sudo chmod -R 755 /var/www/mmlipl.info
```

#### Method 2: Using rsync (better for future updates)

**On your Mac:**
```bash
# This copies everything and removes files that don't exist locally
rsync -avz --delete build/ username@your-server-ip:/var/www/mmlipl.info/
```

**Then on your server:**
```bash
ssh username@your-server-ip
sudo chown -R www-data:www-data /var/www/mmlipl.info
sudo chmod -R 755 /var/www/mmlipl.info
```

#### Method 3: Manual Upload (if you don't have SSH)

1. **Zip the build folder:**
   ```bash
   cd /Users/macbook/transport-management-system
   zip -r tms-build.zip build/
   ```

2. **Upload via FTP/SFTP:**
   - Use FileZilla, Cyberduck, or similar FTP client
   - Connect to your server
   - Upload `tms-build.zip` to `/var/www/`
   - Extract the zip file on the server

3. **On your server (via SSH or control panel):**
   ```bash
   cd /var/www/
   sudo unzip tms-build.zip
   sudo mv build/* mmlipl.info/
   sudo chown -R www-data:www-data /var/www/mmlipl.info
   ```

### What should be in /var/www/mmlipl.info/ after copying?
```
/var/www/mmlipl.info/
├── index.html          ← Main HTML file
├── static/            ← CSS and JavaScript files
│   ├── css/
│   └── js/
├── favicon.ico        ← Website icon
├── manifest.json
└── robots.txt
```

---

## Step 2: Configure Nginx Using nginx.conf

### What is Nginx?
Nginx is a web server that serves your website files to visitors. It needs to know:
- Where your files are located (`/var/www/mmlipl.info`)
- Which domain to serve (`mmlipl.info`)
- How to handle requests

### What is nginx.conf?
The `nginx.conf` file in your project contains the configuration that tells Nginx how to serve your website.

### How to configure Nginx?

**1. SSH into your server:**
```bash
ssh username@your-server-ip
```

**2. Create the Nginx configuration file:**
```bash
# Create and edit the configuration file
sudo nano /etc/nginx/sites-available/mmlipl.info
```

**3. Copy the contents from your local nginx.conf file:**
   - Open `/Users/macbook/transport-management-system/nginx.conf` on your Mac
   - Copy all the contents
   - Paste into the nano editor on your server
   - Save: Press `Ctrl + X`, then `Y`, then `Enter`

**Or, copy the file directly:**
```bash
# On your Mac, copy the file to server
scp nginx.conf username@your-server-ip:/tmp/nginx.conf

# On your server, move it to the right location
sudo mv /tmp/nginx.conf /etc/nginx/sites-available/mmlipl.info
```

**4. Enable the site:**
```bash
# Create a symbolic link to enable the site
sudo ln -s /etc/nginx/sites-available/mmlipl.info /etc/nginx/sites-enabled/
```

**5. Test the configuration:**
```bash
# This checks if your Nginx config is valid
sudo nginx -t
```

You should see:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

**6. Restart Nginx:**
```bash
# Restart Nginx to apply the new configuration
sudo systemctl restart nginx

# Or if systemctl doesn't work:
sudo service nginx restart
```

**7. Check if Nginx is running:**
```bash
sudo systemctl status nginx
```

### What does the nginx.conf file do?
- **Listens on port 80** (HTTP) for requests to `mmlipl.info`
- **Serves files** from `/var/www/mmlipl.info`
- **Handles routing** - if a file doesn't exist, serves `index.html` (for React routing)
- **Enables compression** (gzip) for faster loading
- **Sets security headers** to protect your site
- **Caches static files** (images, CSS, JS) for 1 year

---

## Step 3: Visit http://mmlipl.info

### What to do?
Simply open your web browser and go to:
```
http://mmlipl.info
```

### What should you see?
You should see your Transport Management System (TMS) application running!

### Troubleshooting if it doesn't work:

**1. Check if files are in the right place:**
```bash
ssh username@your-server-ip
ls -la /var/www/mmlipl.info
```
You should see `index.html` and `static/` folder.

**2. Check Nginx status:**
```bash
sudo systemctl status nginx
```
Should show "active (running)".

**3. Check Nginx error logs:**
```bash
sudo tail -f /var/log/nginx/error.log
```
Look for any error messages.

**4. Check file permissions:**
```bash
ls -la /var/www/mmlipl.info
```
Files should be owned by `www-data`. If not:
```bash
sudo chown -R www-data:www-data /var/www/mmlipl.info
sudo chmod -R 755 /var/www/mmlipl.info
```

**5. Check DNS:**
Make sure your domain `mmlipl.info` points to your server's IP address:
```bash
nslookup mmlipl.info
```
Should show your server's IP address.

**6. Check firewall:**
```bash
sudo ufw status
```
Port 80 (HTTP) should be open. If not:
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp  # For HTTPS later
```

**7. Test locally on server:**
```bash
curl http://localhost
```
Should return your website's HTML.

---

## Complete Command Summary

### On Your Mac (Local):
```bash
# 1. Make sure build is ready
cd /Users/macbook/transport-management-system
npm run build

# 2. Copy files to server (replace with your details)
scp -r build/* username@your-server-ip:/tmp/tms-build/
scp nginx.conf username@your-server-ip:/tmp/nginx.conf
```

### On Your Server (via SSH):
```bash
# 1. Create web directory
sudo mkdir -p /var/www/mmlipl.info

# 2. Copy files
sudo cp -r /tmp/tms-build/* /var/www/mmlipl.info/

# 3. Set permissions
sudo chown -R www-data:www-data /var/www/mmlipl.info
sudo chmod -R 755 /var/www/mmlipl.info

# 4. Configure Nginx
sudo mv /tmp/nginx.conf /etc/nginx/sites-available/mmlipl.info
sudo ln -s /etc/nginx/sites-available/mmlipl.info /etc/nginx/sites-enabled/

# 5. Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx

# 6. Check status
sudo systemctl status nginx
```

### In Your Browser:
```
Visit: http://mmlipl.info
```

---

## Next Steps (Optional but Recommended)

### Set up HTTPS (SSL Certificate):
```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Get free SSL certificate
sudo certbot --nginx -d mmlipl.info -d www.mmlipl.info
```

This will:
- Get a free SSL certificate from Let's Encrypt
- Automatically configure HTTPS
- Set up auto-renewal
- Redirect HTTP to HTTPS

After this, your site will be available at `https://mmlipl.info`!

---

## Need Help?

If something doesn't work:
1. Check the error messages in Nginx logs
2. Verify file permissions
3. Ensure DNS is pointing to your server
4. Check firewall settings
5. See `DEPLOY_TO_SERVER.md` for more troubleshooting

