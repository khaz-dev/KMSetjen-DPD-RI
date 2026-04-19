# Delete Cascade Bug Fix - Testing Guide

## Test Environment Setup

### Prerequisites
- Backend running on http://0.0.0.0:8002
- Frontend running on http://localhost:5175
- Access to database queries (psql or Django shell)
- Administrator or Editor account

## Test Scenarios

### Test 1: Delete Draft Article WITHOUT Published Version

**Setup**:
1. Create a new article with title "Test Draft Only"
2. Add featured image
3. Upload 2 file attachments
4. Keep status as DRAFT
5. Don't publish

**Action**:
1. Navigate to dashboard
2. Find "Test Draft Only" article
3. Click "Hapus" button
4. Confirm deletion

**Expected Results**:
- ✅ Article removed from dashboard
- ✅ Database: Article record deleted
- ✅ Database: File records deleted
- ✅ Storage: Featured image deleted
- ✅ Storage: File attachments deleted

**Verification**:
```sql
-- Should return empty result
SELECT * FROM content_article WHERE title_id LIKE '%Test Draft Only%';
SELECT * FROM content_file WHERE article_id IN (SELECT id FROM content_article WHERE title_id LIKE '%Test Draft Only%');
```

---

### Test 2: Delete Draft Article WITH Published Version

**Setup**:
1. Create article with title "Test Draft+Published"
2. Add featured image: `featured_draft.jpg`
3. Upload file: `document_draft.pdf`
4. Publish article (this creates published version)
5. Published version will have:
   - Featured image: `featured_published.jpg` (copied)
   - File: `document_published.pdf` (copied)

**Action**:
1. Navigate to dashboard
2. Find "Test Draft+Published" article in draft list
3. Click "Hapus" button
4. Confirm deletion

**Expected Results**:
- ✅ Draft article removed from dashboard
- ✅ Draft NOT listed in articles anymore
- ✅ Database: Draft article deleted
- ✅ Database: Draft file records deleted
- ✅ Database: Published article STILL EXISTS with draft_article=NULL
- ✅ Storage: Draft featured image deleted
- ✅ Storage: Draft file attachment deleted
- ✅ Storage: Published featured image STILL EXISTS
- ✅ Storage: Published file attachment STILL EXISTS

**Verification**:
```sql
-- Draft should be deleted
SELECT * FROM content_article 
WHERE title_id = 'Test Draft+Published' AND version_type = 'draft';
-- Result: Empty ✅

-- Published should exist with draft_article = NULL
SELECT * FROM content_article 
WHERE title_id = 'Test Draft+Published' AND version_type = 'published';
-- Result: 1 record with draft_article = NULL ✅

-- Published should have files
SELECT * FROM content_file 
WHERE article_id IN (
    SELECT id FROM content_article 
    WHERE title_id = 'Test Draft+Published' AND version_type = 'published'
);
-- Result: 2 file records ✅
```

**Frontend Verification**:
1. Check published article is still viewable at public URL
2. Featured image displays correctly
3. File attachments are downloadable

---

### Test 3: Delete Published Article Directly (Admin)

**Setup** (requires admin access):
1. Take published article from Test 2
2. Note the published article ID
3. Use Django admin or direct API call

**Action**:
```bash
# Using Django shell or direct API delete
DELETE /api/v1/internal/articles/{published_id}/
```

**Expected Results**:
- ✅ Published article deleted
- ✅ Database: Published article record deleted
- ✅ Database: Published file records deleted
- ✅ Storage: Published featured image deleted
- ✅ Storage: Published file attachments deleted
- ✅ Database: Draft article STILL EXISTS (unaffected)

**Verification**:
```sql
-- Published should be deleted
SELECT * FROM content_article 
WHERE title_id = 'Test Draft+Published' AND version_type = 'published';
-- Result: Empty ✅

-- Draft should still exist
SELECT * FROM content_article 
WHERE title_id = 'Test Draft+Published' AND version_type = 'draft';
-- Result: 1 record (if draft wasn't deleted yet) ✅
```

---

### Test 4: Delete Article with NO Files

**Setup**:
1. Create minimal article (title only)
2. No featured image
3. No file attachments

**Action**:
1. Delete from dashboard

**Expected Results**:
- ✅ Article deleted cleanly
- ✅ No storage errors
- ✅ No database errors

---

### Test 5: Delete Article with Only Featured Image

**Setup**:
1. Create article
2. Add featured image
3. No file attachments

**Action**:
1. Delete from dashboard

**Expected Results**:
- ✅ Article deleted
- ✅ Featured image deleted from storage
- ✅ No errors during cleanup

---

### Test 6: Delete Article with Multiple Files

**Setup**:
1. Create article with featured image
2. Upload 5-10 files of different types (PDF, DOC, XLS, PNG, etc.)
3. Publish to create published version with copies

**Action**:
1. Delete draft from dashboard

**Expected Results**:
- ✅ Draft and all draft files deleted
- ✅ Published and all published files REMAIN
- ✅ No timeout or performance issues
- ✅ Storage cleanup completes successfully

