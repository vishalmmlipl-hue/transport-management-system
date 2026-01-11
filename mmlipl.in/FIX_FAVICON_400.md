# 🔧 Fix Favicon 400 Error

## Problem
`favicon.ico` returns 400 Bad Request

## 🔍 Check Favicon File

**On server, check if favicon exists:**
```bash
ls -la /home/mmlipl/htdocs/mmlipl.in/public/favicon.ico
```

**If file doesn't exist or is wrong:**
- The favicon might not have been uploaded
- Or the path is incorrect

## 🔧 Fix Options

### Option 1: Check if Favicon Exists

```bash
# On server
ls -la /home/mmlipl/htdocs/mmlipl.in/public/ | grep favicon
```

**If favicon.ico exists:**
- Check permissions: `chmod 644 /home/mmlipl/htdocs/mmlipl.in/public/favicon.ico`
- Check ownership: `chown mmlipl:mmlipl /home/mmlipl/htdocs/mmlipl.in/public/favicon.ico`

### Option 2: Upload Favicon from Build

**From your Mac:**
```bash
cd /Users/macbook/transport-management-system
scp build/favicon.ico root@31.97.107.232:/home/mmlipl/htdocs/mmlipl.in/public/
```

**Set permissions:**
```bash
chmod 644 /home/mmlipl/htdocs/mmlipl.in/public/favicon.ico
chown mmlipl:mmlipl /home/mmlipl/htdocs/mmlipl.in/public/favicon.ico
```

### Option 3: Ignore (Non-Critical)

The favicon error is cosmetic and doesn't affect functionality. The site works fine without it.

---

**Check if favicon file exists first!** 🔍
