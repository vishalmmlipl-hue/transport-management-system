# How to Find Netlify IP Address for A Record

## Quick Methods

### Method 1: Netlify Dashboard (Recommended)

1. **Go to Netlify Dashboard:**
   - https://app.netlify.com
   - Login to your account

2. **Navigate to Domain Settings:**
   - Select your site (`transport-management-system`)
   - Click **"Site settings"**
   - Go to **"Domain management"**
   - Click on **`mmlipl.info`** domain

3. **Find DNS Configuration:**
   - Look for **"DNS settings"** or **"DNS records"**
   - Find **A record** section
   - Copy the **IP address** shown

### Method 2: DNS Settings Tab

1. In Netlify → **Domain management**
2. Click **"DNS settings"** tab
3. Look for **A record** entries
4. Copy the IP address value

### Method 3: Check Site's DNS

1. In Netlify → Your site
2. Go to **"DNS"** tab (if available)
3. Look for A record IP address

### Method 4: Common Netlify IPs

Netlify commonly uses these IP addresses:

- **`75.2.60.5`** (most common)
- **`99.83.190.102`**

**⚠️ Important:** Verify the exact IP for your site in Netlify dashboard!

### Method 5: Terminal Check

```bash
# Check your Netlify site's IP
dig mmlipl-info.netlify.app

# Or check common Netlify IPs
nslookup mmlipl-info.netlify.app
```

## What to Look For

In Netlify dashboard, you should see something like:

```
DNS Records:
Type    Name    Value
A       @       75.2.60.5
NETLIFY mmlipl.info  mmlipl-info.netlify.app
```

The **A record** value is the IP address you need.

## If You Can't Find It

### Option 1: Contact Netlify Support
- Go to: https://www.netlify.com/support
- Ask for the IP address for your domain

### Option 2: Use Netlify DNS Instead
- Update name servers at GoDaddy
- Manage DNS entirely in Netlify
- See `UPDATE_NAMESERVERS.md`

### Option 3: Check Site's Network Info
- In Netlify → Site settings → General
- Look for IP address information

## Once You Have the IP

Use it in GoDaddy DNS:

```
A Record:
Type: A
Name: @
Value: [IP address from Netlify]
TTL: 600
```

## Verification

After updating DNS, verify:

```bash
dig mmlipl.info
```

Should show the Netlify IP address you configured.

