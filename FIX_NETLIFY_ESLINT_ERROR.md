# ✅ Fix: Netlify ESLint Error

## ❌ Error

**Netlify treats ESLint warnings as errors in CI mode.**

**Error:**
```
src/admin-expense-form.jsx
  Line 2:36:  'User' is defined but never used
  Line 2:42:  'FileText' is defined but never used
```

---

## ✅ Fix Applied

**Removed unused imports from `admin-expense-form.jsx`:**

**Before:**
```javascript
import { Save, DollarSign, Wallet, User, FileText } from 'lucide-react';
```

**After:**
```javascript
import { Save, DollarSign, Wallet } from 'lucide-react';
```

---

## 🚀 Deploy the Fix

### Run These Commands:

```bash
cd /Users/macbook/transport-management-system
git add src/admin-expense-form.jsx
git commit -m "Remove unused imports from admin-expense-form to fix Netlify build"
git push origin main
```

---

## ✅ After Deployment

Netlify will:
1. Detect the push
2. Rebuild your site
3. **Build should succeed now!** ✅

---

**Run the commands above to deploy!** 🚀
