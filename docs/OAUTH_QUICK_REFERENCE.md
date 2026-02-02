# 🎯 OAuth Configuration - Quick Reference Card

**Print this or keep it handy while filling in Google Cloud Console**

---

## Step-by-Step Quick Summary

### 1️⃣ Go to Google Cloud Console
```
URL: https://console.cloud.google.com/
```

### 2️⃣ Create/Select Project
```
Project Name: KMSetjen-DPD-RI
```

### 3️⃣ Enable Google+ API
```
Search: "Google+ API" or "Google Identity"
Action: Click "Enable"
```

### 4️⃣ Configure OAuth Consent Screen
```
Type: External
App Name: KMSetjen DPD RI
Email: Your email
Scopes: userinfo.email, userinfo.profile
```

### 5️⃣ Create OAuth Credentials
```
Type: Web application
Name: KMSetjen DPD RI

JavaScript Origins:
- http://localhost:5175
- http://localhost:8002
- http://127.0.0.1:5175
- http://127.0.0.1:8002

Redirect URIs:
- http://localhost:5175/google/callback
- http://127.0.0.1:5175/google/callback
```

### 6️⃣ Copy Credentials

When Google shows you the new credentials:

```
Client ID:     [COPY ME]
Client Secret: [COPY ME]
```

---

## 📍 Where to Paste

### Location 1: `backend/.env`

```env
GOOGLE_CLIENT_ID=[PASTE CLIENT ID]
GOOGLE_CLIENT_SECRET=[PASTE CLIENT SECRET]
```

**File Path**: `d:\Project\KMSetjen DPD RI\backend\.env`

---

### Location 2: `frontend/.env.local`

```env
REACT_APP_GOOGLE_CLIENT_ID=[PASTE CLIENT ID ONLY]
```

**Note**: Use the SAME Client ID (no secret here)

**File Path**: `d:\Project\KMSetjen DPD RI\frontend\.env.local`

---

## 🧪 Test It

### Terminal 1 - Backend
```bash
cd backend
python manage.py runserver
```

### Terminal 2 - Frontend
```bash
cd frontend
npm start
```

### Browser
```
1. Go to: http://localhost:5175
2. Click: "Login with Google"
3. Verify: Login works!
```

---

## ✅ Success Indicators

- ✅ Google login button appears on login page
- ✅ Clicking it redirects to Google login
- ✅ After login, you're logged into the app
- ✅ No errors in browser console (F12)
- ✅ No errors in backend terminal

---

## 🔴 Common Mistakes

| Mistake | Fix |
|---------|-----|
| Redirect URI doesn't match | Use EXACTLY: `http://localhost:5175/google/callback` |
| Secret pasted in frontend | Frontend only gets Client ID, not Secret |
| Client ID not matching | Must be same in both backend and frontend |
| Scopes missing | Add `userinfo.email` and `userinfo.profile` in consent screen |
| JavaScript origins not added | Add all localhost URLs to Google Console |

---

## 📊 Current Credentials Being Replaced

```
❌ OLD Client ID:     403156786636-3e0nge5u9lotno64j10eo78jq5584kar.apps.googleusercontent.com
❌ OLD Client Secret: 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

✅ NEW Client ID:     [You'll get this from Google]
✅ NEW Client Secret: [You'll get this from Google]
```

---

## 📞 Files Already Ready

These are already configured - just need credentials:

```
✅ backend/config/settings.py          (reads from .env)
✅ backend/apps/auth/views.py          (has callback endpoint)
✅ frontend/src/services/googleService.js    (handles flow)
✅ frontend/src/pages/LoginPage.js     (shows login button)
```

---

## 🚀 Total Time: 10-15 minutes

1. Google Cloud Console: 5 min
2. Copy credentials: 1 min
3. Paste in files: 2 min
4. Test: 5 min

**Then proceed to Phase 3! 🎉**

---

**Detailed guide**: See [OAUTH_CONFIG_COMPLETE_GUIDE.md](OAUTH_CONFIG_COMPLETE_GUIDE.md)
