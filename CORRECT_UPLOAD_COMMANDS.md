# Correct Upload Commands - Use Your Actual VPS Hostname

## ❌ Wrong Command

```bash
scp -r build/* root@your-vps-ip:/var/www/html/
```

**Problem:** `your-vps-ip` is placeholder text, not your actual VPS!

---

## ✅ Correct Command

**Your VPS hostname is:** `srv1260712.hstgr.cloud`

**Use this:**
```bash
scp -r build/* root@srv1260712.hstgr.cloud:/var/www/html/
```

---

## 📋 All Upload Commands (Corrected)

### Upload Frontend (Build Folder):
```bash
scp -r build/* root@srv1260712.hstgr.cloud:/var/www/html/
```

### Upload Backend (Server Folder):
```bash
scp -r server root@srv1260712.hstgr.cloud:/var/www/tms/
```

### Upload Single File:
```bash
scp file.js root@srv1260712.hstgr.cloud:/var/www/html/
```

### Upload Scripts:
```bash
scp scripts/backup-tms.sh root@srv1260712.hstgr.cloud:/root/
```

---

## 🔐 Password Prompt

When you run `scp`, you'll be asked for password:

```
root@srv1260712.hstgr.cloud's password:
```

**Enter the password you got from Hostinger control panel.**

---

## 📝 Complete Upload Workflow

### Step 1: Build Your App (On Mac)
```bash
cd /Users/macbook/transport-management-system
npm run build
```

### Step 2: Upload Frontend (On Mac)
```bash
scp -r build/* root@srv1260712.hstgr.cloud:/var/www/html/
```

**Enter password when prompted**

### Step 3: Upload Backend (On Mac)
```bash
scp -r server root@srv1260712.hstgr.cloud:/var/www/tms/
```

**Enter password when prompted**

---

## 🛠️ Troubleshooting

### Issue: "Could not resolve hostname"
**Solution:** Make sure you're using: `srv1260712.hstgr.cloud` (not `your-vps-ip`)

### Issue: "Permission denied"
**Solution:** 
- Check password is correct
- Get password from Hostinger control panel
- Make sure you're using `root` as username

### Issue: "Connection refused"
**Solution:**
- Check VPS is running in Hostinger control panel
- Try using Web Terminal instead (easier!)

---

## 💡 Alternative: Use Web Terminal

If `scp` keeps having issues, use Web Terminal:

1. **Log in to Hostinger**
2. **Open Web Terminal**
3. **Use File Manager** to upload files
   - Or use `wget` to download from a URL
   - Or use `git clone` if code is on GitHub

---

## ✅ Quick Reference

**Always replace:**
- ❌ `your-vps-ip` 
- ✅ `srv1260712.hstgr.cloud`

**Your VPS hostname:** `srv1260712.hstgr.cloud`

---

## 🚀 Try Now

```bash
# Make sure you're in project directory
cd /Users/macbook/transport-management-system

# Upload frontend (use YOUR hostname!)
scp -r build/* root@srv1260712.hstgr.cloud:/var/www/html/
```

**Enter password when prompted!**
