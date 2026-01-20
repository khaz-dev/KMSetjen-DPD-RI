# ✅ Google Cloud Console - OAuth Form Fill-In Guide

**Date**: January 20, 2026  
**Project**: KMSetjen DPD RI  
**Purpose**: Create new OAuth 2.0 credentials

---

## 🎯 Form Fields - Exact Values to Use

### Field 1: Application Type
```
✅ Web application
   (This is already correct in your form)
```

**Why**: Your app is a web-based React frontend + Django backend

---

### Field 2: Name
```
✅ KMSetjen-DPD-RI
   (This is already correct in your form)
```

**Why**: Identifies the client in Google Console (not shown to users)

---

### Field 3: Authorized JavaScript Origins
```
Add EACH of these URLs:
├─ http://localhost:3000
├─ http://localhost:8000
├─ http://127.0.0.1:3000
└─ http://127.0.0.1:8000
```

**How to Add**:
1. In the "URIs 1" field, clear the example text
2. Type: `http://localhost:3000`
3. Press Tab or click "Add URI"
4. Repeat for each URL above
5. Result: 4 origins listed

**Why Each Origin**:
- `http://localhost:3000` - Frontend development (main)
- `http://localhost:8000` - Backend development (if needed)
- `http://127.0.0.1:3000` - Alternative localhost (port 3000)
- `http://127.0.0.1:8000` - Alternative localhost (port 8000)

**Important**: 
- ✅ Use `http://` (not https for localhost)
- ✅ Include the port number
- ✅ Do NOT use trailing slashes
- ✅ These are case-sensitive

---

### Field 4: Authorized Redirect URIs
```
Add EACH of these URLs:
├─ http://localhost:3000/google/callback
└─ http://127.0.0.1:3000/google/callback
```

**How to Add**:
1. In the "URIs 1" field, clear the example text
2. Type: `http://localhost:3000/google/callback`
3. Press Tab or click "Add URI"
4. Add the second one: `http://127.0.0.1:3000/google/callback`
5. Result: 2 redirect URIs listed

**Why These URLs**:
- `http://localhost:3000/google/callback` - Frontend callback (development)
- `http://127.0.0.1:3000/google/callback` - Alternative callback URL

**CRITICAL**:
- ✅ Must match EXACTLY what's in your code
- ✅ In your code: `http://localhost:3000/google/callback`
- ✅ Path must include `/google/callback`
- ✅ No trailing slash after "callback"
- ✅ Must use `http://` (not https for localhost)

---

## 📋 Complete Form Summary

```
Application type:        Web application ✅
Name:                   KMSetjen-DPD-RI ✅

Authorized JavaScript Origins (4 total):
├─ 1. http://localhost:3000 ✅
├─ 2. http://localhost:8000 ✅
├─ 3. http://127.0.0.1:3000 ✅
└─ 4. http://127.0.0.1:8000 ✅

Authorized Redirect URIs (2 total):
├─ 1. http://localhost:3000/google/callback ✅
└─ 2. http://127.0.0.1:3000/google/callback ✅
```

---

## 🛠️ Step-by-Step Form Filling

### Step 1: Application Type
- ✅ Already set to "Web application" - LEAVE AS IS

### Step 2: Name
- ✅ Already set to "KMSetjen-DPD-RI" - LEAVE AS IS

### Step 3: Add Authorized JavaScript Origins
**Current state**: Shows example text "https://www.example.com"

**What to do**:
1. Click in the "URIs 1" field (first box under "Authorized JavaScript origins")
2. Delete: `https://www.example.com`
3. Type: `http://localhost:3000`
4. Click: "Add URI" button (or press Tab)
5. Now type the second: `http://localhost:8000`
6. Click: "Add URI" button
7. Add third: `http://127.0.0.1:3000`
8. Click: "Add URI" button
9. Add fourth: `http://127.0.0.1:8000`
10. Result: You should see 4 URLs listed

**Visual Result After Completing**:
```
Authorized JavaScript origins:
☑ http://localhost:3000
☑ http://localhost:8000
☑ http://127.0.0.1:3000
☑ http://127.0.0.1:8000
```

### Step 4: Add Authorized Redirect URIs
**Current state**: Shows example text "https://www.example.com"

**What to do**:
1. Click in the "URIs 1" field (first box under "Authorized redirect URIs")
2. Delete: `https://www.example.com`
3. Type: `http://localhost:3000/google/callback`
4. Click: "Add URI" button (or press Tab)
5. Type the second: `http://127.0.0.1:3000/google/callback`
6. Click: "Add URI" button
7. Result: You should see 2 URLs listed

