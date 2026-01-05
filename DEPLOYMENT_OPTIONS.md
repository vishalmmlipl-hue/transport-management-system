# Deployment Options for TMS

## Current Situation
You're seeing a Netlify usage limit error. You have two options:

## Option 1: Deploy to Your Own Server (Recommended - No Limits!)

Deploy to your domain `mmlipl.info` on your own server. This avoids any usage limits.

### Steps:

1. **SSH into your server** (where mmlipl.info points)

2. **Copy the build folder to your server:**
   ```bash
   # From your local machine, copy build folder
   scp -r build/* user@your-server-ip:/var/www/mmlipl.info/
   ```

3. **On your server, configure Nginx:**
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/mmlipl.info
   sudo ln -s /etc/nginx/sites-available/mmlipl.info /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

4. **Set proper permissions:**
   ```bash
   sudo chown -R www-data:www-data /var/www/mmlipl.info
   ```

5. **Visit:** `http://mmlipl.info`

**Benefits:**
- ✅ No usage limits
- ✅ Full control
- ✅ Your own domain
- ✅ No monthly costs (just server costs)

---

## Option 2: Deploy to Netlify (If you prefer)

If you want to continue using Netlify, you'll need to:

1. **Upgrade your Netlify plan** (visit https://app.netlify.com/billing)
   - Free tier has limits
   - Pro plan: $19/month
   - Business plan: $99/month

2. **Or wait for usage limits to reset** (if on free tier)

3. **Deploy via Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify deploy --prod --dir=build
   ```

4. **Or connect via Git:**
   - Push to GitHub/GitLab
   - Connect repository in Netlify dashboard
   - Set build command: `npm run build`
   - Set publish directory: `build`

---

## Option 3: Other Free Hosting Alternatives

### Vercel (Free tier available)
```bash
npm install -g vercel
vercel --prod
```

### GitHub Pages
- Push to GitHub
- Enable GitHub Pages in repository settings
- Set source to `build` folder

### Cloudflare Pages (Free)
- Connect GitHub repository
- Set build command: `npm run build`
- Set output directory: `build`

---

## Recommendation

**Deploy to your own server** (`mmlipl.info`) - you already have:
- ✅ Production build ready
- ✅ Nginx configuration
- ✅ Deployment script
- ✅ No usage limits
- ✅ Full control

See `QUICK_DEPLOY.md` for detailed instructions.

