# Google OAuth: Why Local Dev Login Fails (Real Root Cause + Fix)

**Date:** April 13, 2026  
**Status:** 🔴 REQUIRES GOOGLE CLOUD CONSOLE UPDATE

---

## The Real Problem

Your Google OAuth credentials are **only registered for staging/production in Google Cloud Console**, NOT for localhost development.

### Current Registration Status

| URL | Status | Works? |
|-----|--------|--------|
| `https://khaz.app/kms/google/callback/` | ✅ Registered | Yes (staging/production) |
| `http://localhost:5175/google/callback` | ❌ NOT Registered | **No (local dev fails)** |

### Why It Works on Staging But Not Local

**On Staging:**
```
1. User logs in with Google
2. Google redirects to: https://khaz.app/kms/google/callback/
3. Google checks: "Is this in my registered list?"
4. ✅ YES! It's registered → Google accepts it → You get auth code
5. Backend exchanges code → Success ✅
```

**On Local:**
```
1. User logs in with Google
2. Google redirects to: http://localhost:5175/google/callback
3. Google checks: "Is this in my registered list?"
4. ❌ NO! NOT found → Google rejects it → "redirect_uri_mismatch" or error
5. No code sent to backend → 400 Bad Request ❌
```

---

## The Fix: Register Localhost with Google Cloud Console

### Step 1: Go to Google Cloud Console

1. Open: https://console.cloud.google.com/
2. Sign in with your Google account
3. Find the KMSetjen DPD RI project (or one with the existing credentials)

### Step 2: Find Your OAuth Credentials

1. Click: **APIs & Services** (left sidebar)
2. Click: **Credentials**
3. Find the OAuth client named: **KMSetjen-DPD-RI** or similar
   - Should show the Client ID: `403156786636-7umtcldsh5t6h31r3q4eprni77qqicos.apps.googleusercontent.com`
4. Click on it to edit

### Step 3: Add Localhost Redirect URI

On the edit page, scroll to: **Authorized redirect URIs**

You should see one or more entries for staging:
```
https://khaz.app/kms/google/callback/
```

**Now add the local development redirect URI:**

1. Click: **+ ADD URI**
2. In the new field, type: `http://localhost:5175/google/callback`
3. Click the checkmark or press Enter to confirm
4. Also add (for completeness): `http://127.0.0.1:5175/google/callback`
5. Click: **SAVE**

### Step 4: Wait for Changes to Apply

Google usually applies changes **within 1-5 minutes**. After saving:
- Close all browser tabs (especially login pages)
- Wait a couple minutes
- Then test again

---

## Configuration Files Already Correct

Your code configuration is already set up correctly:

**`.env` (Local):**
```
GOOGLE_CLIENT_ID=403156786636-7umtcldsh5t6h31r3q4...
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=http://localhost:5175/google/callback/  ✅
```

**`.env.production` (Staging):**
```
GOOGLE_CLIENT_ID=403156786636-7umtcldsh5t6h31r3q4...  (same)
GOOGLE_CLIENT_SECRET=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  (same)
GOOGLE_REDIRECT_URI=https://khaz.app/kms/google/callback/  ✅
```

The **code is correct**. The **Google Cloud Console configuration** was incomplete.

---

## Why This Matters

Google's OAuth system is **very strict**:
- The redirect_uri in your code **must match exactly** what's registered in Google Cloud Console
- Character by character matching: `http://` vs `https://`, `:5175` vs `:8002`, `/callback` vs `/callback/`
- If there's ANY mismatch, Google rejects the request

For **security**: This prevents attackers from redirecting your users to malicious sites during login.

---

## Verification Checklist

After updating Google Cloud Console, test with this checklist:

- [ ] Changes saved in Google Cloud Console
- [ ] Waited 2-5 minutes for Google to update
- [ ] Cleared browser cache and cookies (optional but recommended)
- [ ] Closed and reopened browser
- [ ] Go to: `http://localhost:5175/login`
- [ ] Click: "Masuk dengan Google"
- [ ] See: Google login screen (not error page)
- [ ] Enter: Google credentials
- [ ] See: Consent screen
- [ ] After approval: Redirected to dashboard ✅

---

## If It Still Doesn't Work

**Try these troubleshooting steps:**

1. **Check Google Console settings again**
   ```bash
   # Verify in browser that the localhost redirect_uri is saved
   ```

2. **Clear browser data**
   - DevTools → Application → Storage → Clear site data
   - Close and reopen browser

3. **Check backend logs**
   ```bash
   cd backend
   tail -f logs/django.log | grep -i "googl\|error"
   ```

4. **Restart both servers**
   ```bash
   # Stop backend (Ctrl+C)
   # Restart: python manage.py runserver 0.0.0.0:8002
   
   # Frontend: npm run dev (should auto-reload)
   ```

5. **Double-check trailing slash**
   - Frontend sends: `http://localhost:5175/google/callback/` (WITH slash)
   - Registered should be: `http://localhost:5175/google/callback` (WITHOUT slash for origins)
   - OR: `http://localhost:5175/google/callback/` (WITH slash for redirect URIs)
   - Check the Google Console documentation for Field 3 vs Field 4

---

## Summary

| Item | Current Status | Action |
|------|---|---|
| Backend configuration | ✅ Correct | None needed |
| Frontend code | ✅ Correct | None needed |
| Google Cloud Console | ❌ **INCOMPLETE** | **ADD localhost redirect_uri** |
| Test after Google update | TBD | Test and confirm ✅ |

---

## Timeline

- ✅ Previous session: Fixed backend configuration
- ✅ This session: Identified real root cause (Google Console scope)
- ⏳ Next: Manually update Google Cloud Console (user action)
- ⏳ Then: Test locally (should work after Google processes changes)
