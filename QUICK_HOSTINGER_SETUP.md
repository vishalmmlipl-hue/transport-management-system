# Quick Setup: Cursor + Hostinger with Auto-Deploy

## ✅ Answer: YES! You Can Use Cursor with Live Updates

**Everything works the same!** The only difference is deployment (one command instead of Git push).

---

## Setup (5 Minutes)

### Step 1: Create Deployment Config

```bash
# Copy example file
cp .env.deploy.example .env.deploy

# Edit with your Hostinger details
nano .env.deploy
```

Fill in:
```env
HOSTINGER_HOST=mmlipl.info
HOSTINGER_USER=your-hostinger-username
HOSTINGER_PASS=your-hostinger-password
HOSTINGER_PATH=/public_html
```

### Step 2: Install FTP Tool (Optional - for easier deployment)

```bash
# On Mac:
brew install lftp

# Or use SCP (already installed on Mac)
```

### Step 3: Test Deployment

```bash
npm run deploy
```

That's it! 🎉

---

## Daily Workflow (Same as Before!)

### Development:
```bash
# 1. Open Cursor
# 2. Edit your code
# 3. Run local dev:
npm start

# 4. Test at http://localhost:3000
# 5. Hot reload works ✅
# 6. Live updates work ✅
```

### Deploy to Production:
```bash
# When ready to go live:
npm run deploy

# Takes 30-60 seconds
# Done! Changes are live on mmlipl.info
```

---

## What's Different?

| Task | Netlify | Hostinger |
|------|---------|-----------|
| **Edit code** | Cursor ✅ | Cursor ✅ (same) |
| **Local dev** | `npm start` ✅ | `npm start` ✅ (same) |
| **Hot reload** | ✅ Yes | ✅ Yes (same) |
| **Deploy** | `git push` | `npm run deploy` |
| **Time** | 2-3 minutes | 30-60 seconds |

**That's the only difference!**

---

## Advanced: Auto-Deploy on Git Push

Want it to work exactly like Netlify? Set up Git hook:

```bash
# Create Git hook
cat > .git/hooks/post-commit << 'EOF'
#!/bin/bash
npm run deploy
EOF

chmod +x .git/hooks/post-commit
```

Now every `git commit` automatically deploys! 🚀

---

## Troubleshooting

### "lftp not found"
```bash
brew install lftp
```

### "SCP failed"
- Check SSH access in Hostinger control panel
- Or use FTP credentials instead

### "Build failed"
```bash
npm install
npm run build
npm run deploy
```

---

## Summary

✅ **Cursor works exactly the same**  
✅ **Local development works exactly the same**  
✅ **Hot reload works exactly the same**  
✅ **Only difference: `npm run deploy` instead of `git push`**  
✅ **I can make it auto-deploy on Git push too!**

**You won't notice any difference in your daily workflow!**
