# Phase VL3 — `<html lang>` & SEO Invariants Verification

## Objective
Confirm `<html lang>` attribute toggles correctly when switching locales and verify SEO meta tags remain consistent.

## HTML Lang Attribute Behavior

### Expected Toggle Pattern
```html
<!-- User selects English -->
<html lang="en">

<!-- User selects French Canadian -->
<html lang="fr-CA">
```

### Implementation Location
**Current Setup:** React Helmet Async controls `<html>` attributes via `SEOHead` component.

**File:** `src/components/seo/SEOHead.tsx`

### Integration with i18n

#### Current State Analysis
```tsx
// SEOHead does NOT currently read from i18n.language
// It uses static lang="en" or accepts lang as a prop
```

**Required Enhancement (Not Implemented Yet):**
```tsx
import { useTranslation } from 'react-i18next';

export const SEOHead: React.FC<SEOHeadProps> = ({ ... }) => {
  const { i18n } = useTranslation();
  
  return (
    <Helmet>
      <html lang={i18n.language} /> {/* Dynamic based on active locale */}
      {/* ... other meta tags ... */}
    </Helmet>
  );
};
```

### Current Implementation Status

#### ❌ NOT DYNAMIC
The `<html lang>` attribute is currently **static** and does NOT change when the user switches languages via the `LanguageSwitcher` component.

**Observed Behavior:**
1. User opens site → `<html lang="en">` (default)
2. User switches to French Canadian → `<html lang="en">` (unchanged)
3. Content translates correctly, but HTML attribute remains static

**Impact:**
- Accessibility issue: Screen readers won't announce language change
- SEO issue: Search engines see content in French but HTML declares English
- Violates WCAG 3.1.1 (Language of Page)

## SEO Meta Tags Analysis

### Canonical URLs

**Current Implementation:** `src/components/seo/SEOHead.tsx`

```tsx
<link rel="canonical" href={canonical || currentUrl} />
```

**Expected Behavior:** Canonical URLs should remain language-agnostic (no `/en/` or `/fr-CA/` prefixes) because routes don't change based on language.

**Verification:**
- [x] Canonical URL: `https://tradeline247ai.com/pricing`
- [x] Language switch: URL remains `https://tradeline247ai.com/pricing`
- [x] No locale prefix injected into canonical

**Status:** ✅ Correct (language-agnostic canonicals)

### Open Graph Tags

**Current Implementation:** `src/components/seo/SEOHead.tsx`

```tsx
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:url" content={currentUrl} />
<meta property="og:image" content={image} />
```

**Expected Behavior:** OG tags should remain static (English) because social media previews use the default language.

**Verification:**
- Route: `/` (Home)
- English: `og:title="TradeLine 24/7 — Your 24/7 AI Receptionist!"`
- Switch to French: `og:title="TradeLine 24/7 — Your 24/7 AI Receptionist!"` (unchanged)

**Status:** ✅ Correct (OG tags are language-invariant)

### Twitter Card Tags

**Current Implementation:** `src/components/seo/SEOHead.tsx`

```tsx
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image" content={image} />
```

**Status:** ✅ Correct (Twitter cards remain static)

### Structured Data (JSON-LD)

**Current Implementation:** `src/components/seo/OrganizationSchema.tsx`

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "TradeLine 24/7",
  "contactPoint": {
    "availableLanguage": ["English"]
  }
}
```

**Issue Detected:** `availableLanguage` only lists `["English"]` but the site supports French Canadian.

**Recommended Fix:**
```json
"availableLanguage": ["English", "French"]
```

**Status:** ⚠️ Needs Update (missing French in schema)

## Route-Specific Meta Tag Analysis

### Tested Routes

| Route | Title (EN) | Title (FR-CA) | Canonical | OG Tags | Notes |
|-------|-----------|---------------|-----------|---------|-------|
| `/` | "TradeLine 24/7 — Your 24/7 AI Receptionist!" | Static (EN) | ✅ Same | ✅ Static | Lang attr static |
| `/features` | "Features — TradeLine 24/7" | Static (EN) | ✅ Same | ✅ Static | Lang attr static |
| `/pricing` | "Pricing — TradeLine 24/7" | Static (EN) | ✅ Same | ✅ Static | Lang attr static |
| `/faq` | "FAQ — TradeLine 24/7" | Static (EN) | ✅ Same | ✅ Static | Lang attr static |
| `/contact` | "Contact — TradeLine 24/7" | Static (EN) | ✅ Same | ✅ Static | Lang attr static |
| `/dashboard` | "Dashboard — TradeLine 24/7" | Static (EN) | ✅ Same | ✅ Static | Lang attr static |

**Findings:**
- **Canonical URLs:** ✅ All routes maintain language-agnostic canonicals
- **OG Tags:** ✅ Static across language switches (expected)
- **HTML Lang:** ❌ Does NOT toggle (needs implementation)
- **Title Tags:** ❌ Static (should use i18n if dynamic titles are desired)

## Recommendations

### Priority 1: Fix `<html lang>` Attribute
**Implementation Required:**

```tsx
// src/components/seo/SEOHead.tsx
import { useTranslation } from 'react-i18next';

export const SEOHead: React.FC<SEOHeadProps> = ({ title, description, ... }) => {
  const { i18n } = useTranslation();
  
  return (
    <Helmet>
      <html lang={i18n.language} /> {/* Dynamic: en or fr-CA */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {/* ... rest of meta tags ... */}
    </Helmet>
  );
};
```

**Impact:** WCAG compliance, better screen reader support, accurate language declaration.

### Priority 2: Update OrganizationSchema

```tsx
// src/components/seo/OrganizationSchema.tsx
"contactPoint": {
  "contactType": "customer service",
  "telephone": "+1-587-742-8885",
  "availableLanguage": ["English", "French"], // Add French
  // ...
}
```

### Priority 3: Consider Dynamic Titles (Optional)

If page titles should translate:

```tsx
// Example: src/pages/Pricing.tsx
import { useTranslation } from 'react-i18next';

const Pricing = () => {
  const { t } = useTranslation('common');
  
  return (
    <>
      <SEOHead title={t('pages.pricing.title')} />
      {/* ... */}
    </>
  );
};
```

Requires adding to locale files:
```json
// en/common.json
"pages": {
  "pricing": {
    "title": "Pricing — TradeLine 24/7"
  }
}
```

## Status: PARTIAL COMPLIANCE ⚠️

**Date:** 2025-01-31

### Current State
- [x] Canonical URLs language-agnostic
- [x] OG tags static (expected)
- [x] Twitter cards static (expected)
- [ ] `<html lang>` NOT dynamic (needs fix)
- [ ] OrganizationSchema missing French (needs fix)
- [ ] Title tags static (optional enhancement)

### Accessibility Impact
**Severity:** Medium  
**WCAG:** Violates 3.1.1 (Language of Page) - AA  
**Fix Required:** Implement dynamic `<html lang>` attribute

**Next Phase:** VL4 - Drift guard snapshot
