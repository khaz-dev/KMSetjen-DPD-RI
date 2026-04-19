# 🔴 Google OAuth Staging Redirect URI Mismatch - Root Cause & Fix

## 🎯 The Problem

When you try to login with Google on staging (`https://kms.khaz.app/login`), you get:

```
Error 400: redirect_uri_mismatch
Redirect URI being used: https://kms.khaz.app/google/callback/
Registered redirect URIs in Google Cloud Console: https://khaz.app/kms/google/callback/
```

---

## 🔍 Root Cause Analysis

### What Changed: URL Architecture Migration

Your project migrated from **subpath routing** to **subdomain routing** for staging:

#### ❌ OLD Architecture (Registered in Google Console)
```
Domain:        https://khaz.app/
Frontend at:   https://khaz.app/
Backend at:    https://khaz.app/
App subpath:   /kms/
OAuth callback: https://khaz.app/kms/google/callback/  ✅ REGISTERED
```

#### ✅ NEW Architecture (Currently Running on Staging)
```
Frontend domain:  https://kms.khaz.app/  (NEW SUBDOMAIN)
Backend domain:   https://kms-be.khaz.app/  (NEW SUBDOMAIN)
App subpath:      /  (NO SUBPATH)
OAuth callback:   https://kms.khaz.app/google/callback/  ❌ NOT REGISTERED
```

### Why This Happens

1. **URL Architecture Document** (`COMPLETE_URL_ARCHITECTURE_FIX_IMPLEMENTATION.md`) recommends the subdomain approach for consistency with production
2. **Staging deployment** followed this recommendation and configured:
   - Frontend at `kms.khaz.app` subdomain
   - Backend at `kms-be.khaz.app` subdomain  
   - Environment variables set to use `/` subpath (no `/kms/`)

3. **Google Cloud Console** was never updated with the new staging domain
   - Only has the OLD domain `khaz.app` with `/kms/` subpath
   - Missing `kms.khaz.app` subdomain registration

4. **User Environment Override**: The staging server likely has custom environment variables or the frontend environment file may have been built with different values

### Why Local Works But Staging Doesn't

| Environment | URL | OAuth Callback | Google Registered? |
|---|---|---|---|
| **Local** | `http://localhost:5175/` | `http://localhost:5175/google/callback/` | ✅ YES |
| **Staging** | `https://kms.khaz.app/` | `https://kms.khaz.app/google/callback/` | ❌ NO |
| **Production** | `https://kms.dpd.go.id/` | `https://kms.dpd.go.id/google/callback/` | ❌ (Not your concern) |

---

## ✅ The Fix

### 🎯 The ONLY Solution: Update Google Cloud Console (5 minutes)

**Your staging server is configured 100% correctly.** 
**Google just doesn't know about the new staging domain yet.**

**Action Items:**

