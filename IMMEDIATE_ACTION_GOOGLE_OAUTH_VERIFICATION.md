# Google OAuth Testing Checklist - IMMEDIATE ACTION NEEDED

## Your Role: Verify Google Cloud Console Setup

I've fixed the code to send the `redirect_uri` parameter, but the OAuth still fails with `invalid_grant`. This indicates a mismatch between what we're sending and what Google has registered.

**Please follow these steps NOW:**

### Step 1: Open Google Cloud Console
```
https://console.cloud.google.com/
```

### Step 2: Find Your OAuth App
1. Click on the project dropdown (top left)
2. Select the correct project
3. Go to **APIs & Services** → **Credentials**
4. Look for OAuth 2.0 Client ID with ID: `403156786636-7umtcldsh5t6h31r3q4eprni77qqicos`

### Step 3: Check Authorized Redirect URIs
1. Click on the OAuth app to edit it
2. Scroll down to **Authorized redirect URIs**
3. **TAKE A SCREENSHOT** and send it to me

### What Should Be There
Should have at least:
```
http://localhost:5175/google/callback
```

### What Might Be Wrong
Common mistakes:
- ❌ `http://localhost:5175/callback/google` (wrong path order)
- ❌ `http://localhost:5175/google/callback/` (trailing slash)
- ❌ `https://localhost:5175/google/callback` (https instead of http)
- ❌ `http://localhost:8002/google/callback` (backend port instead of frontend port)
- ❌ Only has a different redirect URI registered

### If the URI is Missing or Wrong
1. Add or correct it to: `http://localhost:5175/google/callback`
2. Click **Save**
3. Wait 30 seconds for changes to propagate
4. Close this browser tab completely
5. Clear browser cache: Ctrl+Shift+Del
6. Go back to http://localhost:5175
7. Try logging in again

### If the URI is Correct
If the URI is already correct and you still get the error, the problem is likely:
1. The authorization code expired (you waited too long between authorization and token exchange)
2. You refreshed the browser before it completed
3. The code was already used

**In this case:**
1. Clear localStorage completely
2. Start fresh Google login flow
3. Complete authorization **immediately without waiting**

## What I Fixed in the Code

✅ **api.js** - Now sends `redirect_uri` parameter  
✅ **googleService.js** - Now passes `redirect_uri` to API  
✅ **backend logging** - Added debug output to see what values are received  

The frontend is now correctly sending:
```json
{
  "code": "...",
  "state": "...",
  "redirect_uri": "http://localhost:5175/google/callback"
}
```

## Backend Log Monitoring

I've restarted the backend with new logging. When you test:

1. Open backend terminal (where python is running)
2. Look for lines like:
   ```
   [GoogleCallback] Request received:
   [GoogleCallback] - redirect_uri from frontend: http://localhost:5175/google/callback
   ```

3. Then look for:
   ```
   [GoogleCallback] Exchanging code with parameters:
   [GoogleCallback] - redirect_uri: http://localhost:5175/google/callback
   ```

4. Share ALL the logs with me (copy everything from when you start the login until you see the error)

## Frontendtests

Clear browser storage first:
```javascript
// In browser DevTools console:
localStorage.clear()
sessionStorage.clear()
location.reload()
```

Then test the flow and check console for:
```
[GoogleService] Calling googleCallback with:
[GoogleService] - redirectUri: http://localhost:5175/google/callback
```

## Action Items for You

1. ⬜ Check Google Cloud Console for registered redirect URIs
2. ⬜ Verify it matches `http://localhost:5175/google/callback` exactly
3. ⬜ If wrong/missing, add/correct it and save
4. ⬜ Test fresh OAuth flow
5. ⬜ Share backend logs when testing

**Please respond with:**
- Screenshot of Google Cloud Console showing registered URIs
- Backend console output when you attempt login
- Whether the error changed or persists
