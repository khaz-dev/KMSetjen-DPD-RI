# Article Versioning System - Implementation Complete ✅

**Date:** April 4, 2026  
**Status:** ✅ IMPLEMENTED & TESTED  
**Issue Resolved:** Slug conflicts when saving published articles as draft

---

## Problem Summary

When editing a published article and clicking "Save as Draft", users received an error:
```
Slug sudah digunakan. Silahkan pilih slug yang berbeda
(Slug already used. Please choose a different slug)
```

**Root Cause:** Single Article record with unique slug constraint globally. When editing published articles, the slug validation would conflict with the existing record.

---

## Solution: Draft & Published Versioning

Instead of one article with status changes, we now have:

### **Draft Version**
- What contributors edit
- Can be freely modified
- Internal API only
- Can use any slug (unique per draft namespace)
- Published after admin approval
- Author can edit at any time

### **Published Version**  
- Read-only public copy
- Created when draft is approved
- Public API only (displays to end users)
- Can use same slug as draft or different
- Shows stable version to public
- Updates when draft is re-published

---

## Database Schema Changes

### New Fields in Article Model

```python
# Versioning fields
version_type = CharField(
    choices=[('draft', 'Draft Version'), ('published', 'Published Version')],
    default='draft'
)

draft_article = OneToOneField(
    self,
    null=True,
    blank=True,
    related_name='published_version'
)  # Published versions link back to their draft
```

### Slug Uniqueness
- **Before:** Globally unique (`unique=True`)
- **After:** Unique per version type (`UNIQUE(version_type, slug)`)
- **Result:** Draft can use same slug as published version!

---

## Workflow: Creating & Publishing Articles

### Step 1: Create Draft
```
Author: Create new article → Saved as Draft Version (ID: 5)
- version_type = 'draft'
- status = 'draft'
- slug = 'test-article'
```

### Step 2: Edit Draft
```
Author: Edit and save again → Same Draft (ID: 5)
- version_type = 'draft' (unchanged)
- status = 'draft' (unchanged)
- slug = 'test-article' (no conflict! ✅)
```

### Step 3: Submit for Review
```
Author: Click "Kirim untuk Review"
- status = 'review' (same draft record)
- Draft still ID: 5
```

### Step 4: Admin Approves
```
Admin: Click "Setujui"  
- Draft status → 'approved'
- Draft still ID: 5 (not changed)
```

### Step 5: Publish
```
Admin: Click "Publikasikan"
- NEW Published record created (ID: 42)  
  - version_type = 'published'
  - status = 'published'
  - slug = 'test-article'
  - draft_article = 5 (links back to draft)
- Draft status → 'approved'
- Draft remains ID: 5 in system (Hidden from public)
```

### Step 6: Edit After Publication
```
Author: Edit draft again (ID: 5)
- Save draft → works! ✅ No slug conflict
- Slug 'test-article' exists but in DIFFERENT version_type
- Published version (ID: 42) unaffected
```

### Step 7: Republish
```
Admin: Re-publish after edits
- Update existing Published (ID: 42) with new content
- OR create new Published if needed
- Draft remains editable
```

---

## API Changes

### Check Slug Endpoint
```http
GET /api/v1/internal/articles/check-slug/
  ?slug=test-article
  &exclude_id=5
  &version_type=draft  ← NEW PARAMETER
```

**Behavior:**
- Checks if slug exists in DRAFT namespace only
- Draft 'test-article' ≠ Published 'test-article'
- Same slug can exist in both versions! ✅

### Internal API (Contributors)
- Shows: DRAFT articles only
- Hides: Published versions
- Endpoint: `/api/v1/internal/articles/`

### Public API (End Users)  
- Shows: PUBLISHED versions only
- Hides: Draft articles
- Endpoint: `/api/v1/public/articles/`

---

## Database Queries After Changes

### Get user's draft articles (for editing)
```python
Article.objects.filter(
    author=user,
    version_type='draft'
)
```

### Get article for public view
```python
Article.objects.filter(
    slug='test-article',
    version_type='published'  # Only published
)
```

### Check slug availability (draft)
```python
Article.objects.filter(
    slug='test-article',
    version_type='draft'     # Check in draft namespace
).exclude(id=current_id)      # Exclude self
```

---

## Benefits

| Issue | Before | After |
|-------|--------|-------|
| Slug conflict when re-saving | ❌ Error | ✅ Works |
| Edit published article | ❌ Can't change | ✅ Edit draft freely |
| Public sees edits immediately | ✅ | ❌ (more stable!) |
| Author freedom | ❌ Limited | ✅ Full |
| URL stability | ✅ | ✅ (maintained) |
| Versioning support | ❌ | ✅ (foundation ready) |

---

## Code Changes Summary

### Backend Changes

1. **Model** (`apps/content/models.py`)
   ```python
   - Added version_type field
   - Added draft_article link
   - Changed slug constraint to (version_type, slug)
   ```

2. **Slug Validation** (`check_slug` endpoint)
   ```python
   - Filter by version_type
   - Check availability within version namespace
   ```

3. **Publishing** (`publish` action)
   ```python
   - Create new published version from draft
   - Keep draft editable
   - Link draft→published via draft_article FK
   ```

4. **API Filters**
   ```python
   - Internal: Show only draft articles
   - Public: Show only published articles
   ```

### Frontend Changes

1. **Slug Checking** (`ArticleEditorPage.jsx`)
   ```javascript
   - Pass version_type='draft' to API
   - Always check draft namespace
   ```

### Database Changes

1. **Migrations**
   - `0011_add_article_versioning`: Schema changes
   - `0012_populate_version_type`: Set existing to draft
   - `0013_...`: Auto-generated index cleanup

---

## Migration Path (Existing Articles)

All existing articles automatically set as:
```
version_type = 'draft'
draft_article = NULL  # No published versions yet
```

- Published articles remain as draft version
- Authors can continue editing freely
- When re-published, creates published version

---

## Testing Checklist

- [x] Migrations applied successfully
- [x] Draft version created on article save
- [x] Slug check respects version_type
- [x] Can save draft multiple times without conflict
- [x] Can edit published article's draft
- [x] Publish creates new version record
- [x] Public API shows published only
- [x] Internal API shows draft only

---

## Future Enhancements

### Version History (Optional)
Could add:
- `published_version_number` field
- `version_history` queryset method
- UI to show v1, v2, v3, etc.
- Rollback to previous version

### Scheduled Publishing
- Schedule1 maintenance
- Auto-publish at specific time
- Webhook notifications

### Collaborative Editing
- Multiple drafts per article
- Branching/merging workflow
- Comment-based collaboration

---

## Rollback Plan (If Needed)

To revert to single-version system:
```sql
DELETE FROM content_article WHERE version_type = 'published';
ALTER TABLE content_article DROP COLUMN version_type;
ALTER TABLE content_article DROP COLUMN draft_article_id;
ALTER TABLE content_article ADD UNIQUE (slug);
```

**Note:** Data loss of published versions if rolled back!

---

## Notes for QA

1. **Existing Articles:** Will show as drafts, which is correct
2. **New Articles:** Create as draft, publish creates published version
3. **Slug Changes:** Only work on draft articles, published frozen
4. **Public View:** Always sees latest published version
5. **Author View:** Always sees draft (internal API)

---

## Deployment Checklist

- [x] Database migrations tested
- [x] API endpoints updated
- [x] Frontend slug checking updated
- [x] Public API filtering updated
- [x] Internal API filtering updated
- [ ] Load test with versioning
- [ ] User acceptance testing
- [ ] Production backup before deploy

---

**Status:** Ready for testing and deployment ✅
