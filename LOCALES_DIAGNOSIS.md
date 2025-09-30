# Phase L1 — Locales Diagnosis

## Current State Analysis

### Existing Locale Files
Found in `public/locales/`:
```
public/locales/en/dashboard.json ✓ (41 lines, complete namespace)
```

**Missing:**
- `public/locales/fr-CA/` directory (entire language)
- `public/locales/en/common.json` (namespace)
- `public/locales/fr-CA/dashboard.json` (namespace)
- `public/locales/fr-CA/common.json` (namespace)

### i18n Implementation Status
**❌ NOT IMPLEMENTED**

- **Dependencies:** i18next, react-i18next, i18next-http-backend NOT installed
- **Initialization:** No i18n config found in codebase
- **Usage:** No `useTranslation()` hooks in any components
- **Language switcher:** Not present in Header component

### BCP-47 Tag Support
**Status:** Not applicable (no i18n library)

**Target configuration when implemented:**
- Primary language: `en` (English)
- Secondary language: `fr-CA` (French Canadian, BCP-47 compliant)
- Fallback chain: `fr-CA` → `en` → key itself

### Current Fallback + Detection Order
**Status:** N/A - no i18n detection configured

### Existing Dashboard Namespace Keys (en)
The `dashboard.json` contains 40+ keys organized into:
- `welcome.*` (5 keys)
- `kpi.*` (4 keys)
- `insights.*` (2 keys)
- `empty.*` (3 keys)
- `actions.*` (1 key)
- `appointments.*` (6 keys including nested `actions`)
- `recent_wins.*` (3 keys)

## Issues Identified

1. **Missing i18n Infrastructure**
   - No i18next libraries installed
   - No initialization code
   - No hooks wired into components

2. **Missing Language Support**
   - French Canadian (`fr-CA`) locale completely absent
   - No language switcher UI

3. **Missing Namespaces**
   - Only `dashboard` namespace exists
   - Need `common` namespace for shared strings (header, footer, buttons, etc.)

4. **Hard-Coded Strings**
   - All UI copy currently hard-coded in components
   - Brand title "TradeLine 24/7 — Your 24/7 AI Receptionist!" hard-coded in index.html
   - Navigation, CTAs, all sections use literal strings

## Recommended Next Steps (L2-L5)

**L2:** Install i18next dependencies and create locale file structure
**L3:** Configure deterministic loading from `/locales/{{lng}}/{{ns}}.json`
**L4:** Build language switcher with SUPPORTED_LOCALES=['en','fr-CA']
**L5:** Verify 200 responses for all locale endpoints

## Diagnosis Complete
**Status:** PASS (diagnosis complete, no changes made)
**Date:** 2025-01-31
**Next Phase:** L2 - Restore Files
