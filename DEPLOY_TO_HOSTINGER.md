# 🚀 Deploy to Hostinger - Step by Step Guide

## ✅ Pre-Deployment Checklist

- [x] ✅ Build completed successfully
- [x] ✅ All import paths fixed
- [x] ✅ Build folder created: `/Users/macbook/transport-management-system/build`
- [x] ✅ Backup created: `/Users/macbook/MMLTMS`

---

## 📦 What to Upload

**Upload ONLY the contents of the `build/` folder** to your Hostinger server.

**Location on Hostinger:** `/public_html/` (or your domain's root directory)

---

## 🎯 Deployment Methods

### **Method 1: Using Hostinger File Manager (Easiest)**

1. **Login to Hostinger**
   - Go to https://hpanel.hostinger.com
   - Login with your credentials

2. **Open File Manager**
   - Click on **"File Manager"** in the control panel
   - Navigate to `public_html/` (or your domain root)

3. **Upload Build Files**
   - Click **"Upload"** button
   - Select ALL files from your `build/` folder:
     - `index.html`
     - `asset-manifest.json`
     - `manifest.json`
     - `robots.txt`
     - `favicon.ico`
     - `logo192.png`
     - `logo512.png`
     - `_redirects`
     - `static/` folder (entire folder)

4. **Extract/Upload**
   - If uploading as ZIP, extract it
   - Make sure all files are in `public_html/` root

5. **Verify**
   - Visit your domain: `https://mmlipl.info`
   - App should load!

---

### **Method 2: Using SCP (Command Line)**

```bash
# Navigate to your project
cd /Users/macbook/transport-management-system

# Upload build folder contents
scp -r build/* username@your-server-ip:/home/username/public_html/
```

**Replace:**
- `username` = Your Hostinger username
- `your-server-ip` = Your server IP or domain

---

### **Method 3: Using FTP Client (FileZilla, etc.)**

1. **Connect to Hostinger**
   - Host: Your server IP or domain
   - Username: Your Hostinger username
   - Password: Your Hostinger password
   - Port: 21 (FTP) or 22 (SFTP)

2. **Upload Files**
   - Navigate to `public_html/` on server
   - Upload all contents from `build/` folder
   - Maintain folder structure (especially `static/`)

---

## 🔧 Backend Setup (If Needed)

If you're also deploying the backend:

1. **Upload Backend Files**
   - Upload `server/` folder to your server
   - Place in: `/home/username/transport-management-system/`

2. **Install Dependencies**
   ```bash
   cd /home/username/transport-management-system/server
   npm install
   ```

3. **Start Backend**
   ```bash
   # Using PM2 (recommended)
   pm2 start server.js
   pm2 save
   pm2 startup
   ```

4. **Configure Nginx** (if using)
   - Point API requests to backend port (e.g., 3001)

---

## ✅ Post-Deployment Checklist

- [ ] Visit your domain: `https://mmlipl.info`
- [ ] Check if app loads correctly
- [ ] Test login functionality
- [ ] Test data sync (create/update/delete)
- [ ] Check browser console for errors
- [ ] Verify API calls are working

---

## 🐛 Troubleshooting

### **App Not Loading?**

1. **Check File Permissions**
   ```bash
   chmod -R 755 public_html/
   ```

2. **Check .htaccess** (if using Apache)
   - Create `.htaccess` in `public_html/`:
   ```apache
   Options -MultiViews
   RewriteEngine On
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteRule ^ index.html [QR,L]
   ```

3. **Check Nginx Config** (if using Nginx)
   ```nginx
   location / {
     try_files $uri $uri/ /index.html;
   }
   ```

### **API Not Working?**

1. **Check Backend Status**
   ```bash
   pm2 status
   ```

2. **Check API URL**
   - Verify API URL in frontend matches backend
   - Check CORS settings on backend

3. **Check Firewall**
   - Ensure backend port is open

---

## 📝 Quick Reference

**Build Location:** `/Users/macbook/transport-management-system/build`

**Upload To:** `public_html/` on Hostinger

**Files to Upload:**
- All files in `build/` folder
- Keep `static/` folder structure intact

**Backend Location:** (if deploying)
- `/home/username/transport-management-system/server`

---

## 🎉 Success!

Once deployed, your app will be live at:
- **Frontend:** `https://mmlipl.info`
- **Backend API:** `https://mmlipl.info/api` (if configured)

---

**Need Help?** Check the build folder and verify all files are uploaded correctly!
