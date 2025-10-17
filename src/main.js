/**
 * Main Entry Point
 * Upwork Scraper API
 */

const app = require('./app');
const config = require('./config');

const PORT = config.server.port;
const ENV = config.server.env;

// Start server
const server = app.listen(PORT, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Upwork Scraper API started`);
  console.log(`📡 Environment: ${ENV}`);
  console.log(`🌐 Server running at: http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/`);
  console.log(`🔗 Scrape endpoint: POST http://localhost:${PORT}/scrape`);
  if (config.proxy.url) {
    console.log(`🌐 Proxy configured: ${config.proxy.url.replace(/:[^:]*@/, ':****@')}`);
  } else {
    console.log(`⚠️  No proxy configured (may fail on VPS with Cloudflare)`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

// Graceful shutdown handler
const shutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  // Close server (stop accepting new connections)
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('Forcing shutdown after timeout...');
    process.exit(1);
  }, 30000);
};

// Handle termination signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = server;

