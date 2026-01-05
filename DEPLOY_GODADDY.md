# Deploy to GoDaddy - Step by Step

## Your Setup
- **Hosting**: GoDaddy
- **Domain**: mmlipl.info
- **Deployment Package**: `tms-deploy.zip` (ready to upload)

## Method 1: GoDaddy File Manager (Easiest)

### Step 1: Access GoDaddy cPanel

1. **Log into GoDaddy**:
   - Go to: https://sso.godaddy.com/
   - Or: https://www.godaddy.com/ and click "Sign In"

2. **Go to My Products**:
   - Click "My Products" or "Web Hosting"
   - Find your `mmlipl.info` hosting account
   - Click "Manage" or "cPanel Admin"

3. **Open File Manager**:
   - In cPanel, look for "Files" section
   - Click **"File Manager"**

### Step 2: Navigate to Web Directory

In File Manager:
1. Look for `public_html/` folder (this is your web root)
2. **Click on `public_html/`** to open it
3. This is where your website files should go

### Step 3: Upload Files

**Option A: Upload Zip and Extract**
1. Click **"Upload"** button at the top
2. Select `tms-deploy.zip` from your Mac
3. Wait for upload to complete
4. **Right-click** on `tms-deploy.zip` → **"Extract"**
5. This will create a `build/` folder
6. **Select all files** inside `build/` folder
7. **Cut** them (Ctrl+X or right-click → Cut)
8. **Go back to `public_html/`**
9. **Paste** all files there
10. **Delete** the empty `build/` folder and `tms-deploy.zip`

**Option B: Extract Locally and Upload**
1. On your Mac, extract `tms-deploy.zip`
2. In File Manager, click **"Upload"**
3. **Select all files** from the `build/` folder
4. Upload them directly to `public_html/`

### Step 4: Verify Files

In `public_html/`, you should see:
- `index.html`
- `static/` folder
- `favicon.ico`
- `manifest.json`
- `robots.txt`

### Step 5: Test Your Site

Visit: **http://mmlipl.info**

---

## Method 2: GoDaddy FTP (Alternative)

### Step 1: Get FTP Credentials

1. In GoDaddy cPanel, go to **"FTP Accounts"**
2. You'll see your FTP username and host
3. **Note down**:
   - FTP Host: Usually `ftp.mmlipl.info` or your server IP
   - FTP Username: Usually `username@mmlipl.info`
   - FTP Password: (you can reset if needed)

### Step 2: Use FileZilla

1. **Download FileZilla**: https://filezilla-project.org/
2. **Connect**:
   ```
   Host: ftp.mmlipl.info (or the host shown in cPanel)
   Username: [your FTP username]
   Password: [your FTP password]
   Port: 21
   ```
3. **Navigate to** `public_html/` folder
4. **Upload** all files from `build/` folder
   - Or upload `tms-deploy.zip` and extract via File Manager

---

## Method 3: Quick Upload Script

If you have FTP credentials, you can use this:

```bash
cd /Users/macbook/transport-management-system

# Extract the zip first
unzip -q tms-deploy.zip

# Upload via FTP (replace with your credentials)
lftp -c "open -u username@mmlipl.info,password ftp.mmlipl.info; cd public_html; mput -O . build/*; quit"
```

---

## Important: Update DNS (Remove Netlify)

Your domain currently points to both:
- Netlify (75.2.60.5) - causing usage limit error
- Your GoDaddy server (99.83.190.102)

### Update DNS in GoDaddy:

1. **Go to GoDaddy Domain Manager**:
   - My Products → Domains → mmlipl.info → DNS

2. **Find A Records**:
   - Look for A record pointing to `75.2.60.5` (Netlify)
   - **Delete or edit** it

3. **Ensure A record points to GoDaddy server**:
   - Should point to `99.83.190.102` or GoDaddy's IP
   - Or use GoDaddy's nameservers

4. **Save changes**
5. **Wait 5-10 minutes** for DNS to propagate

---

## Troubleshooting

### Files uploaded but site not working?

1. **Check file permissions**:
   - In File Manager, select all files
   - Right-click → "Change Permissions"
   - Set to `755` for folders, `644` for files

2. **Check file location**:
   - Files must be in `public_html/` (not in a subfolder)

3. **Clear browser cache**:
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### Still seeing Netlify error?

- DNS hasn't updated yet (wait 10-30 minutes)
- Clear your browser cache
- Try accessing directly: `http://99.83.190.102`

### Can't access cPanel?

- GoDaddy support: 1-480-505-8877
- Or use GoDaddy Help Center

---

## Quick Checklist

- [ ] Log into GoDaddy account
- [ ] Open cPanel → File Manager
- [ ] Navigate to `public_html/`
- [ ] Upload `tms-deploy.zip` or extract and upload `build/` files
- [ ] Verify `index.html` is in `public_html/`
- [ ] Update DNS to remove Netlify IP
- [ ] Visit http://mmlipl.info
- [ ] Test the application

---

## Need Help?

If you get stuck:
1. GoDaddy Support: https://www.godaddy.com/help
2. Check GoDaddy's File Manager guide
3. Contact GoDaddy support for FTP credentials

**Ready to deploy?** Log into GoDaddy and follow Method 1 above!

