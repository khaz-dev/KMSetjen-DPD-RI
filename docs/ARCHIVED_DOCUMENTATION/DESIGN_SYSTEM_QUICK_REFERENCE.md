# 🎨 Design System Quick Reference Guide

## For Developers: How to Use the New Design System

### Overview

The KMSetjen DPD RI application now has a **professional design system** with 50+ CSS variables. All design tokens are defined in `frontend/src/styles/theme.css`.

---

## Typography Variables

### Font Sizes
```css
var(--font-size-xs)     /* 12px  */
var(--font-size-sm)     /* 14px  */
var(--font-size-base)   /* 16px  */
var(--font-size-lg)     /* 18px  */
var(--font-size-xl)     /* 20px  */
var(--font-size-2xl)    /* 24px  */
var(--font-size-3xl)    /* 30px  */
var(--font-size-4xl)    /* 36px  */
```

**Usage Example:**
```css
.heading-one {
  font-size: var(--font-size-4xl);
}

.body-text {
  font-size: var(--font-size-base);
}
```

### Font Weights
```css
var(--font-weight-light)     /* 300 */
var(--font-weight-normal)    /* 400 */
var(--font-weight-medium)    /* 500 */
var(--font-weight-semibold)  /* 600 */
var(--font-weight-bold)      /* 700 */
```

**Usage Example:**
```css
.label {
  font-weight: var(--font-weight-semibold);
}

.heading {
  font-weight: var(--font-weight-bold);
}
```

### Line Heights
```css
var(--line-height-tight)    /* 1.2  - for headings */
var(--line-height-snug)     /* 1.375 */
var(--line-height-normal)   /* 1.5  - default */
var(--line-height-relaxed)  /* 1.625 - for body text */
var(--line-height-loose)    /* 2   - for captions */
```

**Usage Example:**
```css
h1 {
  line-height: var(--line-height-tight);
}

p {
  line-height: var(--line-height-relaxed);
}
```

---

## Spacing Variables (Use for padding, margins, gaps)

```css
var(--spacing-0)   /* 0px   */
var(--spacing-1)   /* 4px   */
var(--spacing-2)   /* 8px   */
var(--spacing-3)   /* 12px  */
var(--spacing-4)   /* 16px  */
var(--spacing-5)   /* 20px  */
var(--spacing-6)   /* 24px  */
var(--spacing-8)   /* 32px  */
var(--spacing-10)  /* 40px  */
var(--spacing-12)  /* 48px  */
var(--spacing-16)  /* 64px  */
```

**Usage Examples:**
```css
/* Padding */
.card {
  padding: var(--spacing-6);        /* 24px all sides */
  padding: var(--spacing-4) var(--spacing-6);  /* top/bottom × left/right */
}

/* Margins */
.section {
  margin-bottom: var(--spacing-8);  /* 32px bottom */
}

/* Gaps */
.flex-container {
  gap: var(--spacing-4);            /* 16px gap between items */
}
```

---

## Border Radius Variables

```css
var(--radius-sm)    /* 4px    - minimal */
var(--radius-md)    /* 6px    */
var(--radius-lg)    /* 8px    - default buttons/inputs */
var(--radius-xl)    /* 12px   - cards/sections */
var(--radius-2xl)   /* 16px   - hero sections */
var(--radius-full)  /* 9999px - badges/pills */
```

**Usage Examples:**
```css
/* Buttons */
.btn {
  border-radius: var(--radius-lg);  /* 8px */
}

/* Cards */
.card {
  border-radius: var(--radius-xl);  /* 12px */
}

/* Badges/Pills */
.badge {
  border-radius: var(--radius-full);  /* fully rounded */
}

/* Hero Sections */
.hero {
  border-radius: var(--radius-2xl);   /* 16px */
}
```

---

## Shadow Variables (Use for depth/elevation)

```css
var(--shadow-xs)    /* subtle shadow */
var(--shadow-sm)    /* light shadow */
var(--shadow-md)    /* medium shadow */
var(--shadow-lg)    /* pronounced shadow */
var(--shadow-xl)    /* strong shadow */
var(--shadow-2xl)   /* dramatic shadow */
```

