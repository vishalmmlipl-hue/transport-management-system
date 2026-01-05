# Deploy to mmlipl.info - Ready to Go!

## Your Server Information
- **Domain**: mmlipl.info
- **IP Addresses**: 
  - 75.2.60.5 (Primary)
  - 99.83.190.102 (Secondary/Backup)

## Step 1: Test SSH Connection

Try connecting to your server. Common usernames are:
- `root`
- `ubuntu`
- `ec2-user`
- `admin`

**Test connection:**
```bash
# Try these one by one until one works:
ssh root@75.2.60.5
ssh ubuntu@75.2.60.5
ssh ec2-user@75.2.60.5
ssh admin@75.2.60.5
```

**If you're using SSH keys:**
```bash
ssh -i /path/to/your-key.pem ubuntu@75.2.60.5
```

## Step 2: Once Connected, Deploy Files

### On Your Mac (in a new terminal):

```bash
cd /Users/macbook/transport-management-system

# Copy build files (replace 'root' with your actual username)
scp -r build/* root@75.2.60.5:/tmp/tms-build/

# Copy nginx config
scp nginx.conf root@75.2.60.5:/tmp/nginx.conf
```

### On Your Server (via SSH):

```bash
# Create web directory
sudo mkdir -p /var/www/mmlipl.info

# Copy files
sudo cp -r /tmp/tms-build/* /var/www/mmlipl.info/

# Set permissions
sudo chown -R www-data:www-data /var/www/mmlipl.info
sudo chmod -R 755 /var/www/mmlipl.info

# Configure Nginx
sudo mv /tmp/nginx.conf /etc/nginx/sites-available/mmlipl.info
sudo ln -s /etc/nginx/sites-available/mmlipl.info /etc/nginx/sites-enabled/

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx
```

## Step 3: Visit Your Site

Open browser: http://mmlipl.info

