# Deploy via FTP/SFTP (Alternative Method)

Since SSH isn't working, you can deploy using FTP/SFTP.

## Step 1: Get FTP Credentials

Check your hosting provider's control panel for:
- FTP Host: Usually `ftp.mmlipl.info` or `75.2.60.5`
- FTP Username: Your account username
- FTP Password: Your account password
- FTP Port: Usually 21 (FTP) or 22 (SFTP)

## Step 2: Install FTP Client (if needed)

### Option A: Use Built-in FTP (macOS)
```bash
# Connect via FTP
ftp ftp.mmlipl.info
# Enter username and password when prompted
```

### Option B: Use FileZilla (GUI - Recommended)
1. Download FileZilla: https://filezilla-project.org/
2. Install and open
3. Enter:
   - Host: `ftp.mmlipl.info` or `75.2.60.5`
   - Username: Your FTP username
   - Password: Your FTP password
   - Port: 21 (FTP) or 22 (SFTP)

### Option C: Use Cyberduck (macOS)
1. Download Cyberduck: https://cyberduck.io/
2. Connect using FTP/SFTP
3. Upload files

## Step 3: Upload Files

### Using FileZilla:
1. Connect to your server
2. Navigate to `/var/www/mmlipl.info/` (or `public_html/` or `www/`)
3. Upload all files from `build/` folder:
   - Select all files in `build/` folder
   - Drag and drop to server
   - Or right-click → Upload

### Using Command Line (FTP):
```bash
cd /Users/macbook/transport-management-system/build

# Connect via FTP
ftp ftp.mmlipl.info
# Enter username and password

# Navigate to web directory (might be public_html, www, or htdocs)
cd public_html
# or
cd www
# or
cd /var/www/mmlipl.info

# Upload files
binary
prompt
mput *
```

### Using Command Line (SFTP):
```bash
cd /Users/macbook/transport-management-system

# Connect via SFTP
sftp username@ftp.mmlipl.info
# Enter password when prompted

# Navigate to web directory
cd public_html
# or check with: pwd

# Upload entire build folder
put -r build/* .
```

## Step 4: Configure Nginx (if you have access)

If you can access the server via web-based file manager or another method:

1. Upload `nginx.conf` file
2. SSH or use terminal access to configure Nginx
3. Or contact your hosting provider to configure it

## Step 5: Test

Visit: http://mmlipl.info

---

## Common Web Directory Names

Depending on your hosting provider, the web directory might be:
- `/var/www/mmlipl.info/`
- `/var/www/html/`
- `/home/username/public_html/`
- `/home/username/www/`
- `/var/www/htdocs/`
- `~/public_html/`

Check your hosting provider's documentation or control panel.