**Usage Examples:**
```css
/* Default state */
.card {
  box-shadow: var(--shadow-sm);
}

/* Hover state - elevation */
.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-4px);
}

/* Modal/overlay */
.modal {
  box-shadow: var(--shadow-2xl);
}

/* Navigation */
.navbar {
  box-shadow: var(--shadow-md);
}
```

---

## Transition Variables

```css
var(--transition-fast)   /* 150ms */
var(--transition-normal) /* 250ms */
var(--transition-slow)   /* 350ms */
```

**Usage Examples:**
```css
/* Quick feedback */
.button:hover {
  transition: all var(--transition-fast);
  background-color: #0d9488;
}

/* Normal transitions */
.card {
  transition: all var(--transition-normal);
}

/* Slower animations */
.modal {
  animation: slideIn var(--transition-slow);
}
```

---

## Color Variables (Teal Palette)

### Primary Teal
```css
var(--teal-50)   /* #f0fdfa */
var(--teal-100)  /* #ccfbf1 */
var(--teal-200)  /* #99f6e4 */
var(--teal-300)  /* #5eead4 */
var(--teal-400)  /* #2dd4bf */
var(--teal-500)  /* #14b8a6 */  /* Primary */
var(--teal-600)  /* #0d9488 */
var(--teal-700)  /* #0f766e */
var(--teal-800)  /* #115e59 */
var(--teal-900)  /* #134e4a */
```

**Usage Examples:**
```css
/* Primary color */
.btn-primary {
  background-color: #14b8a6;  /* or var(--teal-500) */
}

/* Hover state */
.btn-primary:hover {
  background-color: #0d9488;  /* var(--teal-600) */
}

/* Backgrounds */
.hero {
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 50%, #0f766e 100%);
}
```

---

## Common Component Patterns

### Button Component
```css
.btn {
  padding: var(--spacing-2) var(--spacing-4);           /* 8px 16px */
  border-radius: var(--radius-lg);                      /* 8px */
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast);               /* 150ms */
  box-shadow: var(--shadow-md);
}

.btn:hover {
  transform: translateY(-2px);                          /* lift effect */
  box-shadow: var(--shadow-lg);
}

.btn:focus {
  outline: 2px solid #14b8a6;
  outline-offset: 2px;
}
```

### Card Component
```css
.card {
  border-radius: var(--radius-xl);                      /* 12px */
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-6);                            /* 24px */
  transition: all var(--transition-normal);             /* 250ms */
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-4px);                          /* lift effect */
}
```

### Form Input
```css
.form-control {
  border: 2px solid #dee2e6;
  border-radius: var(--radius-lg);                      /* 8px */
  padding: var(--spacing-2) var(--spacing-3);           /* 8px 12px */
  font-size: var(--font-size-base);
  transition: all var(--transition-fast);               /* 150ms */
}

.form-control:focus {
  border-color: #14b8a6;
  box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.1);
  outline: none;
}
```

### Badge Component
```css
.badge {
  padding: var(--spacing-2) var(--spacing-3);           /* 8px 12px */
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  letter-spacing: var(--letter-spacing-wide);
}
```

---

## Grid & Flex Spacing

```css
/* Container with spacing */
.container {
  padding-left: var(--spacing-4);    /* 16px */
  padding-right: var(--spacing-4);
}

/* Section with vertical spacing */
.section {
  margin-bottom: var(--spacing-12);  /* 48px */
  padding: var(--spacing-8);          /* 32px */
}

/* Flex with gap */
.flex-row {
  display: flex;
  gap: var(--spacing-4);              /* 16px between items */
}

/* Grid with gap */
.grid {
  display: grid;
  gap: var(--spacing-6);              /* 24px */
}
```

---

## Responsive Spacing

