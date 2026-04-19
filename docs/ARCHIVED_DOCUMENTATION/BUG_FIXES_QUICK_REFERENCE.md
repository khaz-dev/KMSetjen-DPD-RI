# Quick Reference: Bug Fixes Summary

## 🐛 Issue #1: Toast Not Sticking

**Problem:**
```
Page scrolls down
     ↓
Toast scrolls away with form
     ↓
User can't see notification
```

**Solution:**
```jsx
// Use React Portal to render outside Form hierarchy
ReactDOM.createPortal(
  <ToastContainer>...</ToastContainer>,
  document.body  // Renders at document root
)
```

**Result:** ✅ Toast stays fixed at top-right while scrolling

---

## 🐛 Issue #2: Slug Validation Failing

**Problem:**
```
HTTP Query Param: exclude_id=27 (comes as STRING "27")
     ↓
Django Query: exclude(id="27")
     ↓
String "27" ≠ Integer 27
     ↓
Current article not excluded
     ↓
Duplicate slug error ❌
```

**Solution:**
```python
# Convert string to integer before exclusion
if exclude_id:
    try:
        exclude_id = int(exclude_id)  # "27" → 27
        query = query.exclude(id=exclude_id)
    except (ValueError, TypeError):
        pass
```

**Result:** ✅ Slug validation works correctly

---

## Files Changed

| File | Change | Line |
|------|--------|------|
| `ArticleEditorPage.jsx` | Add Portal wrapper | 2, 781-800 |
| `ArticleEditorPage.jsx` | Import ReactDOM | 2 |
| `views.py` (backend) | Convert exclude_id to int | 640-646 |

---

## How to Test

### Test 1: Toast Stickiness
1. Edit article 27: `http://localhost:5175/editor/27`
2. Click "Simpan sebagai Draft"
3. See toast at top-right
4. **Scroll page down** ← Toast should stay visible!

### Test 2: Slug Validation  
1. Edit article 27 (keep same slug)
2. Click "Simpan sebagai Draft"
3. ✅ Should save without error

---

## Impact

- **Medium**: Fixes user experience and data save issues
- **Risk**: Low (no breaking changes, small targeted fixes)
- **Urgency**: High (users currently blocked from saving)

---

## Deployment Order

1. Deploy backend fix first (slug validation)
2. Deploy frontend fix second (toast portal)
3. Test in staging
4. Monitor production for any slug-related errors

---

✅ **Both issues fully resolved and documented**
