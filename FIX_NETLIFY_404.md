# Fix "Page not found" Error on Netlify

## Problem
When navigating to routes directly or refreshing pages on Netlify, you get a 404 "Page not found" error. This happens because Netlify tries to find the file on the server, but React routes are client-side only.

## Solution

### Option 1: Using `_redirects` file (Recommended)
The `public/_redirects` file is already configured correctly:
```
/*    /index.html   200
```

### Option 2: Using `netlify.toml`
The `netlify.toml` file is also configured with redirects.

## Steps to Fix

### 1. Verify Files Exist
- ✅ `public/_redirects` - Should contain: `/*    /index.html   200`
- ✅ `netlify.toml` - Should have redirects configuration

### 2. Rebuild and Redeploy
```bash
# Build the project
npm run build

# The _redirects file should be automatically copied to the build folder
# Verify it exists:
ls build/_redirects
```

### 3. Deploy to Netlify

**If using Netlify CLI:**
```bash
netlify deploy --prod
```

**If using Git integration:**
1. Commit and push your changes:
   ```bash
   git add public/_redirects netlify.toml
   git commit -m "Fix Netlify 404 redirects"
   git push
   ```
2. Netlify will automatically rebuild and redeploy

**If using manual deploy:**
1. Build the project: `npm run build`
2. Upload the `build` folder to Netlify
3. Make sure `_redirects` is in the build folder

### 4. Verify in Netlify Dashboard
1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Build & deploy** → **Post processing**
3. Check that redirects are active
4. Or go to **Site settings** → **Redirects** to see the redirect rules

### 5. Clear Browser Cache
After redeploying, clear your browser cache or use incognito mode to test.

## Testing
1. Deploy your site
2. Try accessing a route directly (e.g., `https://mmlipl.info/some-route`)
3. Try refreshing the page on a route
4. Both should work without 404 errors

## Troubleshooting

### If redirects still don't work:
1. **Check build folder**: Make sure `_redirects` is in the `build` folder after building
2. **Netlify Dashboard**: Go to Site settings → Redirects and manually add:
   - From: `/*`
   - To: `/index.html`
   - Status: `200`
3. **Force rebuild**: In Netlify dashboard, go to Deploys → Trigger deploy → Clear cache and deploy site

### Alternative: Add redirects in Netlify Dashboard
1. Go to **Site settings** → **Redirects**
2. Click **New rule**
3. Add:
   - **Rule**: `/*`
   - **Action**: `/index.html`
   - **Status**: `200`
4. Save and redeploy

## Current Configuration

✅ `public/_redirects` exists with correct content
✅ `netlify.toml` has redirects configured
✅ Both methods are in place for redundancy

After redeploying, the 404 errors should be resolved!

