# Slug Validation - Testing Guide

## Quick Start

The slug validation system is now fully implemented with:
- ✓ Real-time format validation (instant feedback)
- ✓ Real-time availability checking (500ms debounced API call)
- ✓ Bilingual messages (English & Indonesian)
- ✓ Dark/Light mode support
- ✓ Form submission validation

## How It Works

### 1. Automatic Slug Generation
When you type a title, the slug automatically generates:
```
Title: "Hello World!"
↓
Slug: "hello-world"
```

### 2. Format Validation (Instant)
As soon as you modify the slug, it validates the format:
```
Valid slug:     "my-article"      ✓ Green border
Too short:      "ab"              ✗ Red border + error message
Too long:       [256+ chars]      ✗ Red border + error message
Invalid chars:  "my_article"      ✗ Red border + error message
Starts w/dash:  "-my-article"     ✗ Red border + error message
Ends w/dash:    "my-article-"     ✗ Red border + error message
Consecutive:    "my--article"     ✗ Red border + error message
```

### 3. Availability Check (Debounced - 500ms)
After format is valid, the system checks if slug is already used:
```
Valid format
    ↓
Wait 500ms (debouncing)
    ↓
Show "Checking..." badge (blue, pulsing)
    ↓
Check with backend API
    ↓
Show result:
  ✓ "Slug is valid and available" (green)
  ✗ "Slug is already in use" (red)
```

## Testing Scenarios

### Scenario 1: Valid Slug
**Steps:**
1. Open article editor
2. Enter title: "My First Article"
3. Slug auto-generates: "my-first-article"
4. Wait 500ms
5. See: Green border + "✓ Slug is valid and available"

**Expected:**
- Green border with success glow
- Green checkmark icon
- Success message in green text
- Can submit form

---

### Scenario 2: Slug Too Short
**Steps:**
1. Clear slug field
2. Type: "ab"
3. Watch in real-time

**Expected:**
- Red border with error glow
- Red X icon
- Error message: "✗ Slug must be between 3 and 255 characters long"
- Message in red text
- Cannot submit (blocked)

---

### Scenario 3: Invalid Characters
**Steps:**
1. Clear slug field
2. Type: "my_article-2024"
3. Watch in real-time

**Expected:**
- Red border immediately
- Error message: "✗ Slug can only contain lowercase letters, numbers, and hyphens"
- Cannot submit

---

### Scenario 4: Slug with Uppercase
**Steps:**
1. Clear slug field
2. Type: "My-Article"
3. Watch in real-time

**Expected:**
- Red border (uppercase not allowed)
- Error message: "✗ Slug can only contain lowercase letters, numbers, and hyphens"

---

### Scenario 5: Duplicate Slug
**Steps:**
1. Create article 1 with slug: "my-article"
2. Create article 2
3. Type slug: "my-article"
4. Wait 500ms for API check

**Expected:**
- Green border disappears during "Checking..."
- Red border after check completes
- Error message: "✗ Slug is already in use. Please choose a different slug."
- Cannot submit

---

### Scenario 6: Leading Hyphen
**Steps:**
1. Clear slug field
2. Type: "-my-article"

**Expected:**
- Red border
- Error message: "✗ Slug cannot start with a hyphen"

---

### Scenario 7: Trailing Hyphen
**Steps:**
1. Clear slug field
2. Type: "my-article-"

**Expected:**
- Red border
- Error message: "✗ Slug cannot end with a hyphen"

---

### Scenario 8: Consecutive Hyphens
**Steps:**
1. Clear slug field
2. Type: "my--article"

**Expected:**
- Red border
- Error message: "✗ Slug cannot contain consecutive hyphens"

---

### Scenario 9: Bilingual Support (English)
**Steps:**
1. Set language to English
2. Enter invalid slug (e.g., "my_article")

**Expected:**
- Error message in English
- Example: "✗ Slug can only contain lowercase letters, numbers, and hyphens"

---

### Scenario 10: Bilingual Support (Indonesian)
**Steps:**
1. Set language to Indonesian
2. Enter invalid slug (e.g., "my_article")

**Expected:**
- Error message in Indonesian
- Example: "✗ Slug hanya dapat berisi huruf kecil, angka, dan tanda hubung"

---

### Scenario 11: Dark Mode
**Steps:**
1. Switch to dark mode
2. Enter invalid slug

