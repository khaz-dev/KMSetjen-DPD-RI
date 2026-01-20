# Deep Scan: Adding CAPTCHA to Login Page

## Executive Summary
Adding a CAPTCHA between the password input and submit button is technically feasible with minimal code changes. The current form structure provides ample space for CAPTCHA integration.

---

## 1. Current Form Structure Analysis

### LoginPage.js Form Layout (Lines 144-177)
```
1. Email input field (Form.Group)
   ├─ Label: "Alamat Email" / "Email Address"
   ├─ Input type: email
   └─ Validation feedback

2. Password input field (Form.Group)
   ├─ Label: "Sandi" / "Password"
   ├─ Input wrapper with visibility toggle
   ├─ Eye/EyeOff icons
   └─ Validation feedback

3. SUBMIT BUTTON [Masuk] ← CAPTCHA INSERTION POINT
   └─ class: "auth-submit-btn"
   └─ width: 100%
   └─ margin: Related to mb-3 class
```

### Key Measurements:
- **Form max-width**: 450px (line 15, AuthPages.css)
- **Form padding**: 2.5rem (line 21, AuthPages.css)
- **Available width for CAPTCHA**: ~360px
- **Form.Group margin-bottom**: 1rem (line 59, AuthPages.css)
- **Auth submit button**: Full width (100%), 56px height, #0d6efd color

---

## 2. Recommended CAPTCHA Solutions

### Option A: Google reCAPTCHA v3 (Recommended)
**Pros:**
- No UI component - invisible to user
- Best UX integration
- Industry standard
- Free tier available
- Backend can verify token

**Cons:**
- Requires Google Cloud setup
- Need Site Key and Secret Key
- Depends on Google infrastructure

**Integration Complexity**: MEDIUM
**Setup Time**: 30 minutes

**Required Changes:**
1. Install: `npm install react-google-recaptcha`
2. Add reCAPTCHA v3 keys to `.env.local`
3. Wrap form in `<ReCaptchaProvider>`
4. Add `useGoogleReCaptcha()` hook
5. Call `executeRecaptcha()` before form submit
6. Send token to backend for verification

### Option B: Google reCAPTCHA v2 (Checkbox)
**Pros:**
- Checkbox UI - simple and familiar
- Good for accessibility testing
- Free tier
- No JavaScript required for basic display

**Cons:**
- Takes up space (visible element)
- Less intuitive flow
- Can impact UX

**Integration Complexity**: LOW
**Setup Time**: 20 minutes

**Required Changes:**
1. Install: `npm install react-google-recaptcha`
2. Add reCAPTCHA v2 keys to `.env.local`
3. Add `<ReCAPTCHA>` component after password field
4. Add state for captcha token
5. Validate token exists before submit
6. Send token to backend for verification

### Option C: hCaptcha
**Pros:**
- Privacy-focused alternative to Google
- Similar API to reCAPTCHA
- Free tier available
- Less tracking

**Cons:**
- Less widespread
- Requires hCaptcha account

**Integration Complexity**: MEDIUM
**Setup Time**: 30 minutes

### Option D: Simple Math/Logic CAPTCHA
**Pros:**
- No external dependency
- Full control
- Privacy-friendly
- Works offline

**Cons:**
- Not as secure against automated attacks
- Need custom implementation
- UX can vary

**Integration Complexity**: HIGH
**Setup Time**: 1-2 hours

---

## 3. Placement Analysis

### Current Position (RECOMMENDED)
```
┌─────────────────────────────────────┐
│      Email Input                    │  [Already positioned]
│                                     │
│      Password Input + Toggle        │  [Already positioned]
│                                     │
│   [CAPTCHA PLACEMENT HERE]          │  ← NEW
│                                     │
│        [Masuk Button]               │  [Already positioned]
│                                     │
│           atau                      │
│                                     │
│  [Google Section] [SSO Section]     │
└─────────────────────────────────────┘
```

### CSS Modifications Needed:
1. Add `.captcha-container` class for consistent spacing
2. Set margin: `0 0 1rem 0` to match form spacing
3. Ensure width matches form controls (100%)
4. Add dark mode support with CSS variables

### HTML Structure:
```javascript
<Form.Group className="mb-3 captcha-container">
  <CaptchaComponent />
</Form.Group>
```

