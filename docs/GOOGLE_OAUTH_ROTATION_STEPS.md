# 🔄 Google OAuth Credential Rotation - Step-by-Step Guide

**Status**: 90% Complete - Only Google OAuth rotation remaining  
**Time Required**: 5-10 minutes  
**Date**: January 20, 2026

---

## ✅ What's Already Done

- ✅ New Django SECRET_KEY generated: `[SAVED TO backend/.env]`
- ✅ Git repository secured with .gitignore
- ✅ Template files (.env.example) created

---

## 🟡 What You Need to Do: Rotate Google OAuth

### Current Exposed Credentials

```
Current Google Client ID:     403156786636-3e0nge5u9lotno64j10eo78jq5584kar.apps.googleusercontent.com
Current Google Client Secret: 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
```

These are exposed in this repository. You must rotate them.

---

## 📋 Step-by-Step: Rotate Google OAuth Credentials

### Step 1: Go to Google Cloud Console

1. Open browser and go to: https://console.cloud.google.com/
2. If prompted, sign in with your Google account

---

### Step 2: Navigate to OAuth 2.0 Credentials

1. In the left sidebar, click: **APIs & Services**
2. Click: **Credentials** (in the submenu)
3. You should see a list of your OAuth applications

**You're looking for**: The OAuth 2.0 Client ID with the exposed credentials

---

### Step 3: Delete Old Credentials (Keep Them Safe First)

1. Find the credential with ID: `403156786636-3e0nge5u9lotno64j10eo78jq5584kar.apps.googleusercontent.com`
2. Click the **trash/delete icon** next to it
3. Confirm deletion

**Note**: You're deleting the exposed credentials. This is correct and necessary for security.

---

### Step 4: Create New OAuth 2.0 Credentials

1. Click: **+ CREATE CREDENTIALS** (at top)
2. Select: **OAuth client ID** from dropdown
3. If prompted, configure OAuth consent screen first:
   - Choose: **External** app type
   - Fill in basic info: App name, user support email
   - Add scopes: `userinfo.profile`, `userinfo.email`
   - Save and return to credentials

4. For the OAuth client ID:
   - Application type: **Web application**
   - Name: `KMSetjen DPD RI`
   - Authorized redirect URIs: Add `http://localhost:3000/google/callback`
   - Click: **Create**

---

### Step 5: Copy Your New Credentials

A popup will appear with your new credentials:

```
Client ID:     [COPY THIS]
Client Secret: [COPY THIS]
```

**Save these values somewhere safe** - you'll need them in the next step.

---

### Step 6: Update Your .env Files

Now update the credentials in your local files:

#### Update: `backend/.env`

Find these lines:
```
GOOGLE_CLIENT_ID=403156786636-3e0nge5u9lotno64j10eo78jq5584kar.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

Replace with your NEW values from Google Console:
```
GOOGLE_CLIENT_ID=[YOUR_NEW_CLIENT_ID]
GOOGLE_CLIENT_SECRET=[YOUR_NEW_CLIENT_SECRET]
```

#### Update: `frontend/.env.local`

Find this line:
```
REACT_APP_GOOGLE_CLIENT_ID=403156786636-3e0nge5u9lotno64j10eo78jq5584kar.apps.googleusercontent.com
```

Replace with your new Client ID:
```
REACT_APP_GOOGLE_CLIENT_ID=[YOUR_NEW_CLIENT_ID]
```

---

### Step 7: Test Your New Credentials

Open two terminals:

**Terminal 1 - Backend:**
```bash
cd backend
python manage.py runserver
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

Then:
1. Open http://localhost:3000 in your browser
2. Try logging in with Google
3. Verify it works without errors
4. Check the browser console for any authentication errors

If you see login errors:
- Check that the Client ID matches exactly
- Verify redirect URI is exactly: `http://localhost:3000/google/callback`
- Restart both servers after updating .env files

---

## 🔒 Security Checklist

Before pushing to GitHub, verify:

- [ ] Old Google OAuth credentials deleted from Google Cloud Console
- [ ] New credentials generated and saved locally
- [ ] `backend/.env` updated with new Client ID and Secret
- [ ] `frontend/.env.local` updated with new Client ID
- [ ] Google login tested and working locally
- [ ] `backend/.env` and `frontend/.env.local` are NOT in git (verify: `git status`)
- [ ] No error messages in browser console during login

---

## ✨ After Credentials Are Rotated

Once you've verified everything works locally:

```bash
# Verify .env files are ignored
git status

# You should NOT see:
# - backend/.env
# - frontend/.env.local

# If they appear, check .gitignore files
```

---

## 📞 Verification Commands

Once you've made changes, run these to confirm:

```bash
# Check if .env files are properly ignored
git check-ignore -v backend/.env frontend/.env.local

# Expected output:
# backend/.gitignore:38:.env      backend/.env
# frontend/.gitignore:14:.env.local       frontend/.env.local
```

If .env files appear in `git status`, double-check your `.gitignore` files.

---

## 🚀 Next After Credentials Are Verified

Once Google OAuth is rotated and tested:

1. **Phase 3**: Organize code (create backend/scripts/, move test files)
2. **Phase 4**: Create documentation (README.md files)
3. **Phase 5**: Code cleanup (remove console.logs, comments)
4. **Phase 6**: Final review and first GitHub commit

---

## ❓ Common Issues

### "Google Login Not Working"
- ✅ Check: Redirect URI matches exactly `http://localhost:3000/google/callback`
- ✅ Check: Client ID in frontend matches backend
- ✅ Check: Restart backend and frontend servers
- ✅ Check: Clear browser cache

### "Invalid Client ID"
- ✅ Make sure you're using the NEW credentials, not the old ones
- ✅ Copy-paste carefully (no extra spaces)

### ".env file still appearing in git"
- ✅ Run: `git rm --cached backend/.env` and `git rm --cached frontend/.env.local`
- ✅ Verify `.gitignore` has the correct patterns

---

## 📌 Status After Rotation

Once you complete these steps, your repository will be:

✅ Secrets rotated  
✅ .env files protected by .gitignore  
✅ Credentials tested locally  
✅ Ready for Phase 3 (code organization)

---

**Time Estimate**: 5-10 minutes  
**Complexity**: Low (mostly copy-paste)  
**Critical**: YES (must complete before GitHub push)

**Let me know once you've rotated the credentials and I'll help with Phase 3! 🚀**
