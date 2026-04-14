# Google Cloud Console OAuth Configuration - Before & After

## 📸 BEFORE (Current - Causes Error)

### Authorized JavaScript origins
```
✅ http://localhost:5175
✅ http://localhost:8002
✅ http://127.0.0.1:5175
✅ http://127.0.0.1:8002
✅ https://kms.dpd.go.id
✅ https://kms-be.dpd.go.id
✅ https://khaz.app
❌ https://kms.khaz.app  ← MISSING!
```

### Authorized redirect URIs
```
✅ http://localhost:5175/google/callback/
✅ http://127.0.0.1:5175/google/callback/
✅ http://localhost:8002/api/auth/google/callback/
✅ http://127.0.0.1:8002/api/auth/google/callback/
✅ https://kms.dpd.go.id/google/callback
✅ https://kms-be.dpd.go.id/api/auth/google/callback/
✅ https://khaz.app/kms/google/callback/
❌ https://kms.khaz.app/google/callback/  ← MISSING!
```

**Result when user tries to login on staging:**
```
Error 400: redirect_uri_mismatch
Your app sent an invalid request...
Redirect URI: https://kms.khaz.app/google/callback/
```

---

## ✅ AFTER (Fixed - OAuth Works)

### Authorized JavaScript origins
```
✅ http://localhost:5175
✅ http://localhost:8002
✅ http://127.0.0.1:5175
✅ http://127.0.0.1:8002
✅ https://kms.dpd.go.id
✅ https://kms-be.dpd.go.id
✅ https://khaz.app
✅ https://kms.khaz.app  ← ADDED!
```

### Authorized redirect URIs
```
✅ http://localhost:5175/google/callback/
✅ http://127.0.0.1:5175/google/callback/
✅ http://localhost:8002/api/auth/google/callback/
✅ http://127.0.0.1:8002/api/auth/google/callback/
✅ https://kms.dpd.go.id/google/callback
✅ https://kms-be.dpd.go.id/api/auth/google/callback/
✅ https://khaz.app/kms/google/callback/
✅ https://kms.khaz.app/google/callback/  ← ADDED!
```

**Result when user tries to login on staging:**
```
✅ Successfully redirects to Google OAuth login
✅ User authenticates
✅ Successfully redirects back to https://kms.khaz.app/...
```

---

## 🎯 What to Add

**Copy-paste exactly these 2 lines into Google Cloud Console:**

### Line 1 - JavaScript Origin
```
https://kms.khaz.app
```

### Line 2 - Redirect URI
```
https://kms.khaz.app/google/callback/
```

---

## 📋 Step-by-Step Instructions

### 1. Go to Google Cloud Console
```
URL: https://console.cloud.google.com/apis/credentials?project=kmsetjen-dpd-ri
```

### 2. Find Your OAuth Client
Look for: **`KMSetjen-DPD-RI`** with type **`OAuth 2.0 Client IDs (Web application)`**

### 3. Click EDIT button
Opens the OAuth settings panel

### 4. Add JavaScript Origin

**Find section:** "Authorized JavaScript origins"

**Click:** "Add URI" button

**Paste:** 
```
https://kms.khaz.app
```

**Visible in console:**
```
URIs: 1. http://localhost:5175
      2. http://localhost:8002
      3. http://127.0.0.1:5175
      4. http://127.0.0.1:8002
      5. https://kms.dpd.go.id
      6. https://kms-be.dpd.go.id
      7. https://khaz.app
      8. https://kms.khaz.app  ← NEW
```

### 5. Add Redirect URI

**Find section:** "Authorized redirect URIs"

**Click:** "Add URI" button

**Paste:**
```
https://kms.khaz.app/google/callback/
```

**Visible in console:**
```
URIs: 1. http://localhost:5175/google/callback/
      2. http://127.0.0.1:5175/google/callback/
      3. http://localhost:8002/api/auth/google/callback/
      4. http://127.0.0.1:8002/api/auth/google/callback/
      5. https://kms.dpd.go.id/google/callback
      6. https://kms-be.dpd.go.id/api/auth/google/callback/
      7. https://khaz.app/kms/google/callback/
      8. https://kms.khaz.app/google/callback/  ← NEW
```

### 6. Click SAVE
Bottom right of the dialog

### 7. Wait 5-300 minutes
Google processes the change

### 8. Test
- Go to: https://kms.khaz.app/login
- Click: "Masuk dengan Google"
- Should redirect to Google login page (not error)

---

## 🔍 Verification Checklist

After adding these to Google Cloud Console:

- [ ] Both URIs added to Google Console
- [ ] Changes saved in Google Cloud
- [ ] Waited at least 5 minutes
- [ ] Cleared browser cache (Ctrl+Shift+Delete)
- [ ] Opened incognito/private window
- [ ] Went to https://kms.khaz.app/login
- [ ] Clicked "Masuk dengan Google" button
- [ ] Got redirected to Google OAuth login (not error page)
- [ ] Successfully logged in
- [ ] Redirected back to staging app

---

## ⚠️ Common Mistakes to Avoid

| ❌ DON'T | ✅ DO |
|---|---|
| Add `https://kms.khaz.app/` (with trailing slash) | Use `https://kms.khaz.app` (no trailing slash) for JavaScript origin |
| Only add to redirect URIs, forget JavaScript origins | Add to BOTH sections |
| Use different URI format | Match exactly: `https://kms.khaz.app/google/callback/` |
| Test immediately | Wait 5-10 minutes before testing |
| Only test in the same browser | Clear cache or use incognito window |
| Save without checking format | Verify entries look exactly like examples |

---

## 🆘 If It Still Doesn't Work

1. **Verify the URIs were actually saved:**
   - Go back to Google Cloud Console
   - Edit the same OAuth client again
   - Make sure your new entries are there

2. **Check staging server configuration:**
   ```bash
   ssh -i ~/.ssh/khaz root@165.245.191.216
   docker exec kms_frontend env | grep VITE_GOOGLE
   # Should show: VITE_GOOGLE_REDIRECT_URI=https://kms.khaz.app/google/callback/
   ```

3. **Check browser console for errors:**
   - Open Dev Tools (F12)
   - Go to Console tab
   - Look for any Google OAuth or fetch errors

4. **Verify domain DNS works:**
   ```bash
   nslookup kms.khaz.app
   # Should resolve to 165.245.191.216
   ```

5. **Check nginx configuration on staging:**
   ```bash
   ssh -i ~/.ssh/khaz root@165.245.191.216
   docker exec kms_django cat /etc/nginx/sites-enabled/default | grep server_name
   # Should include: kms.khaz.app
   ```

---

## 📞 Support References

- [Google OAuth 2.0 Error Codes](https://developers.google.com/identity/protocols/oauth2/web-server#error-codes)
- [Redirect URI Mismatch Error](https://developers.google.com/identity/protocols/oauth2/web-server#authorization-errors-redirect-uri-mismatch)
- Your OAuth Configuration: [Google Cloud Console](https://console.cloud.google.com/apis/credentials?project=kmsetjen-dpd-ri)
