# GA4 — Audiences & Conversions (TradeLine 24/7)
**Events already firing:** `install` (PWA), `start_trial_click`, `submit_lead`, `pricing_start_zero`, `pricing_choose_predictable`, `view_search_results`.

## Mark as Conversions
- install
- start_trial_click
- submit_lead

## Audiences (suggested)
1) **Trial Intent (30d):** users with `start_trial_click` or visited `/auth`.
2) **Installers:** fired `install`.
3) **Leads Submitted:** fired `submit_lead`.
4) **Pricing Browsers:** viewed `/pricing` but no `submit_lead`.
5) **Searchers:** fired `view_search_results` with search_term contains "price|trial|install".

## Explorations (sanity)
- Funnel: Home → start_trial_click → submit_lead.
- Path: `/pricing` → event sequences.

## Notes
- Ads linking optional; no changes to site required.

Acceptance: Document lands under /docs/ga4-audiences.md in repo.