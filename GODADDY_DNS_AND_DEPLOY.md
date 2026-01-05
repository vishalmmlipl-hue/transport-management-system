# GoDaddy DNS & Deployment Guide

## Step 1: Update DNS (Remove Netlify)

### Access DNS Settings:
1. On the domain page you're viewing, click **"DNS"** tab
2. You'll see DNS records (A records, CNAME, etc.)

### Remove Netlify IP:
1. **Look for A records** pointing to:
   - `75.2.60.5` (Netlify - this is causing the error)
   - `99.83.190.102` (Your GoDaddy server)

2. **Delete the Netlify A record** (`75.2.60.5`):
   - Click the **three dots** (⋯) next to the record
   - Click **"Delete"**
   - Confirm deletion

3. **Keep or add** your GoDaddy server IP:
   - If there's an A record for `99.83.190.102`, keep it
   - If not, add one:
     - Click **"Add"** → **"A"**
     - Name: `@` (or leave blank for root domain)
     - Value: `99.83.190.102` (or your GoDaddy hosting IP)
     - TTL: 600 (or default)

4. **Save changes**
5. **Wait 10-30 minutes** for DNS to propagate

---

## Step 2: Access File Manager to Upload Files

### Option A: Through Website/Web Hosting
1. Click **"Website"** or **"Manage"** button
2. Look for **"File Manager"** or **"cPanel"**
3. Or go to: **My Products** → **Web Hosting** → **mmlipl.info** → **cPanel Admin**

### Option B: Direct cPanel Access
1. Go to: https://sso.godaddy.com/
2. **My Products** → **Web Hosting**
3. Find `mmlipl.info` hosting
4. Click **"Manage"** or **"cPanel Admin"**
5. Look for **"File Manager"** in the Files section

### Option C: If You Have Managed WordPress
If you see "Managed WordPress Hosting", you might need to:
1. Use **FTP** instead (see below)
2. Or contact GoDaddy support to enable File Manager

---

## Step 3: Upload Files via File Manager

Once in File Manager:

1. **Navigate to `public_html/`** folder
2. **Click "Upload"** button
3. **Select**: `/Users/macbook/transport-management-system/tms-deploy.zip`
4. **Wait** for upload
5. **Right-click** `tms-deploy.zip` → **"Extract"**
6. **Open** the `build/` folder
7. **Select all files** → **Cut**
8. **Go back** to `public_html/`
9. **Paste** all files
10. **Delete** `build/` folder and `tms-deploy.zip`

---

## Step 4: Alternative - Use FTP

If File Manager isn't available:

### Get FTP Credentials:
1. In cPanel, go to **"FTP Accounts"**
2. Note your FTP details:
   - Host: `ftp.mmlipl.info` or server IP
   - Username: Usually `username@mmlipl.info`
   - Password: (reset if needed)

### Upload via FileZilla:
1. Download FileZilla: https://filezilla-project.org/
2. Connect using FTP credentials
3. Navigate to `public_html/`
4. Upload files from `build/` folder

---

## Step 5: Verify Deployment

1. **Wait 10-30 minutes** for DNS to update
2. **Visit**: http://mmlipl.info
3. **Or test directly**: http://99.83.190.102

---

## Quick Action Items

**Right Now:**
1. ✅ Click **"DNS"** tab
2. ✅ Delete A record for `75.2.60.5` (Netlify)
3. ✅ Ensure A record points to `99.83.190.102` or GoDaddy IP
4. ✅ Click **"Website"** or **"Manage"** to access File Manager
5. ✅ Upload `tms-deploy.zip` to `public_html/`
6. ✅ Extract and move files
7. ✅ Test: http://mmlipl.info

---

## Need Help Finding File Manager?

If you can't find File Manager:
1. **Contact GoDaddy Support**: 1-480-505-8877
2. **Live Chat**: Available in GoDaddy account
3. **Ask**: "How do I access File Manager for my hosting?"

---

## Current Status

- ✅ Deployment package ready: `tms-deploy.zip`
- ⏳ Need to: Update DNS (remove Netlify)
- ⏳ Need to: Upload files via File Manager or FTP
- ⏳ Need to: Wait for DNS propagation

**Next Step**: Click the **"DNS"** tab and remove the Netlify A record!

