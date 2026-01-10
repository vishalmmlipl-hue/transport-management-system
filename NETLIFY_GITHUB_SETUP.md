# Netlify + GitHub Setup Guide

## Step 1: Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the **"+"** icon in the top right → **"New repository"**
3. Repository name: `transport-management-system`
4. Description: "Transport Management System - TMS"
5. Choose **Public** or **Private**
6. **DO NOT** initialize with README, .gitignore, or license (we already have files)
7. Click **"Create repository"**

## Step 2: Update Git Remote URL

After creating the repository, GitHub will show you the repository URL. It will look like:
- HTTPS: `https://github.com/YOUR_USERNAME/transport-management-system.git`
- SSH: `git@github.com:YOUR_USERNAME/transport-management-system.git`

**Replace `YOUR_USERNAME` with your actual GitHub username.**

### Update Remote URL:

```bash
# Replace YOUR_USERNAME with your actual GitHub username
git remote set-url origin https://github.com/YOUR_USERNAME/transport-management-system.git

# Verify it's updated
git remote -v
```

## Step 3: Commit and Push to GitHub

```bash
# Stage all changes
git add .

# Commit changes
git commit -m "Initial commit: Transport Management System with all features"

# Push to GitHub (first time)
git push -u origin main
```

If you get authentication errors, you may need to:
- Use a Personal Access Token instead of password
- Or set up SSH keys

## Step 4: Connect to Netlify

1. Go to [Netlify.com](https://netlify.com) and sign in
2. Click **"Add new site"** → **"Import an existing project"**
3. Click **"Deploy with GitHub"**
4. Authorize Netlify to access your GitHub account
5. Select your repository: `transport-management-system`
6. Click **"Connect"**

## Step 5: Configure Netlify Build Settings

Netlify should auto-detect React, but verify these settings:

### Build Settings:
- **Branch to deploy:** `main`
- **Base directory:** (leave empty)
- **Build command:** `npm run build`
- **Publish directory:** `build`

### Environment Variables (if needed):
- `REACT_APP_API_URL` - Your API URL (if using external API)
- Add any other environment variables your app needs

## Step 6: Deploy

1. Click **"Deploy site"**
2. Netlify will:
   - Install dependencies (`npm install`)
   - Build your app (`npm run build`)
   - Deploy to a URL like: `https://random-name-123.netlify.app`

## Step 7: Custom Domain (Optional)

If you want to use `mmlipl.info`:

1. In Netlify dashboard → **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Enter: `mmlipl.info`
4. Follow DNS configuration instructions
5. Update your DNS records at GoDaddy:
   - Type: `A` or `CNAME`
   - Name: `@` or `www`
   - Value: (provided by Netlify)

## Troubleshooting

### If "Link repository" fails:
1. Make sure you've pushed code to GitHub first
2. Check that Netlify has access to your GitHub account
3. Try disconnecting and reconnecting GitHub integration

### If build fails:
1. Check build logs in Netlify dashboard
2. Make sure `package.json` has correct build script
3. Verify all dependencies are listed in `package.json`

### If site doesn't work:
1. Check browser console for errors
2. Verify environment variables are set
3. Check that `build` folder is being created correctly

## Quick Commands Reference

```bash
# Check git status
git status

# Add all files
git add .

# Commit changes
git commit -m "Your commit message"

# Push to GitHub
git push origin main

# Update remote URL
git remote set-url origin https://github.com/YOUR_USERNAME/transport-management-system.git

# View remote URL
git remote -v
```

## Important Notes

- **Never commit sensitive data** (passwords, API keys) to GitHub
- Use environment variables in Netlify for sensitive config
- The `build` folder is auto-generated - don't commit it (should be in `.gitignore`)
- Netlify will rebuild automatically when you push to `main` branch

