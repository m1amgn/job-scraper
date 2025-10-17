/**
 * Express Application
 * API server for Upwork scraper
 */

const express = require('express');
const ScrapeController = require('./controllers/scrapeController');

const app = express();

// Middleware
app.use(express.json({ limit: '5mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.get('/', ScrapeController.healthCheck);
app.post('/scrape', ScrapeController.scrape);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found` 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

module.exports = app;

