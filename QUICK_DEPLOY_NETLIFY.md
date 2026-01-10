# 🚀 Quick Deploy to Netlify

## ✅ Pre-Deployment Checklist

- [ ] Code is ready
- [ ] GitHub repository exists
- [ ] Git remote is configured correctly
- [ ] All changes are committed

## 📋 Quick Steps

### 1. Update Git Remote (if needed)
```bash
# Check current remote
git remote -v

# If it shows placeholder URL, update it:
git remote set-url origin https://github.com/YOUR_USERNAME/transport-management-system.git
```

### 2. Commit and Push
```bash
# Stage all files
git add .

# Commit
git commit -m "Deploy to Netlify - Transport Management System"

# Push to GitHub
git push origin main
```

### 3. Deploy on Netlify

**Option A: Via Netlify Dashboard (Recommended)**

1. Go to **https://app.netlify.com**
2. Click **"Add new site"** → **"Import an existing project"**
3. Click **"Deploy with GitHub"**
4. Select repository: **`transport-management-system`**
5. Click **"Deploy site"**

Netlify will auto-detect settings from `netlify.toml`:
- ✅ Build command: `npm run build`
- ✅ Publish directory: `build`
- ✅ Node version: 18

**Option B: Via Netlify CLI**

```bash
# Install Netlify CLI (if not installed)
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

## 🎯 Build Settings (Auto-detected)

Your `netlify.toml` is already configured:
- **Build command:** `npm run build`
- **Publish directory:** `build`
- **Node version:** 18
- **Redirects:** Configured for React Router

## 🔗 After Deployment

1. **Get your site URL:**
   - Netlify will provide: `https://random-name-123.netlify.app`
   - You can change it in Site settings → General → Site details

2. **Add custom domain (optional):**
   - Site settings → Domain management
   - Add `mmlipl.info`
   - Update DNS records at GoDaddy

## ⚠️ Troubleshooting

**Build fails?**
- Check build logs in Netlify dashboard
- Ensure all dependencies are in `package.json`
- Test build locally: `npm run build`

**Can't link repository?**
- Make sure code is pushed to GitHub first
- Check Netlify has GitHub access
- Repository must exist on GitHub

**Site shows blank page?**
- Check browser console for errors
- Verify `build` folder structure
- Check redirects in `netlify.toml`

## 📝 Next Steps After Deployment

1. ✅ Test your application
2. ✅ Set up custom domain (if needed)
3. ✅ Configure environment variables (if needed)
4. ✅ Enable automatic deployments

## 🎉 Success!

Once deployed, every push to `main` branch will automatically trigger a new deployment!

