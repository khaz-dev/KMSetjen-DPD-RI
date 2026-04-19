# Root Cause Analysis: Article Save Failure (500 Error)

## Problem Summary
When trying to save article 27, the frontend receives:
- **HTTP 500 Internal Server Error**
response with generic message: "An unexpected error occurred"
- User notification: "Kesalahan! Gagal menyimpan draf"

## Root Causes Identified

### Issue 1: Backend Exception Handler Was Broken (FIXED)
**What happened:**
- Django REST Framework custom exception handler couldn't be properly imported
- Validation errors (which would normally be 400 Bad Request) became 500 Internal Server Errors
- This masked the actual validation failure from the user

**What we fixed:**
- Improved `backend/shared/exceptions/handlers.py` with better error handling
- Now catches and logs errors gracefully
- Returns detailed validation error messages in response

### Issue 2: Frontend Sends Invalid Field Values (ROOT CAUSE)
**What's happening:**
- Frontend sends status as `"DRAFT"` or `"PUBLIC"` (UPPERCASE)
- Backend expects `"draft"` or `"internal"` (lowercase)
- Serializer validation rejects uppercase values with error:
  ```
  "status": ["\"DRAFT\" tidak ada dalam daftar pilihan."]
  "access_level": ["\"PUBLIC\" tidak ada dalam daftar pilihan."]
  ```

**Why it happens:**
- Backend returns lowercase values correctly (e.g., `status: "draft"`)
- But somewhere in the submission process, these get uppercased
- This could be:
  - Hard-coded uppercase values in form options
  - A transformation function converting them
  - HTML form select element with wrong values

**Database values are correct:**
```
Article 27:
  - status: 'draft' (correct)
  - access_level: 'internal' (correct)
```

**API response is correct:**
```json
{
  "id": 27,
  "status": "draft",
  "access_level": "internal"
}
```

## Solutions Implemented

### 1. Improved Error Handling (Backend)
**File:** `backend/shared/exceptions/handlers.py`
- Added proper try-catch around exception handling
- Validation errors now return 400 (not 500) with detailed field-specific messages
- Errors include clear information about what failed and why

### 2. Better Error Display (Frontend)
**File:** `frontend/src/pages/ArticleEditorPage.jsx`
- Updated error handling in `saveDraft()` function
- Now extracts and displays detailed validation errors from backend
- Shows field-specific errors so users know exactly what's wrong
- Example: "status: "DRAFT" tidak ada dalam daftar pilihan."

### 3. What Still Needs to be Done
The frontend code appears correct when reviewed:
- Default values use lowercase: `status: 'draft'`, `access_level: 'public'`
- Loading from API preserves lowercase values
- No `toUpperCase()` calls found in the code

**Next steps to investigate:**
1. Check if old/cached frontend code is still being served
2. Verify browser is not caching old JavaScript
3. Run actual network capture to see what bytes are sent
4. Check if there's form data transformation happening

## Testing

### Backend Validation Test Results
```
✓ TEST 1 (Lowercase): PASSED
  - status: "draft" ✓
  - access_level: "internal" ✓

✗ TEST 2 (Uppercase): FAILED (expected)
  - status: "DRAFT" error: "DRAFT" tidak ada dalam daftar pilihan
  - access_level: "PUBLIC" error: "PUBLIC" tidak ada dalam daftar pilihan

✓ Serializer correctly validates values ✓
```

## Field Value Mapping
**Correct values (what backend expects):**
- Status: `"draft"`, `"review"`, `"approved"`, `"published"`, `"rejected"`, `"scheduled"`, `"archived"`
- Access Level: `"public"`, `"internal"`, `"role_based"`

**Incorrect values (causing errors):**
- Status: `"DRAFT"`, `"REVIEW"`, etc. (uppercase)
- Access Level: `"PUBLIC"`, `"INTERNAL"` (uppercase)

## How to Test the Fix
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R)
3. Navigate to http://localhost:5175/editor/27
4. Make any small change to the form
5. Try to save
6. Should now see either:
   - Success message if data is correct, OR
   - Detailed error message showing exactly what's invalid

## Error Message Improvements
**Before fix:**
```
Toast notification: "Kesalahan! Gagal menyimpan draf"
Console: Generic "An unexpected error occurred"
Result: User confused, no idea what went wrong
```

**After fix:**
```
Toast notification: Shows specific field error
Example: "status: \"DRAFT\" tidak ada dalam daftar pilihan."
Result: User knows exactly what needs to be fixed
```
