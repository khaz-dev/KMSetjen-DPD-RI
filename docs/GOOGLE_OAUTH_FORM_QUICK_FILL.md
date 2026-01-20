# 🎯 Google OAuth Form - Quick Copy-Paste Reference

**Use this to quickly fill in the form without mistakes**

---

## 📋 Copy-Paste Ready Values

### COPY #1: Application Type
```
Web application
```
✅ (Already correct in form)

---

### COPY #2: Name
```
KMSetjen-DPD-RI
```
✅ (Already correct in form)

---

### COPY #3: JavaScript Origins (Add These 4)

**First**, clear the example text. **Then**, add each one:

#### Origin 1
```
http://localhost:3000
```

#### Origin 2
```
http://localhost:8000
```

#### Origin 3
```
http://127.0.0.1:3000
```

#### Origin 4
```
http://127.0.0.1:8000
```

---

### COPY #4: Redirect URIs (Add These 2)

**First**, clear the example text. **Then**, add each one:

#### Redirect 1
```
http://localhost:3000/google/callback
```

#### Redirect 2
```
http://127.0.0.1:3000/google/callback
```

---

## 📊 Form Summary

```
Application Type:  Web application ✅
Name:             KMSetjen-DPD-RI ✅

JavaScript Origins:
  1. http://localhost:3000
  2. http://localhost:8000
  3. http://127.0.0.1:3000
  4. http://127.0.0.1:8000

Redirect URIs:
  1. http://localhost:3000/google/callback
  2. http://127.0.0.1:3000/google/callback
```

---

## 🚨 Critical Reminders

- ❌ NO HTTPS for localhost (use http://)
- ❌ NO trailing slashes (callback not callback/)
- ❌ Don't include example text
- ❌ Include ALL ports (3000, 8000)
- ✅ Use BOTH localhost and 127.0.0.1

---

## ✅ Checklist

- [ ] Application Type: Web application
- [ ] Name: KMSetjen-DPD-RI
- [ ] 4 JavaScript Origins added
- [ ] 2 Redirect URIs added
- [ ] No error messages
- [ ] Ready to click CREATE

---

**After clicking CREATE, you'll get:**
- Client ID (copy to backend/.env and frontend/.env.local)
- Client Secret (copy to backend/.env only)

**Then test login at: http://localhost:3000**
