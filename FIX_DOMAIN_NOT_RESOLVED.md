# Fix: Domain Not Resolved Error

## Problem
```
ERR_NAME_NOT_RESOLVED
mmlipl.org's server IP address could not be found
```

## Important: Domain Name Check

**You mentioned:** `mmlipl.org`
**We've been working with:** `mmlipl.info`

### Is this a typo?
- If you meant `mmlipl.info` → Continue with DNS setup below
- If you have a different domain `mmlipl.org` → Need to configure it separately

## Solution for mmlipl.info

### Current DNS Status at GoDaddy

**Your DNS records:**
- ✅ A record: `@` → `75.2.60.5` (correct)
- ✅ CNAME: `www` → `mmlipl-info.netlify.app` (correct)
- ⚠️ Missing: Second A record for `99.83.190.102`

### Step 1: Add Missing A Record

**In GoDaddy DNS Management:**

1. Click **"Add New Record"**
2. Select **Type:** `A`
3. Set:
   - **Name:** `@` (or leave blank for root)
   - **Value:** `99.83.190.102`
   - **TTL:** `1 Hour`
4. Click **"Save"**

**Your DNS should have TWO A records:**
```
A    @    75.2.60.5        1 Hour
A    @    99.83.190.102    1 Hour
CNAME www  mmlipl-info.netlify.app  1 Hour
```

### Step 2: Wait for DNS Propagation

- ⏱️ **Wait:** 10-60 minutes
- ✅ **Check:** https://dnschecker.org
   - Enter: `mmlipl.info`
   - Should show both IP addresses

### Step 3: Renew SSL Certificate

**In Netlify Dashboard:**
1. Domain management → `mmlipl.info`
2. SSL certificate section
3. Click **"Renew certificate"**
4. Wait 5-60 minutes

### Step 4: Test Your Site

**After DNS propagates:**
- Visit: **https://mmlipl.info**
- Should load without errors

## If You Have mmlipl.org Domain

### Step 1: Add Domain to Netlify

1. **In Netlify Dashboard:**
   - Site settings → Domain management
   - Click **"Add custom domain"**
   - Enter: `mmlipl.org`

2. **Get DNS Records:**
   - Netlify will show DNS records needed
   - Copy the A record IP address(es)

### Step 2: Configure DNS at GoDaddy

**Add DNS records for mmlipl.org:**

1. **A Record(s):**
   ```
   Type: A
   Name: @
   Value: [Netlify IP from dashboard]
   TTL: 1 Hour
   ```

2. **CNAME Record:**
   ```
   Type: CNAME
   Name: www
   Value: [Your Netlify site URL].netlify.app
   TTL: 1 Hour
   ```

### Step 3: Wait and Verify

- Wait 10-60 minutes for DNS propagation
- Check: https://dnschecker.org
- Renew SSL certificate in Netlify

## Quick Troubleshooting

### Check 1: Verify Domain Name

**Which domain are you trying to access?**
- `mmlipl.info` → Continue with DNS setup above
- `mmlipl.org` → Need to add to Netlify first

### Check 2: Verify DNS Records

**For mmlipl.info, you need:**
- Two A records (both Netlify IPs)
- One CNAME record (www)

**Current status:**
- ✅ One A record exists
- ❌ Missing second A record
- ✅ CNAME exists

### Check 3: DNS Propagation

**Check if DNS is resolving:**
```bash
dig mmlipl.info
# or
nslookup mmlipl.info
```

**Should show:**
- Both IP addresses: `75.2.60.5` and `99.83.190.102`
- If only one shows, DNS hasn't fully propagated

## Action Items

### For mmlipl.info:

1. ✅ **Add second A record** at GoDaddy:
   - Type: A
   - Name: @
   - Value: `99.83.190.102`
   - TTL: 1 Hour

2. ⏱️ **Wait 10-60 minutes** for DNS propagation

3. ✅ **Renew SSL certificate** in Netlify

4. ✅ **Test:** https://mmlipl.info

### For mmlipl.org (if different domain):

1. ✅ **Add domain** to Netlify first
2. ✅ **Configure DNS** records at GoDaddy
3. ⏱️ **Wait** for propagation
4. ✅ **Renew SSL** certificate

## Summary

**Current Issue:**
- Domain not resolving (ERR_NAME_NOT_RESOLVED)
- Missing second A record for mmlipl.info
- Or mmlipl.org not configured

**Solution:**
- Add missing A record: `99.83.190.102`
- Wait for DNS propagation
- Renew SSL certificate

**Timeline:**
- DNS propagation: 10-60 minutes
- SSL certificate: 5-60 minutes after DNS
- Total: 15-120 minutes

