# 🔴 Git Diverging Branches Issue - Root Cause & Fix

**Status:** Diverging branches on staging server  
**Date:** April 14, 2026  
**Issue:** Can't push/pull - branches have diverged

---

## What Happened (The Culprit)

### Timeline of Events

```
April 13-14 Local Machine:
  1. Created code fixes (getAssetPath)
  2. Committed locally (78f0700, 849648b, etc.)
  3. Pushed to GitHub: git push origin main
  4. GitHub now has: 7f0b893 (4 new commits)

April 14 Staging Server:
  1. git pull origin main (pulled new commits)
  2. BUT then made OWN local commits:
     - Renamed deploy scripts
     - Created commit: 304ec55
  3. Now has commits GitHub doesn't have!
  4. GitHub has commits staging doesn't have!
  
RESULT: Diverging Branches ❌
```

### The Git Diagram

```
GitHub (origin/main):
  9d5f230 → 7f0b893 (local's 4 commits pushed)
  
Staging Server (main):
  9d5f230 → 304ec55 (staging's 1 commit)
  
They diverged from 9d5f230 in different directions!
```

### Why It Fails

When staging tries to push:
```
git push origin main
↓
GitHub says: "You have commits I don't have (304ec55)"
GitHub says: "I have commits you don't have (7f0b893)"
GitHub says: "REJECTED - fetch first!"
```

When staging tries to pull:
```
git pull origin main
↓
Git sees: "You have divergent branches"
Git says: "I don't know how to merge them"
Git says: "Specify --rebase or --no-rebase or --ff-only"
```

---

## Why This Matters

The staging server's local commit (304ec55) is renaming old deploy scripts, which:
- Isn't important to keep
- Conflicts with the real fixes from local machine
- Blocks the pull of actual image fixes

The fix should be: **Discard staging's local changes and sync with GitHub**.

---

## The Solution

### Option 1: Clean Sync (RECOMMENDED - What We'll Do)

**This approach:**
- Discards staging server's local commit (renaming scripts)
- Syncs with clean GitHub commits
- Gets all the image fixes
- Avoids merge conflicts

```bash
# On staging server:
cd /var/www/html/kmsetjendpdri

# Reset to GitHub's version (discard local commit)
git fetch origin main
git reset --hard origin/main

# Verify we're clean
git status
# Should show: "nothing to commit, working tree clean"
```

### Option 2: Rebase (If You Want To Keep Staging's Commits)

Not recommended here because staging's local commit isn't useful anyway.

```bash
git pull --rebase origin main
```

### Option 3: Merge (More Complex)

Not recommended - unnecessary merging.

```bash
git pull --no-rebase origin main
```

---

## Why Option 1 is BEST

**Staging server's commit (renaming scripts):**
- ❌ Not needed
- ❌ Not pushed to GitHub
- ❌ Would cause merge conflicts
- ✅ Better to discard it

**Local machine's commits (image fixes):**
- ✅ Important fixes
- ✅ Already on GitHub
- ✅ Need these on staging
- ✅ Keep these!

**Best approach:** Use local machine's commits, discard staging's local commit.

---

## Step-by-Step Fix

### On Staging Server:

```bash
# 1. Navigate to project
cd /var/www/html/kmsetjendpdri

# 2. Fetch latest from GitHub
git fetch origin main

# 3. Reset to GitHub's version (discard local commit)
git reset --hard origin/main

# 4. Verify clean state
git status
# Output should be:
# On branch main
# Your branch is up to date with 'origin/main'.
# nothing to commit, working tree clean

# 5. Verify you have the right commits
git log --oneline -5
# Should show: 7f0b893 (docs: Add quick summary for image 404 fix deployment)

# 6. Now safe to proceed with deployment
```

---

## What Gets Discarded vs Kept

### Discarded (Staging Local Commit)
```
❌ 304ec55: remove old deploy script
   - deploy-docker.sh → deploy-docker.sh.old
   - deploy-final.sh → deploy-final.sh.old
   - deploy-staging.sh → deploy-staging.sh.old
   - deploy.sh → deploy.sh.old
```

**Why discard?** These are old files being renamed. Not critical. The .old versions are just backups.

### Kept (GitHub Commits)
```
✅ 7f0b893: docs: Add quick summary
✅ 3361265: docs: Add comprehensive staging deployment
✅ 27e89b7: docs: Add comprehensive staging deployment
✅ 849648b: fix: Add missing .env.staging
✅ 78f0700: fix: Fix repository image 404 errors (THE REAL FIX!)
```

**Why keep?** These contain:
- Image 404 fix (getAssetPath)
- .env.staging configuration
- All the documentation

---

## Why This Happened

### Root Cause Analysis

**On staging server:**
1. Executed: `git add .`
2. This staged the file deletions (deploy-*.sh)
3. Then: `git commit -m "remove old deploy script"`
4. Created commit 304ec55 locally
5. Meanwhile, GitHub was updated by local machine
6. Branches diverged!

### Prevention

**For future:**
1. Always check git status before making changes
2. Verify `git status` shows "Your branch is up to date"
3. Pull before making commits
4. Or: `git pull origin main` before `git add`

---

## After Fix: What's Next

Once you resolve the git conflict with:
```bash
git reset --hard origin/main
```

Then continue deployment:
```bash
# Apply staging environment
cp .env.staging .env

# Verify correct environment
grep VITE_APP_SUBPATH .env
# Should show: VITE_APP_SUBPATH=/kms

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d

# Test
docker-compose ps
```

---

## Verification

### After Running Reset

```bash
git status
# Should show:
# On branch main
# Your branch is up to date with 'origin/main'.
# nothing to commit, working tree clean

git log --oneline -3
# Should show latest commits from local machine
```

### Deploy Script Files

```bash
# Check what files exist now
ls -la deploy*.sh*
# Should show:
#   deploy-master.sh (new unified script)
#   deploy-master.ps1 (new unified script)
#   deploy-docker.sh.old (old backup)
#   deploy-final.sh.old (old backup)
#   deploy-staging.sh.old (old backup)
#   deploy.sh.old (old backup)
```

---

## Git Concepts

### What is "Diverging Branches"?

```
Common ancestor: 9d5f230
                   ↗ (staging goes this way) → 304ec55
                   ↖ (github goes this way) → 7f0b893

Git doesn't know how to reconcile them!
```

### What Does "reset --hard" Do?

```
BEFORE:
  Local (staging server): 304ec55 ← HEAD
  Remote (GitHub): 7f0b893
  
AFTER git reset --hard origin/main:
  Local (staging server): 7f0b893 ← HEAD (matches remote)
```

### Why "--hard"?

- `git reset` = move HEAD pointer
- `--hard` = also discard working directory changes
- Combined = completely sync with remote

---

## Summary

| Item | Details |
|------|---------|
| **Problem** | Diverging branches (staging has 304ec55, GitHub has 7f0b893) |
| **Root Cause** | Staging made local commits while GitHub was updated separately |
| **Impact** | Can't push/pull - git is confused |
| **Solution** | `git reset --hard origin/main` on staging server |
| **Result** | Staging syncs with GitHub, gets image fixes, ready to deploy |

---