**Visual Result After Completing**:
```
Authorized redirect URIs:
☑ http://localhost:3000/google/callback
☑ http://127.0.0.1:3000/google/callback
```

### Step 5: Click "CREATE"
- Click the blue "CREATE" button
- Google will generate your credentials

---

## ⚠️ Common Mistakes to AVOID

### ❌ Mistake 1: Using HTTPS for localhost
```
❌ WRONG: https://localhost:3000
✅ RIGHT: http://localhost:3000
```

### ❌ Mistake 2: Including example text
```
❌ WRONG: http://localhost:3000 https://www.example.com
✅ RIGHT: http://localhost:3000
```

### ❌ Mistake 3: Forgetting the port
```
❌ WRONG: http://localhost/google/callback
✅ RIGHT: http://localhost:3000/google/callback
```

### ❌ Mistake 4: Adding trailing slash
```
❌ WRONG: http://localhost:3000/google/callback/
✅ RIGHT: http://localhost:3000/google/callback
```

### ❌ Mistake 5: Wrong callback path
```
❌ WRONG: http://localhost:3000/callback
✅ RIGHT: http://localhost:3000/google/callback
```

### ❌ Mistake 6: Missing port in origins
```
❌ WRONG: http://localhost (missing :3000)
✅ RIGHT: http://localhost:3000
```

### ❌ Mistake 7: Mixing localhost and 127.0.0.1
```
❌ Can use either, but be consistent:
✅ Use BOTH: http://localhost:3000 AND http://127.0.0.1:3000
```

---

## 📋 Checklist Before Clicking CREATE

- [ ] Application Type: Web application ✅
- [ ] Name: KMSetjen-DPD-RI ✅
- [ ] JavaScript Origins: 4 URLs added
  - [ ] http://localhost:3000
  - [ ] http://localhost:8000
  - [ ] http://127.0.0.1:3000
  - [ ] http://127.0.0.1:8000
- [ ] Redirect URIs: 2 URLs added
  - [ ] http://localhost:3000/google/callback
  - [ ] http://127.0.0.1:3000/google/callback
- [ ] No example text remaining
- [ ] No HTTPS for localhost
- [ ] No trailing slashes
- [ ] All ports included (3000, 8000)

---

## 🎯 After Clicking CREATE

**Google will show you**:
```
Client ID:     [COPY THIS]
Client Secret: [COPY THIS]
```

**What to do**:
1. Copy the Client ID
2. Open: `backend/.env`
3. Find line: `GOOGLE_CLIENT_ID=`
4. Paste: Your new Client ID
5. Copy the Client Secret
6. Find line: `GOOGLE_CLIENT_SECRET=`
7. Paste: Your new Client Secret
8. Save the file

**Then**:
1. Copy the Client ID again
2. Open: `frontend/.env.local`
3. Find line: `REACT_APP_GOOGLE_CLIENT_ID=`
4. Paste: Your new Client ID
5. Save the file

---

## ✅ Success Indicators

After filling in the form correctly:
- ✅ No error messages about invalid URIs
- ✅ Form accepts your entries
- ✅ Can click CREATE button
- ✅ Google generates credentials
- ✅ You see Client ID and Client Secret

---

## 🔒 Security Reminder

```
✅ Client ID: OK to share (public)
❌ Client Secret: NEVER share (secret, keep safe)

Store in:
✅ backend/.env (protected by .gitignore)
❌ NOT in code
❌ NOT in frontend
❌ NOT in version control
```

---

## ⏱️ Timeline

```
Fill in form:        5 minutes
Click CREATE:        Instant
Get credentials:     Immediate
Update .env files:   2 minutes
Test login:          5 minutes
────────────────────────────
TOTAL:              15 minutes
```

---

## 📞 Quick Copy-Paste Blocks

### For JavaScript Origins (Copy all at once if your form allows)
```
http://localhost:3000
http://localhost:8000
http://127.0.0.1:3000
http://127.0.0.1:8000
```

### For Redirect URIs (Copy all at once if your form allows)
```
http://localhost:3000/google/callback
http://127.0.0.1:3000/google/callback
```

---

## 🎊 You're Ready!

**With these exact values**:
- ✅ Your form will have no errors
- ✅ Google will create your credentials
- ✅ Login will work perfectly
- ✅ No security issues
- ✅ Development will be smooth

**Now fill in the form with the values above and click CREATE! 🚀**

---

**Generated**: January 20, 2026  
**For**: KMSetjen DPD RI Project  
**Purpose**: Guide to filling Google OAuth form  
**Status**: Ready to use
