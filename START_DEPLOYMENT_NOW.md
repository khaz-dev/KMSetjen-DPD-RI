# ⚡ DO THIS NOW - DEPLOYMENT START

**Your deployment is 100% ready.**

You have two simple choices:

---

## 🟢 CHOICE 1: AUTOMATIC DEPLOYMENT (EASY - RECOMMENDED)

### Run This Command

```powershell
cd "d:\Project\KMSetjen DPD RI"
.\deploy-helper.ps1
```

### What It Does
- ✓ Copies .env to server via SCP
- ✓ Runs deployment script on server
- ✓ Shows real-time progress
- ✓ Verifies services running

### Time: ~15 minutes

---

## 🟡 CHOICE 2: MANUAL DEPLOYMENT (STEP-BY-STEP)

### Step 1: Copy .env to Server

```powershell
$keyPath = "C:\Users\khair\.ssh\id_rsa"
scp -i $keyPath "d:\Project\KMSetjen DPD RI\.env" root@143.198.200.57:/var/www/html/kmsetjendpdri/.env
```

### Step 2: SSH to Server

```powershell
ssh -i $keyPath root@143.198.200.57
```

### Step 3: Deploy (On Server)

```bash
cd /var/www/html/kmsetjendpdri
git pull origin main
chmod +x deploy-final.sh
sudo ./deploy-final.sh
```

### Time: ~20 minutes

---

## ✅ AFTER DEPLOYMENT (5 MINUTES)

### 1. Visit Application
```
https://khaz.app/kmsetjendpdri/
```

### 2. Create Admin User (On Server)
```bash
cd /var/www/html/kmsetjendpdri/backend
source venv/bin/activate
python manage.py createsuperuser
# Follow prompts
```

### 3. Login to Admin
```
https://khaz.app/kmsetjendpdri/admin/
```

### 4. Test Print (Article Page)
```
Ctrl+P → Verify article-only output (no navbar/footer)
```

---

## 📚 NEED HELP?

Read these files (in order):

1. `00_DEPLOYMENT_READY_NOW.md` - Status & overview
2. `DEPLOYMENT_QUICK_START.md` - Comprehensive guide
3. `DEPLOYMENT_INSTRUCTIONS_FINAL.md` - Detailed steps
4. `POST_DEPLOYMENT_VERIFICATION.md` - Troubleshooting

---

## 🚨 TROUBLESHOOTING

### SSH Connection Fails?
```powershell
# Use password auth instead
ssh root@143.198.200.57
# Enter password when prompted
```

### Script Says "Permission Denied"?
```bash
# Make it executable
chmod +x deploy-final.sh
# Run with sudo
sudo ./deploy-final.sh
```

### 502 Bad Gateway?
```bash
# SSH to server and restart
systemctl restart kmsetjendpdri-gunicorn
```

---

## ✨ SUMMARY

| What | Status | Time |
|------|--------|------|
| Code | ✅ Ready | N/A |
| Config | ✅ Ready | N/A |
| Scripts | ✅ Ready | N/A |
| Docs | ✅ Ready | N/A |
| **Deploy** | **Ready Now** | **15 min** |

---

## 🎯 DO THIS NOW

### Pick One:

#### AUTOMATIC (Easiest):
```
.\deploy-helper.ps1
```

#### MANUAL (Step-by-step):
```
See CHOICE 2 above
```

---

## 🎉 RESULT

```
✓ Application live at: https://khaz.app/kmsetjendpdri/
✓ Admin panel at: https://khaz.app/kmsetjendpdri/admin/
✓ All services running
✓ Print working (article-only)
✓ API endpoints accessible
```

---

**That's it. You're done. Go deploy!** 🚀

Questions? Read the documentation.  
Ready? Run the command above.  
Let's go live!
