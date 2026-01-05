# How to Find Your Server Information

## What You Need

To deploy, you need:
1. **Server IP Address** (or hostname)
2. **Username** to login to your server
3. **SSH Access** (password or SSH key)

---

## How to Find Your Server Details

### Option 1: If You Have a VPS/Cloud Server

**Common Providers:**
- **DigitalOcean**: Check your Droplet dashboard
- **AWS EC2**: Check EC2 Dashboard → Instances
- **Linode**: Check Linode Dashboard
- **Vultr**: Check Server Dashboard
- **Hetzner**: Check Server Dashboard

**What to look for:**
- **IP Address**: Usually shown as "Public IP" or "IPv4 Address"
- **Username**: Usually `root` or `ubuntu` or `admin` (depends on OS)

### Option 2: If You Have a Domain Already

If `mmlipl.info` is already pointing to your server:

```bash
# Find the IP address your domain points to
nslookup mmlipl.info
```

This will show the IP address.

### Option 3: If You're Using Your Mac as the Server

If you want to serve from your Mac (not recommended for production, but works for testing):

- **IP Address**: Your Mac's local IP (192.168.x.x) or public IP
- **Username**: Your Mac username (usually `macbook` based on your prompt)

To find your Mac's IP:
```bash
# Local network IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# Or
ipconfig getifaddr en0
```

### Option 4: Check Your Domain Provider

If you bought `mmlipl.info` from a domain registrar:
- Log into your domain registrar (GoDaddy, Namecheap, etc.)
- Check DNS settings
- Look for "A Record" pointing to an IP address
- That IP is your server IP

---

## Common Server Usernames by OS

- **Ubuntu/Debian**: `ubuntu` or `root`
- **CentOS/RHEL**: `root` or `centos`
- **macOS**: Your Mac username (e.g., `macbook`)
- **Custom**: Whatever you set up

---

## Test Your Connection

Once you have the details, test SSH access:

```bash
# Replace with your actual details
ssh username@your-actual-ip-address

# Example:
# ssh root@192.168.1.100
# ssh ubuntu@45.55.123.456
```

If it asks for a password, enter it. If it connects, you're good to go!

---

## Still Don't Have a Server?

If you don't have a server yet, you have options:

1. **Use a VPS Provider** (recommended):
   - DigitalOcean ($5/month)
   - Linode ($5/month)
   - Vultr ($2.50/month)
   - Hetzner (€4/month)

2. **Use Your Mac** (for testing only):
   - Install Nginx on Mac
   - Use your Mac's IP address
   - Not recommended for production

3. **Use a Different Hosting Service**:
   - Netlify (but you hit usage limits)
   - Vercel (free tier available)
   - GitHub Pages (free)

---

## Next Steps

Once you have:
- Server IP: `XXX.XXX.XXX.XXX`
- Username: `your-username`

Run:
```bash
scp -r build/* your-username@XXX.XXX.XXX.XXX:/tmp/tms-build/
```

