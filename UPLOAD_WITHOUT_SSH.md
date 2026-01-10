# Upload Files Without SSH - Alternative Methods

## 🔍 Problem: SSH Connection Refused

**This means:**
- SSH service might not be running
- SSH might be disabled
- Firewall blocking port 22
- VPS might need configuration

---

## ✅ Solution 1: Use Hostinger File Manager (Easiest!)

### Step 1: Log in to Hostinger

1. Go to **hostinger.com**
2. Log in to your account

### Step 2: Open File Manager

1. Go to **Dashboard**
2. Click on your **VPS** (srv1260712)
3. Look for **"File Manager"** or **"Files"** button
4. Click it!

### Step 3: Upload Files

1. Navigate to `/var/www/html/` folder
2. Click **"Upload"** button
3. Select your `build` folder files
4. Upload them!

**OR:**

1. Navigate to `/var/www/` folder
2. Create `tms` folder if needed
3. Upload `server` folder here

---

## ✅ Solution 2: Use Hostinger Web Terminal + Git

### Step 1: Push Code to GitHub

**On your Mac:**

```bash
cd /Users/macbook/transport-management-system

# If not already a git repo:
git init
git add .
git commit -m "Initial commit"

# Create repo on GitHub.com, then:
git remote add origin https://github.com/your-username/tms.git
git push -u origin main
```

### Step 2: Clone on VPS (via Web Terminal)

1. **Log in to Hostinger**
2. **Open Web Terminal**
3. **Run:**

```bash
# Create directories
mkdir -p /var/www/tms
mkdir -p /var/www/html

# Clone your repo
cd /var/www/tms
git clone https://github.com/your-username/tms.git .

# Or clone just what you need
cd /var/www
git clone https://github.com/your-username/tms.git temp
cp -r temp/server /var/www/tms/
rm -rf temp
```

### Step 3: Build on VPS

```bash
# Install Node.js (if not done)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Build frontend
cd /var/www/tms
npm install
npm run build

# Copy build files
cp -r build/* /var/www/html/
```

---

## ✅ Solution 3: Fix SSH First, Then Upload

### Step 1: Enable SSH via Web Terminal

1. **Log in to Hostinger**
2. **Open Web Terminal**
3. **Run:**

```bash
# Install SSH if not installed
apt update
apt install -y openssh-server

# Start SSH service
systemctl start ssh
systemctl enable ssh

# Check status
systemctl status ssh

# Allow SSH in firewall
ufw allow 22/tcp
ufw enable
```

### Step 2: Then Try SCP Again

**On your Mac:**

```bash
scp -r build/* root@srv1260712.hstgr.cloud:/var/www/html/
```

---

## ✅ Solution 4: Use FTP/SFTP Client

### Step 1: Get FTP Credentials

1. **Log in to Hostinger**
2. **Go to VPS → FTP Accounts**
3. **Create FTP account** (if not exists)
4. **Get:**
   - FTP hostname
   - Username
   - Password
   - Port (usually 21)

### Step 2: Use FTP Client

**On your Mac, use:**
- **FileZilla** (free FTP client)
- **Cyberduck** (free)
- **Transmit** (paid)

**Connect with:**
- Host: `srv1260712.hstgr.cloud`
- Username: (from Hostinger)
- Password: (from Hostinger)
- Port: 21 (FTP) or 22 (SFTP)

**Upload files to:**
- `/var/www/html/` (for frontend)
- `/var/www/tms/server/` (for backend)

---

## ✅ Solution 5: Zip and Upload via Control Panel

### Step 1: Create Zip File (On Mac)

```bash
cd /Users/macbook/transport-management-system

# Zip build folder
zip -r build.zip build/

# Zip server folder
zip -r server.zip server/
```

### Step 2: Upload via File Manager

1. **Log in to Hostinger**
2. **Open File Manager**
3. **Upload `build.zip` and `server.zip`**
4. **Extract on VPS:**

**In Web Terminal:**
```bash
# Navigate to upload location
cd /root  # or wherever you uploaded

# Extract build
unzip build.zip -d /var/www/html/

# Extract server
unzip server.zip -d /var/www/tms/
```

---

## 🎯 Recommended: Use File Manager + Web Terminal

**Easiest method:**

1. **Upload files via File Manager** (drag & drop)
2. **Use Web Terminal** to:
   - Move files to correct locations
   - Install dependencies
   - Start services

**No SSH needed!**

---

## 📋 Quick Workflow (File Manager Method)

### Step 1: Prepare Files (On Mac)

```bash
cd /Users/macbook/transport-management-system
npm run build
```

### Step 2: Upload via File Manager

1. Log in to Hostinger
2. Open File Manager
3. Navigate to `/var/www/html/`
4. Upload all files from `build/` folder

### Step 3: Upload Backend (via File Manager)

1. In File Manager
2. Navigate to `/var/www/`
3. Create `tms` folder
4. Upload `server/` folder

### Step 4: Install & Start (via Web Terminal)

1. Open Web Terminal
2. Run:

```bash
cd /var/www/tms/server
npm install
npm run init-db
pm2 start server.js --name tms-backend
```

---

## 🛠️ Troubleshooting

### "Connection refused" means:
- SSH service not running
- SSH disabled
- Firewall blocking
- VPS not accessible

### Solutions:
1. ✅ Use File Manager (no SSH needed)
2. ✅ Use Web Terminal (no SSH needed)
3. ✅ Use Git (clone on VPS)
4. ✅ Fix SSH first (enable in Web Terminal)

---

## 💡 Best Option for You

**Since SSH isn't working, use:**

1. **Hostinger File Manager** - Upload files
2. **Hostinger Web Terminal** - Run commands

**No SSH needed!**

---

## 📝 Summary

**When SSH doesn't work:**

1. ✅ **File Manager** - Upload files
2. ✅ **Web Terminal** - Run commands
3. ✅ **Git** - Clone code on VPS
4. ✅ **FTP Client** - Alternative upload method

**Try File Manager first - it's the easiest!**
