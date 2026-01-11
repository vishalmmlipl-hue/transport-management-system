# mmlipl.info - Troubleshooting Guide

## 🔍 Common Issues

### Issue 1: Blank Page
**Symptoms:** Site loads but shows blank page

**Diagnosis:**
1. Check Netlify build status
2. Check browser console (F12) for errors
3. Verify build succeeded

**Fix:**
1. Go to: https://app.netlify.com
2. Click your site → Deploys tab
3. Check if build succeeded (green checkmark)
4. If failed, click build to see errors
5. Fix errors and push again

---

### Issue 2: TypeError: toString() Errors
**Symptoms:** Console shows `Cannot read properties of undefined (reading 'toString')`

**Status:** ✅ **FIXED** - All null checks added

**If still seeing errors:**
- Hard refresh: `Ctrl+F5` or `Cmd+Shift+R`
- Clear browser cache
- Verify latest code is deployed

---

### Issue 3: Manifest 401 Error
**Symptoms:** Console shows `manifest.json 401 (Unauthorized)`

**Status:** ✅ **FIXED** - Manifest link commented out

**If still seeing errors:**
- Verify `public/index.html` has manifest link commented
- Rebuild and redeploy

---

### Issue 4: Supabase Warnings
**Symptoms:** Console shows Supabase environment variables warning

**Status:** ✅ **FIXED** - Supabase disabled

**If still seeing warnings:**
- Verify `src/supabaseClient.js` has no console.log
- Rebuild and redeploy

---

### Issue 5: API Not Working
**Symptoms:** API calls fail or return errors

**Diagnosis:**
1. Check Render.com backend status
2. Test API directly
3. Verify API URL in code

**Fix:**
```bash
# Test API
curl https://transport-management-system-wzhx.onrender.com/api/branches

# Check Render.com dashboard
# Go to: https://dashboard.render.com
# Check if service is running
```

---

### Issue 6: Build Fails on Netlify
**Symptoms:** Netlify build shows red X

**Diagnosis:**
1. Check build logs in Netlify
2. Look for syntax errors
3. Check for missing dependencies

**Common Causes:**
- Syntax errors in code
- Missing dependencies in `package.json`
- Build script errors

**Fix:**
1. Fix errors shown in build logs
2. Test build locally: `npm run build`
3. Push fixed code

---

### Issue 7: Site Shows Old Version
**Symptoms:** Changes not visible after deploy

**Fix:**
1. Hard refresh: `Ctrl+F5` or `Cmd+Shift+R`
2. Clear browser cache
3. Try incognito/private mode
4. Verify Netlify deploy completed

---

## 🔧 Quick Diagnostic Steps

### Step 1: Check Netlify Build
1. Go to: https://app.netlify.com
2. Your site → Deploys tab
3. Check latest deploy status

### Step 2: Check Browser Console
1. Visit: https://mmlipl.info
2. Press F12
3. Console tab - look for errors

### Step 3: Check Network Tab
1. Press F12 → Network tab
2. Reload page
3. Check for failed requests (404, 500)

### Step 4: Test API
```bash
# Test backend API
curl https://transport-management-system-wzhx.onrender.com/api/branches

# Should return JSON data
```

---

## 📋 Diagnostic Checklist

- [ ] Netlify build successful (green checkmark)
- [ ] No console errors (F12)
- [ ] No 404 errors in Network tab
- [ ] API responding correctly
- [ ] Hard refresh tested
- [ ] Browser cache cleared

---

## 🔗 Useful Links

- **Netlify Dashboard:** https://app.netlify.com
- **Render.com Dashboard:** https://dashboard.render.com
- **Site URL:** https://mmlipl.info
- **API URL:** https://transport-management-system-wzhx.onrender.com/api

---

**For deployment steps, see:** `mmlipl.info/DEPLOYMENT.md`  
**For applied fixes, see:** `mmlipl.info/FIXES.md`