**Verification**:
```bash
# Check storage directory for remaining files
# Published files should exist with article_id in metadata
```

---

### Test 7: File Attachment Independence

**Setup**:
1. Create draft article with file "important.pdf"
2. Publish → creates published version with copy of "important.pdf"
3. Delete draft file from dashboard (via file deletion API)

**Action**:
1. Delete draft attached file

**Expected Results**:
- ✅ Draft file deleted from dashboard
- ✅ Published file still accessible
- ✅ Published file downloadable

**Verification**:
```sql
-- Draft file deleted
SELECT * FROM content_file 
WHERE article_id = {draft_id} AND original_filename = 'important.pdf';
-- Result: Empty ✅

-- Published file still exists
SELECT * FROM content_file 
WHERE article_id = {published_id} AND original_filename = 'important.pdf';
-- Result: 1 record ✅
```

---

### Test 8: Featured Image Independence

**Setup**:
1. Create draft with featured image "cover.jpg"
2. Publish → creates published version with different file
3. Edit draft featured image to new image "cover_new.jpg"

**Action**:
1. Delete draft article
2. For each action: Create, Upload, Delete operations

**Expected Results**:
- ✅ Draft featured image deleted from storage
- ✅ Published featured image remains (different file path)
- ✅ No cross-contamination between versions

---

## Performance Tests

### Test 9: Large File Deletion

**Setup**:
1. Create article with large files (100MB+ total)
2. Publish with file copies

**Action**:
1. Delete from dashboard
2. Monitor response time

**Expected Results**:
- ✅ Completes in < 5 seconds
- ✅ No timeout errors
- ✅ Files properly cleaned up
- ✅ Database transaction successful

---

## Edge Cases

### Test 10: Concurrent Deletions

**Setup**:
1. Create 3 articles with published versions
2. Dashboard shows all in list

**Action**:
1. Rapidly click delete on multiple articles
2. Confirm each one

**Expected Results**:
- ✅ All deletions succeed
- ✅ No database locks
- ✅ All files properly cleaned up
- ✅ No orphaned database records

---

### Test 11: Delete with Partial File Deletion Failure

**Setup**:
1. Create article with 5 files
2. Simulate one file already deleted from storage

**Action**:
1. Delete article

**Expected Results**:
- ✅ Article deleted despite one missing file
- ✅ Other 4 files deleted from storage
- ✅ Database cleaned up successfully
- ✅ No critical errors

---

## Rollback Testing (if needed)

### Reverse Migration Test
```bash
python manage.py migrate content 0013
```

**Expected**:
- ✅ Migration reverses
- ✅ `on_delete` reverts to CASCADE
- ✅ Database schema correct

---

## Success Criteria

All tests pass when:

1. **Data Integrity**
   - ✅ Draft and published versions are completely independent
   - ✅ Deleting draft doesn't affect published
   - ✅ Both versions have separate files

2. **File Management**
   - ✅ Featured images properly deleted from storage
   - ✅ Attachments properly deleted from storage
   - ✅ No orphaned files remain
   - ✅ Published version files preserved

3. **Database Consistency**
   - ✅ No orphaned database records
   - ✅ CASCADE still works for File model
   - ✅ Relationships properly maintained
   - ✅ Migration reversible if needed

4. **User Experience**
   - ✅ Delete completes in reasonable time (< 5 sec)
   - ✅ Clear confirmation before deletion
   - ✅ Successful deletion feedback
   - ✅ Published article remains accessible

5. **Error Handling**
   - ✅ One file error doesn't block deletion
   - ✅ Graceful handling of missing storage files
   - ✅ Proper logging for debugging

---

## Recommended Test Order

1. First: Test 1 (simple case)
2. Second: Test 2 (main fix verification)
3. Third: Test 3 (published deletion)
4. Fourth: Test 4-8 (edge cases)
5. Fifth: Test 9 (performance)
6. Last: Test 10-11 (concurrency and failures)

---

## Pass/Fail Summary

| Test | Status | Notes |
|------|--------|-------|
| Test 1: Delete Draft Only | ⏳ Pending | |
| Test 2: Delete Draft+Published | ⏳ Pending | **PRIMARY TEST** |
| Test 3: Delete Published Only | ⏳ Pending | |
| Test 4: No Files | ⏳ Pending | |
| Test 5: Featured Only | ⏳ Pending | |
| Test 6: Multiple Files | ⏳ Pending | |
| Test 7: File Independence | ⏳ Pending | |
| Test 8: Featured Independence | ⏳ Pending | |
| Test 9: Large Files | ⏳ Pending | |
| Test 10: Concurrent | ⏳ Pending | |
| Test 11: Partial Failure | ⏳ Pending | |

---

## Sign-Off

- [ ] All tests passed
- [ ] No regressions observed
- [ ] Performance acceptable
- [ ] Ready for production deployment

**Tested By:** _______________
**Date:** _______________
**Notes:** ________________________________________________
