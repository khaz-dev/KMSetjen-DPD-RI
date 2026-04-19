# Delete Cascade Issue - Root Cause Analysis

## 🔴 The Problem

When a user clicks "Hapus" (Delete) button to delete a DRAFT article from the dashboard:

### What SHOULD Happen:
- ✅ Draft article deleted
- ✅ Draft article's files deleted  
- ✅ Published version remains intact
- ✅ Published version's files remain intact

### What ACTUALLY Happens (BUG):
- ✅ Draft article deleted
- ✅ Draft article's files deleted
- ❌ **Published version is ALSO deleted** (CASCADE)
- ❌ **Published version's files are ALSO deleted**

## Root Causes

### Issue 1: CASCADE on draft_article ForeignKey
**Location**: [backend/apps/content/models.py](backend/apps/content/models.py#L244) (line 244)

```python
draft_article = models.OneToOneField(
    'self',
    on_delete=models.CASCADE,  # ❌ PROBLEM: Deletes published version when draft is deleted!
    null=True,
    blank=True,
    related_name='published_version',
)
```

**How it works**:
- Draft article has `draft_article=NULL` (it IS the draft)
- Published article has `draft_article=draft_article_instance` (points to draft)
- When draft is deleted with `on_delete=models.CASCADE`
- Django CASCADE deletes the reverse relationship (`published_version`)
- Published article is deleted even though user only deleted the draft!

### Issue 2: CASCADE on File.article ForeignKey
**Location**: [backend/apps/content/models.py](backend/apps/content/models.py#L680) (line 680)

```python
article = models.ForeignKey(
    Article,
    on_delete=models.CASCADE,  # When article deleted, files cascade deleted
    related_name='files',
)
```

**Impact**:
- When draft article deleted → its files deleted ✓ (correct)
- When published article CASCADE deleted → its files deleted ✗ (wrong side effect)

## 🔍 Flow of the Bug

```
User clicks "Hapus" on dashboard
           ↓
DELETE /api/v1/internal/articles/{draft_id}/
           ↓
ArticleViewSet.destroy() calls Article.delete()
           ↓
CASCADE on draft_article field triggers
           ↓
Published version Article is deleted (on_delete=CASCADE)
           ↓
CASCADE on File.article field triggers  
           ↓
All published article files deleted!
           ↓
Published article completely removed with all files
```

## ✅ The Solution

### Step 1: Change draft_article ForeignKey on_delete behavior
Change `on_delete=models.CASCADE` to `on_delete=models.SET_NULL`

**Result**:
- When draft deleted, published_version's draft_article becomes NULL
- Published article remains in database
- Relationship is broken but article survives

### Step 2: Custom delete() method in Article model
Override `delete()` to properly handle cleanup:
- Only delete files if it's a draft being deleted
- Don't try to delete published version's files
- Only delete published version's draft_article relationship if it exists

### Step 3: Ensure File cleanup is proper
- Files are deleted when their Article is deleted ✓ (CASCADE works)
- But ensure we only delete draft files when deleting draft
- Published files stay intact when published article remains
