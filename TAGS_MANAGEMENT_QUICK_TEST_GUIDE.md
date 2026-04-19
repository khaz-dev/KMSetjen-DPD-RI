# Tags Management Page - Quick Testing Guide

## 🎯 Testing URL
Open: **http://localhost:5175/admin/tags**

---

## ✅ Test Case 1: Required Fields Notice Bilingual Display

### Steps:
1. Click "Tambah Tag" (Add Tag) button
2. Look at the modal header notice

### Expected Results:
- **English Mode**: Shows "* Indicates required field"
- **Indonesian Mode**: Shows "* Menandakan field wajib diisi"
- ✅ NOT showing translation key `common.required_fields`

**Status**: ✅ Pass/❌ Fail

---

## ✅ Test Case 2: Color Picker with Hex Input

### Steps:
1. Open "Tambah Tag" modal
2. Scroll to "Tampilan & Status" section
3. See two color input methods:
   - Color picker square on the left
   - Text input for hex code on the right

### Test Color Picker:
- Click the color picker square
- Select a color
- Verify the hex code updates in the text field

### Test Hex Input:
- Clear the hex input
- Type `#FF5733` (or any valid hex)
- Verify the color picker updates to show that color
- Verify the preview square shows the new color

### Test Hex Validation:
- Type invalid hex like `#ZZZZZZ`
- Should NOT update (validation rejects it)
- Type `FF5733` (without #)
- Should auto-add # and display correctly

### Expected Results:
- ✅ Color picker and hex input sync together
- ✅ Hex validation works (only #RRGGBB format)
- ✅ Hex preview square shows correct color
- ✅ Help text: "Format: #RRGGBB (e.g., #3498db)"

**Status**: ✅ Pass/❌ Fail

---

## ✅ Test Case 3: Table Column Order with No. Column

### Steps:
1. View the Tags table
2. Check column headers from left to right

### Expected Order:
1. **No.** - Centered, narrow column
2. **NAMA (INDONESIA)** - Main name
3. **NAMA (INGGRIS)** - English name
4. **WARNA** - Color with preview
5. **PENGETAHUAN** - Article count
6. **STATUS** - Active/Inactive badge
7. **ACTIONS** - Edit/Delete buttons

### Verify Row Numbers:
- Row 1 on page 1: Shows `1`
- Row 10 on page 1: Shows `10`
- Row 1 on page 2 (with 10 items per page): Shows `11`
- Row 1 on page 3: Shows `21`

**Formula Check**: `(currentPage - 1) * itemsPerPage + rowIndex + 1`

**Status**: ✅ Pass/❌ Fail

---

## ✅ Test Case 4: Search Functionality

### Steps:
1. Look for search card below the title
2. See search icon and input field with placeholder "Search tags..."

### Test Search:
1. Type a tag name (e.g., "Berita")
2. Table updates to show only matching tags
3. Results count updates
4. Pagination resets to page 1

### Test Search Clear:
1. Clear the search input
2. All tags reappear
3. Original pagination reconstructs

### Test Search + Pagination:
1. Type search query
2. Results show page 1 with filtered items
3. Navigate to page 2 (if results > items per page)
4. Only relevant results show on page 2

**Expected Results**:
- ✅ Search filters tags in real-time
- ✅ Page resets to 1 when searching
- ✅ Both bilingual names are searchable
- ✅ Descriptions can be searched too

**Status**: ✅ Pass/❌ Fail

---

## ✅ Test Case 5: Items Per Page Selector

### Steps:
1. Look for "Items Per Halaman" dropdown
2. Current value should be 10

### Test Each Option:
- Select `10` → Table shows max 10 items
- Select `25` → Table shows max 25 items
- Select `50` → Table shows max 50 items
- Select `75` → Table shows max 75 items
- Select `100` → Table shows max 100 items

### Test Behavior:
1. Load some tags (assume 45 total)
2. Select `25` → Shows 25 items, page 1 of 2
3. Click page 2 → Shows 20 items
4. Change to `50` → Resets to page 1, shows all 45
5. Select `10` → Resets to page 1, shows 10 items

**Expected Results**:
- ✅ All 5 options work correctly
- ✅ Page 1 is shown after changing size
- ✅ Results count updates correctly
- ✅ Rows don't disappear when changing size

**Status**: ✅ Pass/❌ Fail

---

## ✅ Test Case 6: Results Count Display

### Steps:
1. Look for "Hasil" section next to Items Per Page

### Expected Display Format:
- "10 of 45 (Page 1 of 5)" ← if 10 items per page, 45 total
- "25 of 45 (Page 2 of 2)" ← if 25 items per page, page 2
- "8 of 18" ← if only 18 total (no page info on last page)

### Test Scenarios:
1. Load page 1 with 10 items per page
   - Should show: "10 of XX (Page 1 of Y)"
2. Go to page 2
   - Should show: "10 of XX (Page 2 of Y)"
3. Change to 25 items per page
   - Should update count and page info
4. Search for tags
   - Results should update count

**Status**: ✅ Pass/❌ Fail

---

## ✅ Test Case 7: Advanced Pagination

### Steps:
1. Upload or create enough tags to have multiple pages
2. Look at pagination controls at bottom

### Test with 50+ Tags:
- **First 3 pages**: Should show `1 2 3`
- **Page 3-5**: Should show `... 3 4 5 6 ...` (current page ± 1)
- **Last 3 pages**: Should show `... X-2 X-1 X` (where X = last page)
- **Ellipsis**: Should appear for gaps

### Test Buttons:
- **First** button: Takes to page 1, disabled on page 1
- **Previous** button: Previous page, disabled on page 1
- **Next** button: Next page, disabled on last page
- **Last** button: Last page, disabled on last page
- **Page Numbers**: Click any number to jump to page

**Status**: ✅ Pass/❌ Fail

---

## ✅ Test Case 8: Dark Mode Support

### Steps:
1. Toggle dark mode (if available in top menu)
2. Observe all components

### Expected in Dark Mode:
- ✅ Background is dark
- ✅ Text is light/readable
- ✅ Search card is dark
- ✅ Modals have dark background
- ✅ Table rows are readable
- ✅ All buttons are styled for dark mode
- ✅ Color preview square shows correctly

### Expected in Light Mode:
- ✅ Background is light/white
- ✅ Text is dark/readable
- ✅ All components are clean and bright

**Status**: ✅ Pass/❌ Fail

---

## ✅ Test Case 9: Bilingual Support

### Steps:
1. Change language to Indonesian (look for language selector)
2. Check all labels update

### Indonesian Labels Should Show:
- "Manajemen Tag" (title)
- "Tambah Tag" (add button)
- "Hasil" (results)
- "Item Per Halaman" (items per page)
- "NAMA (INDONESIA)"
- "NAMA (INGGRIS)"
- "WARNA" (color)
- "PENGETAHUAN" (knowledge articles)
- "STATUS"
- "AKSI" (actions)
- Modal title: "Tambah Tag"
- Required notice: "* Menandakan field wajib diisi"

### English Labels Should Show:
- "Tag Management" (title)
- "Add Tag" (add button)
- "Results"
- "Items Per Page"
- "Name (Indonesian)"
- "Name (English)"
- "Color"
- "Knowledge"
- "Status"
- "Actions"
- Modal title: "Add Tag"
- Required notice: "* Indicates required field"

**Status**: ✅ Pass/❌ Fail

---

## ✅ Test Case 10: Create New Tag

### Steps:
1. Click "Tambah Tag" button
2. Fill all required fields:
   - **Nama (Indonesia)**: "Berita Terbaru"
   - **Nama (Inggris)**: "Latest News"
   - **Deskripsi (Indonesia)**: "Berita dan perkembangan terbaru"
   - **Deskripsi (Inggris)**: "Latest news and updates"
   - **Color**: Pick a color (or type hex)
3. Check "Tag Aktif" checkbox
4. Click "Simpan" button

### Expected Results:
- ✅ Tag created successfully
- ✅ Modal closes
- ✅ New tag appears in table
- ✅ Row numbers update correctly
- ✅ Table reloads with correct pagination

**Status**: ✅ Pass/❌ Fail

---

## 🚀 Quick Test Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Required Fields Notice | ✅/❌ | Should show proper text, not translation key |
| Color Picker + Hex Input | ✅/❌ | Both should sync, validate hex format |
| Table No. Column | ✅/❌ | Row numbers should calculate correctly |
| Table Column Order | ✅/❌ | 7 columns in correct order |
| Search Functionality | ✅/❌ | Real-time search, resets pagination |
| Items Per Page Selector | ✅/❌ | All 5 options work |
| Results Count Display | ✅/❌ | Shows "X of Y (Page A of B)" |
| Advanced Pagination | ✅/❌ | Smart truncation with ellipsis |
| Dark Mode | ✅/❌ | Components themed correctly |
| Bilingual Support | ✅/❌ | All labels in both languages |

---

## 📝 Bug Report Template

If you find an issue, please note:
- **Feature**: Which test case fails?
- **Browser**: Chrome, Firefox, Safari, etc.
- **Mode**: Light/Dark, English/Indonesian
- **Steps to Reproduce**: How to trigger the issue
- **Expected**: What should happen
- **Actual**: What actually happened
- **Screenshot**: If possible

---

## 🔧 Troubleshooting

### Issue: Color hex input not updating
- **Check**: Backend supports color field in tag model
- **Fix**: Clear browser cache, reload page

### Issue: Search not working
- **Check**: Backend returns correct count and results
- **Fix**: Verify API supports `?search=` parameter

### Issue: Pagination shows wrong numbers
- **Check**: Verify `itemsPerPage` state is updating
- **Fix**: Check payload being sent to API

### Issue: Required notice showing key instead of text
- **Check**: i18n translations are loaded
- **Fix**: Restart development server, clear cache

---

**Test Date**: ___________
**Tester Name**: ___________
**Overall Status**: ✅ Pass / ⚠️ Pass with Issues / ❌ Fail

---

**Thank you for testing! 🎉**
