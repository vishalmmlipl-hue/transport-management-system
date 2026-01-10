# Setup Custom Domain: mmlipl.info on Netlify

## Prerequisites
- ✅ Netlify site deployed (even if temporary URL)
- ✅ Domain `mmlipl.info` registered (GoDaddy)
- ✅ Access to GoDaddy DNS settings

## Step 1: Add Domain to Netlify

### 1.1 In Netlify Dashboard

1. Go to **https://app.netlify.com**
2. Select your site (`transport-management-system`)
3. Go to **Site settings** → **Domain management**
4. Click **"Add custom domain"**
5. Enter: `mmlipl.info`
6. Click **"Verify"**

### 1.2 Netlify will show DNS configuration

Netlify will provide DNS records you need to add. Usually:
- **Type:** `A` or `CNAME`
- **Name:** `@` (or root domain)
- **Value:** Netlify's IP address or hostname

**Note:** Netlify may also suggest:
- `www.mmlipl.info` → `mmlipl.info` (CNAME)

## Step 2: Configure DNS at GoDaddy

### 2.1 Login to GoDaddy

1. Go to **https://dcc.godaddy.com**
2. Login to your account
3. Click **"My Products"**
4. Find `mmlipl.info` → Click **"DNS"**

### 2.2 Update DNS Records

**Option A: Using A Record (Recommended)**

1. Find existing `A` record for `@` (or root)
2. **Edit** or **Add**:
   - **Type:** `A`
   - **Name:** `@` (or leave blank for root)
   - **Value:** Netlify's IP address (from Netlify dashboard)
   - **TTL:** `600` (or default)
3. **Save**

**Option B: Using CNAME (Alternative)**

1. **Add** new record:
   - **Type:** `CNAME`
   - **Name:** `@` (or root)
   - **Value:** Your Netlify site URL (e.g., `your-site.netlify.app`)
   - **TTL:** `600`
2. **Save**

**Note:** Some registrars don't allow CNAME on root domain. Use A record instead.

### 2.3 Add WWW Subdomain (Optional but Recommended)

1. **Add** new record:
   - **Type:** `CNAME`
   - **Name:** `www`
   - **Value:** `mmlipl.info` (or your Netlify site URL)
   - **TTL:** `600`
2. **Save**

### 2.4 Remove Conflicting Records

- Remove any existing `A` records pointing to other IPs
- Remove any conflicting `CNAME` records
- Keep only the Netlify records

## Step 3: SSL Certificate (Automatic)

Netlify will automatically:
- ✅ Issue SSL certificate via Let's Encrypt
- ✅ Enable HTTPS
- ✅ Configure automatic renewal

**Wait time:** 5-60 minutes for DNS propagation and SSL setup

## Step 4: Verify Setup

### 4.1 Check DNS Propagation

Use online tools to verify DNS:
- **https://dnschecker.org**
- Enter: `mmlipl.info`
- Check if it points to Netlify

### 4.2 Test Your Site

1. Wait 5-60 minutes for DNS to propagate
2. Visit: **https://mmlipl.info**
3. Should show your Transport Management System

### 4.3 Check SSL Certificate

1. In Netlify → **Site settings** → **Domain management**
2. Look for SSL certificate status
3. Should show: **"Certificate issued"** or **"Provisioning"**

## Step 5: Configure Redirects (Optional)

### 5.1 Redirect HTTP to HTTPS

Netlify does this automatically, but you can verify in `netlify.toml`:

```toml
[[redirects]]
  from = "http://mmlipl.info/*"
  to = "https://mmlipl.info/:splat"
  status = 301
  force = true
```

### 5.2 Redirect WWW to Non-WWW (or vice versa)

In Netlify dashboard → **Site settings** → **Domain management**:
- Enable **"Redirect www to non-www"** or **"Redirect non-www to www"**

## Troubleshooting

### DNS Not Propagating

**Wait time:** DNS changes can take up to 48 hours (usually 5-60 minutes)

**Check:**
```bash
# Check DNS records
dig mmlipl.info
nslookup mmlipl.info
```

**Common issues:**
- DNS cache: Clear browser cache or use incognito
- Wrong DNS records: Double-check values in GoDaddy
- Propagation delay: Wait longer

### SSL Certificate Not Issuing

**Wait:** SSL certificate provisioning can take 5-60 minutes

**Check:**
1. DNS must be pointing to Netlify first
2. In Netlify → Domain management → SSL certificate status
3. If stuck, try: **"Verify DNS configuration"**

**Fix:**
- Ensure DNS records are correct
- Wait for DNS propagation
- Click **"Renew certificate"** in Netlify

### Site Shows "Not Found" or Wrong Content

**Possible causes:**
- DNS not fully propagated
- Wrong DNS records
- Netlify site not deployed

**Fix:**
- Verify DNS records match Netlify's requirements
- Check Netlify site is deployed successfully
- Clear browser cache

### GoDaddy DNS Settings Not Saving

**Common issues:**
- Browser cache: Try incognito mode
- Multiple tabs: Close other GoDaddy tabs
- Wait a few minutes and try again

## Quick Reference

### Netlify DNS Records (Example)

**A Record:**
```
Type: A
Name: @
Value: 75.2.60.5 (Netlify IP - check your Netlify dashboard)
TTL: 600
```

**CNAME Record (for www):**
```
Type: CNAME
Name: www
Value: mmlipl.info
TTL: 600
```

### GoDaddy DNS Settings Location

1. Login: https://dcc.godaddy.com
2. My Products → mmlipl.info → DNS
3. DNS Management → Records

### Netlify Domain Settings Location

1. https://app.netlify.com
2. Select site → Site settings
3. Domain management

## After Setup

✅ **Your site will be live at:**
- https://mmlipl.info
- https://www.mmlipl.info (if configured)

✅ **Automatic features:**
- HTTPS/SSL enabled
- Automatic certificate renewal
- DNS management in Netlify

✅ **Future deployments:**
- Every push to GitHub → Auto-deploy
- New deployments → Live on mmlipl.info automatically

## Need Help?

- **Netlify Support:** https://www.netlify.com/support
- **GoDaddy Support:** https://www.godaddy.com/help
- **DNS Checker:** https://dnschecker.org

