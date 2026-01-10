# Update Name Servers at GoDaddy for mmlipl.info

## Quick Steps

### 1. Login to GoDaddy
- Go to: https://dcc.godaddy.com
- Login with your account

### 2. Navigate to Domain
- Click **"My Products"**
- Find **`mmlipl.info`**
- Click **"DNS"** or **"Manage DNS"**

### 3. Find Name Servers Section
- Look for **"Name Servers"** section
- Usually at the top or bottom of DNS settings
- Click **"Change"** or **"Edit"**

### 4. Update Name Servers
- Select **"Custom"** or **"I'll use my own name servers"**
- Replace all existing name servers with:

```
dns1.p06.nsone.net
dns2.p06.nsone.net
dns3.p06.nsone.net
dns4.p06.nsone.net
```

### 5. Save Changes
- Click **"Save"** or **"Update"**
- Confirm if prompted

### 6. Wait for Propagation
- ⏱️ **Time:** 5-60 minutes (can take up to 48 hours)
- ✅ **Check:** https://dnschecker.org
- Enter: `mmlipl.info`
- Check name servers column

## Verify Name Servers Updated

### Method 1: DNS Checker
1. Go to: https://dnschecker.org
2. Enter: `mmlipl.info`
3. Select: **"NS"** (Name Servers)
4. Check if results show Netlify name servers

### Method 2: Terminal
```bash
dig NS mmlipl.info
```

Should show:
```
dns1.p06.nsone.net
dns2.p06.nsone.net
dns3.p06.nsone.net
dns4.p06.nsone.net
```

## After Name Servers Update

1. **Netlify will detect** the change automatically
2. **DNS records** already configured in Netlify will become active
3. **SSL certificate** will be issued automatically
4. **Site will be live** at https://mmlipl.info

## Current DNS Records (Already Configured)

These are already set in Netlify and will work once name servers are updated:

```
mmlipl.info → mmlipl-info.netlify.app
www.mmlipl.info → mmlipl-info.netlify.app
```

## Troubleshooting

### Can't Find Name Servers Section
- Look for **"DNS Management"** or **"DNS Settings"**
- May be under **"Advanced DNS"**
- Contact GoDaddy support if needed

### Changes Not Saving
- Try incognito/private browser window
- Clear browser cache
- Wait a few minutes and try again

### Name Servers Not Updating
- Wait longer (up to 48 hours)
- Verify you saved changes
- Check GoDaddy account for any restrictions

## Important Notes

⚠️ **After changing name servers:**
- DNS management moves to Netlify
- Update DNS records in Netlify dashboard (not GoDaddy)
- All DNS changes now done in Netlify

✅ **Benefits:**
- Easier DNS management
- Automatic SSL certificates
- Better integration with Netlify
- Faster DNS updates

## Next Steps

1. ✅ Update name servers at GoDaddy
2. ⏱️ Wait for propagation (5-60 minutes)
3. ✅ Verify DNS is working
4. ✅ Check SSL certificate in Netlify
5. ✅ Test https://mmlipl.info

