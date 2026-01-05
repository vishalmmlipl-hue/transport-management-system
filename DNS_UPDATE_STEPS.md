# DNS Update - Step by Step

## Current Situation
- A record points to "WebsiteBuilder Site" (GoDaddy's builder)
- Need to change it to your server IP: `99.83.190.102`

## Step-by-Step Instructions

### 1. Edit the A Record

On the DNS page you're viewing:

1. **Find the A record** row (Type: `a`, Name: `@`, Data: `WebsiteBuilder Site`)
2. **Click "Edit"** button (or three dots → Edit)
3. **In the edit form**:
   - **Name**: `@` (keep as is)
   - **Data/Value**: Change from "WebsiteBuilder Site" to `99.83.190.102`
   - **TTL**: 1 Hour (keep as is)
4. **Click "Save"** or "Update"

### 2. If Edit is Disabled

If you can't edit because Website Builder is managing it:

**Option A: Disconnect Website Builder First**
1. Go back to domain overview
2. Look for "Website" section
3. Click "Manage" or "Disconnect"
4. Remove Website Builder connection
5. Return to DNS and edit A record

**Option B: Add New A Record**
1. Click **"Add New Record"**
2. Select **"A"** from dropdown
3. Fill in:
   - **Name**: `@`
   - **Data**: `99.83.190.102`
   - **TTL**: 1 Hour
4. **Save**
5. Try to delete the old "WebsiteBuilder Site" record

### 3. Verify the Change

After saving, your DNS should show:
- **A record** (@) → `99.83.190.102` ✅

### 4. Wait for DNS Propagation

- **Wait**: 10-30 minutes
- **Check**: Run `nslookup mmlipl.info` to verify it points to `99.83.190.102`

---

## After DNS Update

Once DNS is updated, you need to upload files to your server (`99.83.190.102`).

**Do you have:**
- ✅ GoDaddy Web Hosting? → Use File Manager
- ✅ FTP access to `99.83.190.102`? → Use FTP
- ❌ Neither? → We'll set up FTP or get hosting

---

**Right Now**: Click "Edit" on that A record and change it to `99.83.190.102`!

