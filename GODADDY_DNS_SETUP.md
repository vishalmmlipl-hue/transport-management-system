# Configure mmlipl.info DNS at GoDaddy (Using A Record)

## Option: Keep DNS Management at GoDaddy

Instead of changing name servers, you can keep DNS management at GoDaddy and point to Netlify using A and CNAME records.

## Step 1: Get Netlify IP Address

### Method 1: From Netlify Dashboard

1. Go to **Netlify Dashboard** → Your site
2. **Site settings** → **Domain management**
3. Click on **`mmlipl.info`** domain
4. Look for **DNS configuration** or **DNS records**
5. Find the **A record** IP address

### Method 2: From Netlify DNS Settings

1. In Netlify → **Domain management**
2. Click **"DNS settings"** or **"Manage DNS"**
3. Look for A record value
4. Copy the IP address

### Method 3: Check Your Site's DNS

The IP address is usually one of these Netlify IPs:
- `75.2.60.5`
- `99.83.190.102`
- Or check your site's DNS tab in Netlify

### Method 4: Use Terminal to Find

```bash
# Check your Netlify site's IP
dig your-site-name.netlify.app

# Or check common Netlify IPs
nslookup mmlipl-info.netlify.app
```

## Step 2: Update DNS Records at GoDaddy

### 2.1 Login to GoDaddy

1. Go to: **https://dcc.godaddy.com**
2. Login to your account
3. Click **"My Products"**
4. Find **`mmlipl.info`**
5. Click **"DNS"** or **"Manage DNS"**

### 2.2 Update/Add A Record

**Find existing A record** for `@` (root domain) or **Add new**:

```
Type: A
Name: @ (or leave blank/empty for root domain)
Value: [Netlify IP Address - from Step 1]
TTL: 600 (or 3600)
```

**Steps:**
1. Look for existing **A record** with Name `@` or blank
2. Click **"Edit"** or **"Add"** if not exists
3. Set:
   - **Type:** `A`
   - **Name:** `@` (or leave blank)
   - **Value:** `[Netlify IP Address]`
   - **TTL:** `600`
4. Click **"Save"**

### 2.3 Add CNAME for WWW

**Add new CNAME record:**

```
Type: CNAME
Name: www
Value: mmlipl.info
TTL: 600 (or 3600)
```

**Steps:**
1. Click **"Add"** or **"Add Record"**
2. Select **Type:** `CNAME`
3. Set:
   - **Name:** `www`
   - **Value:** `mmlipl.info`
   - **TTL:** `600`
4. Click **"Save"**

### 2.4 Remove Conflicting Records

**Remove or update:**
- Any existing A records pointing to other IPs
- Any CNAME records conflicting with www
- Keep only the Netlify records

## Step 3: Common Netlify IP Addresses

Netlify uses these IP addresses (check your Netlify dashboard for the exact one):

**Common Netlify IPs:**
- `75.2.60.5`
- `99.83.190.102`
- `75.2.60.5` (most common)

**Important:** Check your Netlify dashboard for the exact IP address for your site!

## Step 4: Verify DNS Records

### Check at GoDaddy

Your DNS records should look like:

```
Type    Name    Value              TTL
A       @       75.2.60.5          600
CNAME   www     mmlipl.info        600
```

### Verify DNS Propagation

1. **Use DNS Checker:**
   - Go to: https://dnschecker.org
   - Enter: `mmlipl.info`
   - Check A record shows Netlify IP

2. **Use Terminal:**
   ```bash
   dig mmlipl.info
   nslookup mmlipl.info
   ```

## Step 5: Wait for Propagation

- ⏱️ **Time:** 5-60 minutes (can take up to 48 hours)
- ✅ **Check:** DNS propagation status
- 🔒 **SSL:** Netlify will issue SSL certificate automatically

## Step 6: Test Your Site

1. Wait for DNS to propagate
2. Visit: **https://mmlipl.info**
3. Should load your Transport Management System
4. Check SSL certificate is active

## Troubleshooting

### Can't Find Netlify IP Address

**Solutions:**
1. Check Netlify dashboard → Domain management → DNS settings
2. Contact Netlify support
3. Use common Netlify IP: `75.2.60.5` (verify first)

### DNS Not Propagating

**Check:**
- DNS records are saved correctly at GoDaddy
- Wait longer (up to 48 hours)
- Verify IP address is correct

**Verify:**
```bash
dig mmlipl.info
```
Should show Netlify IP address.

### Site Not Loading

**Possible causes:**
- Wrong IP address
- DNS not propagated yet
- SSL certificate not issued

**Fix:**
- Verify IP address in Netlify dashboard
- Wait for DNS propagation
- Check SSL certificate status in Netlify

### GoDaddy DNS Not Saving

**Try:**
- Clear browser cache
- Use incognito mode
- Wait a few minutes and try again
- Contact GoDaddy support

## Alternative: Use Netlify DNS (Easier)

If you're having trouble with GoDaddy DNS, consider using Netlify DNS:

1. **Update name servers** at GoDaddy to Netlify's name servers
2. **Manage DNS** entirely in Netlify dashboard
3. **Automatic** SSL certificate management

See `UPDATE_NAMESERVERS.md` for details.

## Quick Reference

### DNS Records at GoDaddy

```
A Record:
Type: A
Name: @
Value: [Netlify IP - check Netlify dashboard]
TTL: 600

CNAME Record:
Type: CNAME
Name: www
Value: mmlipl.info
TTL: 600
```

### How to Find Netlify IP

1. Netlify Dashboard → Site → Domain management → DNS settings
2. Look for A record value
3. Or check site's DNS tab

### Verification Commands

```bash
# Check DNS
dig mmlipl.info
nslookup mmlipl.info

# Check name servers (should show GoDaddy)
dig NS mmlipl.info
```

## After Setup

✅ **Your site will be live at:**
- https://mmlipl.info
- https://www.mmlipl.info

✅ **DNS managed at:** GoDaddy
✅ **SSL managed by:** Netlify (automatic)