**Expected:**
- Red border with bright red glow (not dark red)
- Error text in bright red (#ff6b6b)
- Icons clearly visible
- Proper contrast (readable)

---

### Scenario 12: Light Mode
**Steps:**
1. Switch to light mode
2. Enter valid slug

**Expected:**
- Green border with green glow (#198754)
- Success text in green
- Icons clearly visible
- Proper contrast (readable)

---

### Scenario 13: Form Submission - Valid Slug
**Steps:**
1. Fill all required fields (title, content, category)
2. Ensure slug shows green "✓ Slug is valid and available"
3. Click "Submit for Review"

**Expected:**
- Form submits successfully
- Article status changes to "submitted"

---

### Scenario 14: Form Submission - Invalid Slug
**Steps:**
1. Fill all required fields
2. Manually edit slug to invalid value (e.g., "ab")
3. Click "Submit for Review"

**Expected:**
- Form does NOT submit
- Error alert appears: "✗ Slug must be between 3 and 255 characters long"
- Focus returns to slug field

---

### Scenario 15: Form Submission - Duplicate Slug
**Steps:**
1. Create article 1 with slug: "existing-article"
2. Create article 2
3. Type same slug: "existing-article"
4. Wait for availability check
5. Click "Submit for Review"

**Expected:**
- Form does NOT submit
- Error alert appears: "✗ Slug is already in use. Please choose a different slug."

---

### Scenario 16: Edit Existing Article
**Steps:**
1. Edit published article (status: "published")
2. Try to edit slug field

**Expected:**
- Slug field is DISABLED (greyed out)
- Yellow badge shows: "Slug is locked after publication..."
- Cannot type in field

---

### Scenario 17: Edit Draft Article
**Steps:**
1. Edit draft article (status: "draft")
2. Title is editable
3. Slug auto-generates from title changes

**Expected:**
- Slug field is ENABLED
- Changing title updates slug
- Can manually edit slug
- Validation works normally

---

## Error Messages Reference

### English:
| Error | Message |
|-------|---------|
| Format | "✗ Slug can only contain lowercase letters, numbers, and hyphens" |
| Length | "✗ Slug must be between 3 and 255 characters long" |
| Leading Hyphen | "✗ Slug cannot start with a hyphen" |
| Trailing Hyphen | "✗ Slug cannot end with a hyphen" |
| Consecutive | "✗ Slug cannot contain consecutive hyphens" |
| Duplicate | "✗ Slug is already in use. Please choose a different slug." |
| Valid | "✓ Slug is valid and available" |

### Indonesian:
| Error | Message |
|-------|---------|
| Format | "✗ Slug hanya dapat berisi huruf kecil, angka, dan tanda hubung" |
| Length | "✗ Slug harus antara 3 dan 255 karakter" |
| Leading Hyphen | "✗ Slug tidak boleh dimulai dengan tanda hubung" |
| Trailing Hyphen | "✗ Slug tidak boleh berakhir dengan tanda hubung" |
| Consecutive | "✗ Slug tidak dapat berisi tanda hubung berturut-turut" |
| Duplicate | "✗ Slug sudah digunakan. Silakan pilih slug yang berbeda." |
| Valid | "✓ Slug valid dan tersedia" |

## Visual Indicators

### Light Mode 🌞
- **Valid (Green)**: Border #198754, Text #198754, Icon ✓
- **Invalid (Red)**: Border #dc3545, Text #dc3545, Icon ✗
- **Checking (Blue)**: Badge #0d6efd, Pulsing animation

### Dark Mode 🌙
- **Valid (Bright Green)**: Border #51cf66, Text #51cf66, Icon ✓
- **Invalid (Bright Red)**: Border #ff6b6b, Text #ff6b6b, Icon ✗
- **Checking (Blue)**: Badge #0d6efd, Pulsing animation

## Performance Notes

- **Format validation**: Instant (synchronous)
- **Availability check**: 500ms debounce (reduced API calls)
- **No lag** during typing
- **Smooth transitions** between states
- **Proper cleanup** of debounce timeouts

## Troubleshooting

### Slug validation shows "Could not verify slug availability"
- **Cause**: Backend API unreachable
- **Solution**: Check if backend is running on port 8000
- **Check**: Browser console for network errors

### Bilingual messages not showing
- **Cause**: Translation keys not found
- **Solution**: Verify keys exist in translation JSON files
- **Check**: Browser console for i18next warnings

### Dark mode colors not applying
- **Cause**: `[data-theme="dark"]` attribute not set
- **Solution**: Verify dark mode toggle sets this attribute on html element
- **Check**: Browser DevTools > Elements > html tag

### Form submits despite invalid slug
- **Cause**: Validation logic bypass
- **Solution**: Verify `validateSlugFormat()` is called before submit
- **Check**: Browser console for errors before form submission

## Success Criteria ✓

- [x] Slug validation messages are bilingual (EN/ID)
- [x] All messages are translated correctly
- [x] Dark mode styling applies to all validation states
- [x] Light mode styling looks professional
- [x] Real-time format validation (instant feedback)
- [x] Real-time availability checking (debounced)
- [x] Form submission blocked for invalid slugs
- [x] Error messages are specific and actionable
- [x] Icons display correctly in both modes
- [x] Color contrast meets accessibility standards
- [x] No hard-coded messages in UI (all translatable)
- [x] Proper error handling for API failures