### Mobile First Approach
```css
/* Mobile (default) */
.container {
  padding: var(--spacing-4);          /* 16px */
}

/* Tablet and up */
@media (min-width: 768px) {
  .container {
    padding: var(--spacing-6);        /* 24px */
  }
}

/* Desktop and up */
@media (min-width: 1200px) {
  .container {
    padding: var(--spacing-8);        /* 32px */
  }
}
```

---

## Best Practices

### ✅ DO
```css
/* Use design variables */
.component {
  padding: var(--spacing-4);
  font-size: var(--font-size-base);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-fast);
}

/* Use consistent naming */
.btn-primary { }
.card-header { }
.form-label { }

/* Combine variables for hierarchy */
.heading h1 {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  margin-bottom: var(--spacing-6);
}
```

### ❌ DON'T
```css
/* Don't use hardcoded pixels */
.component {
  padding: 16px;          /* Bad - use var(--spacing-4) */
  font-size: 14px;        /* Bad - use var(--font-size-sm) */
  box-shadow: 0 2px 8px;  /* Bad - use var(--shadow-sm) */
}

/* Don't mix units inconsistently */
.section {
  padding: 20px var(--spacing-4);  /* Inconsistent mix */
}

/* Don't add new shadow values */
.element {
  box-shadow: 0 3px 7px rgba(0,0,0,0.1);  /* Create variable first */
}
```

---

## Color Accessibility

### Text Contrast (WCAG AA)
- **Minimum 4.5:1** for normal text
- **Minimum 3:1** for large text (18px+)

```css
/* Good contrast */
.dark-text {
  color: #212529;           /* Dark gray on white - 11.5:1 */
}

/* Primary color for CTAs */
.btn-primary {
  color: #ffffff;           /* White on teal - 5.5:1 */
}

/* Secondary text */
.text-muted {
  color: #6c757d;           /* Medium gray - 7:1 on white */
}
```

---

## Animation Examples

### Smooth Hover Effect
```css
.card {
  transition: all var(--transition-normal);  /* 250ms */
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}
```

### Focus State
```css
.button:focus {
  outline: 2px solid #14b8a6;
  outline-offset: 2px;
  transition: outline var(--transition-fast);
}
```

### Loading Animation
```css
.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
```

---

## File Location Reference

- **Design Variables:** `frontend/src/styles/theme.css`
- **Global Component Styles:** `frontend/src/App.css`
- **Component CSS Files:** `frontend/src/components/*.css`
- **Page CSS Files:** `frontend/src/pages/*.css`

---

## Quick Translation Guide

### From Old Hardcoded → New Variable System

| Old Way | New Way | Value |
|---------|---------|-------|
| `font-size: 14px` | `font-size: var(--font-size-sm)` | 14px |
| `padding: 16px` | `padding: var(--spacing-4)` | 16px |
| `border-radius: 8px` | `border-radius: var(--radius-lg)` | 8px |
| `box-shadow: 0 2px 8px rgba(0,0,0,0.08)` | `box-shadow: var(--shadow-sm)` | standard shadow |
| `transition: all 0.2s` | `transition: all var(--transition-fast)` | 150ms |
| `margin-bottom: 24px` | `margin-bottom: var(--spacing-6)` | 24px |
| `font-weight: 600` | `font-weight: var(--font-weight-semibold)` | 600 |
| `line-height: 1.625` | `line-height: var(--line-height-relaxed)` | 1.625 |

---

## Support

If you need to:

1. **Add a new spacing value** - Edit `theme.css` and add `--spacing-X` variable
2. **Add a new shadow** - Edit `theme.css` and add `--shadow-X` variable
3. **Create a new component** - Follow patterns in `App.css`
4. **Update a component** - Edit corresponding CSS file and use variables

---

## Resources

- **Design System File:** `frontend/src/styles/theme.css`
- **Implementation Report:** `UI_UX_DESIGN_SYSTEM_COMPLETION_REPORT.md`
- **Component Documentation:** `UI_UX_UPGRADE_COMPREHENSIVE.md`

---

*Design System Quick Reference*
*Last Updated: Design System Implementation*
*Version: 1.0 - Professional Design System*
