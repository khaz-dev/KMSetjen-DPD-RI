# Staging Git Branch Divergence - Fix Instructions

**Problem:** Staging server has local commits with untracked JSON files that conflict with remote changes.

**Solution:** Reset staging to match remote, delete untracked files, add to .gitignore.

---

## Step-by-Step Fix

### Step 1: SSH to Staging Server
```bash
ssh -i c:\Users\khair\khaz root@165.245.191.216
cd /var/www/html/kmsetjendpdri
```

### Step 2: Check Current State
```bash
git status
git log --oneline -5
```

You should see:
- Local commit `ab53212` "merge user data" (untracked)
- Remote at `4a609ba` "fix avatar upload"
- 5 untracked JSON files

### Step 3: Reset to Remote (Undo the Local Commit)
```bash
# Reset to origin/main, undoing the local commit with JSON files
git reset --hard origin/main
```

**What this does:**
- Undoes your local commit `ab53212`
- Discards changes back to what remote has
- Your staging is now in sync with GitHub

### Step 4: Delete the Untracked JSON Files (They're Gone After Reset)
```bash
# They should already be deleted after the reset, but just in case:
rm -f backend/users_export.json
rm -f backend/users_final_import.json
rm -f backend/users_merge_export.json
rm -f backend/users_only_export.json
rm -f users_export.json
```

### Step 5: Add These File Patterns to .gitignore
```bash
# Edit .gitignore to prevent these from ever being tracked
nano .gitignore
```

Add these lines at the end:
```
# User data exports (temporary migration files - should never be tracked)
*_export.json
*_import.json
*_merge*.json
users_export.json
backend/users*.json
```

Save: `Ctrl+X`, then `Y`, then `Enter`

### Step 6: Commit the .gitignore Update
```bash
git add .gitignore
git commit -m "Add user export JSON files to gitignore

- Prevent temporary user data files from being tracked
- These are created locally for data migration purposes
- Should never be committed to repository"
```

### Step 7: Push the .gitignore Update
```bash
git push origin main
```

### Step 8: Verify Everything is Clean
```bash
git status
# Should show: "On branch main
#              Your branch is up to date with 'origin/main'.
#              nothing to commit, working tree clean"
```

---

## If You Still Have JSON Files Tracked

If after `git reset --hard origin/main` you still see the JSON files, they were already tracked in history. Execute:

```bash
# Remove them from git history (they won't be on staging anymore)
git rm --cached backend/users*.json
git rm --cached users_export.json
git commit -m "Remove user export JSON files from git tracking"
git push origin main
```

---

## What to Do on Local Machine

Make sure local has .gitignore updated:

```bash
# On your local machine
cd d:\Project\KMSetjen\ DPD\ RI

# Verify .gitignore has the patterns
cat .gitignore | grep -A5 "User data"

# If not there, add them (they should be after our fix)
git pull origin main  # This will bring in the updated .gitignore

# Verify
git status
```

---

## Prevention for Future

- Never commit temporary data files (JSON exports, CSVs, etc.)
- Add them to `.gitignore` immediately
- Use `.env` for local config/paths
- Use `.gitignore` patterns generously

---

## Quick Reference (One-Liner Fix)

If you're experienced, here's the one-liner for staging:

```bash
cd /var/www/html/kmsetjendpdri && \
git reset --hard origin/main && \
rm -f backend/users*.json users_export.json && \
echo "*_export.json" >> .gitignore && \
echo "backend/users*.json" >> .gitignore && \
git add .gitignore && \
git commit -m "Add user export JSON files to gitignore" && \
git push origin main && \
git status
```

---

## Expected Result

After these steps:
✅ Staging and local are in sync
✅ JSON export files are not tracked
✅ .gitignore prevents future tracking of similar files
✅ `git pull` works smoothly
✅ `git push` works smoothly
