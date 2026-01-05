# GoDaddy Quick Deployment Steps

## 🚀 Fast Track (5 Minutes)

### 1. Log into GoDaddy
- Go to: https://sso.godaddy.com/
- Sign in with your account

### 2. Open File Manager
- My Products → Web Hosting → mmlipl.info → **cPanel Admin**
- Click **"File Manager"** in Files section

### 3. Go to Web Directory
- Click on **`public_html/`** folder
- This is where your website files go

### 4. Upload Files
- Click **"Upload"** button
- Select: `/Users/macbook/transport-management-system/tms-deploy.zip`
- Wait for upload

### 5. Extract Files
- Right-click `tms-deploy.zip` → **"Extract"**
- Open the `build/` folder
- **Select all files** (Ctrl+A or Cmd+A)
- **Cut** them (Ctrl+X or Cmd+X)
- Go back to `public_html/`
- **Paste** (Ctrl+V or Cmd+V)

### 6. Clean Up
- Delete `tms-deploy.zip`
- Delete empty `build/` folder

### 7. Test
- Visit: **http://mmlipl.info**

---

## 📝 Update DNS (Important!)

To remove Netlify error:

1. GoDaddy → My Products → Domains → mmlipl.info → **DNS**
2. Find A record with `75.2.60.5` (Netlify)
3. **Delete** it or change to GoDaddy's IP
4. Save and wait 10 minutes

---

## ✅ Done!

Your TMS should now be live at http://mmlipl.info

