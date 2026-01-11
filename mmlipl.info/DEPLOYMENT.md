# mmlipl.info - Deployment Guide

## 🚀 Deploy to Netlify (Automatic)

### Step 1: Commit Changes
```bash
cd /Users/macbook/transport-management-system
git add .
git commit -m "Your commit message"
```

### Step 2: Push to Git
```bash
git push
```

### Step 3: Netlify Auto-Deploy
- Netlify automatically detects the push
- Builds the React app
- Deploys to https://mmlipl.info
- Takes 1-3 minutes

### Step 4: Verify Deployment
1. Go to: https://app.netlify.com
2. Click your site (mmlipl.info)
3. Check Deploys tab for status
4. Wait for green checkmark ✅

### Step 5: Test Site
- Visit: https://mmlipl.info
- Hard refresh: `Ctrl+F5` or `Cmd+Shift+R`
- Check console (F12) for errors

---

## 🔧 Manual Deployment (If Needed)

### Step 1: Build Locally
```bash
cd /Users/macbook/transport-management-system
npm run build
```

### Step 2: Deploy via Netlify CLI
```bash
# Install Netlify CLI (if not installed)
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod --dir=build
```

### Step 3: Or Drag & Drop
1. Go to: https://app.netlify.com
2. Sites → Add new site → Deploy manually
3. Drag `build/` folder

---

## 🔗 Backend API (Render.com)

The backend is already deployed on Render.com:
- **URL:** `https://transport-management-system-wzhx.onrender.com/api`
- **Status:** Auto-deploys from Git
- **Database:** SQLite on Render.com

### Update Backend
```bash
# Backend code is in the same repo
# Push changes and Render.com will auto-deploy
git push
```

---

## 📋 Deployment Checklist
- [ ] Code changes committed
- [ ] Git push completed
- [ ] Netlify build started
- [ ] Build successful (green checkmark)
- [ ] Site tested on https://mmlipl.info
- [ ] Console checked (F12) - no errors
- [ ] API connectivity verified
- [ ] Hard refresh tested

---

## 🐛 Common Issues

### Build Fails
- Check Netlify build logs
- Verify `package.json` has correct scripts
- Check for syntax errors

### Site Shows Old Version
- Hard refresh: `Ctrl+F5` or `Cmd+Shift+R`
- Clear browser cache
- Check Netlify deploy status

### API Not Working
- Verify Render.com backend is running
- Check API URL in `apiService.js`
- Test API directly: `curl https://transport-management-system-wzhx.onrender.com/api/branches`

---

**For troubleshooting, see:** `mmlipl.info/TROUBLESHOOTING.md`
