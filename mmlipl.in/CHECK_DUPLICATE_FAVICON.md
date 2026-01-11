# 🔍 Check for Duplicate Favicon Files

## Check for Multiple Favicon Files

**On server, run:**
```bash
# Find all favicon files
find /home/mmlipl/htdocs/mmlipl.in -name "favicon.ico" -type f

# Check public directory
ls -la /home/mmlipl/htdocs/mmlipl.in/public/ | grep favicon

# Check if there's one in root directory
ls -la /home/mmlipl/htdocs/mmlipl.in/ | grep favicon
```

## If Multiple Files Found

**Keep only one in the public directory:**
```bash
# Remove duplicates
rm /home/mmlipl/htdocs/mmlipl.in/favicon.ico  # if exists in root
# Keep: /home/mmlipl/htdocs/mmlipl.in/public/favicon.ico
```

## Check Nginx Configuration

**Make sure Nginx is serving from public directory:**
```bash
grep "root" /etc/nginx/sites-enabled/mmlipl.in.conf
```

**Should show:**
```
root /home/mmlipl/htdocs/mmlipl.in;
```

**And the public directory should contain:**
- index.html
- favicon.ico
- static/

---

**Run the find command to check for duplicates!** 🔍
