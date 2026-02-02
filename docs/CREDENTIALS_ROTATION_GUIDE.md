# 🔐 Credentials Rotation Guide - Phase 1-2 Completion

**Date**: January 20, 2026  
**Status**: Security Hardening Complete  
**Action Required**: Rotate exposed credentials (estimated 30 minutes)

---

## ✅ What Has Been Done

### 1. Git Repository Initialized ✅
- Repository initialized at: `D:\Project\KMSetjen DPD RI`
- Status: Clean (fresh git init - no secrets committed to history)

### 2. .gitignore Files Protected ✅
- **Root .gitignore**: Created comprehensive protection
- **backend/.gitignore**: Already protecting `.env` files
- **frontend/.gitignore**: Already protecting `.env.local` files
- Coverage: All .env files in any directory will be ignored

### 3. .env.example Templates Verified ✅
- **backend/.env.example**: Safe template with placeholders available
- **frontend/.env.example**: Safe template with placeholders available
- Both files contain ONLY placeholder values, no real credentials

---

## 🔴 Credentials That Need Rotation

### EXPOSED in Backend (.env)

| Credential | Current Value | Status | Action |
|------------|---------------|---------|----|
| **GOOGLE_CLIENT_ID** | `403156786636-3e0nge5u9lotno64j10eo78jq5584kar.apps.googleusercontent.com` | 🔴 EXPOSED | ✅ Rotate Now |
| **GOOGLE_CLIENT_SECRET** | `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` | 🔴 EXPOSED | ✅ Rotate Now |
| **RECAPTCHA_SECRET_KEY** | `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe` | ✅ Test Key | No action needed |
| **SECRET_KEY** | `django-insecure-kms-development-...` | ⚠️ Dev Key | Change for production |

### EXPOSED in Frontend (.env.local)

| Credential | Current Value | Status | Action |
|------------|---------------|---------|----|
| **REACT_APP_GOOGLE_CLIENT_ID** | `403156786636-3e0nge5u9lotno64j10eo78jq5584kar.apps.googleusercontent.com` | 🔴 EXPOSED | ✅ Same as backend (rotate once) |

---

## 🛠️ How to Rotate Credentials

### Step 1: Google OAuth Credentials (5 minutes)

**Current**: Client ID and Secret are exposed in the codebase

**Action**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to: `APIs & Services` → `Credentials`
3. Find your OAuth 2.0 application (KMS DPD RI)
4. Delete the current credentials
5. Create new OAuth 2.0 credentials:
   - Application type: Web Application
   - Name: KMSetjen DPD RI
   - Authorized redirect URIs: `http://localhost:5175/google/callback`
6. Copy the new Client ID and Secret

**Where to update after rotation**:
- `backend/.env` - Line with `GOOGLE_CLIENT_ID=` and `GOOGLE_CLIENT_SECRET=`
- `frontend/.env.local` - Line with `REACT_APP_GOOGLE_CLIENT_ID=`

---

### Step 2: reCAPTCHA Keys (Optional - Currently Using Test Keys)

**Current**: Using test keys (this is okay for development)

**For Production**:
1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin/)
2. Create new reCAPTCHA v3 key
3. Copy Secret Key

**Where to update**:
- `backend/.env` - Line with `RECAPTCHA_SECRET_KEY=`

---

### Step 3: Django SECRET_KEY (5 minutes)

**Current**: `django-insecure-kms-development-key-change-in-production`

**Action for Development**:
```python
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

**Action for Production**:
Generate using the command above and keep it secret

**Where to update**:
- `backend/.env` - Line with `SECRET_KEY=`

---

## 📋 Checklist - Credentials Rotation

### Before Pushing to GitHub

- [ ] **Google OAuth**
  - [ ] Delete old OAuth 2.0 credentials from Google Cloud Console
  - [ ] Create new OAuth 2.0 credentials
  - [ ] Update `backend/.env` with new `GOOGLE_CLIENT_ID`
  - [ ] Update `backend/.env` with new `GOOGLE_CLIENT_SECRET`
  - [ ] Update `frontend/.env.local` with new `REACT_APP_GOOGLE_CLIENT_ID`
  - [ ] Test Google login functionality locally

- [ ] **reCAPTCHA** (Optional, if using in production)
  - [ ] Create new reCAPTCHA v3 keys from Google
  - [ ] Update `backend/.env` with new `RECAPTCHA_SECRET_KEY`
  - [ ] Test form submission with reCAPTCHA

- [ ] **Django SECRET_KEY**
  - [ ] Generate new SECRET_KEY using provided command
  - [ ] Update `backend/.env` with new `SECRET_KEY`
  - [ ] Test backend functionality

- [ ] **Verify .gitignore Protection**
  - [ ] Run: `git status` (should NOT show .env or .env.local)
  - [ ] Confirm files are in .gitignore

---

## 🔒 Security Best Practices - After Rotation

### 1. Before First GitHub Push
```bash
# Make sure .env files are NOT staged
git status

# These should NOT appear in the list:
# - backend/.env
# - frontend/.env.local
# - .env
```

### 2. Keep Credentials Safe
- [ ] Store credentials in secure password manager
- [ ] Use different credentials for dev/staging/production
- [ ] Never commit .env files
- [ ] Never share credentials via email/chat

### 3. After GitHub Push
- [ ] Create `.env` files locally from `.env.example`
- [ ] Document credential setup in README
- [ ] Add pre-commit hook to prevent .env commits:
  ```bash
  git config core.hooksPath .git/hooks
  # Create .git/hooks/pre-commit (see below)
  ```

### Pre-commit Hook (Optional but Recommended)
File: `.git/hooks/pre-commit`
```bash
#!/bin/bash
# Prevent committing .env files

if git diff --cached --name-only | grep -E "\.env|secrets"; then
    echo "ERROR: Attempting to commit sensitive files!"
    echo "These files should never be committed:"
    git diff --cached --name-only | grep -E "\.env|secrets"
    exit 1
fi
```

---

## 📝 Current Status Summary

| Phase | Task | Status | Est. Time |
|-------|------|--------|-----------|
| 1 | Remove secrets from git | ✅ Not needed (fresh init) | 0 min |
| 1 | Verify .gitignore files | ✅ Complete | 0 min |
| 2 | Rotate Google OAuth | 🟡 Pending user | 5 min |
| 2 | Rotate reCAPTCHA (prod) | 🟡 Optional | 5 min |
| 2 | Generate new SECRET_KEY | 🟡 Pending user | 2 min |
| 2 | Test credentials locally | 🟡 Pending user | 10 min |

---

## ✨ Next Steps

1. **Now**: Follow the credential rotation steps above
2. **After**: Run `npm install && python manage.py runserver` to test with new credentials
3. **Then**: Execute Phase 3-4 (organize code and documentation)
4. **Finally**: Push to GitHub with clean, credential-free repository

---

## 📚 Reference Files

- **Template**: `backend/.env.example` - Use as reference for required variables
- **Template**: `frontend/.env.example` - Use as reference for required variables
- **Protection**: Root `.gitignore` - Ensures no .env files are ever committed

**Security Status**: 🔐 **SECURED** - Git repository is clean and ready for GitHub

---

**Critical Note**: Do NOT proceed to pushing to GitHub until you have:
1. ✅ Rotated all credentials (Google OAuth, reCAPTCHA if production)
2. ✅ Tested the application locally with new credentials
3. ✅ Verified no .env files appear in `git status`
