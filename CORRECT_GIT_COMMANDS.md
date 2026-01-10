# Correct Git Commands - Navigate to Project First

## Problem
You're running git commands from your home directory (`~`) instead of the project directory. That's why you see warnings about Library directories.

## Solution: Navigate to Project First

### Step 1: Go to Project Directory
```bash
cd /Users/macbook/transport-management-system
```

### Step 2: Pull Remote Changes
```bash
git pull origin main
```

This will:
- Download changes from GitHub
- Merge them with your local changes
- Create a merge commit if needed

### Step 3: Push Your Changes
```bash
git push origin main
```

## Complete Command Sequence

Run these commands **in order**:

```bash
# 1. Navigate to project
cd /Users/macbook/transport-management-system

# 2. Pull remote changes
git pull origin main

# 3. If there are conflicts, you'll see messages. Then:
#    - Resolve conflicts manually, OR
#    - Use: git checkout --ours . (keep local) or git checkout --theirs . (keep remote)
#    - Then: git add . && git commit -m "Merge conflicts resolved"

# 4. Push your changes
git push origin main
```

## Important Notes

1. **Always run `cd` first** to go to the project directory
2. **The warnings about Library directories are harmless** - they're just macOS system files
3. **Make sure you're in the project directory** before running git commands

## Verify You're in the Right Directory

After running `cd`, verify with:
```bash
pwd
# Should show: /Users/macbook/transport-management-system

ls -la | grep netlify.toml
# Should show: netlify.toml exists
```

## If Pull Shows Conflicts

If `git pull` shows merge conflicts:

1. **See what files have conflicts:**
   ```bash
   git status
   ```

2. **Resolve conflicts:**
   - Open the conflicted files
   - Look for `<<<<<<<`, `=======`, `>>>>>>>` markers
   - Edit to keep the code you want
   - Save files

3. **Complete the merge:**
   ```bash
   git add .
   git commit -m "Merge remote changes"
   git push origin main
   ```

## Quick Fix (If You Just Want to Push)

If you want to keep your local changes and overwrite remote:

```bash
cd /Users/macbook/transport-management-system
git pull origin main --rebase
git push origin main
```

Or if you're sure you want to force push (⚠️ use carefully):
```bash
cd /Users/macbook/transport-management-system
git push origin main --force
```

⚠️ **Warning:** Force push overwrites remote changes. Only use if you're sure!

