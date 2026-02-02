# 🔐 Complete OAuth Configuration Guide - Fill in Google Cloud Console

**Date**: January 20, 2026  
**Project**: KMSetjen DPD RI Knowledge Management System  
**Status**: Ready for Google Cloud Console setup

---

## 📊 Project OAuth Configuration Summary

### Current Setup

```
Application Name: KMSetjen DPD RI
Backend: Django 4.2.8 (Python)
Frontend: React 18.2.0 (JavaScript)
OAuth Version: OAuth 2.0 (Code Flow)
Redirect URI: http://localhost:5175/google/callback
Scopes: profile email openid
```

### Where OAuth is Used

| Component | File | Usage |
|-----------|------|-------|
| **Backend** | `backend/apps/auth/views.py` | Handles Google callback and token exchange |
| **Backend** | `backend/config/settings.py` | Stores OAuth configuration |
| **Frontend** | `frontend/src/services/googleService.js` | Manages OAuth flow |
| **Frontend** | `frontend/src/pages/LoginPage.js` | Displays Google login button |
| **Frontend** | `frontend/src/pages/GoogleCallbackPage.js` | Processes callback |

---

## 🔑 Current OAuth Credentials (TO BE REPLACED)

### Exposed Credentials - DO NOT USE AFTER TODAY

```
GOOGLE_CLIENT_ID:
403156786636-3e0nge5u9lotno64j10eo78jq5584kar.apps.googleusercontent.com

GOOGLE_CLIENT_SECRET:
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

GOOGLE_REDIRECT_URI:
http://localhost:5175/google/callback
```

**Status**: 🔴 **EXPOSED** - Must be rotated immediately

---

## 📝 Step-by-Step: Create New OAuth Credentials in Google Cloud Console

### STEP 1: Go to Google Cloud Console

1. Open: **https://console.cloud.google.com/**
2. Sign in with your Google account
3. Select or create a Google Cloud Project
   - Project Name: `KMSetjen-DPD-RI` (or similar)

---

### STEP 2: Enable Google+ API

1. Click: **APIs & Services** (left sidebar)
2. Click: **+ ENABLE APIS AND SERVICES** (at top)
3. Search: `Google+ API` or `Google Identity`
4. Click: **Enable**

---

### STEP 3: Configure OAuth Consent Screen

1. Click: **APIs & Services** → **OAuth consent screen** (left sidebar)
2. Choose: **External** (for now - this is for development)
3. Fill in:
   - **App name**: `KMSetjen DPD RI`
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Click: **SAVE AND CONTINUE**

5. On "Scopes" page:
   - Click: **+ ADD OR REMOVE SCOPES**
   - Search and select: `userinfo.email` and `userinfo.profile`
   - Click: **UPDATE**
   - Click: **SAVE AND CONTINUE**

6. Click: **SAVE AND CONTINUE** (skip adding test users for now)

---

### STEP 4: Create OAuth 2.0 Credentials

1. Click: **APIs & Services** → **Credentials** (left sidebar)
2. Click: **+ CREATE CREDENTIALS** (at top)
3. Select: **OAuth client ID**
4. Application type: **Web application**
5. Fill in:

   ```
   Name: KMSetjen DPD RI (or any descriptive name)
   
   Authorized JavaScript origins:
   - http://localhost:5175
   - http://localhost:8002
   - http://127.0.0.1:5175
   - http://127.0.0.1:8002
   
   Authorized redirect URIs:
   - http://localhost:5175/google/callback
   - http://localhost:5175/auth/google/callback
   - http://127.0.0.1:5175/google/callback
   ```

   **CRITICAL**: The redirect URI must match EXACTLY what's in the code

6. Click: **CREATE**

---

### STEP 5: Copy Your New Credentials

A popup will show with:

```
Client ID: [COPY THIS - It will look like: xxxxxxxxxx-xxxx.apps.googleusercontent.com]
Client Secret: [COPY THIS - It will look like: GOCSP_xxxxxx]
```

**Save these immediately!**

---

## 📥 Where to Use Your New Credentials

### File 1: `backend/.env`

Update these lines:

```env
GOOGLE_CLIENT_ID=YOUR_NEW_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_NEW_CLIENT_SECRET_HERE
GOOGLE_REDIRECT_URI=http://localhost:5175/google/callback
```

**Example after update:**
```env
GOOGLE_CLIENT_ID=123456789-abcdefghijk.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSP_1a2b3c4d5e6f7g8h9i0j
GOOGLE_REDIRECT_URI=http://localhost:5175/google/callback
```

---

### File 2: `frontend/.env.local`

Update this line:

```env
REACT_APP_GOOGLE_CLIENT_ID=YOUR_NEW_CLIENT_ID_HERE
```

**Important**: Use the SAME Client ID as in `backend/.env`

**Example after update:**
```env
REACT_APP_GOOGLE_CLIENT_ID=123456789-abcdefghijk.apps.googleusercontent.com
```

