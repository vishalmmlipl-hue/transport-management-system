# Quick Upload Guide - No SSH Needed

## ✅ Deployment Package Ready!

I've created `tms-deploy.zip` (333KB) with all your files ready to upload.

**Location**: `/Users/macbook/transport-management-system/tms-deploy.zip`

## Option 1: Upload via FTP (Recommended)

### Step 1: Get FTP Credentials
Check your hosting provider's control panel or email for:
- FTP Host: `ftp.mmlipl.info` or `99.83.190.102`
- Username: Your FTP username
- Password: Your FTP password

### Step 2: Use FileZilla (Free, Easy)

1. **Download FileZilla**: https://filezilla-project.org/download
2. **Install and open**
3. **Connect**:
   ```
   Host: ftp.mmlipl.info (or 99.83.190.102)
   Username: [your FTP username]
   Password: [your FTP password]
   Port: 21
   ```
4. **Click "Quickconnect"**
5. **Navigate to web directory**:
   - Look for: `public_html/`, `www/`, `htdocs/`, or `/var/www/mmlipl.info/`
6. **Upload**:
   - Drag `tms-deploy.zip` to the server
   - Right-click zip → Extract/Unzip
   - Or extract locally and upload the `build/` folder contents

### Step 3: Extract Files
If you uploaded the zip:
- Right-click `tms-deploy.zip` on server → Extract
- Move files from `build/` folder to web root
- Delete zip file

## Option 2: Web-Based File Manager

1. **Log into your hosting control panel**
   - Common URLs:
     - `https://mmlipl.info:2083` (cPanel)
     - `https://mmlipl.info:8443` (Plesk)
     - Check your hosting provider's website

2. **Open "File Manager"**
3. **Navigate to web directory** (`public_html/` or `www/`)
4. **Upload** `tms-deploy.zip`
5. **Extract** the zip file
6. **Move files** from `build/` folder to web root

## Option 3: Command Line FTP

```bash
cd /Users/macbook/transport-management-system

# Connect via FTP
ftp ftp.mmlipl.info
# Enter username and password when prompted

# Navigate to web directory
cd public_html
# or
cd www

# Upload zip file
put tms-deploy.zip

# Exit FTP
quit
```

Then extract via web file manager.

## What's in the Zip?

- `build/` folder with all your website files
- `nginx.conf` configuration file

## After Uploading

1. **Extract** the zip file on the server
2. **Move contents** of `build/` folder to your web root directory
3. **Configure Nginx** (if you have server access):
   - Upload `nginx.conf` to `/etc/nginx/sites-available/mmlipl.info`
   - Or contact your hosting provider to configure it

4. **Visit**: http://mmlipl.info

## Need Help Finding FTP Credentials?

**Check:**
- Your hosting provider's control panel
- Welcome email from hosting provider
- Domain registrar account (if domain and hosting are together)
- Hosting provider's support/documentation

**Common Hosting Providers:**
- **AWS**: Use AWS Console → EC2 → Connect
- **DigitalOcean**: Check Droplet → Access → Reset Root Password
- **GoDaddy**: cPanel → FTP Accounts
- **Namecheap**: cPanel → FTP Accounts
- **Bluehost**: cPanel → FTP Accounts

## Test Your Upload

After uploading, visit:
- http://mmlipl.info
- http://99.83.190.102

You should see your TMS application!

---

**Next Step**: Find your FTP credentials or hosting control panel, then upload `tms-deploy.zip`!

