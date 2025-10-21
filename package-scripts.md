# Core Web Vitals & Performance Testing

## LHCI (Lighthouse CI) Testing

### Mobile Performance Gate
Run comprehensive Lighthouse testing with mobile preset and performance gates:

```bash
# Install LHCI (already added to dependencies)
npm run lighthouse:mobile

# Manual LHCI command
npx lhci autorun \
  --collect.url="http://localhost:5173" \
  --collect.numberOfRuns=3 \
  --collect.settings.preset=mobile \
  --upload.target=temporary-public-storage \
  --assert.assertions='{
    "categories:accessibility": ["error", { "minScore": 1 }],
    "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
    "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
    "total-blocking-time": ["error", { "maxNumericValue": 200 }]
  }'
```

### For Production URL Testing
```bash
URL="https://your-staging-url.https://tradeline247aicom.lovable.app/"
npx lhci autorun \
  --collect.url="$URL" \
  --collect.numberOfRuns=3 \
  --collect.settings.preset=mobile \
  --upload.target=temporary-public-storage
```

## Performance Gates Checklist

### ✅ Core Web Vitals Targets
- **Accessibility**: 100% (Perfect score)
- **LCP (Largest Contentful Paint)**: ≤ 2.5s
- **CLS (Cumulative Layout Shift)**: ≤ 0.1
- **TBT (Total Blocking Time)**: ≤ 200ms
- **FCP (First Contentful Paint)**: ≤ 1.8s
- **Performance Score**: ≥ 90%

### ✅ PWA Requirements Met
- ✅ Manifest with proper icons (192x192, 512x512, maskable)
- ✅ Service Worker with offline support
- ✅ Theme colors and display settings
- ✅ Installability requirements
- ✅ Offline shell loads on reload

### ✅ Security Headers Implemented
- ✅ CSP (Content Security Policy) in Report-Only mode
- ✅ X-Content-Type-Options: nosniff
- ✅ X-Frame-Options: SAMEORIGIN
- ✅ X-XSS-Protection: 1; mode=block
- ✅ Referrer-Policy: strict-origin-when-cross-origin

### ✅ Performance Optimizations
- ✅ Hero logo preloaded with fetchpriority="high"
- ✅ Font preloading and preconnects
- ✅ DNS prefetch for Supabase
- ✅ Lazy loading where appropriate
- ✅ Web Vitals monitoring and error tracking

### 🔄 Next Steps (Manual Setup Required)

#### Email Deliverability
1. **Domain Authentication** (requires DNS access):
   - Set up SPF record: `v=spf1 include:_spf.google.com ~all`
   - Configure DKIM in Resend dashboard
   - Add DMARC policy: `v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com`

2. **Monitoring Setup**:
   - Google Postmaster Tools registration
   - DMARC report monitoring

#### Observability
1. **Error Tracking**: 
   - Sign up for Sentry (or similar)
   - Configure environment variables
   - Set sampling rates

2. **Uptime Monitoring**:
   - Set up 1-minute checks for `/` and key API endpoints
   - Configure alerts for 5xx responses

#### Final QA Checklist
- [ ] Keyboard-only navigation test (tab through all interactive elements)
- [ ] Focus visible indicators working
- [ ] GA4 Real-time shows pageviews and events
- [ ] 404 page branded and helpful ✅
- [ ] Form submissions tracked in analytics
- [ ] A/B tests working correctly
- [ ] PWA installation prompt appears

## Testing Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run Lighthouse CI
npm run lighthouse:mobile

# Type checking
npm run type-check
```

## Performance Budget Enforcement

The project includes automated performance gates that fail CI if:
- Accessibility score < 100%
- LCP > 2.5 seconds
- CLS > 0.1
- TBT > 200ms

These gates ensure consistent performance standards across deployments.
