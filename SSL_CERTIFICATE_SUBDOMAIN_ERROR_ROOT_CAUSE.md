# SSL Certificate Error: Subdomain Mismatch Root Cause & Fix

## 🔴 Problem Identified

**Error:** `net::ERR_CERT_COMMON_NAME_INVALID`

**What it means:** The SSL certificate doesn't match the domain you're trying to access.

---

## Root Cause Analysis

### Current Situation

**Certificate location:** `/etc/letsencrypt/live/khaz.app/fullchain.pem`

**Certificate issued for:** `khaz.app` only (or maybe `khaz.app` + `www.khaz.app`)

**Trying to access:** `kms.khaz.app` and `kms-be.khaz.app` (SUBDOMAINS)

### Why It Fails

```
SSL Certificate:        khaz.app
Domain being accessed:  kms.khaz.app
Match?                  ❌ NO - Different domain!
```

The certificate's Common Name (CN) is `khaz.app`, so it only works for:
- ✅ `khaz.app`
- ✅ `www.khaz.app` (maybe)
- ❌ `kms.khaz.app` (FAILS)
- ❌ `kms-be.khaz.app` (FAILS)

---

## Solutions

### Option 1: Use Wildcard Certificate (RECOMMENDED) 🏆

**What it is:** A certificate for `*.khaz.app` covers ALL subdomains

**How to get it:**

```bash
# On staging server, renew with wildcard
sudo certbot certonly --standalone \
  -d khaz.app \
  -d "*.khaz.app" \
  --email your-email@example.com
```

**Result:**
- Certificate valid for: `*.khaz.app` (all subdomains)
- ✅ Works with `kms.khaz.app`
- ✅ Works with `kms-be.khaz.app`
- ✅ Works with any future subdomains

---

### Option 2: Add Specific SANs to Certificate

**What it is:** Add Subject Alternative Names (SANs) for specific subdomains

```bash
# Renew certificate with specific subdomains
sudo certbot certonly --standalone \
  -d khaz.app \
  -d "*.khaz.app" \
  -d kms.khaz.app \
  -d kms-be.khaz.app \
  --email your-email@example.com
```

**Result:**
- Certificate valid for: `khaz.app`, `kms.khaz.app`, `kms-be.khaz.app`, all other `*.khaz.app` subdomains
- More flexible than Option 1

---

### Option 3: Revert to Subpath Routing (If No Wildcard Available)

If you **cannot** get a wildcard certificate, use the old subpath approach:

```
https://khaz.app/kms/
```

Instead of:

```
https://kms.khaz.app/
```

---

## Detailed Deployment Fix

### Step 1: Check Current Certificate

```bash
# On staging server
sudo openssl x509 -in /etc/letsencrypt/live/khaz.app/fullchain.pem -text -noout | grep -A 5 "Subject:"
sudo openssl x509 -in /etc/letsencrypt/live/khaz.app/fullchain.pem -text -noout | grep -A 10 "Subject Alternative Name"
```

**Expected output for wildcard:**
```
Subject: CN=*.khaz.app
Alternative Name: DNS:*.khaz.app, DNS:khaz.app
```

**Current output (likely):**
```
Subject: CN=khaz.app
Alternative Name: DNS:khaz.app, DNS:www.khaz.app
```

### Step 2: If Certificate Doesn't Have Wildcard, Renew It

```bash
# On staging server (as root)
sudo certbot delete --cert-name khaz.app  # Optional - removes old cert
sudo certbot certonly --standalone \
  -d khaz.app \
  -d "*.khaz.app" \
  --email your-email@example.com \
  --expand  # Or add to existing cert
```

Or if using DNS validation (better for renewals):

```bash
sudo certbot certonly --dns-cloudflare \
  -d khaz.app \
  -d "*.khaz.app" \
  --dns-cloudflare-credentials /path/to/cloudflare.ini
```

### Step 3: Verify Certificate Updated

```bash
# Check certificate again
sudo openssl x509 -in /etc/letsencrypt/live/khaz.app/fullchain.pem -text -noout | grep -E "(Subject:|DNS:)"

# Should now show: DNS:*.khaz.app
```

### Step 4: Reload Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Step 5: Test in Browser

Visit: `https://kms.khaz.app/`

Should work without SSL error!

---

## Why This Happened

**During subdomain migration:**

1. You moved from subpath routing (`khaz.app/kms`) to subdomain routing (`kms.khaz.app`)
2. `nginx-kms-subdomains.conf` was deployed (which is correct)
3. BUT the SSL certificate still only covers `khaz.app`, not `*.khaz.app`
4. Nginx serves the config but the browser rejects it due to certificate mismatch

**What was correct:**
- ✅ DNS records (kms.khaz.app points to server)
- ✅ Nginx configuration (correct server blocks)
- ✅ Container deployment (working correctly)

**What was missing:**
- ❌ SSL certificate (doesn't cover subdomains)

---

## Deployment Verification Checklist

After fixing the certificate:

- [ ] DNS A record: `kms` → server IP
- [ ] DNS A record: `kms-be` → server IP
- [ ] SSL certificate: Has `*.khaz.app` or wildcard
- [ ] Nginx config: `/etc/nginx/sites-enabled/kms-subdomains` exists
- [ ] Nginx test: `sudo nginx -t` returns OK
- [ ] Nginx reload: `sudo systemctl reload nginx`
- [ ] Browser test: `https://kms.khaz.app/` (no SSL error)
- [ ] Backend test: `https://kms-be.khaz.app/` (no SSL error)

---

## Quick Command Reference

```bash
# Quick renewal with wildcard
sudo certbot renew --force-renewal -d khaz.app -d "*.khaz.app"

# List all certificates
sudo certbot certificates

# Check specific certificate details
sudo openssl x509 -in /etc/letsencrypt/live/khaz.app/fullchain.pem -text -noout

# Reload nginx after certificate update
sudo systemctl reload nginx

# Test SSL certificate (from local machine)
openssl s_client -connect kms.khaz.app:443 -servername kms.khaz.app
```

---

## Architecture Summary

**What Changed:**

| Aspect | Old | New | Certificate Need |
|--------|-----|-----|---|
| Frontend URL | `khaz.app/kms` | `kms.khaz.app` | Wildcard `*.khaz.app` |
| Backend URL | `khaz.app/kms/api` | `kms-be.khaz.app` | Wildcard `*.khaz.app` |
| SSL Cert Domain | `khaz.app` | `*.khaz.app` | **MUST UPDATE** |

---

## Next Steps

1. SSH to staging server
2. Check current certificate (Option 1, Step 1)
3. If no wildcard, renew certificate (Option 1, Step 2)
4. Reload nginx (Option 1, Step 4)
5. Test in browser (Option 1, Step 5)

**Estimated time:** 5-10 minutes (including DNS propagation)
