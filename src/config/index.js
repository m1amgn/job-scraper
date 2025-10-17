/**
 * Application Configuration
 */

module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
  },

  // Proxy configuration
  proxy: {
    url: process.env.PROXY_URL || null,
  },

  // Scraper configuration
  scraper: {
    maxJobs: 10,
    timeout: 60000,
    viewport: {
      width: 1920,
      height: 1080,
    },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },

  // Cloudflare bypass settings
  cloudflare: {
    maxAttempts: 30,
    delayMin: 3000,
    delayMax: 5000,
  },
};