---

## 4. Code Integration Points

### File: LoginPage.js

#### Import Addition (Line 4):
```javascript
import ReCAPTCHA from "react-google-recaptcha";
// OR
import HCaptcha from "@hcaptcha/react";
```

#### State Addition (Line 32-33):
```javascript
const [captchaToken, setCaptchaToken] = useState(null);
const recaptchaRef = useRef();  // For v3
```

#### Form Data (Line 26-27):
```javascript
// For v2 - add captcha to formData or separate state
const [captchaToken, setCaptchaToken] = useState(null);
```

#### Validation Update (Line 49-58):
```javascript
const validateForm = () => {
  const newErrors = {};
  
  // ... existing validation ...
  
  if (!captchaToken) {
    newErrors.captcha = t('login.captcha_required');
  }
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

#### Submit Handler Update (Line 67-84):
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) return;
  
  try {
    setLoading(true);
    setApiError(null);
    
    // For reCAPTCHA v3:
    // const token = await recaptchaRef.current.executeAsync();
    
    const response = await authService.login({
      email: formData.email,
      password: formData.password,
      captcha_token: captchaToken,  // NEW
    });
    
    // ... rest of handler ...
  }
};
```

#### JSX Insertion (Between password and submit button):
```javascript
{/* Position: After password Form.Group, before submit Button */}
{useRecaptchaV2 && (
  <Form.Group className="mb-3 captcha-container">
    <ReCAPTCHA
      sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
      onChange={(token) => setCaptchaToken(token)}
      theme={theme === 'dark' ? 'dark' : 'light'}
    />
  </Form.Group>
)}
```

### File: AuthPages.css

#### New Styling (After line 327):
```css
/* CAPTCHA Styling */
.captcha-container {
  margin-bottom: 1rem;
  margin-top: 0;
}

.captcha-container iframe {
  max-width: 100%;
  border-radius: 0.375rem;
}

[data-theme="dark"] .captcha-container {
  filter: invert(1) hue-rotate(180deg);
}

.g-recaptcha {
  display: flex;
  justify-content: center;
}
```

### File: .env.local (Frontend)

#### Add Environment Variables:
```dotenv
REACT_APP_RECAPTCHA_SITE_KEY=your_site_key_here
REACT_APP_RECAPTCHA_SECRET_KEY=your_secret_key_here
```

### File: backend/.env

#### Add Environment Variables:
```dotenv
RECAPTCHA_SECRET_KEY=your_secret_key_here
RECAPTCHA_VERIFY_URL=https://www.google.com/recaptcha/api/siteverify
```

---

## 5. Backend Verification Required

### Django Endpoint Modification

**File: backend/auth/views.py**

```python
import requests
from django.conf import settings

class LoginView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        captcha_token = request.data.get('captcha_token')
        
        # Verify CAPTCHA (if enabled)
        if captcha_token and settings.ENABLE_CAPTCHA:
            captcha_valid = self.verify_recaptcha(captcha_token)
            if not captcha_valid:
                return Response(
                    {'detail': 'CAPTCHA verification failed'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # ... rest of login logic ...

    @staticmethod
    def verify_recaptcha(token):
        """Verify reCAPTCHA token with Google"""
        try:
            response = requests.post(
                settings.RECAPTCHA_VERIFY_URL,
                data={
                    'secret': settings.RECAPTCHA_SECRET_KEY,
                    'response': token
                },
                timeout=5
            )
            result = response.json()
            
            # For v3: Check score
            if 'score' in result:
                return result.get('success', False) and result.get('score', 0) > 0.5
            
            # For v2: Check success
            return result.get('success', False)
        except Exception as e:
            logger.error(f"CAPTCHA verification error: {str(e)}")
            return False
```

---

## 6. Translation Strings Needed

### Indonesian (id/translation.json)
```json
"login": {
  "captcha_required": "Silakan verifikasi CAPTCHA",
  "captcha_error": "Verifikasi CAPTCHA gagal, coba lagi"
}
```

### English (en/translation.json)
```json
"login": {
  "captcha_required": "Please verify the CAPTCHA",
  "captcha_error": "CAPTCHA verification failed, please try again"
}
```

