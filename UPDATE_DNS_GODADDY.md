# Update DNS in GoDaddy - Current Status

## What You're Seeing

Your DNS records show:
- **A record** (@) → "WebsiteBuilder Site" (GoDaddy's website builder)
- **CNAME** (www) → mmlipl.info
- **Nameservers** → GoDaddy's (ns15.domaincontrol.com, ns16.domaincontrol.com)

**Problem**: The A record is pointing to Website Builder, not your actual server!

## Solution: Update A Record

### Step 1: Edit the A Record

1. **Find the A record** that says "WebsiteBuilder Site"
2. **Click "Edit"** (pencil icon or three dots → Edit)
3. **Change the value** to your server IP: `99.83.190.102`
   - Or if you have GoDaddy hosting, use GoDaddy's provided IP
4. **Save** the changes

### Step 2: If You Don't See Edit Option

The A record might be managed by Website Builder. You have two options:

**Option A: Disconnect Website Builder**
1. Go back to domain overview
2. Look for "Website" or "Website Builder" section
3. Disconnect or remove Website Builder
4. Then edit the A record manually

**Option B: Add New A Record**
1. Click **"Add New Record"**
2. Select **"A"** type
3. **Name**: `@` (or leave blank)
4. **Data/Value**: `99.83.190.102` (your Nginx server IP)
5. **TTL**: 1 Hour (or default)
6. **Save**
7. Delete the old "WebsiteBuilder Site" A record if possible

---

## Step 3: Access Your Hosting/File Manager

Since you have a domain but might not have hosting set up:

### Check If You Have Hosting:

1. **Go to**: https://sso.godaddy.com/
2. **My Products** → Look for **"Web Hosting"** or **"Linux Hosting"**
3. If you see hosting for mmlipl.info:
   - Click **"Manage"** or **"cPanel Admin"**
   - Open **"File Manager"**
   - Navigate to `public_html/`

### If You Don't Have Hosting:

You'll need to either:

**Option 1: Get GoDaddy Hosting**
- Purchase Web Hosting from GoDaddy
- Then you can upload files via File Manager

**Option 2: Use Your Existing Server**
- Update DNS A record to point to `99.83.190.102`
- Upload files via FTP (if FTP is enabled on that server)

**Option 3: Use FTP to Your Server**
- Get FTP credentials for `99.83.190.102`
- Upload files directly via FTP

---

## Quick Actions Right Now

1. **Click "Edit"** on the A record showing "WebsiteBuilder Site"
2. **Change it to**: `99.83.190.102`
3. **Save**
4. **Check**: My Products → Do you have "Web Hosting"?
   - If YES → Access File Manager
   - If NO → We'll use FTP to upload to your server

---

## Next Steps After DNS Update

Once DNS points to `99.83.190.102`:

1. **Wait 10-30 minutes** for DNS propagation
2. **Upload files** via:
   - File Manager (if you have GoDaddy hosting)
   - FTP (if you have server access)
3. **Test**: http://mmlipl.info

---

**Action**: Click "Edit" on that A record and change "WebsiteBuilder Site" to `99.83.190.102`!

