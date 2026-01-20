## ArticleDetailPage Card-Body - Deep Audit Report

### Investigation: Are card-body sections using real data or static?

---

## Code Analysis

### Load Process
**File:** `frontend/src/pages/ArticleDetailPage.js` Lines 28-42

```javascript
useEffect(() => {
  const loadArticle = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await publicAPI.getArticle(id);  // ← FETCH FROM API
      setArticle(response.data);                          // ← STORE IN STATE
    } catch (err) {
      setError('errors.failed_load_article');
      console.error('Error loading article:', err);
    } finally {
      setLoading(false);
    }
  };
  
  loadArticle();
}, [id]);
```

**What's happening:**
1. ✅ Component calls `publicAPI.getArticle(id)` - fetches from backend API
2. ✅ Stores response in `article` state - saves to React state
3. ✅ Null check before rendering - prevents display until data loaded

### Card-Body Display Code
**File:** `frontend/src/pages/ArticleDetailPage.js` Lines 208-242

```javascript
<div className="card mb-4">
  <div className="card-body">
    <h5 className="card-title">{t('articles.article_information')}</h5>
    <div className="article-details">
      
      {/* STATUS - Using article.status from state */}
      <p>
        <strong>{t('articles.status')}:</strong>
        <Badge bg={article.status === 'published' ? 'success' : 'secondary'}>
          {article.status === 'published' && t('articles.published')}
          {article.status === 'draft' && t('articles.draft')}
          {article.status === 'review' && t('dashboard.status_review')}
          {article.status === 'approved' && t('dashboard.status_approved')}
          {article.status === 'rejected' && t('dashboard.status_rejected')}
        </Badge>
      </p>
      
      {/* LAST UPDATED - Using article.updated_at from state */}
      <p>
        <strong>{t('articles.last_updated')}:</strong><br />
        {new Date(article.updated_at).toLocaleDateString(
          isIndonesian ? 'id-ID' : 'en-US', 
          { year: 'numeric', month: 'long', day: 'numeric' }
        )}
      </p>
      
      {/* ACCESS LEVEL - Using article.access_level from state */}
      <p>
        <strong>{t('articles.access_level')}:</strong>
        <span>
          {article.access_level === 'public' && t('articles.access_public')}
          {article.access_level === 'internal' && t('articles.access_internal')}
          {article.access_level === 'role_based' && t('articles.access_role_based')}
        </span>
      </p>
      
    </div>
  </div>
</div>
```

**What's being used:**
- ✅ `article.status` - Real value from state
- ✅ `article.updated_at` - Real value from state
- ✅ `article.access_level` - Real value from state
- ❌ NO hardcoded values anywhere
- ❌ NO static data anywhere

---

## API Response Verification

**Article ID 6 - Actual API Response:**

```
status: published ✅
updated_at: 2026-01-09T11:35:14.016115+07:00 ✅
access_level: public ✅
category: {id: 5, name_id: "Berita & Media", name_en: "News & Media", ...} ✅
like_count: 203 ✅
view_count: 690 ✅
published_at: 2025-12-26T11:35:13.957616+07:00 ✅
```

All critical fields are present in API response.

---

## Data Flow Verification

```
Backend Database (Article ID 6)
    ↓
    └─ status: 'published'
    └─ updated_at: 2026-01-09T11:35:14
    └─ access_level: 'public'
    └─ category_id: 5
    
API Endpoint: GET /api/v1/public/articles/6/
    ↓
    └─ Serializer: ArticleDetailSerializer
    └─ Fields: All database fields included ✓
    
Frontend: publicAPI.getArticle(id)
    ↓
    └─ Receives full JSON response ✓
    └─ Stores in state: setArticle(response.data) ✓
    
Component Render
    ↓
    └─ Reads from state: article.status ✓
    └─ Reads from state: article.updated_at ✓
    └─ Reads from state: article.access_level ✓
    └─ Displays in card-body ✓
```

---

## Conclusion

### ✅ Card-Body Is Using REAL DATA

**Evidence:**
1. ✅ Code references `article.status` (not hardcoded string)
2. ✅ Code references `article.updated_at` (not hardcoded date)
3. ✅ Code references `article.access_level` (not hardcoded value)
4. ✅ API verified returning all these fields for article ID 6
5. ✅ No static/placeholder values found in component
6. ✅ Data loaded from backend API on component mount

**For Article ID 6 specifically:**
- Status: "published" (from database)
- Last Updated: "9 January 2026" (from database - updated_at)
- Access Level: "public" (from database)
- Category: "Berita & Media" (from database)

**Verdict:** ✅ NOT static data. Using REAL data from database via API.

---

## Files Reviewed

1. `frontend/src/pages/ArticleDetailPage.js` - Component code
2. `backend/apps/api/v1/public/serializers.py` - API response structure
3. `backend/apps/content/models.py` - Database fields

All verified. No issues found. Data is flowing correctly from database → API → Frontend → Display.
