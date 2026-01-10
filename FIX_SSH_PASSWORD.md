# Fix SSH Password & Connection Issues

## 🔍 Problems You're Having

1. ❌ **Permission denied** → Wrong password
2. ❌ **Connection refused** → SSH might be disabled or server issue

---

## ✅ Solution: Get Correct Password from Hostinger

### Step 1: Log in to Hostinger Control Panel

1. Go to **hostinger.com**
2. Click **"Log In"**
3. Enter your Hostinger account credentials

### Step 2: Access Your VPS

1. Go to **"VPS"** section in dashboard
2. Click on your VPS (srv1260712)
3. Look for **"Access"** or **"SSH"** or **"Server Details"** tab

### Step 3: Get/Reset Password

**Option A: View Existing Password**
- Look for "Root Password" or "SSH Password"
- Click "Show" or "Reveal" to see password
- Copy it exactly (including any special characters)

**Option B: Reset Password**
- Click "Reset Root Password" or "Change Password"
- Set a new password
- **Save it somewhere safe!**
- Wait 2-3 minutes for it to take effect

---

## 🔑 Alternative: Use Hostinger Web Terminal

If SSH isn't working, use Hostinger's built-in terminal:

### Step 1: Access Web Terminal

1. In Hostinger control panel
2. Go to your VPS
3. Click **"Web Terminal"** or **"Browser SSH"**
4. This opens a terminal in your browser (no password needed!)

### Step 2: Use Web Terminal

- You can run all commands here
- No SSH connection needed
- Works immediately

---

## 🛠️ Fix Connection Refused

### Check 1: Is VPS Running?

1. In Hostinger control panel
2. Check VPS status
3. Should show "Running" or "Active"
4. If stopped, click "Start" or "Power On"

### Check 2: Is SSH Enabled?

**In Hostinger Web Terminal (if available):**

```bash
# Check if SSH is running
systemctl status ssh
# or
systemctl status sshd

# If not running, start it:
systemctl start ssh
systemctl enable ssh
```

### Check 3: Check Firewall

```bash
# Check firewall status
ufw status

# Allow SSH if blocked
ufw allow 22/tcp
```

---

## 📋 Step-by-Step Fix

### Method 1: Reset Password (Recommended)

1. **Log in to Hostinger:**
   - hostinger.com → Log In

2. **Go to VPS:**
   - Dashboard → VPS → srv1260712

3. **Reset Password:**
   - Click "Reset Root Password" or "Change Password"
   - Set new password (write it down!)
   - Wait 2-3 minutes

4. **Try Connecting Again:**
   ```bash
   ssh root@srv1260712.hstgr.cloud
   ```
   - Enter the NEW password

### Method 2: Use Web Terminal (Easier!)

1. **Log in to Hostinger**
2. **Go to VPS → Web Terminal**
3. **Use terminal in browser** (no SSH needed!)

---

## 🔐 Password Tips

### Common Issues:

1. **Copy-paste issues:**
   - Don't copy extra spaces
   - Type password manually if needed

2. **Case sensitivity:**
   - Passwords are case-sensitive
   - Check Caps Lock

3. **Special characters:**
   - Make sure special chars are correct
   - Try typing manually

4. **Wrong password field:**
   - Make sure you're using "Root Password"
   - Not "Control Panel Password"

---

## ✅ Quick Test

### After Getting Password:

```bash
# 1. Connect
ssh root@srv1260712.hstgr.cloud

# 2. When prompted, paste password
# (or type it manually)

# 3. If successful, you'll see:
# Welcome to Ubuntu...
# root@srv1260712:~#
```

---

## 🆘 Still Not Working?

### Try These:

1. **Use Web Terminal:**
   - Hostinger control panel → Web Terminal
   - No SSH needed!

2. **Check VPS Status:**
   - Make sure VPS is "Running"
   - Restart if needed

3. **Contact Hostinger Support:**
   - They can reset password for you
   - Or help with SSH access

4. **Try Different Port:**
   ```bash
   ssh -p 2222 root@srv1260712.hstgr.cloud
   ```
   (Some VPS use different SSH port)

---

## 📝 Summary

**What to do:**

1. ✅ **Log in to Hostinger control panel**
2. ✅ **Go to VPS → Reset Root Password**
3. ✅ **Set new password (save it!)**
4. ✅ **Wait 2-3 minutes**
5. ✅ **Try connecting: `ssh root@srv1260712.hstgr.cloud`**

**OR:**

1. ✅ **Use Hostinger Web Terminal** (easier!)
2. ✅ **No SSH needed**
3. ✅ **Works immediately**

---

## 🎯 Next Steps

Once you're connected (via SSH or Web Terminal):

1. Run: `pwd` (should show `/root`)
2. Run: `whoami` (should show `root`)
3. Then proceed with VPS setup from migration guide

**Get the password from Hostinger control panel first!**
