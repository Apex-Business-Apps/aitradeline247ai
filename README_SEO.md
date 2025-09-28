# SEO: Robots & Sitemap Autogen

Automated SEO file generation with fallback to static files for the TradeLine 24/7 system.

## Endpoints

### Robots.txt
- `GET /robots.txt` - Serves static file if exists, otherwise generates dynamically

### Sitemap.xml  
- `GET /sitemap.xml` - Serves static file if exists, otherwise generates dynamically

## Route Configuration

The sitemap includes these static routes by default:
- `/` (priority: 1.0)
- `/privacy` (priority: 0.8)
- `/terms` (priority: 0.8)
- `/features` (priority: 0.8)
- `/pricing` (priority: 0.8)
- `/faq` (priority: 0.8)
- `/contact` (priority: 0.8)

## Extending Routes

To add new routes to the sitemap, edit the `STATIC_ROUTES` array in `server/routes/seo.robots.sitemap.mjs`:

```js
const STATIC_ROUTES = [
  '/',
  '/privacy',
  '/terms',
  '/features',
  '/pricing', 
  '/faq',
  '/contact',
  '/new-page'  // Add new routes here
];
```

## Static File Override

To use custom static files instead of generated content:
- Place `robots.txt` in `public/robots.txt`
- Place `sitemap.xml` in `public/sitemap.xml`

The dynamic handlers will automatically serve static files if they exist.

## Cache Headers

Both endpoints set `Cache-Control: public, max-age=3600` (1 hour) for performance.

## Verification

Test the endpoints:
```bash
curl https://your-domain.com/robots.txt
curl https://your-domain.com/sitemap.xml
```

Both should return 200 status with appropriate content-type headers.

## Integration

Wire up in your main server file:
```js
import { robotsHandler, sitemapHandler } from './server/routes/seo.robots.sitemap.mjs';

app.get('/robots.txt', robotsHandler);
app.get('/sitemap.xml', sitemapHandler);
```