---

## 🔄 OAuth Flow in This Application

### How It Works

```
┌─────────────┐
│  User      │
└──────┬──────┘
       │
       │ 1. Click "Login with Google"
       ▼
┌─────────────────────┐
│  LoginPage.js       │
│ (Frontend/React)    │
└──────┬──────────────┘
       │
       │ 2. Redirect to Google OAuth
       │ URL: https://accounts.google.com/o/oauth2/v2/auth?
       │       client_id=[NEW_CLIENT_ID]&
       │       redirect_uri=http://localhost:5175/google/callback&
       │       response_type=code&
       │       scope=profile+email+openid
       ▼
┌──────────────────────┐
│  Google Login Page   │
│ (Google's servers)   │
└──────┬───────────────┘
       │
       │ 3. User enters credentials
       │ 4. Google redirects to callback
       ▼
┌──────────────────────────────────────┐
│  GoogleCallbackPage.js                │
│  (Frontend/React)                     │
│  URL: http://localhost:5175/google/  │
│       callback?code=AUTH_CODE&        │
│       state=CSRF_TOKEN                │
└──────┬───────────────────────────────┘
       │
       │ 5. Extract auth code
       │ 6. Send to backend
       ▼
┌────────────────────────────────────────┐
│  Backend API: /api/auth/google/        │
│  callback/                             │
│ (Django REST Framework)                │
└──────┬─────────────────────────────────┘
       │
       │ 7. Backend exchanges code for token
       │ POST to: https://oauth2.googleapis.com/token
       │ with:
       │   - code
       │   - client_id
       │   - client_secret
       │   - redirect_uri
       ▼
┌──────────────────────┐
│  Google API          │
│ (Token Exchange)     │
└──────┬───────────────┘
       │
       │ 8. Return Google access token
       ▼
┌──────────────────────────────────────┐
│  Backend: Fetch User Info             │
│ GET https://www.googleapis.com/       │
│ oauth2/v2/userinfo                    │
│ Header: Authorization: Bearer TOKEN   │
└──────┬───────────────────────────────┘
       │
       │ 9. Get user info:
       │ - Email
       │ - First/Last Name
       │ - Profile Picture
       ▼
┌────────────────────────────────┐
│  Backend: Create/Update User    │
│ (In KMS Database)               │
└──────┬─────────────────────────┘
       │
       │ 10. Generate JWT tokens
       ▼
┌────────────────────────────────┐
│  Return to Frontend             │
│ Response: {                     │
│   access: JWT_TOKEN,            │
│   refresh: JWT_TOKEN,           │
│   user: {...}                   │
│ }                               │
└──────┬─────────────────────────┘
       │
       │ 11. Frontend stores tokens
       │ 12. Redirect to dashboard
       ▼
┌───────────────────┐
│  Dashboard        │
│ (Logged in!)      │
└───────────────────┘
```

---

## 🧪 Testing Your New Credentials

### After You Update the Files

**Terminal 1 - Backend:**
```bash
cd backend
python manage.py runserver
# Should start at http://localhost:8002
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
# Should start at http://localhost:5175
```

### Test Steps

1. Open: **http://localhost:5175**
2. Click: **"Login with Google"** button
3. You should be redirected to Google login
4. Enter your Google credentials
5. Authorize the app
6. You should be redirected back to the application
7. You should see the dashboard (logged in)

### If Login Fails

**Check These Things:**

1. **Verify Client ID is correct**
   ```bash
   cd backend
   grep GOOGLE_CLIENT_ID .env
   # Should show: GOOGLE_CLIENT_ID=123456789-abc...
   ```

2. **Verify Redirect URI matches exactly**
   - In Google Console: `http://localhost:5175/google/callback`
   - In code: Same as above
   - No trailing slashes, exact match

3. **Verify scopes are correct**
   - Google Console should have: `userinfo.email`, `userinfo.profile`

4. **Check browser console for errors**
   - Open: Browser DevTools (F12)
   - Click: **Console** tab
   - Look for error messages
   - Take a screenshot if needed

5. **Check backend logs**
   ```bash
   # Terminal where backend is running
   # Look for error messages
   ```

---

## 🔒 Security Configuration

### Authorized JavaScript Origins (In Google Console)

These are the domains where your frontend can call Google OAuth:

```
http://localhost:5175      (Local development)
http://127.0.0.1:5175      (Local development - alternate)
http://localhost:8002      (Backend - if needed)
```

**For Production Later:**
```
https://yourdomain.com
https://www.yourdomain.com
```

---

### Authorized Redirect URIs (In Google Console)

This is where Google sends the user after login:

```
http://localhost:5175/google/callback
http://127.0.0.1:5175/google/callback
```

**Note**: Must match EXACTLY (including protocol, domain, port, path)

---

## 📋 Credentials Summary Sheet

### What You'll Get from Google Console

