# Delete Cascade Bug Fix - Quick Reference

## Problem
Clicking "Hapus" (Delete) on a DRAFT article deleted BOTH the draft AND published versions, including all files from both.

## Root Cause  
`draft_article` ForeignKey had `on_delete=models.CASCADE`, which cascade-deleted the published version when draft was deleted.

## Solution
1. Changed `on_delete=models.CASCADE` to `on_delete=models.SET_NULL`
2. Added custom `delete()` method to properly clean up storage files
3. Created and applied database migration

## Result
✅ **Deleting draft now preserves published version and all files**

### What happens now:

**Delete Draft Article (with Published Version)**:
- ✅ Draft deleted from DB
- ✅ Draft files deleted from storage
- ✅ Published version REMAINS in DB
- ✅ Published files REMAIN in storage
- ✅ Published version's draft_article field = NULL

**Delete Published Article**:
- ✅ Published deleted from DB
- ✅ Published files deleted from storage
- ✅ Draft version REMAINS in DB
- ✅ Draft can still be edited or republished

## Files Modified
- [backend/apps/content/models.py](backend/apps/content/models.py) - 2 changes
- Migration: `0014_alter_article_draft_article_alter_article_image_and_more`

## Status
🟢 **COMPLETE & TESTED** - Draft/Published versions now properly independent
