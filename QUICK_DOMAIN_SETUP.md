# Quick Setup: mmlipl.info on Netlify

## 🎯 Quick Steps

### 1. Deploy Site First (if not done)
- Deploy to Netlify (even with temporary URL)
- Get your Netlify site URL: `https://your-site-123.netlify.app`

### 2. Add Domain in Netlify

1. **Netlify Dashboard** → Your site → **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Enter: `mmlipl.info`
4. Click **"Verify"**
5. **Copy the DNS records** shown by Netlify

### 3. Update DNS at GoDaddy

1. **GoDaddy** → **My Products** → `mmlipl.info` → **DNS**
2. **Edit existing A record** or **Add new**:
   ```
   Type: A
   Name: @ (or leave blank)
   Value: [Netlify IP from step 2]
   ```
3. **Add CNAME** (for www):
   ```
   Type: CNAME
   Name: www
   Value: mmlipl.info
   ```
4. **Save** all changes

### 4. Wait & Verify

- ⏱️ **Wait:** 5-60 minutes for DNS propagation
- ✅ **Check:** Visit https://mmlipl.info
- 🔒 **SSL:** Netlify will auto-configure HTTPS

## 📋 DNS Records Example

**In GoDaddy DNS:**

```
A Record:
@ → 75.2.60.5 (Netlify IP - check Netlify dashboard)

CNAME Record:
www → mmlipl.info
```

**Note:** The IP address will be shown in Netlify dashboard when you add the domain.

## ⚠️ Common Issues

**DNS not working?**
- Wait longer (up to 48 hours, usually 5-60 min)
- Check DNS records match Netlify's requirements
- Use https://dnschecker.org to verify

**SSL not working?**
- DNS must propagate first
- Wait 5-60 minutes after DNS is correct
- Check Netlify → Domain management → SSL status

**Site not loading?**
- Verify DNS records are correct
- Check Netlify site is deployed
- Clear browser cache

## ✅ Success Checklist

- [ ] Site deployed on Netlify
- [ ] Domain added in Netlify dashboard
- [ ] DNS records updated in GoDaddy
- [ ] DNS propagated (check with dnschecker.org)
- [ ] SSL certificate issued (check Netlify dashboard)
- [ ] Site accessible at https://mmlipl.info

## 🎉 Done!

Once DNS propagates, your site will be live at:
- **https://mmlipl.info**
- **https://www.mmlipl.info**

All future deployments will automatically update your live site!

