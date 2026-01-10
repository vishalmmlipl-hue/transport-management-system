# Configure mmlipl.info DNS on Netlify

## Current Status
- ✅ Domain: `mmlipl.info` added to Netlify
- ✅ DNS records configured in Netlify
- ⚠️ Need to point domain to Netlify DNS

## Option 1: Use Netlify DNS (Recommended)

### Why Use Netlify DNS?
- ✅ Easier management (all DNS in one place)
- ✅ Automatic SSL certificate management
- ✅ Better integration with Netlify features
- ✅ Automatic DNS updates

### Steps to Enable Netlify DNS

#### Step 1: Get Name Servers from Netlify

From your Netlify dashboard, you have these name servers:
```
dns1.p06.nsone.net
dns2.p06.nsone.net
dns3.p06.nsone.net
dns4.p06.nsone.net
```

#### Step 2: Update Name Servers at GoDaddy

1. **Login to GoDaddy:**
   - Go to https://dcc.godaddy.com
   - Login to your account

2. **Navigate to Domain Settings:**
   - Click **"My Products"**
   - Find `mmlipl.info`
   - Click **"DNS"** or **"Manage DNS"**

3. **Change Name Servers:**
   - Look for **"Name Servers"** section
   - Click **"Change"** or **"Edit"**
   - Select **"Custom"** or **"I'll use my own name servers"**
   - Replace existing name servers with:
     ```
     dns1.p06.nsone.net
     dns2.p06.nsone.net
     dns3.p06.nsone.net
     dns4.p06.nsone.net
     ```
   - Click **"Save"**

4. **Wait for Propagation:**
   - Changes take 5-60 minutes (up to 48 hours)
   - Check status: https://dnschecker.org

#### Step 3: Verify in Netlify

1. Go back to Netlify → **Domain management**
2. Netlify will detect when name servers are updated
3. DNS records will be active automatically

### Your Current DNS Records (Already Set)

Netlify shows these records:
```
mmlipl.info → mmlipl-info.netlify.app (NETLIFY)
www.mmlipl.info → mmlipl-info.netlify.app (NETLIFY)
```

These are correct! Once name servers are updated, they'll be active.

---

## Option 2: Keep GoDaddy DNS (Alternative)

If you prefer to keep DNS management at GoDaddy:

### Steps

1. **In GoDaddy DNS Settings:**
   - Remove or update existing A/CNAME records
   - Add these records:

   **A Record:**
   ```
   Type: A
   Name: @ (or blank for root)
   Value: [Get IP from Netlify - check your site's DNS settings]
   TTL: 3600
   ```

   **CNAME Record:**
   ```
   Type: CNAME
   Name: www
   Value: mmlipl-info.netlify.app
   TTL: 3600
   ```

2. **Get Netlify IP Address:**
   - In Netlify → Site settings → Domain management
   - Look for DNS configuration
   - Or check your site's DNS tab for A record value

3. **Save and Wait:**
   - Save DNS records at GoDaddy
   - Wait 5-60 minutes for propagation

---

## Recommended: Use Netlify DNS

**Why?**
- Simpler: All DNS managed in Netlify
- Automatic: SSL certificates managed automatically
- Integrated: Better with Netlify features
- Reliable: Netlify's DNS infrastructure

**Steps Summary:**
1. Copy name servers from Netlify
2. Update name servers at GoDaddy
3. Wait for propagation (5-60 minutes)
4. Done! DNS records are already configured

---

## Verify DNS is Working

### Check DNS Propagation

1. **Use DNS Checker:**
   - Go to https://dnschecker.org
   - Enter: `mmlipl.info`
   - Check if it resolves to Netlify

2. **Check Name Servers:**
   ```bash
   # In terminal
   dig NS mmlipl.info
   ```
   Should show Netlify name servers if updated.

3. **Test Website:**
   - Visit: https://mmlipl.info
   - Should load your site

### Check SSL Certificate

1. **In Netlify:**
   - Site settings → Domain management
   - Look for SSL certificate status
   - Should show "Certificate issued" after DNS propagates

---

## Troubleshooting

### Name Servers Not Updating

**Check:**
- Did you save changes at GoDaddy?
- Wait longer (up to 48 hours)
- Verify name servers are correct

**Verify:**
```bash
dig NS mmlipl.info
```
Should show Netlify name servers.

### DNS Records Not Working

**If using Netlify DNS:**
- Records are already configured in Netlify
- Just need name servers updated at GoDaddy

**If using GoDaddy DNS:**
- Verify A record points to correct Netlify IP
- Verify CNAME records are correct
- Check TTL values

### Site Not Loading

**Possible causes:**
- DNS not propagated yet (wait longer)
- Wrong DNS records
- SSL certificate not issued yet

**Fix:**
- Wait 5-60 minutes
- Check DNS propagation status
- Verify DNS records are correct

---

## Quick Checklist

**For Netlify DNS (Recommended):**
- [ ] Copy name servers from Netlify
- [ ] Update name servers at GoDaddy
- [ ] Wait for propagation (5-60 min)
- [ ] Verify DNS records in Netlify
- [ ] Check SSL certificate status
- [ ] Test https://mmlipl.info

**For GoDaddy DNS:**
- [ ] Get Netlify IP address
- [ ] Update A record at GoDaddy
- [ ] Update CNAME records at GoDaddy
- [ ] Wait for propagation
- [ ] Test https://mmlipl.info

---

## After Setup

✅ **Your site will be live at:**
- https://mmlipl.info
- https://www.mmlipl.info

✅ **Automatic features:**
- SSL/HTTPS enabled
- DNS managed (if using Netlify DNS)
- Auto-deployments from GitHub

✅ **Future updates:**
- Push to GitHub → Auto-deploy
- Changes live on mmlipl.info automatically

