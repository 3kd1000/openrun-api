# OpenRun Design Guidelines

**Purpose**: Quick reference for OpenRun's design system rules, breakpoints, and tokens.
**Last Updated**: 2025-01-13
**Audience**: CSS Media Query Reviewer, React Frontend Developer agents

---

## 🎯 Core Principles

1. **No hardcoded values** - Always use CSS variables
2. **Exact breakpoints only** - No custom breakpoints
3. **Same-level components must be identical** - Height, font size, padding
4. **Minimum font size: 11px** - `var(--font-s)`, **NEVER use --font-xs**
5. **BEM naming with component prefixes** - `.schedule-card__header`, not `.header`

---

## 📐 Breakpoints (EXACT VALUES ONLY)

From: `front/src/styles/tokens/breakpoints.css`

```css
/* Mobile Small: 360px 이하 */
@media (max-width: 360px) {
  /* Smallest mobile devices */
}

/* Mobile Medium: 361px ~ 425px */
@media (min-width: 361px) and (max-width: 425px) {
  /* Standard mobile */
}

/* Tablet: 426px ~ 768px */
@media (min-width: 426px) and (max-width: 768px) {
  /* Tablet devices */
}

/* Desktop: 769px 이상 */
@media (min-width: 769px) {
  /* Desktop and larger */
}
```

### ❌ FORBIDDEN Breakpoints
```css
/* ❌ NEVER use these */
@media (max-width: 768px)        /* Wrong boundary */
@media (min-width: 600px)        /* Non-standard */
@media (max-width: 640px)        /* Not in design system */
@media (min-width: 1024px)       /* Not defined */
```

---

## 🔤 Typography Tokens

From: `front/src/styles/tokens/typography.css`

### Font Sizes

```css
:root {
  /* ✅ ALLOWED */
  --font-s: 11px;      /* Minimum - 절대 이것보다 작게 쓰지 말 것 */
  --font-m: 13px;
  --font-l: 14px;
  --font-xl: 16px;
  --font-2xl: 18px;
  --font-3xl: 22px;

  /* ❌ FORBIDDEN */
  --font-xs: 10px;     /* TOO SMALL - 절대 사용 금지 */
}
```

### Usage Rules

```css
/* ✅ CORRECT */
.text {
  font-size: var(--font-s);    /* 11px - minimum */
  font-size: var(--font-l);    /* 14px - standard */
}

/* ❌ WRONG */
.text {
  font-size: var(--font-xs);   /* 10px - FORBIDDEN */
  font-size: 10px;              /* Hardcoded xs */
  font-size: 9px;               /* Below minimum */
}
```

### Font Weights

```css
:root {
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```

---

## 📏 Spacing Tokens

From: `front/src/styles/tokens/spacing.css`

```css
:root {
  --space-xxs: 2px;
  --space-xs: 4px;
  --space-s: 8px;
  --space-m: 16px;
  --space-l: 24px;
  --space-xl: 32px;
  --space-xxl: 48px;
}
```

### Usage

```css
/* ✅ CORRECT */
.component {
  padding: var(--space-m);           /* 16px */
  margin: var(--space-s);            /* 8px */
  gap: var(--space-l);               /* 24px */
}

/* ❌ WRONG */
.component {
  padding: 14px;   /* Not a token value */
  margin: 18px;    /* Not a token value */
  gap: 10px;       /* Not a token value */
}
```

---

## 🎨 Color Tokens

From: `front/src/styles/tokens/colors.css`

```css
:root {
  /* Primary Colors */
  --color-primary: #007bff;
  --color-primary-dark: #0056b3;
  --color-primary-light: #66b3ff;

  /* Secondary Colors */
  --color-secondary: #6c757d;
  --color-success: #28a745;
  --color-danger: #dc3545;
  --color-warning: #ffc107;
  --color-info: #17a2b8;

  /* Neutral Colors */
  --color-text: #212529;
  --color-text-secondary: #6c757d;
  --color-background: #ffffff;
  --color-background-secondary: #f8f9fa;
  --color-border: #dee2e6;
}
```

### Usage

```css
/* ✅ CORRECT */
.button {
  background-color: var(--color-primary);
  color: var(--color-background);
  border: 1px solid var(--color-border);
}

/* ❌ WRONG */
.button {
  background-color: #007bff;   /* Hardcoded hex */
  color: white;                /* Not a token */
  border: 1px solid #ddd;      /* Hardcoded hex */
}
```

