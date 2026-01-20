# QUICK START GUIDE - Test the Feature Now 🚀

**Date:** January 9, 2026  
**Status:** ✅ ALL DATA UPDATED IN DATABASE

---

## What Just Happened

✅ All 6 articles now have **VARIED metrics:**
- Different publication dates (1 to 15 days ago)
- Different view counts (234 to 1,567)
- Different like counts (45 to 267)

✅ Frontend feature **already implemented:**
- Meta-items reorder based on sort selection
- Primary metric highlights in bold + blue
- Bilingual support works

---

## Quick Test (2 minutes)

### Step 1️⃣ Navigate to Articles
```
URL: http://localhost:3000/articles
```

### Step 2️⃣ Look at Current Sort Order
You'll see 6 articles in some order. Each article shows:
```
Author Name | Date | 👁 Views | ❤️ Likes
```

### Step 3️⃣ Click "Urutkan Berdasarkan" Dropdown
Select: **"Paling Banyak Dilihat"** (Most Viewed)

**Expected Result:**
- ✅ Articles reorder (different article might be first now!)
- ✅ Views count jumps to 2nd position (after author)
- ✅ Views number is **BOLD and BLUE** (highlighted)
- ✅ Different articles have different view counts (234 → 1567)

### Step 4️⃣ Click Dropdown Again
Select: **"Paling Banyak Disukai"** (Most Liked)

**Expected Result:**
- ✅ Articles reorder **AGAIN** (completely different order!)
- ✅ Likes count moves to 2nd position
- ✅ Likes number is **BOLD and BLUE**
- ✅ Different articles have different like counts (45 → 267)

### Step 5️⃣ Try Other Options
- **Terbaru** (Newest) - Date highlighted, ordered by newest first
- **Tertua** (Oldest) - Date highlighted, ordered by oldest first
- **Paling Banyak Dilihat** (Most Viewed) - Views highlighted
- **Paling Banyak Disukai** (Most Liked) - Likes highlighted

---

## Data Summary

### The 6 Articles Now Have:

| Article | Date | Views | Likes |
|---------|------|-------|-------|
| Tips Produktivitas | 7 days | 892 | **267** ⭐ Most Liked |
| Kebijakan Privacy | 3 days | **1567** ⭐ Most Viewed | 89 |
| Berita Kolaborasi | 15 days ⭐ Oldest | 678 | 203 |
| KMS v2.0 News | 1 day ⭐ Newest | 523 | 156 |
| Laporan Evaluasi | 10 days | 445 | 98 |
| Panduan KMS | 5 days | 234 ⭐ Least Viewed | 45 ⭐ Least Liked |

---

## Expected Order by Each Sort

### Sort: "Terbaru" (Newest First)
```
1. KMS v2.0 News (1 day ago)
2. Kebijakan Privacy (3 days)
3. Panduan KMS (5 days)
4. Tips Produktivitas (7 days)
5. Laporan Evaluasi (10 days)
6. Berita Kolaborasi (15 days)
```

### Sort: "Paling Banyak Dilihat" (Most Viewed First)
```
1. Kebijakan Privacy (1567 views)
2. Tips Produktivitas (892 views)
3. Berita Kolaborasi (678 views)
4. KMS v2.0 News (523 views)
5. Laporan Evaluasi (445 views)
6. Panduan KMS (234 views)
```

### Sort: "Paling Banyak Disukai" (Most Liked First)
```
1. Tips Produktivitas (267 likes)
2. Berita Kolaborasi (203 likes)
3. KMS v2.0 News (156 likes)
4. Laporan Evaluasi (98 likes)
5. Kebijakan Privacy (89 likes)
6. Panduan KMS (45 likes)
```

---

## What You'll See

### Example 1: Sort by Most Liked
```
┌─────────────────────────────────────────┐
│ Tips Produktivitas: Manajemen Waktu     │
│ Pelajari strategi manajemen waktu...    │
│                                         │
│ Siti Nurhaliza | ❤️ 267 | 👁 892 | ...│
│                ↑ Bold+Blue = Primary  │
└─────────────────────────────────────────┘
```

### Example 2: Sort by Most Viewed
```
┌─────────────────────────────────────────┐
│ Kebijakan Data Privacy dan Keamanan     │
│ Kebijakan penting mengenai privasi...   │
│                                         │
│ Admin System | 👁 1567 | 3 hari | ... │
│              ↑ Bold+Blue = Primary     │
└─────────────────────────────────────────┘
```

---

## Troubleshooting

### "I don't see different numbers"
→ Hard refresh browser: **Ctrl+Shift+R** (Windows/Linux) or **Cmd+Shift+R** (Mac)

### "Articles are in the same order"
→ Make sure you're selecting different sort options from the dropdown
→ Each sort should rearrange the articles

### "Highlighting isn't showing"
→ Make sure you're looking at the 2nd metric (after author name)
→ It should be bold and blue/light-blue (depending on dark mode)

### "Dark mode highlight looks wrong"
→ Check browser developer tools (F12)
→ Should show `color: #58a6ff` for dark mode

---

## Technical Details

### Updated Files
✅ `/backend/apps/core/management/commands/seed_data.py` - Article data now includes metrics
✅ `/backend/update_article_metrics.py` - Script that populated DB with varied data
✅ `/frontend/src/pages/ArticlesPage.js` - Already has conditional meta-item reordering
✅ `/frontend/src/pages/ArticlesPage.css` - Already has highlighting styles

### Database Query
Articles can be sorted by:
- `-published_at` (Newest first)
- `published_at` (Oldest first)
- `-view_count` (Most viewed)
- `-like_count` (Most liked)

### API Endpoint
All article APIs return: `view_count` and `like_count` fields
- GET /api/v1/public/articles/?ordering=-like_count
- GET /api/v1/public/articles/?ordering=-view_count

---

## Success Criteria ✅

You know it's working when:

- ✅ You select "Paling Banyak Dilihat" and see view counts: 1567, 892, 678, 523, 445, 234
- ✅ You select "Paling Banyak Disukai" and see like counts: 267, 203, 156, 98, 89, 45
- ✅ Articles reorder completely each time you change the sort
- ✅ The 2nd item in each card (after author) is bold and blue
- ✅ The 2nd item changes based on what you sorted by
- ✅ Switching language updates the metric labels

---

## Summary

**You now have real, varied article data** that visibly demonstrates the sorting and meta-item reordering feature!

**Next Step:** Visit http://localhost:3000/articles and try different sort options! 🎉