| Item | Value | Where It Goes |
|------|-------|----------------|
| **Client ID** | `123456789-abcdefgh.apps.googleusercontent.com` | Both `backend/.env` and `frontend/.env.local` |
| **Client Secret** | `GOCSP_1a2b3c4d5e6f7g8h` | `backend/.env` ONLY |
| **Redirect URI** | `http://localhost:5175/google/callback` | Already configured in code |
| **Scopes** | `profile email openid` | Already configured in code |

---

## ✅ Verification Checklist

Before Testing:

- [ ] Google Cloud Console account created
- [ ] Google+ API enabled
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 credentials created
- [ ] Client ID copied to `backend/.env` (GOOGLE_CLIENT_ID)
- [ ] Client Secret copied to `backend/.env` (GOOGLE_CLIENT_SECRET)
- [ ] Client ID copied to `frontend/.env.local` (REACT_APP_GOOGLE_CLIENT_ID)
- [ ] Redirect URI verified: `http://localhost:5175/google/callback`
- [ ] JavaScript origins added to Google Console
- [ ] Backend server started (`python manage.py runserver`)
- [ ] Frontend server started (`npm start`)
- [ ] Google login tested and working

---

## 🆘 Common Issues & Solutions

### Issue: "Invalid Client ID"
**Solution**: 
- Copy the client ID exactly (no spaces)
- Make sure it matches between backend and frontend
- Restart both servers after updating

### Issue: "Redirect URI mismatch"
**Solution**:
- Check: Google Console registered URI exactly matches
- Common mistake: Trailing slash or different port number
- URL must be: `http://localhost:5175/google/callback` (exact)

### Issue: "Unauthorized Client"
**Solution**:
- Verify Client ID and Secret match in Google Console
- Make sure the credentials are for "Web application" type
- Check that JavaScript origins are authorized

### Issue: Login button not showing
**Solution**:
- Check: `REACT_APP_GOOGLE_CLIENT_ID` is in `frontend/.env.local`
- Check: It's not empty
- Restart frontend (`npm start`)

### Issue: "Scopes not granted"
**Solution**:
- Go to Google Console
- Check OAuth consent screen has `userinfo.email` and `userinfo.profile` scopes
- Re-authorize if needed

---

## 🚀 After Successful Login

Once Google login works:

1. **Commit to git** (credentials are protected by .gitignore):
   ```bash
   git add .
   git commit -m "feat: rotate Google OAuth credentials"
   ```

2. **Continue to Phase 3**: Organize code
   - Create `backend/scripts/` directory
   - Move test files
   - Organize documentation

3. **Continue to Phase 4**: Documentation
4. **Continue to Phase 5**: Code cleanup
5. **Continue to Phase 6**: GitHub push

---

## 📞 Quick Reference

### OAuth URLs in Code

**Frontend - Google Auth URL:**
```
https://accounts.google.com/o/oauth2/v2/auth?
  client_id=YOUR_CLIENT_ID&
  redirect_uri=http://localhost:5175/google/callback&
  response_type=code&
  scope=profile+email+openid&
  state=CSRF_STATE
```

**Backend - Token Exchange Endpoint:**
```
POST https://oauth2.googleapis.com/token
Content-Type: application/x-www-form-urlencoded

code=AUTH_CODE&
client_id=YOUR_CLIENT_ID&
client_secret=YOUR_CLIENT_SECRET&
redirect_uri=http://localhost:5175/google/callback&
grant_type=authorization_code
```

**Backend - User Info Endpoint:**
```
GET https://www.googleapis.com/oauth2/v2/userinfo
Authorization: Bearer ACCESS_TOKEN
```

---

## 📊 Project Files Already Configured

These files are already set up to work with OAuth - you don't need to modify them:

| File | Status | Notes |
|------|--------|-------|
| `backend/config/settings.py` | ✅ Ready | Reads from `.env` |
| `backend/apps/auth/views.py` | ✅ Ready | Has `google_callback` endpoint |
| `backend/apps/auth/urls.py` | ✅ Ready | Routes to callback |
| `frontend/src/services/googleService.js` | ✅ Ready | Handles OAuth flow |
| `frontend/src/pages/GoogleCallbackPage.js` | ✅ Ready | Processes callback |
| `frontend/src/pages/LoginPage.js` | ✅ Ready | Shows login button |
| `frontend/.env.example` | ✅ Ready | Template provided |
| `backend/.env.example` | ✅ Ready | Template provided |

**All you need to do**: Fill in the new credentials from Google Console

---

**Status**: 🟢 **READY FOR GOOGLE CLOUD CONSOLE SETUP**  
**Next Step**: Follow STEP 1 above to get started  
**Expected Time**: 10-15 minutes total  
**Difficulty**: 🟢 **EASY** (mostly copy-paste)

**Let me know once you've completed the Google Console steps and I'll help verify everything! 🚀**
