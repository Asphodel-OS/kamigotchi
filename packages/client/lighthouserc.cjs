module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        // TODO: mobile preset?
      },
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        // Performance
        'categories:performance': ['warn', { minScore: 0.8 }], // should be error
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 3000 }], // should be error
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'speed-index': ['warn', { maxNumericValue: 4000 }],

        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],

        // Resource budgets
        'resource-summary:script:size': ['warn', { maxNumericValue: 500000 }], // should be error
        'resource-summary:image:size': ['warn', { maxNumericValue: 1000000 }],
        'resource-summary:stylesheet:size': ['warn', { maxNumericValue: 100000 }],
        'resource-summary:total:size': ['warn', { maxNumericValue: 3000000 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
