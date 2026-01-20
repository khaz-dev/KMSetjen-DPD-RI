# ✅ ACTION CHECKLIST - Complete Credential Rotation

**Status**: Ready for you to take action  
**Estimated Time**: 5-10 minutes  
**Difficulty**: Easy (mostly copy-paste)

---

## 🎯 What You Need to Do RIGHT NOW

### Step 1: Rotate Google OAuth (5 min)
- [ ] Read: [GOOGLE_OAUTH_ROTATION_STEPS.md](GOOGLE_OAUTH_ROTATION_STEPS.md)
- [ ] Go to Google Cloud Console: https://console.cloud.google.com/
- [ ] Delete old OAuth credentials (the exposed ones)
- [ ] Create new OAuth 2.0 credentials
- [ ] Copy new Client ID and Secret

### Step 2: Update .env Files (2 min)
- [ ] Update `backend/.env` line 10:
  ```
  GOOGLE_CLIENT_ID=[YOUR_NEW_CLIENT_ID]
  ```
- [ ] Update `backend/.env` line 11:
  ```
  GOOGLE_CLIENT_SECRET=[YOUR_NEW_CLIENT_SECRET]
  ```
- [ ] Update `frontend/.env.local` line 10:
  ```
  REACT_APP_GOOGLE_CLIENT_ID=[YOUR_NEW_CLIENT_ID]
  ```

### Step 3: Test Locally (3 min)
- [ ] Terminal 1: `cd backend && python manage.py runserver`
- [ ] Terminal 2: `cd frontend && npm start`
- [ ] Open: http://localhost:3000
- [ ] Click: Google login button
- [ ] Verify: Login works without errors

### Step 4: Verify Git Protection (1 min)
- [ ] Run: `git status`
- [ ] Confirm: NO .env files shown
- [ ] If they appear: Run `git rm --cached backend/.env frontend/.env.local`

---

## 📋 Detailed Information

### Files That Need Updating

#### File 1: `backend/.env`
**Location**: `d:\Project\KMSetjen DPD RI\backend\.env`

Currently:
```
GOOGLE_CLIENT_ID=403156786636-3e0nge5u9lotno64j10eo78jq5584kar.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

Update to:
```
GOOGLE_CLIENT_ID=[NEW_ID_FROM_GOOGLE]
GOOGLE_CLIENT_SECRET=[NEW_SECRET_FROM_GOOGLE]
```

#### File 2: `frontend/.env.local`
**Location**: `d:\Project\KMSetjen DPD RI\frontend\.env.local`

Currently:
```
REACT_APP_GOOGLE_CLIENT_ID=403156786636-3e0nge5u9lotno64j10eo78jq5584kar.apps.googleusercontent.com
```

Update to:
```
REACT_APP_GOOGLE_CLIENT_ID=[NEW_ID_FROM_GOOGLE]
```

---

## 🚀 Success Criteria

You'll know you're done when:

✅ Google login works locally  
✅ No error messages in browser console  
✅ `git status` does NOT show .env files  
✅ New credentials are saved in local files only (not on GitHub)

---

## 🆘 If Something Goes Wrong

### "Google login not working"
- [ ] Check: Client ID is pasted correctly (no spaces)
- [ ] Check: Client ID in frontend matches backend
- [ ] Check: Servers restarted after .env update
- [ ] Check: Redirect URI in Google Console is exactly `http://localhost:3000/google/callback`

### "Can't find where to update credentials in Google Console"
- [ ] Go to: https://console.cloud.google.com/
- [ ] Click: APIs & Services → Credentials
- [ ] Look for: OAuth 2.0 Client IDs
- [ ] See: [GOOGLE_OAUTH_ROTATION_STEPS.md](GOOGLE_OAUTH_ROTATION_STEPS.md) for details

### ".env file is showing in git status"
- [ ] Run: `git status` to confirm it's there
- [ ] Run: `git rm --cached backend/.env`
- [ ] Check: `.gitignore` file has `.env` pattern
- [ ] If not there, add it manually

---

## 📞 Contact Summary

**Already Completed**:
✅ Django SECRET_KEY rotated  
✅ Git repository initialized  
✅ .gitignore files created and verified  
✅ Detailed guides created  

**Your Turn (Next 5-10 minutes)**:
🟡 Rotate Google OAuth credentials (manual via Google Console)  
🟡 Update .env files with new credentials  
🟡 Test login locally  
🟡 Verify git protection  

**Then**:
→ Phase 3: Organize code (backend/scripts/, docs/)  
→ Phase 4: Create documentation  
→ Phase 5: Clean up code  
→ Phase 6: Push to GitHub

---

## 💡 Pro Tips

1. **Save your new credentials** in a password manager immediately after creating them
2. **Don't share** credentials via email/chat - keep them local only
3. **Keep .env files local** - never commit them to git
4. **Test immediately** after updating - don't wait
5. **If something breaks**, the old credentials are still safe (you haven't deleted them on Google yet - just disable)

---

**Time Estimate**: 5-10 minutes total  
**Difficulty**: 🟢 Easy  
**Critical**: 🔴 YES - Must complete before GitHub push

**Ready? Start with Step 1! 🚀**

---

**Generated**: January 20, 2026  
**Status**: Awaiting your action on Google OAuth rotation  
**Next Update**: After you've rotated credentials and tested locally
