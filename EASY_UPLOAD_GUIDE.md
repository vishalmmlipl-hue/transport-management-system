# Easy Upload Guide - No SSH Needed!

## 🎯 Problem: SSH Connection Refused

**Don't worry!** You can upload files without SSH.

---

## ✅ Easiest Method: Hostinger File Manager

### Step 1: Log in to Hostinger

1. Go to **hostinger.com**
2. Log in

### Step 2: Open File Manager

1. Dashboard → Your VPS (srv1260712)
2. Click **"File Manager"** or **"Files"**
3. Terminal-like interface opens

### Step 3: Navigate to Upload Location

**For Frontend:**
- Navigate to: `/var/www/html/`
- Click **"Upload"** button
- Select all files from your `build/` folder
- Upload!

**For Backend:**
- Navigate to: `/var/www/`
- Create folder: `tms` (if doesn't exist)
- Go into `tms/` folder
- Upload `server/` folder here

---

## 📋 Step-by-Step: Upload Frontend

### On Your Mac (Prepare):

```bash
cd /Users/macbook/transport-management-system
npm run build
```

### In Hostinger File Manager:

1. **Open File Manager**
2. **Navigate to:** `/var/www/html/`
3. **Delete old files** (if any)
4. **Click "Upload"**
5. **Select all files from:** `/Users/macbook/transport-management-system/build/`
6. **Wait for upload** (1-2 minutes)

**Done!** Frontend is uploaded.

---

## 📋 Step-by-Step: Upload Backend

### In Hostinger File Manager:

1. **Navigate to:** `/var/www/`
2. **Create folder:** `tms` (if doesn't exist)
3. **Go into:** `tms/` folder
4. **Upload:** `server/` folder from your Mac

**OR:**

1. **Navigate to:** `/var/www/tms/`
2. **Upload:** All files from `server/` folder

---

## 🚀 After Upload: Install & Start

### Use Web Terminal:

1. **Open Web Terminal** (in Hostinger)
2. **Run:**

```bash
# Install Node.js (if not done)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install Nginx (if not done)
apt install -y nginx

# Install PM2 (if not done)
npm install -g pm2

# Go to backend
cd /var/www/tms/server

# Install dependencies
npm install

# Initialize database
npm run init-db

# Start backend
pm2 start server.js --name tms-backend
pm2 save
pm2 startup

# Check status
pm2 status
```

---

## ✅ Verify Upload

### In Web Terminal:

```bash
# Check frontend files
ls -la /var/www/html/

# Check backend files
ls -la /var/www/tms/server/

# Should see your files!
```

---

## 💡 Pro Tips

### Tip 1: Upload as Zip

**On Mac:**
```bash
cd /Users/macbook/transport-management-system
zip -r build.zip build/
```

**In File Manager:**
- Upload `build.zip`
- Extract it in `/var/www/html/`

### Tip 2: Use Git (Alternative)

**If File Manager is slow:**
- Push code to GitHub
- Clone on VPS via Web Terminal
- No upload needed!

---

## 🎯 Complete Workflow

1. ✅ **Build on Mac:** `npm run build`
2. ✅ **Upload via File Manager:** Drag & drop files
3. ✅ **Install via Web Terminal:** Run npm install
4. ✅ **Start via Web Terminal:** pm2 start
5. ✅ **Done!**

**No SSH needed!**

---

## 📝 Summary

**When SSH doesn't work:**

1. ✅ **Use File Manager** - Upload files (easiest!)
2. ✅ **Use Web Terminal** - Run commands
3. ✅ **No SSH needed!**

**Try File Manager now - it's the simplest method!**