---

## 🔲 Border Radius Tokens

```css
:root {
  --radius-s: 4px;
  --radius-m: 8px;
  --radius-l: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;   /* For circles */
}
```

---

## 📦 Same-Level Components Rule

**Critical Rule**: Components at the same hierarchy level MUST have identical heights and font sizes.

### ✅ CORRECT Example

```css
/* All buttons in modal footer have same height */
.modal-footer__btn-save,
.modal-footer__btn-cancel,
.modal-footer__btn-close {
  min-height: 40px;           /* Same */
  font-size: var(--font-l);   /* Same */
  padding: var(--space-s) var(--space-m);  /* Same */
}

/* All badges in status bar have same height */
.status-bar__badge-active,
.status-bar__badge-pending,
.status-bar__badge-closed {
  min-height: 24px;           /* Same */
  font-size: var(--font-s);   /* Same */
}
```

### ❌ WRONG Example

```css
/* Different heights - VIOLATION */
.modal-footer__btn-save { min-height: 40px; }
.modal-footer__btn-cancel { min-height: 36px; }   /* ❌ Different */
.modal-footer__btn-close { min-height: 38px; }    /* ❌ Different */

/* Different font sizes - VIOLATION */
.status-bar__badge-active { font-size: var(--font-m); }
.status-bar__badge-pending { font-size: var(--font-s); }  /* ❌ Different */
```

### Common Same-Level Groups

1. **Modal Buttons**: Primary, Secondary, Tertiary actions
2. **Status Badges**: Active, Pending, Closed, etc.
3. **Input Fields**: Text, Select, Textarea in same form
4. **Navigation Items**: All menu items at same level
5. **Card Actions**: Edit, Delete, Share buttons

---

## 🏷️ BEM Naming Convention

**Rule**: Each component must have a unique prefix.

### Structure

```
.component-name           /* Block */
.component-name__element  /* Element */
.component-name--modifier /* Modifier */
```

### ✅ CORRECT Examples

```css
/* Schedule Card Component */
.schedule-card {}
.schedule-card__header {}
.schedule-card__title {}
.schedule-card__date {}
.schedule-card--expanded {}

/* Draw View Modal */
.draw-modal {}
.draw-modal__header {}
.draw-modal__bracket-btn {}
.draw-modal__participant-list {}
.draw-modal__refresh-btn {}

/* Club Member List */
.member-list {}
.member-list__item {}
.member-list__name {}
.member-list__role-badge {}
```

### ❌ WRONG Examples

```css
/* ❌ Generic names - no component prefix */
.modal {}
.header {}
.button {}
.list {}

/* ❌ Inconsistent prefixes in same component */
.schedule-card {}
.card-header {}        /* Should be .schedule-card__header */
.schedule-title {}     /* Should be .schedule-card__title */
```

---

## 📱 Modal Component Sizing (4-Tier System)

Modals use a 4-tier height system that scales with breakpoints:

```css
:root {
  /* Desktop (769px+) */
  --modal-primary-btn-height: 44px;
  --modal-secondary-btn-height: 40px;
  --modal-badge-height: 24px;
  --modal-stat-height: 32px;
}

@media (max-width: 768px) {
  :root {
    /* Mobile/Tablet */
    --modal-primary-btn-height: 40px;
    --modal-secondary-btn-height: 36px;
    --modal-badge-height: 22px;
    --modal-stat-height: 28px;
  }
}
```

### Usage

```css
.draw-modal__start-btn {
  min-height: var(--modal-primary-btn-height);
}

.draw-modal__view-bracket-btn,
.draw-modal__participant-list-btn {
  min-height: var(--modal-secondary-btn-height);
}

.draw-modal__status-badge {
  min-height: var(--modal-badge-height);
}
```

---

## ✅ Complete Component Example

