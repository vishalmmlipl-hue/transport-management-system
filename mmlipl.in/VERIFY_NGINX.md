# ✅ Verify Nginx Configuration

## Current Configuration

Your nginx config should look like this:

```nginx
server {
    listen 443 ssl http2;
    http3 off;
    ssl_certificate_key /etc/nginx/ssl-certificates/mmlipl.in.key;
    ssl_certificate /etc/nginx/ssl-certificates/mmlipl.in.crt;
    server_name mmlipl.in www1.mmlipl.in;
    root /home/mmlipl/htdocs/mmlipl.in;

    # API Proxy - MUST be before other location blocks
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    access_log /home/mmlipl/logs/nginx/access.log main;
    error_log /home/mmlipl/logs/nginx/error.log;

    if ($scheme != "https") {
        rewrite ^ https://$host$request_uri permanent;
    }

    location ~ /.well-known {
        auth_basic off;
        allow all;
    }

    # React Router - catch all other routes
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## ⚠️ Important Notes

1. **Location order matters** - `/api` should come BEFORE `/` location
2. **React Router** - Need to add `location /` block for React Router to work
3. **Test before reload** - Always test config before reloading

---

## 🔧 Next Steps

### Step 1: Add React Router Support

Add this location block (after `/api` and before other locations):

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Step 2: Test Configuration

```bash
nginx -t
```

Should show: `syntax is ok` and `test is successful`

### Step 3: Reload Nginx

```bash
systemctl reload nginx
```

### Step 4: Test API

```bash
curl https://mmlipl.in/api/health
```

Should return JSON response from backend.

---

## ✅ Verification Checklist

- [ ] `/api` location block added
- [ ] `/api` location is BEFORE `/` location
- [ ] React Router `/` location added
- [ ] `nginx -t` passes
- [ ] Nginx reloaded
- [ ] API test works
- [ ] Frontend loads correctly

---

**Add the React Router location block, then test!** 🚀
