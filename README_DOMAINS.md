# 🌐 Domain Organization

This project has two separate deployments:

## 📁 Directory Structure

```
transport-management-system/
├── mmlipl.in/          # Hostinger VPS deployment
│   ├── README.md
│   ├── DEPLOYMENT.md
│   ├── TROUBLESHOOTING.md
│   └── API_SETUP.md
│
└── mmlipl.info/        # Netlify deployment
    ├── README.md
    ├── DEPLOYMENT.md
    ├── TROUBLESHOOTING.md
    └── FIXES.md
```

---

## 🌐 mmlipl.in (Hostinger VPS)

**Location:** `/mmlipl.in/`

- **Hosting:** Hostinger VPS
- **Server:** 31.97.107.232
- **Path:** `/home/cloudpanel/htdocs/mmlipl.in/`
- **Control Panel:** CloudPanel

**Documentation:**
- 📖 [README](mmlipl.in/README.md) - Overview
- 🚀 [Deployment Guide](mmlipl.in/DEPLOYMENT.md) - How to deploy
- 🔧 [Troubleshooting](mmlipl.in/TROUBLESHOOTING.md) - Common issues
- 🔌 [API Setup](mmlipl.in/API_SETUP.md) - Backend API setup

---

## 🌐 mmlipl.info (Netlify)

**Location:** `/mmlipl.info/`

- **Hosting:** Netlify
- **Backend:** Render.com
- **Auto-deploy:** Enabled (Git push)
- **Control Panel:** https://app.netlify.com

**Documentation:**
- 📖 [README](mmlipl.info/README.md) - Overview
- 🚀 [Deployment Guide](mmlipl.info/DEPLOYMENT.md) - How to deploy
- 🔧 [Troubleshooting](mmlipl.info/TROUBLESHOOTING.md) - Common issues
- ✅ [Applied Fixes](mmlipl.info/FIXES.md) - All fixes applied

---

## 🔄 Quick Reference

### Deploy to mmlipl.in (VPS)
```bash
# Build and upload to VPS
npm run build
scp -r build/* root@31.97.107.232:/home/cloudpanel/htdocs/mmlipl.in/public/
```

### Deploy to mmlipl.info (Netlify)
```bash
# Just push to Git - Netlify auto-deploys
git add .
git commit -m "Your changes"
git push
```

---

## 📝 Notes

- **mmlipl.in** - Manual deployment to VPS
- **mmlipl.info** - Automatic deployment via Netlify
- Both use the same source code
- Backend API is on Render.com (shared by both)

---

**Last Updated:** Based on current deployment setup