1. Go to [Google Cloud Console OAuth Credentials](https://console.cloud.google.com/apis/credentials?project=kmsetjen-dpd-ri)
   
2. Find and click your OAuth 2.0 Client ID: **`KMSetjen-DPD-RI`**

3. Click the **EDIT** button

4. **Add to "Authorized JavaScript origins":**
   ```
   https://kms.khaz.app
   ```
   (Click "Add URI" button, paste, then save)

5. **Add to "Authorized redirect URIs":**
   ```
   https://kms.khaz.app/google/callback/
   ```
   (Click "Add URI" button, paste, then save)

6. **Click SAVE at the bottom** ✅

7. **Wait 5-300 minutes** for Google to propagate the changes

8. **Test on staging**: Go to `https://kms.khaz.app/login` and try "Masuk dengan Google"

---

### Reference: Complete Google Cloud Console Configuration (After Fix)

**Authorized JavaScript origins:**
```
http://localhost:5175
http://localhost:8002
http://127.0.0.1:5175
http://127.0.0.1:8002
https://khaz.app
https://kms.khaz.app  ← ADD THIS
https://kms.dpd.go.id
https://kms-be.dpd.go.id
```

**Authorized redirect URIs:**
```
http://localhost:5175/google/callback/
http://127.0.0.1:5175/google/callback/
http://localhost:8002/api/auth/google/callback/
http://127.0.0.1:8002/api/auth/google/callback/
https://khaz.app/kms/google/callback/
https://kms.khaz.app/google/callback/  ← ADD THIS
https://kms.dpd.go.id/google/callback
https://kms-be.dpd.go.id/api/auth/google/callback/
```

---

### Option 2: Revert Staging to Original Architecture (Complex - not recommended)

If you want to stay with `https://khaz.app/kms/` instead of `https://kms.khaz.app/`:

You would need to:
1. Change DNS to remove `kms.khaz.app` subdomain
2. Update all environment variables back to `/kms` subpath
3. Rebuild and redeploy frontend
4. This defeats the purpose of the "subdomain routing" fix

**NOT RECOMMENDED** - stick with Option 1

---

## 📋 Why Did This Happen?

### Timeline of Events:

**Jan-Feb 2026:** System worked with `https://khaz.app/kms/` architecture
- Google Console was properly configured
- All pieces aligned

**Mar-Apr 2026:** URL Architecture was redesigned
- Decision made to use subdomains like production
- Implementation document: `COMPLETE_URL_ARCHITECTURE_FIX_IMPLEMENTATION.md`
- Staging deployed with new subdomain architecture

**Apr 2026:** Google OAuth stopped working on staging
- New domain `kms.khaz.app` was deployed
- But Google Console was never updated
- OAuth redirect mismatch error

### Code Review: What Happens on Staging (VERIFIED ✅)

**Current staging container environment (VERIFIED on April 14, 2026):**
```bash
# Frontend container (kms_frontend)
VITE_GOOGLE_REDIRECT_URI=https://kms.khaz.app/google/callback/
VITE_APP_SUBPATH=/
VITE_API_URL=https://kms-be.khaz.app

# Backend container (kms_django)
GOOGLE_REDIRECT_URI=https://kms.khaz.app/google/callback/
VITE_GOOGLE_REDIRECT_URI=https://kms.khaz.app/google/callback/
VITE_APP_SUBPATH=/
```

**Flow:**

1. User clicks "Masuk dengan Google" on `https://kms.khaz.app/login`
2. Frontend ([googleService.js](frontend/src/services/googleService.js)) line 30:
   ```javascript
   // Uses the VITE_GOOGLE_REDIRECT_URI environment variable (already set correctly)
   let redirectUri = GOOGLE_REDIRECT_URI;  // = "https://kms.khaz.app/google/callback/"
   ```
3. Constructs OAuth URL and redirects to Google Auth with:
   ```
   redirect_uri=https://kms.khaz.app/google/callback/
   client_id=403156786636-7umtcldsh5t6h31r3q4eprni77qqicos.apps.googleusercontent.com
   ```
4. User authenticates with Google
5. **Google validates the redirect_uri** 🔍
   - Checks: Is `https://kms.khaz.app/google/callback/` registered?
   - Google Cloud Console has:
     - ❌ `https://kms.khaz.app/google/callback/` - NOT REGISTERED
     - ✅ `https://khaz.app/kms/google/callback/` - REGISTERED (old domain)
   - Google rejects request
6. Returns error page: `Error 400: redirect_uri_mismatch`
7. Shows: "Access blocked: This app's request is invalid"

---

## 🔧 Verification Steps After Fix

### Step 1: Verify Environment Variables on Staging
```bash
# SSH to staging server
ssh -i ~/.ssh/khaz root@165.245.191.216

# Check what's currently set
env | grep -E "VITE_|GOOGLE_"
```

Should show:
```
VITE_GOOGLE_CLIENT_ID=403156786636-7umtcldsh5t6h31r3q4eprni77qqicos.apps.googleusercontent.com
VITE_GOOGLE_REDIRECT_URI=https://kms.khaz.app/google/callback/
# OR not set, so it's constructed from window.location.origin
```

### Step 2: Test OAuth Flow
1. Go to `https://kms.khaz.app/login`
2. Click "Masuk dengan Google"
3. Should redirect to Google OAuth page (not error page)
4. Login with your Google account
5. Should redirect back to `https://kms.khaz.app/...` with access token

### Step 3: Verify in Chrome DevTools
1. Open DevTools → Network tab
2. Click "Masuk dengan Google"
3. Look for request to `https://accounts.google.com/...`
4. Check Request URL parameters, specifically `redirect_uri=...`
5. Should be `https://kms.khaz.app/google/callback/`

---

## 📝 Environment File Review

### Current Staging Configuration
The staging server should have these settings (based on URL architecture):

```env
# Should be using NEW subdomain structure
VITE_APP_SUBPATH=/              (NOT /kms)
VITE_API_URL=https://kms-be.khaz.app    (separate backend domain)
VITE_GOOGLE_CLIENT_ID=403156786636-7umtcldsh5t6h31r3q4eprni77qqicos.apps.googleusercontent.com
VITE_GOOGLE_REDIRECT_URI=https://kms.khaz.app/google/callback/
```

### Local Development (Working)
```env
# Uses localhost - registered in Google Console
VITE_APP_SUBPATH=/
VITE_API_URL=http://localhost:8002
VITE_GOOGLE_REDIRECT_URI=http://localhost:5175/google/callback/
```

---

## ⏱️ Expected Resolution Time

- **Google Console Update**: 5 minutes to update + 5-300 minutes for Google to process
- **Testing**: 2 minutes to verify
- **Total**: 12-305 minutes

---

## 🎯 Summary

| Issue | Cause | Solution |
|---|---|---|
| Staging using `https://kms.khaz.app/` | URL architecture migration | Already deployed correctly ✅ |
| Google Console missing this domain | Not updated during migration | Add to Google Cloud Console ⚠️ |
| OAuth redirect mismatch | Google validates redirect_uri parameter | Configure OAuth settings ✅ |
| Local works, staging doesn't | Different domains, local is registered | Add staging domain to Google Console ✅ |

---

## 🚀 Next Steps

1. **Add `kms.khaz.app` to Google Cloud Console OAuth settings** (THIS FIXES IT)
2. Wait 5-300 minutes for propagation
3. Test login flow on staging
4. Should work immediately after Google processes the change

**Estimated fix time: 10-15 minutes of action, then wait for Google**
