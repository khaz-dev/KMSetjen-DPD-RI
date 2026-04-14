# 📋 Add DNS TXT Record on name.com for Certbot

## Current Status
✅ You have these A records already set:
- khaz.app → 165.245.191.216
- www.khaz.app → 165.245.191.216
- kms.khaz.app → 165.245.191.216
- kms-be.khaz.app → 165.245.191.216

❌ Missing: TXT record for `_acme-challenge.khaz.app`

---

## Step-by-Step: Add TXT Record on name.com

### Step 1: On name.com - "Manage DNS" Page

You're already on this page. Scroll down to see all record types.

Look for the section where you can add a NEW record. There should be a form or button like:
- "Add Record" button
- "Add DNS Record" link
- Or a blank form row at the bottom

### Step 2: Fill in the TXT Record Details

When you add a new record, use these values:

| Field | Value |
|-------|-------|
| **Type** | TXT |
| **Host** | `_acme-challenge` |
| **Answer** | `gN46mVEJCVUvyEbHjInm7HNxYB9Nfp4vGCHWFhPjpmI` |
| **TTL** | 300 (or whatever is shown) |

**Important Details:**
- **Type:** Must be `TXT` (not A, not CNAME)
- **Host:** Enter EXACTLY: `_acme-challenge`
  - name.com will automatically append `.khaz.app` 
  - So it becomes: `_acme-challenge.khaz.app`
- **Answer:** Paste EXACTLY: `gN46mVEJCVUvyEbHjInm7HNxYB9Nfp4vGCHWFhPjpmI`
  - Copy from the Certbot output
  - No quotes, no extra spaces
- **TTL:** Leave as default or set to 300

### Step 3: Visual Guide for name.com

The form should look like this:

```
┌─────────────────────────────────────────────────────────────────────┐
│ Add DNS Record                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Type:        [TXT ▼]                                               │
│                                                                     │
│ Host:        [_acme-challenge         ]                            │
│              (This becomes: _acme-challenge.khaz.app)             │
│                                                                     │
│ Answer:      [gN46mVEJCVUvyEbHjInm7HNxYB9Nfp4vGCHWFhPjpmI ]       │
│              (Your Certbot verification string)                    │
│                                                                     │
│ TTL:         [300 ▼]  (Or default)                                │
│                                                                     │
│ Priority:    [N/A]  (Leave blank for TXT records)                 │
│                                                                     │
│                                           [Save] [Cancel]          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Step 4: Click Save/Add

After filling in all fields, click the "Save" or "Add Record" button.

You should see a confirmation message like:
```
✓ DNS record added successfully
```

### Step 5: Verify DNS Propagated (Wait 2-5 minutes)

After adding the record, DNS needs time to propagate. While you wait, check on your server:

```bash
# Check every 30 seconds until the record appears
watch -n 30 'nslookup -type=TXT _acme-challenge.khaz.app'

# Alternative (one-time check)
dig _acme-challenge.khaz.app TXT +short

# You should see:
# "gN46mVEJCVUvyEbHjInm7HNxYB9Nfp4vGCHWFhPjpmI"
```

**Keep checking until you see the value in the response!**

---

## Exact Certbot Command After DNS is Live

Once DNS TXT record shows up in your checks (`nslookup` or `dig` command shows the value), run:

```bash
sudo certbot certonly --manual \
  -d khaz.app \
  -d "*.khaz.app" \
  --expand \
  --agree-tos \
  --email khairilazmiashari@gmail.com
```

Certbot will show:
```
Please deploy a DNS TXT record under the name:
_acme-challenge.khaz.app.

with the following value:
gN46mVEJCVUvyEbHjInm7HNxYB9Nfp4vGCHWFhPjpmI
```

**This time you can press ENTER immediately** because the DNS record already exists!

---

## After Certificate is Issued

```bash
# 1. Verify certificate has wildcard
sudo openssl x509 -text -noout -in /etc/letsencrypt/live/khaz.app/fullchain.pem | grep DNS:

# Should show: DNS:khaz.app, DNS:*.khaz.app

# 2. Reload nginx
sudo systemctl reload nginx

# 3. Test in browser
# https://kms.khaz.app/
# Should work! ✅
```

---

## Troubleshooting: If DNS Doesn't Appear

### Check with Google DNS
```bash
nslookup -server 8.8.8.8 -type=TXT _acme-challenge.khaz.app

# Or with dig
dig @8.8.8.8 _acme-challenge.khaz.app TXT
```

### Online DNS checker
- Go to: https://toolbox.googleapps.com/apps/dig/#TXT/_acme-challenge.khaz.app
- Look for bolded lines under ";ANSWER"
- Should show your verification string

### If still not showing after 10 minutes:
1. Go back to name.com
2. Double-check the TXT record you added is there
3. Verify the Host is exactly: `_acme-challenge`
4. Verify the Answer value is exactly: `gN46mVEJCVUvyEbHjInm7HNxYB9Nfp4vGCHWFhPjpmI`
5. Wait another 5 minutes (name.com can take up to 10 min for TXT records)

---

## Summary

1. ✅ You already have A records set up correctly
2. ⏳ Add TXT record on name.com:
   - Type: TXT
   - Host: _acme-challenge
   - Value: gN46mVEJCVUvyEbHjInm7HNxYB9Nfp4vGCHWFhPjpmI
3. ⏳ Wait 2-5 minutes for DNS propagation
4. ✅ Run Certbot command
5. ✅ Press ENTER (DNS already verified)
6. ✅ Certificate issued with wildcard!

---

## Total Time
- Add TXT record: 1 minute
- Wait for propagation: 3-5 minutes
- Run Certbot: 30 seconds
- **Total: ~6-7 minutes**

**Ready? Go add that TXT record on name.com!** 🚀
