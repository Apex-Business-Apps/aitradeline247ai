# TradeLine 24/7 — Project Canon (Authoritative Summary)

## Role & Objective
- **Role:** Fractional CTO/COO/Staff Eng/Creative Director/Product+Growth (ship, no drift).
- **Objective:** "What already works — better." Fast setup, personalizable flows/voice, email-only transcripts, simple installable web app. No vendor churn unless explicitly approved.
- **Mission:** 24/7 AI Receptionist service that handles calls when businesses can't, with Canadian compliance and enterprise security.

## Non-negotiables ("Do not break")
- **Hero Layout Canon:** Hero/ROI duo centered, equal columns/heights; auto-heal and blow-up guard (dev). Files: `src/sections/HeroRoiDuo.tsx`, `src/styles/hero-roi.css`, `src/lib/layoutGuard.ts`
- **Performance:** CLS ≤ 0.01; keep LCP element + `fetchpriority="high"`; no blocking scripts
- **Canadian Compliance:** CASL/PIPEDA notices in email & call flows; data hosted in Canada
- **PWA Pattern:** manifest.webmanifest, minimal sw.js, beforeinstallprompt capture, iOS helper
- **Twilio Security:** Webhooks MUST validate `X-Twilio-Signature` (403 on fail) and answer fast (2xx)
- **SEO Canon:** robots+sitemap, canonical to `https://www.tradeline247ai.com`, JSON-LD (Org/WebSite), OG/Twitter, per-route titles
- **Design System:** All colors via semantic tokens (index.css/tailwind.config.ts); no direct color classes
- **Security Headers:** CSP, HSTS, X-Content-Type-Options, X-Frame-Options implemented

## Current Production State
- ✅ **Twilio Integration:** Voice answer/status functions with HMAC-SHA1 signature validation
- ✅ **Security:** Critical fixes implemented (webhook validation, RLS policies, function hardening)
- ✅ **PWA:** Basic manifest + minimal service worker + install prompt
- ✅ **SEO:** Canonical URLs, sitemap.xml, robots.txt, OG/Twitter meta tags
- ✅ **Analytics:** GA4 (G-5KPE9X0NDM) + Klaviyo integration with consent gating
- ✅ **Real-time:** Supabase subscriptions for live call monitoring
- ⚠️ **Manual Required:** Password protection in Supabase dashboard
- ⚠️ **Manual Required:** GSC sitemap submission and URL inspection

## Technology Stack
- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (Edge Functions, Database, Auth, Storage)
- **Telephony:** Twilio Voice API with signature validation
- **Analytics:** GA4 + Klaviyo with privacy-compliant tracking
- **Deployment:** Lovable hosting with direct DNS

## Guardrails
- **Absolute Guard:** Only modify whitelisted files per prompt; abort on uncertainty
- **Layout Canon:** Hero/ROI duo immutable structure with auto-healing guards
- **Security First:** All webhooks validated, RLS policies enforced, audit logging enabled
- **Canada First:** CASL consent requirements, PIPEDA privacy notices mandatory
- **Performance First:** CLS ≤ 0.01 target, image optimization, lazy loading
- **SEO First:** Canonical URLs, meta tags, structured data on every route

## Brand Constants
- **App Name:** TradeLine 24/7
- **Title Tag:** "TradeLine 24/7 — Your 24/7 AI Receptionist!"
- **Primary CTA:** "Never miss a call. Work while you sleep."
- **Voice:** Enterprise-grade, concise, trustworthy; mobile-first; WCAG AA
- **Domain:** https://www.tradeline247ai.com (canonical)
- **Logo:** `/assets/official-logo.svg` with specific transform properties