# Fix SSH Connection - Quick Guide

## 🔍 Issues Found

1. ❌ `pm2` command not found → You're on Mac, need to be on VPS
2. ❌ Using placeholder `your-vps-ip` → Need actual hostname
3. ❌ Wrong SSH syntax → Need correct format

---

## ✅ Correct Commands

### Step 1: Connect to Your VPS

**Your VPS hostname is:** `srv1260712.hstgr.cloud`

**Correct command:**
```bash
ssh root@srv1260712.hstgr.cloud
```

**NOT:**
- ❌ `ssh root@your-vps-ip` (placeholder)
- ❌ `ssh root@VPS - srv1260712.hstgr.cloud` (wrong syntax)

---

### Step 2: After Connecting

**Once connected, you'll see:**
```
Welcome to Ubuntu...
root@srv1260712:~#
```

**NOW you can run:**
```bash
pm2 logs tms-backend
pm2 status
```

---

## 📋 Complete Workflow

### On Your Mac Terminal:

```bash
# 1. Connect to VPS
ssh root@srv1260712.hstgr.cloud

# 2. Enter password when prompted
# (You'll get this from Hostinger control panel)

# 3. Now you're on VPS!
# You'll see: root@srv1260712:~#
```

### On VPS (after connecting):

```bash
# Now these commands will work:
pm2 status
pm2 logs tms-backend
pm2 restart tms-backend
systemctl status nginx
```

---

## 🔑 Getting Your Password

If you don't have the password:

1. **Log in to Hostinger:**
   - Go to hostinger.com
   - Log in to your account

2. **Go to VPS Control Panel:**
   - Click on your VPS
   - Go to "Access" or "SSH" section

3. **Get credentials:**
   - Username: `root`
   - Password: (shown in control panel)
   - Or use SSH key if configured

---

## 🛠️ Troubleshooting

### Issue: "Could not resolve hostname"

**Solution:**
- Use the full hostname: `srv1260712.hstgr.cloud`
- Don't add extra text like "VPS -"
- Make sure you're connected to internet

### Issue: "Permission denied"

**Solution:**
- Check password is correct
- Make sure you're using `root` as username
- Try resetting password in Hostinger control panel

### Issue: "pm2: command not found"

**Solution:**
- This means you're still on Mac
- You need to connect to VPS first: `ssh root@srv1260712.hstgr.cloud`
- PM2 only exists on the VPS, not on your Mac

---

## ✅ Quick Test

**Try this step-by-step:**

```bash
# 1. On Mac - Connect to VPS
ssh root@srv1260712.hstgr.cloud

# 2. Enter password (you'll see prompt)

# 3. After connecting, check where you are:
pwd
# Should show: /root

# 4. Now try PM2:
pm2 status
# Should work now!
```

---

## 📝 Summary

**Correct SSH command:**
```bash
ssh root@srv1260712.hstgr.cloud
```

**After connecting:**
- You'll see: `root@srv1260712:~#`
- Now `pm2` commands will work
- You're on the VPS, not Mac

**Remember:**
- `pm2` only works on VPS (after SSH)
- Use full hostname: `srv1260712.hstgr.cloud`
- Get password from Hostinger control panel

---

**Try connecting now with the correct command!**
