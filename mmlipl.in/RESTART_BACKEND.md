# 🔄 Restart Backend After Adding /api Route

## ✅ Fix Applied

I've added a root `/api` route to handle requests to just `/api`.

## 🚀 Restart Backend

**On server, run:**
```bash
cd /home/mmlipl/htdocs/mmlipl.in/server
pm2 restart mmlipl-api
```

**Or if you need to update the code:**
```bash
# Upload updated server.js from your Mac first, then:
pm2 restart mmlipl-api
pm2 logs mmlipl-api
```

## 🧪 Test

**After restart, test:**
```bash
curl https://mmlipl.in/api
curl https://mmlipl.in/api/health
```

**Both should work now!**

---

**Restart the backend and test!** 🚀