---

## 7. Dark Mode Compatibility

### Current System:
- Uses CSS variables: `--form-bg`, `--text-primary`, `--text-secondary`
- Theme switching via `[data-theme="dark"]` selector
- AuthPages.css has dark mode support

### CAPTCHA Considerations:
- reCAPTCHA v2: Built-in dark mode support (theme prop)
- reCAPTCHA v3: No visual element, no theme needed
- hCaptcha: Supports dark theme via props
- Custom CAPTCHA: Full control with CSS variables

---

## 8. Responsive Design Impact

### Mobile Considerations:
- reCAPTCHA v2 checkbox: 360px width on mobile - fits well
- Auth card max-width: 450px
- Current form controls: responsive

### Required Responsive Rules:
```css
@media (max-width: 576px) {
  .captcha-container {
    margin-bottom: 0.75rem;
  }
  
  .g-recaptcha {
    transform: scale(0.9);
    transform-origin: 0 0;
  }
}
```

---

## 9. Implementation Timeline

### Minimal Setup (reCAPTCHA v2):
1. **Frontend Setup** (10 min)
   - Install package
   - Add env variables
   - Add component and state

2. **JSX Insertion** (5 min)
   - Add CAPTCHA component
   - Add onChange handler

3. **Validation** (5 min)
   - Check token in validateForm
   - Add to submit handler

4. **Styling** (5 min)
   - Add CSS container class
   - Dark mode support

5. **Backend Verification** (10 min)
   - Add verification endpoint
   - Add error handling

6. **Testing** (10 min)
   - Manual testing
   - Form submission flow

**Total: ~45 minutes**

---

## 10. Security Considerations

### CAPTCHA Evasion Risks:
1. **Distributed attacks** - CAPTCHA doesn't fully prevent
2. **Token leakage** - Use HTTPS only
3. **Rate limiting** - Implement on backend
4. **Log attempts** - Monitor suspicious activity

### Recommended Additional Security:
```python
# Add rate limiting to login endpoint
from django_ratelimit.decorators import ratelimit

@ratelimit(key='ip', rate='5/m', method='POST')
def login(request):
    # ... login logic ...
```

---

## 11. User Experience Flow

### Current Flow:
```
User enters email → User enters password → User clicks Masuk → Success/Error
```

### With reCAPTCHA v2:
```
User enters email → User enters password → User checks CAPTCHA checkbox → User clicks Masuk → Success/Error
```

### With reCAPTCHA v3:
```
User enters email → User enters password → User clicks Masuk → Background CAPTCHA verification → Success/Error
```

**Recommendation**: reCAPTCHA v3 for best UX (invisible verification)

---

## 12. Accessibility Impact

### CAPTCHA Accessibility:
- reCAPTCHA v2: Has audio challenge option
- reCAPTCHA v3: No accessibility concerns
- hCaptcha: Better accessibility than reCAPTCHA

### WCAG 2.1 Compliance:
- Add aria-label to CAPTCHA container
- Ensure proper form flow
- Keyboard navigation support

---

## 13. Testing Checklist

- [ ] CAPTCHA displays correctly
- [ ] CAPTCHA works in light mode
- [ ] CAPTCHA works in dark mode
- [ ] Form submission blocked without CAPTCHA
- [ ] Form submission succeeds with CAPTCHA
- [ ] Mobile responsive (320px, 768px, 1024px)
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Error messages appear correctly
- [ ] Token refresh works properly
- [ ] Rate limiting prevents abuse

---

## 14. Rollback Plan

If CAPTCHA needs to be disabled:
1. Set `ENABLE_CAPTCHA=False` in .env
2. Comment out CAPTCHA component in JSX
3. Remove CAPTCHA validation from backend
4. No database migration needed

---

## Conclusion

**Recommended Approach**: Use **Google reCAPTCHA v3** for:
- Best UX (invisible to user)
- No form layout disruption
- Industry standard
- Easy to implement in 30-45 minutes

**Integration Difficulty**: LOW-MEDIUM
**User Impact**: MINIMAL (v3) / MODERATE (v2)
**Security Improvement**: MODERATE-HIGH

The insertion point between password and submit button is ideal and requires minimal CSS changes.
