# Deploy to Your Nginx Server (99.83.190.102)

## Discovery
- `75.2.60.5` = Netlify (CDN, not accessible via SSH)
- `99.83.190.102` = Your actual Nginx server ✅

## Step 1: Try SSH to the Nginx Server

```bash
ssh root@99.83.190.102
ssh ubuntu@99.83.190.102
ssh admin@99.83.190.102
```

## Step 2: If SSH Works, Deploy

### From Your Mac:
```bash
cd /Users/macbook/transport-management-system

# Copy files
scp -r build/* root@99.83.190.102:/tmp/tms-build/
scp nginx.conf root@99.83.190.102:/tmp/nginx.conf
```

### On Server (via SSH):
```bash
sudo mkdir -p /var/www/mmlipl.info
sudo cp -r /tmp/tms-build/* /var/www/mmlipl.info/
sudo chown -R www-data:www-data /var/www/mmlipl.info
sudo chmod -R 755 /var/www/mmlipl.info
sudo mv /tmp/nginx.conf /etc/nginx/sites-available/mmlipl.info
sudo ln -s /etc/nginx/sites-available/mmlipl.info /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 3: If SSH Still Doesn't Work

### Option A: Check DNS Settings
Your domain might be pointing to Netlify first. Update DNS to point only to `99.83.190.102`:
- Remove Netlify A record
- Keep only the Nginx server IP

### Option B: Use FTP/SFTP
The Nginx server might have FTP enabled:
```bash
# Try FTP
ftp 99.83.190.102

# Or SFTP
sftp root@99.83.190.102
```

### Option C: Check Hosting Control Panel
- Log into your hosting provider's control panel
- Look for "File Manager" or "FTP Access"
- Upload files via web interface

## Step 4: Update DNS (Important!)

After deploying to the Nginx server, make sure your domain points to it:
- Remove or update the Netlify A record pointing to `75.2.60.5`
- Ensure `mmlipl.info` points to `99.83.190.102`

## Test Deployment

Visit: http://mmlipl.info

The site should now be served from your Nginx server instead of Netlify!

