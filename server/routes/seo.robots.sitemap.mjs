import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Static routes for sitemap generation
const STATIC_ROUTES = [
  '/',
  '/privacy', 
  '/terms',
  '/features',
  '/pricing',
  '/faq',
  '/contact'
];

/**
 * Handle robots.txt - serve static if exists else generate
 * GET /robots.txt
 */
export function robotsHandler(req, res) {
  try {
    const staticRobotsPath = path.join(__dirname, '../../public/robots.txt');
    
    // Check if static file exists
    if (fs.existsSync(staticRobotsPath)) {
      const content = fs.readFileSync(staticRobotsPath, 'utf8');
      return res.type('text/plain')
        .set('Cache-Control', 'public, max-age=3600')
        .send(content);
    }
    
    // Generate robots.txt dynamically
    const robotsTxt = `User-agent: *
Allow: /
Sitemap: https://www.tradeline247ai.com/sitemap.xml`;
    
    return res.type('text/plain')
      .set('Cache-Control', 'public, max-age=3600')
      .send(robotsTxt);
      
  } catch (error) {
    console.error('Robots.txt generation error:', error);
    return res.status(500).type('text/plain').send('Error generating robots.txt');
  }
}

/**
 * Handle sitemap.xml - serve static if exists else generate
 * GET /sitemap.xml
 */
export function sitemapHandler(req, res) {
  try {
    const staticSitemapPath = path.join(__dirname, '../../public/sitemap.xml');
    
    // Check if static file exists
    if (fs.existsSync(staticSitemapPath)) {
      const content = fs.readFileSync(staticSitemapPath, 'utf8');
      return res.type('application/xml')
        .set('Cache-Control', 'public, max-age=3600')
        .send(content);
    }
    
    // Generate sitemap.xml dynamically
    const baseUrl = 'https://www.tradeline247ai.com';
    const currentDate = new Date().toISOString().split('T')[0];
    
    const urlEntries = STATIC_ROUTES.map(route => {
      return `  <url>
    <loc>${baseUrl}${route}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${route === '/' ? '1.0' : '0.8'}</priority>
  </url>`;
    }).join('\n');
    
    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
    
    return res.type('application/xml')
      .set('Cache-Control', 'public, max-age=3600')
      .send(sitemapXml);
      
  } catch (error) {
    console.error('Sitemap.xml generation error:', error);
    return res.status(500).type('application/xml').send('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap generation failed</error>');
  }
}