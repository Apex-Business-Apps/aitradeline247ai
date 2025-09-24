module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:5173'],
      numberOfRuns: 3,
      settings: {
        preset: 'mobile',
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
      }
    },
    assert: {
      assertions: {
        'categories:accessibility': ['error', { minScore: 1 }],
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.95 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'speed-index': ['error', { maxNumericValue: 3400 }],
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};