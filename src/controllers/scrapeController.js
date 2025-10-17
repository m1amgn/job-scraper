/**
 * Scrape Controller
 * Handles HTTP requests for scraping operations
 */

const UpworkScraperService = require('../services/scraper');

class ScrapeController {
  /**
   * Handle scrape request
   */
  static async scrape(req, res) {
    const { url, cookies, maxJobs = 10, proxy } = req.body;

    // Validation
    if (!url) {
      return res.status(400).json({ 
        error: 'Upwork search URL is required.' 
      });
    }

    if (!url.startsWith('https://www.upwork.com')) {
      return res.status(400).json({ 
        error: 'URL must start with https://www.upwork.com' 
      });
    }

    console.log(`Received scrape request for URL: ${url}`);
    const scraper = new UpworkScraperService();

    try {
      // Initialize scraper
      const initSuccess = await scraper.init(cookies, proxy);
      if (!initSuccess) {
        throw new Error('Failed to initialize the scraping browser.');
      }

      // Navigate to Upwork
      const navSuccess = await scraper.navigateToUpwork(url);
      if (!navSuccess) {
        throw new Error(`Failed to navigate to the specified URL: ${url}`);
      }

      // Scrape jobs
      const jobs = await scraper.scrapeJobs(maxJobs);

      console.log(`Scraping successful. Found ${jobs.length} jobs.`);
      res.status(200).json(jobs);
    } catch (error) {
      console.error('SCRAPING FAILED:', error.message);
      res.status(500).json({
        error: 'An internal server error occurred during the scraping process.',
        details: error.message,
      });
    } finally {
      await scraper.close();
    }
  }

  /**
   * Health check endpoint
   */
  static async healthCheck(req, res) {
    res.status(200).json({ 
      status: 'ok',
      message: 'Upwork Scraper API is running.',
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = ScrapeController;

