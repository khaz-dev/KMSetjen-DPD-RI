# 🧪 Google OAuth Login - Testing Checklist

## Pre-Test Verification

- [ ] All services running: `docker-compose ps` (all 3 should be HEALTHY)
- [ ] Django loaded credentials: `docker exec kms_django python -c "from django.conf import settings; print(settings.GOOGLE_CLIENT_ID[:20])"`
- [ ] Frontend accessible: http://localhost:5175/ (should load homepage)
- [ ] Backend accessible: http://localhost:8002/health/ (should return 200)

---

## Test 1: Google Button Appears

**Steps**:
1. Go to http://localhost:5175/login
2. Look for button labeled "Masuk dengan Google" with Google icon
3. Button should be clickable

**Expected Result**: ✅ Google login button visible and clickable

**If Failed**: 
- Check console for: `GOOGLE_CLIENT_ID not configured`
- Verify `VITE_GOOGLE_CLIENT_ID` in browser DevTools → Application → Environment

---

## Test 2: Google OAuth Flow Initiates

**Steps**:
1. On login page, click "Masuk dengan Google"
2. Should redirect to Google's login page
3. If already logged into Google, may skip to permission screen

**Expected Result**: ✅ Redirected to Google signin page

**If Failed**:
- Check browser console for JavaScript errors
- Verify redirect URI is correct: `http://localhost:5175/google/callback`

---

## Test 3: Google Callback Processing

**Steps**:
1. After Google login, approve permissions
2. Google redirects back to http://localhost:5175/google/callback
3. Should see loading spinner briefly
4. Check browser console for errors

**Expected Result**: ✅ No errors in console, spinner appears then disappears

**If Failed**:
- **400 Error (OLD BUG)**: "Google OAuth not configured on server" → Already Fixed ✅
- **401 Error**: Token exchange failed → Check Google credentials in `.env`
- **Network Error**: Backend unreachable → Check Docker container status

**Console Output Should Include**:
```
[GoogleCallback] Processing callback...
[GoogleCallback] Exchanging code for tokens...
[GoogleCallback] Token exchange successful
[GoogleCallback] Tokens stored in localStorage
[GoogleCallback] Updating AuthContext with user data...
[GoogleCallback] AuthContext updated, navbar should now show user profile
[GoogleCallback] Loading state set to false, spinner hidden
[GoogleCallback] Redirecting to dashboard...
```

---

## Test 4: Successful Login & Redirect

**Steps**:
1. After callback processing, should redirect to dashboard
2. Check URL: should be http://localhost:5175/dashboard
3. Check navbar: should show user profile picture/name

**Expected Result**: ✅ Redirected to dashboard with user profile visible

**If Failed**:
- Check localStorage: `localStorage.getItem('access_token')` should return JWT
- Check AuthContext: Navbar should show logged-in state

---

## Test 5: Dashboard Access Verification

**Steps**:
1. On dashboard, verify you can access protected features
2. Click on user profile dropdown
3. Should see "Logout" option

**Expected Result**: ✅ Can access dashboard, logout option available

**If Failed**:
- Logout and retry login
- Clear browser cache and try again

---

## Test 6: Logout & Repeat

**Steps**:
1. Click logout
2. Redirect to login page
3. Try logging in again with Google
4. Should work without errors

**Expected Result**: ✅ Multiple logins work without issues

**If Failed**:
- Check if tokens are being cleared on logout
- Verify localStorage is empty after logout

---

## Debugging Commands

### View Django Logs
```bash
docker-compose logs django --tail 50
```

### Check if Endpoint Receives Request
```bash
docker exec -it kms_django tail -f logs/django.log | grep -i google
```

### Test Endpoint Directly (with real Google code)
```bash
curl -X POST http://localhost:8002/api/auth/google/callback/ \
  -H "Content-Type: application/json" \
  -d '{"code":"real_code_here","state":"state_here"}'
```

### Verify Environment Variables in Container
```bash
docker exec -it kms_django env | grep GOOGLE
```

---

## Success Criteria

| # | Criteria | Status |
|---|----------|--------|
| 1 | Google button visible on login page | ☐ |
| 2 | Redirects to Google OAuth login | ☐ |
| 3 | Callback processing shows no errors | ☐ |
| 4 | Redirected to dashboard | ☐ |
| 5 | User profile visible in navbar | ☐ |
| 6 | Can access authenticated features | ☐ |
| 7 | Logout works | ☐ |
| 8 | Can log back in | ☐ |

**All criteria met** = ✅ Google OAuth Working Perfectly

---

## Browser DevTools Debugging

### Check Environment Variables
```javascript
// In browser console:
console.log(import.meta.env.VITE_GOOGLE_CLIENT_ID)
// Should show: 403156786636-7umtcldsh5t6h31r3q4eprni77qqicos.apps.googleusercontent.com
```

### Check Stored Tokens
```javascript
// After successful login:
console.log(localStorage.getItem('access_token'))
console.log(localStorage.getItem('refresh_token'))
// Should both show JWT tokens
```

### Check Network Requests
1. Open DevTools → Network tab
2. Try Google login
3. Look for request to `/api/auth/google/callback/`
4. Should return 200 (or 201) with tokens and user data

### Check AuthContext State
```javascript
// Check in React DevTools or through NetworkTab
// After login, useAuth() should have:
{
  user: {
    id: 1,
    email: "user@example.com",
    username: "...",
    first_name: "...",
    last_name: "..."
  },
  isAuthenticated: true
}
```

---

## Notes

- **FIXED**: Environment variables now passed to Django container
- **WORKING**: Google OAuth credentials loaded successfully
- **NEXT**: Test full end-to-end login flow

If any issue occurs, check the logs first:
```bash
docker-compose logs django
docker-compose logs frontend
```