```css
/* ========================================
   Schedule Card Component
   ======================================== */

.schedule-card {
  padding: var(--space-m);
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-m);
}

.schedule-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-s);
}

.schedule-card__title {
  font-size: var(--font-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
}

.schedule-card__date {
  font-size: var(--font-s);   /* 11px - minimum */
  color: var(--color-text-secondary);
}

/* Actions - Same level, same height */
.schedule-card__btn-edit,
.schedule-card__btn-delete,
.schedule-card__btn-share {
  min-height: 36px;               /* ✓ Same */
  font-size: var(--font-m);       /* ✓ Same */
  padding: var(--space-xs) var(--space-s);  /* ✓ Same */
}

/* Responsive - Desktop */
@media (min-width: 769px) {
  .schedule-card {
    padding: var(--space-l);
  }

  .schedule-card__title {
    font-size: var(--font-2xl);
  }

  .schedule-card__btn-edit,
  .schedule-card__btn-delete,
  .schedule-card__btn-share {
    min-height: 40px;             /* Desktop: larger */
    font-size: var(--font-l);
  }
}

/* Responsive - Tablet */
@media (min-width: 426px) and (max-width: 768px) {
  .schedule-card {
    padding: var(--space-m);
  }
}

/* Responsive - Mobile */
@media (max-width: 425px) {
  .schedule-card {
    padding: var(--space-s);
  }

  .schedule-card__title {
    font-size: var(--font-l);
  }
}
```

---

## 🚫 Common Violations

### 1. Wrong Breakpoint
```css
/* ❌ WRONG */
@media (max-width: 768px) {
  .container { padding: 8px; }
}

/* ✅ CORRECT */
@media (min-width: 426px) and (max-width: 768px) {
  .container { padding: var(--space-s); }
}
```

### 2. Font Too Small
```css
/* ❌ WRONG */
.small-text {
  font-size: var(--font-xs);  /* 10px - FORBIDDEN */
}

/* ✅ CORRECT */
.small-text {
  font-size: var(--font-s);   /* 11px - minimum */
}
```

### 3. Hardcoded Values
```css
/* ❌ WRONG */
.card {
  padding: 16px;
  margin-bottom: 12px;
  border-radius: 8px;
  color: #007bff;
}

/* ✅ CORRECT */
.card {
  padding: var(--space-m);
  margin-bottom: var(--space-s);
  border-radius: var(--radius-m);
  color: var(--color-primary);
}
```

### 4. Same-Level Height Mismatch
```css
/* ❌ WRONG */
.modal-footer__btn-save { min-height: 40px; }
.modal-footer__btn-cancel { min-height: 36px; }  /* Different! */

/* ✅ CORRECT */
.modal-footer__btn-save,
.modal-footer__btn-cancel {
  min-height: 40px;           /* Same */
  font-size: var(--font-l);   /* Same */
}
```

---

## 📋 Validation Checklist

Before committing CSS changes:

### Breakpoints
- [ ] All `@media` queries use exact OpenRun breakpoints
- [ ] No custom breakpoints (600px, 640px, 1024px, etc.)
- [ ] Mobile-first approach (min-width preferred)

### Font Sizes
- [ ] No `var(--font-xs)` usage
- [ ] No font-size below 11px
- [ ] All font sizes use CSS variables

### Component Sizing
- [ ] Same-level buttons have identical `min-height`
- [ ] Same-level badges have identical `min-height`
- [ ] Same-level inputs have identical `height`
- [ ] Font sizes are consistent within same level

### Design Tokens
- [ ] No hardcoded px values for spacing
- [ ] No hardcoded hex colors
- [ ] No hardcoded border-radius values
- [ ] All use `var(--token-name)`

### Component Naming
- [ ] Unique prefix per component (e.g., `.schedule-card-`)
- [ ] No generic class names (`.modal-content`, `.button`)
- [ ] BEM methodology followed

---

## 📚 References

**Token Files** (source of truth):
- `front/src/styles/tokens/breakpoints.css`
- `front/src/styles/tokens/typography.css`
- `front/src/styles/tokens/spacing.css`
- `front/src/styles/tokens/colors.css`

**Design Documentation**:
- `docs/guides/design-guide.md` - Comprehensive design system guide
- `docs/side-projects/openrun/ui-ux-decision-log.md` - Historical decisions

**Agents Using This Reference**:
- `css-media-query-reviewer` - Enforces these rules strictly
- `react-vite-frontend-dev` - Follows these rules when creating components

---

## 💡 Philosophy

> "화면이 깨짐없이 최적화되어야 한다"
> "360px ~ Desktop까지 모든 breakpoint에서 완벽해야 한다"
> "같은 계위 컴포넌트는 1px도 차이나면 안 된다"

This is not optional - it's **mandatory** for OpenRun's design quality.

---

**Last Updated**: 2025-01-13
**Version**: 1.0
**Maintained By**: OpenRun Design System
