# 🔧 Fix Divergent Branches

## ❌ Error

```
hint: You have divergent branches and need to specify how to reconcile them.
```

**Meaning:** Your local branch and remote branch have different commits.

---

## ✅ Solution: Configure Merge Strategy

### Option 1: Use Merge (Recommended - Safest)

```bash
cd /Users/macbook/transport-management-system

# Configure to use merge
git config pull.rebase false

# Now pull again
git pull origin main
```

**What happens:**
- Creates a merge commit
- Keeps both your changes and remote changes
- Safe and easy to understand

---

### Option 2: Use Rebase (Cleaner History)

```bash
cd /Users/macbook/transport-management-system

# Configure to use rebase
git config pull.rebase true

# Now pull again
git pull origin main
```

**What happens:**
- Puts your commits on top of remote commits
- Cleaner history (no merge commit)
- Slightly more complex if conflicts

---

## 🎯 Quick Fix (Recommended)

**Just run:**
```bash
cd /Users/macbook/transport-management-system
git config pull.rebase false
git pull origin main
```

Then if there are conflicts, resolve them and continue.

---

## ⚠️ If Merge Conflicts

After pulling, if you see conflicts:

1. **Git will show conflicted files**
2. **Open them and look for:**
   ```
   <<<<<<< HEAD
   Your changes
   =======
   Remote changes
   >>>>>>> origin/main
   ```
3. **Keep your changes** (especially API fix)
4. **Save files**
5. **Continue:**
   ```bash
   git add .
   git commit -m "Merge remote changes"
   git push origin main
   ```

---

## ✅ Complete Workflow

```bash
cd /Users/macbook/transport-management-system

# First, commit your changes
git add .
git commit -m "Fix API URL to use Render server"

# Configure merge strategy
git config pull.rebase false

# Pull remote changes
git pull origin main

# If conflicts, resolve them, then:
# git add .
# git commit -m "Merge remote changes"

# Push everything
git push origin main
```

---

**Run the commands above!** 🚀
