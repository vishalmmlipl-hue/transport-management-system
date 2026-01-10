# How to Use DNS Checker to Verify DNS

## DNS Checker Website
**URL:** https://dnschecker.org

## How to Check DNS Propagation

### Step 1: Check A Records (IP Addresses)

1. **Go to:** https://dnschecker.org
2. **Enter domain:** `mmlipl.info`
3. **Select record type:** `A` (default)
4. **Click:** "Search" or press Enter

**What to look for:**
- Should show: `75.2.60.5` ✅
- Should show: `99.83.190.102` ✅
- Both IPs should appear globally

**Expected result:**
- Green checkmarks ✅ = DNS propagated
- Red X ❌ = Not propagated yet (wait longer)

### Step 2: Check Name Servers (NS Records)

**If you updated name servers to Netlify:**

1. **Enter domain:** `mmlipl.info`
2. **Select record type:** `NS` (Name Servers)
3. **Click:** "Search"

**What to look for:**
- Should show: `dns1.p06.nsone.net` ✅
- Should show: `dns2.p06.nsone.net` ✅
- Should show: `dns3.p06.nsone.net` ✅
- Should show: `dns4.p06.nsone.net` ✅

**If still showing GoDaddy name servers:**
- `ns15.domaincontrol.com` = Not updated yet
- `ns16.domaincontrol.com` = Not updated yet
- Wait longer for propagation

### Step 3: Check CNAME Records

1. **Enter domain:** `www.mmlipl.info`
2. **Select record type:** `CNAME`
3. **Click:** "Search"

**What to look for:**
- Should show: `mmlipl-info.netlify.app` ✅
- Or: `mmlipl.info` ✅

## Understanding DNS Checker Results

### Green Checkmarks ✅
- DNS record is propagated
- Visible from that location/server
- Working correctly

### Red X ❌
- DNS record not propagated yet
- Not visible from that location
- Wait longer (can take up to 48 hours)

### Yellow/Orange ⚠️
- Partial propagation
- Some servers updated, some not
- Wait for full propagation

## What to Check For Your Site

### Current Status (Before Name Server Change)

**A Records:**
- ✅ Should show: `75.2.60.5`
- ✅ Should show: `99.83.190.102`
- Both should be green globally

**Name Servers:**
- Currently: `ns15.domaincontrol.com` (GoDaddy)
- Currently: `ns16.domaincontrol.com` (GoDaddy)

### After Name Server Change

**Name Servers (should change to):**
- ✅ `dns1.p06.nsone.net` (Netlify)
- ✅ `dns2.p06.nsone.net` (Netlify)
- ✅ `dns3.p06.nsone.net` (Netlify)
- ✅ `dns4.p06.nsone.net` (Netlify)

**A Records (should remain):**
- ✅ `75.2.60.5`
- ✅ `99.83.190.102`

## Timeline for DNS Propagation

**Typical:**
- 5-30 minutes: Some servers updated
- 30-60 minutes: Most servers updated
- 60+ minutes: All servers updated

**Maximum:**
- Up to 48 hours for full global propagation

## How to Use Results

### If A Records Show Globally ✅
- DNS is working correctly
- Can proceed with SSL certificate renewal
- Site should be accessible

### If Name Servers Still Show GoDaddy
- Name server change hasn't propagated yet
- Wait longer (5-60 minutes)
- Check again later

### If Some Locations Show Red X
- Partial propagation
- Normal during transition
- Wait for full propagation

## Quick Checklist

**Before SSL Certificate:**
- [ ] A records show both IPs globally ✅
- [ ] CNAME record shows Netlify URL ✅
- [ ] DNS propagated (green checkmarks) ✅

**After Name Server Change:**
- [ ] Name servers show Netlify servers ✅
- [ ] A records still show both IPs ✅
- [ ] All records propagated globally ✅

## Common Scenarios

### Scenario 1: Checking Current DNS
**What to check:**
- A records: Should show both Netlify IPs
- Name servers: Currently GoDaddy (if not changed yet)

**Action:**
- Verify A records are correct
- Proceed with name server change if needed

### Scenario 2: After Name Server Change
**What to check:**
- Name servers: Should show Netlify servers
- A records: Should still show Netlify IPs

**Action:**
- Wait for name servers to propagate
- Verify all records are correct
- SSL certificate will issue automatically

### Scenario 3: Troubleshooting SSL Issues
**What to check:**
- All DNS records propagated globally
- Name servers pointing to Netlify
- A records showing correct IPs

**Action:**
- If DNS is correct, SSL should work
- If not, wait for propagation
- Retry SSL certificate renewal

## Tips

1. **Check multiple times:** DNS propagation can be gradual
2. **Wait between checks:** Give it 10-15 minutes between checks
3. **Check globally:** Look at results from different locations
4. **Be patient:** Full propagation can take up to 48 hours

## Summary

**DNS Checker helps you:**
- ✅ Verify DNS records are correct
- ✅ Check if DNS has propagated globally
- ✅ Troubleshoot DNS issues
- ✅ Confirm name server changes

**For your site:**
- Check A records: Should show both Netlify IPs
- Check name servers: Should show Netlify (after change)
- Verify propagation: All locations should show green ✅

Use DNS Checker to verify your DNS setup before proceeding with SSL certificate renewal!

