import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Serve CTA callback landing page
 * GET /cta/callback
 */
export function ctaCallbackPageHandler(req, res) {
  try {
    const htmlPath = join(__dirname, '../../public/cta-callback.html');
    const html = readFileSync(htmlPath, 'utf8');
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-cache');
    res.send(html);
    
  } catch (error) {
    console.error('CTA callback page error:', error);
    res.status(500).send('Page not found');
  }
}

/**
 * Serve CTA deposit success landing page  
 * GET /cta/deposit/success
 */
export function ctaDepositSuccessPageHandler(req, res) {
  try {
    const htmlPath = join(__dirname, '../../public/cta-deposit-success.html');
    const html = readFileSync(htmlPath, 'utf8');
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-cache');
    res.send(html);
    
  } catch (error) {
    console.error('CTA deposit success page error:', error);
    res.status(500).send('Page not found');
  }
}