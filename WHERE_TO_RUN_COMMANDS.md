# Where to Run Commands - Quick Guide

## 🖥️ Two Places to Run Commands

You'll run commands in **2 places**:
1. **Your Mac** (local computer)
2. **Hostinger VPS** (remote server)

---

## 📍 How to Know Where to Run

### On Your Mac:
- ✅ Commands that say "On your Mac" or "On Mac terminal"
- ✅ Commands that use `cd /Users/macbook/transport-management-system`
- ✅ Commands that build your app (`npm run build`)
- ✅ Commands that upload files (`scp`)

### On Hostinger VPS:
- ✅ Commands that say "On VPS" or "On Hostinger"
- ✅ Commands that start with `apt install`, `systemctl`, `pm2`
- ✅ Commands that use `/var/www/` paths
- ✅ Commands after you `ssh root@your-vps-ip`

---

## 🖥️ Your Mac Terminal

### How to Open:
1. **Press:** `Cmd + Space` (Spotlight)
2. **Type:** `Terminal`
3. **Press:** Enter

**Or:**
- Applications → Utilities → Terminal

### What You'll See:
```
MacBook-Pro:~ macbook$
```

### Example Commands (On Mac):
```bash
# Navigate to your project
cd /Users/macbook/transport-management-system

# Build your app
npm run build

# Upload files to VPS
scp -r build/* root@your-vps-ip:/var/www/html/
```

---

## 🌐 Hostinger VPS (Remote Server)

### How to Connect:
**On your Mac terminal, run:**
```bash
ssh root@your-vps-ip
```

**Replace `your-vps-ip` with your actual VPS IP address**

**Example:**
```bash
ssh root@123.45.67.89
```

### What You'll See After Connecting:
```
Welcome to Ubuntu...
root@vps:~#
```

**Now you're on the VPS!**

### Example Commands (On VPS):
```bash
# Install software
apt install -y nodejs

# Check status
pm2 status

# View logs
pm2 logs tms-backend
```

---

## 📋 Command Location Guide

### ✅ Run on YOUR MAC:

```bash
# 1. Navigate to project
cd /Users/macbook/transport-management-system

# 2. Build frontend
npm install
npm run build

# 3. Connect to VPS (first time)
ssh root@your-vps-ip

# 4. Upload files to VPS
scp -r server root@your-vps-ip:/var/www/tms/
scp -r build/* root@your-vps-ip:/var/www/html/

# 5. Test from Mac
curl https://mmlipl.info/api/health
```

### ✅ Run on HOSTINGER VPS:

**First, connect:**
```bash
ssh root@your-vps-ip
```

**Then run:**
```bash
# 1. Update system
apt update
apt upgrade -y

# 2. Install software
apt install -y nodejs nginx git
npm install -g pm2

# 3. Navigate to app
cd /var/www/tms/server
npm install
npm run init-db

# 4. Start services
pm2 start server.js --name tms-backend
systemctl start nginx

# 5. Check status
pm2 status
systemctl status nginx
```

---

## 🔄 Switching Between Mac and VPS

### To Go FROM Mac TO VPS:
```bash
# On Mac terminal:
ssh root@your-vps-ip
# Now you're on VPS!
```

### To Go FROM VPS BACK TO Mac:
```bash
# On VPS terminal:
exit
# Or press: Ctrl+D
# Now you're back on Mac!
```

### To Open NEW Terminal (Stay on Mac):
- **Press:** `Cmd + T` (new tab)
- **Or:** `Cmd + N` (new window)

**This keeps VPS connection open in first terminal!**

---

## 💡 Pro Tips

### Tip 1: Use Two Terminal Windows
- **Terminal 1:** Connected to VPS (SSH)
- **Terminal 2:** On your Mac (for building/uploading)

### Tip 2: Check Where You Are
**On Mac, you'll see:**
```
MacBook-Pro:transport-management-system macbook$
```

**On VPS, you'll see:**
```
root@vps:~#
```

### Tip 3: If Command Fails
- Check if you're in the right place (Mac vs VPS)
- Check if you're in the right directory
- Check error message

---

## 📝 Quick Reference

| Command Type | Run On | How to Know |
|-------------|--------|-------------|
| `npm run build` | Mac | Uses your project files |
| `scp` (upload) | Mac | Uploads FROM Mac TO VPS |
| `apt install` | VPS | Only works on Linux |
| `pm2 start` | VPS | Manages server processes |
| `systemctl` | VPS | Linux system service |
| `cd /Users/macbook/...` | Mac | Mac file path |
| `cd /var/www/...` | VPS | Linux file path |

---

## 🎯 Step-by-Step Example

### Example: Deploy Frontend

**Step 1: On YOUR MAC**
```bash
cd /Users/macbook/transport-management-system
npm run build
```

**Step 2: Still on YOUR MAC**
```bash
scp -r build/* root@your-vps-ip:/var/www/html/
```

**Step 3: Connect to VPS (on Mac terminal)**
```bash
ssh root@your-vps-ip
```

**Step 4: Now on VPS**
```bash
systemctl reload nginx
```

**Step 5: Exit VPS (back to Mac)**
```bash
exit
```

---

## ❓ Common Questions

### Q: "Where am I?"
**A:** Look at your prompt:
- `MacBook-Pro:` = On Mac
- `root@vps:` = On VPS

### Q: "Command not found?"
**A:** 
- If `apt install` fails → You're on Mac (should be on VPS)
- If `npm` fails → Check if Node.js is installed
- If `scp` fails → You're on VPS (should be on Mac)

### Q: "How do I know if I'm connected to VPS?"
**A:** Your prompt will show `root@vps:` or similar

### Q: "Can I run Mac commands on VPS?"
**A:** No! VPS is Linux, not macOS. Different commands.

---

## 🚀 Quick Start

### First Time Setup:

**1. Open Terminal on Mac**
```bash
# You'll see: MacBook-Pro:~ macbook$
```

**2. Connect to VPS**
```bash
ssh root@your-vps-ip
# Now you'll see: root@vps:~#
```

**3. Run VPS commands**
```bash
apt update
# etc...
```

**4. Exit when done**
```bash
exit
# Back to: MacBook-Pro:~ macbook$
```

---

## 📖 Summary

- **Mac Terminal:** For building, uploading, testing
- **VPS (via SSH):** For installing, configuring, running server
- **Check prompt:** To know where you are
- **Two terminals:** One for Mac, one for VPS (recommended)

**Need help? Check the prompt to see where you are!**
