# QUICK FIX FOR STAGING SERVER (Execute These Commands)

## What Happened
Your staging server has a local commit with JSON files that conflicts with the remote. This happened because:
1. Untracked JSON files existed on staging
2. You added them and committed them locally
3. Your local machine pushed different commits that don't include them
4. Result: **Divergent branches** (branches can't auto-merge)

## Solution (Execute on Staging Server)

SSH to staging and run these commands in order:

```bash
# SSH to staging
ssh -i c:\Users\khair\khaz root@165.245.191.216

# Navigate to project
cd /var/www/html/kmsetjendpdri

# Step 1: Reset to match remote (undo the local commit)
git reset --hard origin/main

# Step 2: Delete the untracked JSON files
rm -f backend/users*.json users_export.json

# Step 3: Verify everything is clean
git status
# Expected output:
# On branch main
# Your branch is up to date with 'origin/main'.
# nothing to commit, working tree clean

# Step 4: Pull the latest (including .gitignore update)
git pull origin main

# Step 5: Restart Docker containers to apply any code changes
docker-compose down
docker-compose up -d

# Step 6: Verify everything
docker-compose ps
git status
```

---

## What These Commands Do

| Command | Purpose |
|---------|---------|
| `git reset --hard origin/main` | Undoes your local commit, matches remote exactly |
| `rm -f backend/users*.json` | Deletes the JSON files that shouldn't be tracked |
| `git status` | Shows that everything is clean |
| `git pull origin main` | Gets latest code including .gitignore update |
| `docker-compose down && up -d` | Restarts containers with latest code |

---

## Expected Result

After running these commands:
- ✅ Staging and local will be **in sync**
- ✅ No divergent branches
- ✅ No tracked JSON files
- ✅ `.gitignore` prevents future tracking of these files
- ✅ `git pull` and `git push` will work smoothly

---

## Why This Works

1. **Reset hard**: Discards the problematic local commit
2. **Delete files**: Cleans up the untracked JSON files
3. **Pull from remote**: Gets the latest code + updated .gitignore
4. **.gitignore update**: Prevents this from happening again
5. **Restart containers**: Applies any new code from the pull

---

## If It Still Fails

If you still get errors, try:

```bash
# Force clean everything and check out remote version
git fetch origin
git reset --hard origin/main
git clean -fd  # Force delete untracked files

# Then verify
git status
```

---

## Files That Were Updated

✅ `.gitignore` - Now prevents tracking of:
- `*_export.json`
- `*_import.json`
- `*_merge*.json`
- `backend/users*.json`

This is now on GitHub and ready to pull on staging.
