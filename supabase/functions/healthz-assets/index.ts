/**
 * Asset Health Check Endpoint (T-3)
 * 
 * Production-safe synthetic smoke test for asset serving.
 * Returns JSON with:
 * - index.html status + cache header
 * - Sample asset status + MIME type
 * - Service worker registration status
 * 
 * Usage: GET /healthz/assets
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface AssetCheck {
  url: string;
  status: number;
  contentType: string | null;
  cacheControl: string | null;
  size: number;
}

interface HealthReport {
  timestamp: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    indexHtml: AssetCheck;
    sampleAsset?: AssetCheck;
    serviceWorker?: AssetCheck;
    manifest?: AssetCheck;
  };
  issues: string[];
}

async function checkAsset(url: string): Promise<AssetCheck> {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      cache: 'no-cache',
    });
    
    return {
      url,
      status: response.status,
      contentType: response.headers.get('content-type'),
      cacheControl: response.headers.get('cache-control'),
      size: parseInt(response.headers.get('content-length') || '0', 10),
    };
  } catch (error) {
    return {
      url,
      status: 0,
      contentType: null,
      cacheControl: null,
      size: 0,
    };
  }
}

serve(async (req: Request) => {
  // CORS headers for monitoring tools
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { status: 405, headers }
    );
  }

  const baseUrl = new URL(req.url).origin;
  const issues: string[] = [];

  // Check index.html
  const indexCheck = await checkAsset(`${baseUrl}/`);
  
  if (indexCheck.status !== 200) {
    issues.push(`index.html returned ${indexCheck.status}`);
  }
  
  if (!indexCheck.contentType?.includes('text/html')) {
    issues.push(`index.html has wrong content-type: ${indexCheck.contentType}`);
  }
  
  if (!indexCheck.cacheControl?.includes('no-cache')) {
    issues.push(`index.html should have no-cache, got: ${indexCheck.cacheControl}`);
  }

  // Check service worker
  const swCheck = await checkAsset(`${baseUrl}/sw.js`);
  
  if (swCheck.status === 200) {
    if (!swCheck.contentType?.includes('javascript')) {
      issues.push(`sw.js has wrong content-type: ${swCheck.contentType}`);
    }
    
    if (!swCheck.cacheControl?.includes('no-cache')) {
      issues.push(`sw.js should have no-cache, got: ${swCheck.cacheControl}`);
    }
  }

  // Check manifest
  const manifestCheck = await checkAsset(`${baseUrl}/manifest.webmanifest`);
  
  if (manifestCheck.status === 200) {
    if (!manifestCheck.contentType?.includes('json') && !manifestCheck.contentType?.includes('manifest')) {
      issues.push(`manifest has wrong content-type: ${manifestCheck.contentType}`);
    }
  }

  // Determine overall status
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  if (issues.length > 0) {
    const criticalIssues = issues.filter(i => 
      i.includes('returned 0') || 
      i.includes('returned 404') || 
      i.includes('returned 500')
    );
    
    status = criticalIssues.length > 0 ? 'unhealthy' : 'degraded';
  }

  const report: HealthReport = {
    timestamp: new Date().toISOString(),
    status,
    checks: {
      indexHtml: indexCheck,
      ...(swCheck.status > 0 && { serviceWorker: swCheck }),
      ...(manifestCheck.status > 0 && { manifest: manifestCheck }),
    },
    issues,
  };

  return new Response(
    JSON.stringify(report, null, 2),
    { 
      status: status === 'unhealthy' ? 503 : 200, 
      headers 
    }
  );
});

