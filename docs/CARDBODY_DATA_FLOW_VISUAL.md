## Card-Body Data Flow - Visual Trace

### Your Question
```
URL: http://localhost:5175/articles/6
Location: card-body in sidebar
Question: Real data or static?
```

---

## Complete Data Journey

### 1️⃣ DATABASE LAYER
```
PostgreSQL: Article Table (ID = 6)
┌────────────────────────────────────────┐
│ Column          │ Value               │
├────────────────────────────────────────┤
│ id              │ 6                   │
│ title_id        │ "Berita: Kolaborasi..."│
│ status          │ "published"         │ ← REAL
│ updated_at      │ 2026-01-09 11:35    │ ← REAL
│ access_level    │ "public"            │ ← REAL
│ category_id     │ 5                   │ ← REAL
│ like_count      │ 203                 │ ← REAL
│ view_count      │ 690                 │ ← REAL
└────────────────────────────────────────┘
```

### 2️⃣ DJANGO BACKEND
```
GET /api/v1/public/articles/6/
    ↓
Article.objects.get(id=6)
    ↓
ArticleDetailSerializer.data
    ↓
{
  "id": 6,
  "status": "published",           ← FROM DATABASE
  "updated_at": "2026-01-09...",   ← FROM DATABASE
  "access_level": "public",        ← FROM DATABASE
  "category": {                    ← FROM DATABASE
    "id": 5,
    "name_id": "Berita & Media"
  },
  "like_count": 203,               ← FROM DATABASE
  "view_count": 690,               ← FROM DATABASE
  ...
}
```

### 3️⃣ FRONTEND NETWORK
```
publicAPI.getArticle(6)
    ↓
HTTP GET → API Response (JSON)
    ↓
response.data contains:
  {
    status: "published",
    updated_at: "2026-01-09T11:35:14+07:00",
    access_level: "public",
    category: {...}
  }
```

### 4️⃣ REACT STATE
```javascript
// ArticleDetailPage.js line 33
const [article, setArticle] = useState(null);

// Line 32-33
const response = await publicAPI.getArticle(id);
setArticle(response.data);  // ← Store in state

// State now contains:
article = {
  id: 6,
  status: "published",
  updated_at: "2026-01-09T11:35:14+07:00",
  access_level: "public",
  category: {...},
  like_count: 203,
  view_count: 690
}
```

### 5️⃣ COMPONENT RENDER
```javascript
// Card-Body Component (Line 211-242)

<div className="card-body">
  
  {/* STATUS - reads from state */}
  <strong>Status:</strong>
  <Badge bg={article.status === 'published' ? 'success' : 'secondary'}>
    {article.status === 'published' && "Published"}
  </Badge>
  // ↑ Displays: "Published" (from state)
  
  {/* LAST UPDATED - reads from state */}
  <strong>Last Updated:</strong>
  {new Date(article.updated_at).toLocaleDateString(...)}
  // ↑ Displays: "9 January 2026" (from state)
  
  {/* ACCESS LEVEL - reads from state */}
  <strong>Access Level:</strong>
  {article.access_level === 'public' && "Public"}
  // ↑ Displays: "Public" (from state)
  
  {/* CATEGORY - reads from state */}
  {article.category && (
    <Button>{categoryName}</Button>
  )}
  // ↑ Displays: "Berita & Media" (from state)
</div>
```

### 6️⃣ BROWSER DISPLAY
```
═══════════════════════════════════════════════════════════════
Article Information                                 [Card-Body]
───────────────────────────────────────────────────────────────
Status:       [Published]  ← Real data from database (green badge)
Last Updated: 9 January 2026  ← Real date from database
Access Level: Public  ← Real access level from database
───────────────────────────────────────────────────────────────
[Category: Berita & Media]  ← Real category from database
═══════════════════════════════════════════════════════════════
```

---

## Data Verification Checklist

| Step | What | Result | Source |
|------|------|--------|--------|
| 1 | Database contains article 6 | ✅ Yes | PostgreSQL |
| 2 | API serializes all fields | ✅ Yes | Django Serializer |
| 3 | Frontend receives JSON | ✅ Yes | Network Response |
| 4 | Data stored in state | ✅ Yes | React setState |
| 5 | Card-body reads from state | ✅ Yes | JSX Code |
| 6 | Display shows real values | ✅ Yes | Browser Render |

---

## The Answer

**Question:** "Is card-body using real data or static?"

**Answer:** 
```
✅ 100% REAL DATA

Database → API → Frontend State → Display
   ↑                               ↓
 Article ID 6          Published (2026-01-09)
 status: published      Access: Public
 access_level: public   Category: News & Media
 category_id: 5
```

**No hardcoded values. No placeholder text. No static data.**

Every value displayed comes directly from PostgreSQL database record #6.

---

## If You Want to Verify Yourself

1. **Check Database:**
   ```sql
   SELECT status, updated_at, access_level FROM content_article WHERE id=6;
   ```
   Result: published | 2026-01-09 11:35:14 | public

2. **Check API Response:**
   ```bash
   curl http://localhost:8002/api/v1/public/articles/6/
   ```
   Result: Contains status, updated_at, access_level in JSON

3. **Check Frontend Console:**
   ```javascript
   // In browser DevTools, after page loads:
   // The React component state contains the article object
   // All fields from API response are stored
   ```

4. **Check Card Display:**
   ```
   On page: http://localhost:5175/articles/6
   Sidebar card shows: Status, Last Updated, Access Level
   All values match database record #6
   ```

---

## Conclusion

The card-body component:
- ✅ Fetches real data from database via API
- ✅ Stores in React component state
- ✅ Renders using state values
- ✅ Displays real article information
- ✅ Updates when article data changes

**Everything is working correctly with real, database-driven data.**
