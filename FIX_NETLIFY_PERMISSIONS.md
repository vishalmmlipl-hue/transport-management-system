# 🔧 Fix Netlify CLI Permission Errors

## ❌ Error You're Seeing

```
EACCES: permission denied
```

This happens because:
1. Netlify CLI needs write access to config files
2. Global npm installs need admin permissions

---

## ✅ Solution 1: Use npx (No Installation Needed)

**Best option - no permissions needed!**

```bash
cd /Users/macbook/transport-management-system

# Login (first time only)
npx netlify-cli login

# Deploy
npx netlify-cli deploy --prod --dir=build
```

**Benefits:**
- ✅ No global installation needed
- ✅ No permission issues
- ✅ Uses latest version automatically

---

## ✅ Solution 2: Fix Permissions

### Fix Config File Permissions

```bash
# Create the directory if it doesn't exist
mkdir -p ~/Library/Preferences/netlify

# Fix permissions
chmod 755 ~/Library/Preferences/netlify
chmod 644 ~/Library/Preferences/netlify/config.json 2>/dev/null || true
```

### Then Try Again

```bash
npx netlify-cli login
npx netlify-cli deploy --prod --dir=build
```

---

## ✅ Solution 3: Use GitHub Auto-Deploy (Recommended)

**Easiest - no CLI needed!**

1. **Commit and Push:**
   ```bash
   cd /Users/macbook/transport-management-system
   git add .
   git commit -m "Fix build errors and import paths"
   git push origin main
   ```

2. **Netlify Auto-Deploys:**
   - If your Netlify site is connected to GitHub
   - It will automatically detect the push
   - Rebuild and deploy automatically
   - Check: https://app.netlify.com

---

## ✅ Solution 4: Install with sudo (Not Recommended)

**Only if other options don't work:**

```bash
sudo npm install -g netlify-cli
```

**Then:**
```bash
netlify login
netlify deploy --prod --dir=build
```

**⚠️ Warning:** Using `sudo` with npm can cause permission issues later.

---

## 🎯 Recommended: Use npx

**Just run:**
```bash
cd /Users/macbook/transport-management-system
npx netlify-cli login
npx netlify-cli deploy --prod --dir=build
```

This avoids all permission issues!

---

## 📝 Quick Commands

**Using npx (recommended):**
```bash
npx netlify-cli login
npx netlify-cli deploy --prod --dir=build
```

**Or use GitHub (easiest):**
```bash
git add .
git commit -m "Fix build errors"
git push origin main
```

---

**Try Solution 1 (npx) first - it's the easiest!** 🚀
