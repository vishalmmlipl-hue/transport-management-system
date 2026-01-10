# Deploy to Netlify - Step by Step Guide

## Prerequisites
- ✅ GitHub account
- ✅ Netlify account (sign up at https://netlify.com if needed)
- ✅ Code ready to deploy

## Step 1: Prepare Your Code

### 1.1 Remove Backup Files
```bash
# Remove backup file from git tracking
rm src/trip-management-form.jsx.bak
```

### 1.2 Update Git Remote (if needed)
```bash
# Check current remote
git remote -v

# If it shows placeholder, update it:
# Replace YOUR_USERNAME with your GitHub username
git remote set-url origin https://github.com/YOUR_USERNAME/transport-management-system.git
```

## Step 2: Commit and Push to GitHub

### 2.1 Stage All Changes
```bash
git add .
```

### 2.2 Commit Changes
```bash
git commit -m "Ready for Netlify deployment - Transport Management System"
```

### 2.3 Push to GitHub
```bash
git push origin main
```

**Note:** If this is your first push and you get an error, you may need to:
- Create the repository on GitHub first
- Use: `git push -u origin main` (first time only)

## Step 3: Deploy on Netlify

### 3.1 Connect Repository

1. Go to **https://app.netlify.com**
2. Click **"Add new site"** → **"Import an existing project"**
3. Click **"Deploy with GitHub"**
4. Authorize Netlify to access your GitHub account (if first time)
5. Search for and select: **`transport-management-system`**
6. Click **"Connect"**

### 3.2 Configure Build Settings

Netlify should auto-detect React, but verify these settings:

**Build Settings:**
- **Branch to deploy:** `main`
- **Base directory:** (leave empty)
- **Build command:** `npm run build`
- **Publish directory:** `build`

**These are already configured in `netlify.toml`, so Netlify should auto-detect them!**

### 3.3 Environment Variables (Optional)

If your app needs environment variables, add them in Netlify:

1. In **Site settings** → **Environment variables**
2. Click **"Add a variable"**
3. Add any variables your app needs (e.g., `REACT_APP_API_URL`)

### 3.4 Deploy

1. Click **"Deploy site"**
2. Netlify will:
   - Install dependencies (`npm install`)
   - Build your app (`npm run build`)
   - Deploy to a URL like: `https://random-name-123.netlify.app`

## Step 4: Verify Deployment

1. Wait for build to complete (usually 2-5 minutes)
2. Click on your site URL
3. Test your application

## Step 5: Custom Domain (Optional)

To use `mmlipl.info`:

1. In Netlify dashboard → **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Enter: `mmlipl.info`
4. Follow DNS configuration instructions:
   - Go to your domain registrar (GoDaddy)
   - Add DNS records as shown by Netlify
   - Usually: CNAME record pointing to your Netlify site

## Troubleshooting

### Build Fails

**Check build logs:**
1. Go to **Deploys** tab in Netlify
2. Click on failed deploy
3. Check error messages

**Common fixes:**
- Missing dependencies → Add to `package.json`
- Build errors → Fix code errors
- Node version → Set in `netlify.toml` or Netlify settings

### Site Shows Blank Page

**Possible causes:**
- Check browser console for errors
- Verify `build` folder structure
- Check `netlify.toml` redirects
- Ensure `index.html` is in `build` folder

### Cannot Link Repository

**Solutions:**
1. Make sure code is pushed to GitHub first
2. Check Netlify has GitHub access
3. Try disconnecting and reconnecting GitHub
4. Check repository is public (or Netlify has access if private)

## Automatic Deployments

Once connected, Netlify will automatically:
- ✅ Deploy when you push to `main` branch
- ✅ Show preview deployments for pull requests
- ✅ Rebuild on every commit

## Quick Reference

**Netlify Build Settings:**
```
Branch: main
Build command: npm run build
Publish directory: build
```

**Git Commands:**
```bash
git add .
git commit -m "Your message"
git push origin main
```

**Netlify Dashboard:**
- Site URL: https://app.netlify.com
- Build logs: Deploys → Click deploy → Build log
- Site settings: Site settings → General

## Need Help?

- Netlify Docs: https://docs.netlify.com
- Netlify Support: https://www.netlify.com/support
- Build logs show detailed error messages

