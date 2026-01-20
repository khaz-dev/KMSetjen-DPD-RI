# Slug Immutability Implementation - Complete

## Overview
Successfully implemented slug field restrictions to prevent URL-breaking changes after article publication. The implementation consists of:
- Frontend: Disabled slug field for non-draft articles with clear visual indicators
- Backend: Validation to prevent slug modifications on published articles
- Translations: Added bilingual messaging for slug locking

## Changes Made

### 1. Frontend Changes

#### ArticleEditorPage.js (Lines 350-375)
**What Changed:**
- Added conditional disabling: `disabled={formData.id && formData.status !== 'draft'}`
- Added visual indicator: "(Locked)" badge next to slug label when disabled
- Added conditional messaging: Shows "slug_locked_warning" message for non-draft articles
- Added CSS class: `className="slug-field"` for styling

**Behavior:**
- **New Articles (no ID):** Slug field is fully editable
- **Draft Articles (status='draft'):** Slug field remains editable
- **Published/Other Status Articles:** Slug field is DISABLED, shows:
  - "(Locked)" badge next to label
  - Lock icon with warning message
  - Message: "Slug is locked after publication to preserve URL stability. Only editable in draft status."

```jsx
{formData.id && formData.status !== 'draft' && (
  <span className="slug-locked-badge"> (Locked)</span>
)}
```

#### ArticleEditorPage.css (Added Lines ~385-410)
**New Styling:**
```css
/* Slug field locked state */
.slug-field:disabled {
  background-color: var(--form-bg);
  color: var(--text-secondary);
  opacity: 0.7;
  cursor: not-allowed;
  border-color: var(--border-color);
}

[data-theme="dark"] .slug-field:disabled {
  background-color: #3a3a3a;
  color: #808080;
  border-color: #4a4a4a;
}

.slug-locked-badge {
  font-size: 12px;
  background: #ffc107;
  color: #000;
  padding: 2px 8px;
  border-radius: 12px;
  margin-left: 8px;
  font-weight: 600;
}

.slug-locked-warning {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #ff9800 !important;
  margin-top: 6px;
}

[data-theme="dark"] .slug-locked-warning {
  color: #ffb74d !important;
}
```

