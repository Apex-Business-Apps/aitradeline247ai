# Lighthouse CI Performance Monitoring

Automated Lighthouse CI integration for performance, accessibility, SEO, and best practices monitoring.

## GitHub Action

The Lighthouse CI workflow runs on:
- Push to `main`/`master` branches
- Pull requests to `main`/`master` branches

### Assertion Thresholds

- **Performance**: ≥90%
- **Accessibility**: ≥100% (perfect score required)
- **Best Practices**: ≥90%
- **SEO**: ≥90%
- **Max Potential FID**: ≤200ms

## Performance Budgets

### Resource Size Limits (KiB)
- **Total**: 300 KiB
- **JavaScript**: 150 KiB
- **CSS**: 50 KiB
- **Images**: 100 KiB
- **Fonts**: 50 KiB

### Timing Budgets (milliseconds)
- **Interactive (TTI)**: 4000ms
- **First Contentful Paint**: 1800ms
- **Largest Contentful Paint**: 2500ms
- **Speed Index**: 3000ms
- **Cumulative Layout Shift**: 0.02

## Interpreting Results

### Performance Failures
- **Reduce bundle size**: Check for unused dependencies, code splitting
- **Optimize images**: Use WebP format, proper sizing, lazy loading
- **Remove render-blocking resources**: Defer non-critical CSS/JS

### Accessibility Failures
- **Missing alt attributes**: All images need descriptive alt text
- **Color contrast**: Ensure 4.5:1 ratio for normal text, 3:1 for large text
- **Keyboard navigation**: All interactive elements must be keyboard accessible
- **ARIA labels**: Proper labeling for screen readers

### SEO Issues
- **Missing meta descriptions**: Add unique descriptions for each page
- **Improper heading structure**: Use H1-H6 in logical order
- **Missing canonical URLs**: Prevent duplicate content issues

### Best Practices Problems
- **HTTPS**: Ensure all resources served over HTTPS
- **Console errors**: Fix JavaScript errors and warnings
- **Deprecated APIs**: Update to modern web APIs

## Budget Violations

When budgets are exceeded:

1. **JavaScript budget exceeded**:
   - Analyze bundle with `npm run build -- --analyze`
   - Remove unused dependencies
   - Implement code splitting

2. **Image budget exceeded**:
   - Compress images with tools like ImageOptim
   - Convert to WebP format
   - Implement lazy loading

3. **Timing budget exceeded**:
   - Optimize Critical Rendering Path
   - Reduce main thread blocking time
   - Implement resource prioritization

## Local Testing

Run Lighthouse locally:
```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Test local build
npm run build
npx http-server dist -p 4173

# Run audit
lighthouse http://localhost:4173 --view
```

## CI Output

The GitHub Action will:
- Run Lighthouse audits on the built application
- Check assertions against thresholds
- Upload results to temporary public storage
- Comment on PRs with pass/fail status
- Fail the build if assertions don't meet requirements

## Customizing Budgets

Edit `lighthouse-budget.json` to adjust limits:
- Increase budgets for resource-heavy features
- Add new budget categories as needed
- Tighten budgets as performance improves

## Monitoring Trends

Track performance over time:
- Set up Lighthouse CI server for historical data
- Monitor Core Web Vitals in production
- Use Google Search Console for real user metrics