**Visual Effects:**
- Disabled field: Faded, reduced opacity (0.7)
- Locked badge: Bright yellow (#ffc107) with black text
- Warning message: Orange text (#ff9800) with lock icon
- Dark mode: Adjusted colors (#3a3a3a background, #ffb74d orange text)

### 2. Translation Keys Added

#### src/locales/en/translation.json (Line 460)
```json
"slug_locked_message": "Slug is locked after publication to preserve URL stability. Only editable in draft status."
```

#### src/locales/id/translation.json (Line 380)
```json
"slug_locked_message": "Slug dikunci setelah publikasi untuk menjaga stabilitas URL. Hanya dapat diedit di status draft."
```

#### public/locales/en/translation.json (Synced)
```json
"slug_locked_message": "Slug is locked after publication to preserve URL stability. Only editable in draft status."
```

#### public/locales/id/translation.json (Synced)
```json
"slug_locked_message": "Slug dikunci setelah publikasi untuk menjaga stabilitas URL. Hanya dapat diedit di status draft."
```

### 3. Backend Validation

#### backend/apps/api/v1/internal/serializers.py

**Modified InternalArticleUpdateSerializer:**

Added to Meta.fields:
```python
fields = [
    'title_id', 'title_en', 'content_id', 'content_en',
    'summary_id', 'summary_en', 'category', 'tags',
    'status', 'access_level', 'allowed_roles',
    'is_bilingual', 'language', 'slug'  # ← Added
]
```

Added extra_kwargs:
```python
'slug': {'required': False},
```

New Validation Method (Lines 138-153):
```python
def validate_slug(self, value):
    """Validate slug can only be changed for draft articles."""
    if self.instance and self.instance.pk:
        # This is an update operation (article already exists)
        current_slug = self.instance.slug
        
        # If slug is being changed
        if value != current_slug:
            # Only allow slug changes for draft articles
            if self.instance.status != 'DRAFT':
                raise serializers.ValidationError(
                    "Slug cannot be modified after publication. "
                    "Slug is locked for all articles except drafts to preserve URL stability."
                )
    
    return value
```

**Behavior:**
- Allows slug changes when creating new articles (no instance.pk)
- Allows slug changes for draft articles (`status == 'DRAFT'`)
- Blocks slug changes for published/submitted/approved articles
- Returns clear error message if violation detected
- Backend enforces unique constraint on slug field

## How It Works

### User Flow - New Article
1. User starts creating a new article
2. Slug field is editable (no ID yet)
3. Slug auto-generates from title as user types
4. User can manually edit slug before saving
5. Article saved in DRAFT status
6. Slug field remains editable (status is 'draft')

### User Flow - Edit Draft Article
1. User opens draft article for editing
2. formData.id exists, status is 'draft'
3. Slug field is editable
4. User can modify slug before submission
5. User changes status to 'PENDING_REVIEW'
6. Backend accepts and saves changes

### User Flow - Edit Published Article
1. User opens published article for editing
2. formData.id exists, status is 'PUBLISHED'
3. Slug field is DISABLED with visual indicators
4. User sees:
   - "(Locked)" badge next to "URL Slug" label
   - Faded, disabled field
   - Lock icon with warning message
   - Message explaining URL stability
5. User cannot modify slug
6. If user tries to send PUT request with modified slug via curl/API:
   - Backend validation catches the change
   - Returns 400 Bad Request error
   - Error message: "Slug cannot be modified after publication..."

## Error Handling

### Frontend Prevents Changes
- Form field is disabled (`disabled` attribute)
- User cannot type in field when disabled

### Backend Double-Check
- If user somehow bypasses frontend (curl, direct API call)
- Backend serializer validation catches attempt
- Returns validation error: "Slug cannot be modified after publication. Slug is locked for all articles except drafts to preserve URL stability."
- HTTP 400 Bad Request response

## Data Integrity

**Protected Data:**
- Article slug remains immutable after publication
- URL structure stays consistent
- External links remain valid
- SEO optimization preserved

**When Slug CAN Change:**
- Before first save (new article)
- While article is in DRAFT status
- At any point before submission/publication

**When Slug CANNOT Change:**
- After article published
- After article submitted for review
- After article approved
- After article scheduled
- After article archived

## Validation Rules

| Status | Slug Editable? | Details |
|--------|---|---|
| New Article (no ID) | ✅ YES | Can set/modify before saving |
| DRAFT | ✅ YES | Full editorial control |
| PENDING_REVIEW | ❌ NO | Under review, immutable |
| APPROVED | ❌ NO | Approved, immutable |
| PUBLISHED | ❌ NO | Live, URL locked |
| SCHEDULED | ❌ NO | Scheduled, immutable |
| REJECTED | ✅ YES | Can be re-edited before resubmit? (Depends on business logic) |
| ARCHIVED | ❌ NO | Archived, immutable |

**Note:** Current implementation allows changes only when `status == 'DRAFT'`. To modify this for REJECTED status, update the condition in `validate_slug()` method.

## Testing Checklist

### Frontend Testing
- [ ] Open new article form - slug field is editable
- [ ] Switch language to Indonesian - messaging appears in Indonesian
- [ ] Save article as draft - slug field remains editable
- [ ] Change status to "Pending Review" - slug field becomes disabled
- [ ] Observe "(Locked)" badge appears next to label
- [ ] Observe lock icon and warning message
- [ ] Dark mode - colors visible and readable

### Backend Testing
- [ ] Create new article with slug - succeeds
- [ ] Update draft article with new slug - succeeds
- [ ] Update published article with same slug - succeeds (no change)
- [ ] Update published article with different slug - fails with validation error
- [ ] Verify error message returned to client
- [ ] Test with curl: `curl -X PATCH /api/articles/{id}/ -d '{"slug": "new-slug"}'` - should fail if published

### API Response Testing
- [ ] GET article detail returns slug field
- [ ] Slug value matches database
- [ ] InternalArticleDetailSerializer includes slug

## Files Modified

1. **frontend/src/pages/ArticleEditorPage.js** - Added slug field disable logic and visual indicators
2. **frontend/src/pages/ArticleEditorPage.css** - Added styling for disabled and locked states
3. **frontend/src/locales/en/translation.json** - Added slug_locked_message
4. **frontend/src/locales/id/translation.json** - Added slug_locked_message (Indonesian)
5. **frontend/public/locales/en/translation.json** - Synced slug_locked_message
6. **frontend/public/locales/id/translation.json** - Synced slug_locked_message (Indonesian)
7. **backend/apps/api/v1/internal/serializers.py** - Added slug field and validation method

## Backward Compatibility

- ✅ Existing draft articles can still have slug modified
- ✅ Existing published articles slug remains locked
- ✅ API still accepts slug in update payload
- ✅ API returns slug in detail responses
- ✅ No database schema changes required

## Security Implications

**Prevented Attacks:**
- User cannot accidentally change URL slug of published article
- Prevents URL hijacking via slug modification
- Admin cannot silently redirect published article to new URL
- Preserves existing external links and bookmarks

**Audit Trail:**
- Any attempted slug modification on non-draft articles is caught by backend
- Error is logged (if audit logging enabled)
- User receives clear message about why change failed

## Future Enhancements

1. **Audit Log Enhancement:** Log all failed slug modification attempts
2. **Admin Override:** Allow admins to change slug with audit trail
3. **Slug History:** Keep history of all slug values for deleted URLs
4. **301 Redirects:** Auto-create 301 redirects when slug must change
5. **Status-Based Rules:** Different restrictions for different statuses

## Conclusion

Implementation is complete and provides:
- ✅ Clear visual indicators when slug is locked
- ✅ Bilingual messaging (English and Indonesian)
- ✅ Backend validation to prevent unauthorized changes
- ✅ Dark mode support
- ✅ SEO-safe URL immutability after publication
- ✅ User-friendly error messages
