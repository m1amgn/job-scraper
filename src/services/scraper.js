/**
 * Upwork Scraper Service
 * Handles web scraping operations with Cloudflare bypass
 */

const { connect } = require('puppeteer-real-browser');
const fs = require('fs');
const config = require('../config');

class UpworkScraperService {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  /**
   * Initialize browser with optional cookies and proxy
   * @param {Array} cookieData - Optional cookies for authentication
   * @param {String} proxyUrl - Optional proxy URL
   */
  async init(cookieData = null, proxyUrl = null) {
    console.log('Initializing browser...');
    
    const effectiveProxy = proxyUrl || config.proxy.url;
    if (effectiveProxy) {
      console.log(`Using proxy: ${this._maskProxyPassword(effectiveProxy)}`);
    }
    
    try {
      const args = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-first-run',
        '--safebrowsing-disable-auto-update',
        `--window-size=${config.scraper.viewport.width},${config.scraper.viewport.height}`,
      ];

      if (effectiveProxy) {
        args.push(`--proxy-server=${effectiveProxy}`);
      }

      const { browser, page } = await connect({
        headless: 'new',
        args: args,
        fingerprint: true,
        turnstile: true,
        connectOption: {
          defaultViewport: {
            width: config.scraper.viewport.width,
            height: config.scraper.viewport.height,
            deviceScaleFactor: 1,
          },
        },
      });

      this.browser = browser;
      this.page = page;

      if (cookieData && Array.isArray(cookieData) && cookieData.length > 0) {
        await this._loadCookies(cookieData);
      }

      await this._setupAntiDetection();

      console.log('Browser initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize browser:', error.message);
      return false;
    }
  }

  /**
   * Load cookies into the page
   */
  async _loadCookies(cookies) {
    console.log('Loading cookies...');
    try {
      await this.page.setCookie(...cookies);
      console.log('Cookies loaded successfully');
    } catch (error) {
      console.error('Failed to load cookies:', error.message);
    }
  }

  /**
   * Setup anti-detection measures
   */
  async _setupAntiDetection() {
    await this.page.setUserAgent(config.scraper.userAgent);

    await this.page.evaluateOnNewDocument(() => {
      // Hide webdriver flag
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      
      // Emulate chrome object
      window.chrome = {
        runtime: {},
      };
      
      // Override permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications'
          ? Promise.resolve({ state: Notification.permission })
          : originalQuery(parameters)
      );
    });
  }

  /**
   * Navigate to Upwork URL
   * @param {String} targetUrl - Target Upwork URL
   */
  async navigateToUpwork(targetUrl) {
    console.log(`Navigating to ${targetUrl}...`);
    try {
      await this.page.goto(targetUrl, {
        waitUntil: 'networkidle0',
        timeout: config.scraper.timeout,
      });
      
      await this._waitForCloudflareComplete();
      await this._delay(config.cloudflare.delayMin, config.cloudflare.delayMax);
      
      console.log('Successfully reached the target page');
      return true;
    } catch (error) {
      console.error('Navigation failed:', error.message);
      return false;
    }
  }

  /**
   * Wait for Cloudflare challenge to complete
   */
  async _waitForCloudflareComplete() {
    console.log('Waiting for Cloudflare to complete...');
    let attempts = 0;
    const maxAttempts = config.cloudflare.maxAttempts;
    
    while (attempts < maxAttempts) {
      attempts++;
      const title = await this.page.title();
      const url = this.page.url();
      
      console.log(`Attempt ${attempts}/${maxAttempts} - ${title}`);
      
      if (
        url.includes('upwork.com') &&
        !title.toLowerCase().includes('cloudflare') &&
        !title.toLowerCase().includes('checking') &&
        !title.toLowerCase().includes('just a moment')
      ) {
        console.log('Cloudflare completely bypassed!');
        return true;
      }
      
      await this._delay(config.cloudflare.delayMin, config.cloudflare.delayMax);
    }
    
    console.log('Continuing despite potential Cloudflare...');
    return true;
  }

  /**
   * Find job elements on the page
   */
  async findJobElements() {
    console.log('Looking for job elements...');
    const selectors = [
      'article[data-test="jobTile"]',
      '.job-tile',
      '.air3-card.job-tile',
    ];
    
    for (const selector of selectors) {
      try {
        await this.page.waitForSelector(selector, { timeout: 10000 });
        const elements = await this.page.$$(selector);
        
        if (elements.length > 0) {
          console.log(`Found ${elements.length} elements with: ${selector}`);
          return { elements, selector };
        }
      } catch (error) {
        console.log(`Selector failed: ${selector}`);
      }
    }
    
    console.log('No job elements found.');
    await this._saveDebugInfo();
    
    return { elements: [], selector: 'none' };
  }

  /**
   * Save debug information when jobs not found
   */
  async _saveDebugInfo() {
    try {
      // Page structure diagnostics
      const pageStructure = await this.page.evaluate(() => {
        const articles = document.querySelectorAll('article');
        const sections = document.querySelectorAll('section');
        const divs = document.querySelectorAll('div[class*="card"], div[class*="tile"], div[class*="job"]');
        
        return {
          articleCount: articles.length,
          sectionCount: sections.length,
          cardDivCount: divs.length,
          firstArticleClasses: articles[0]?.className || 'none',
          firstSectionClasses: sections[0]?.className || 'none',
          bodyClasses: document.body.className,
        };
      });
      
      console.log('Page structure:', JSON.stringify(pageStructure, null, 2));
      
      // Save screenshot
      const screenshotPath = `/tmp/debug_no_jobs_${Date.now()}.png`;
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`Screenshot saved to: ${screenshotPath}`);
      
      // Save HTML
      const html = await this.page.content();
      const htmlPath = `/tmp/debug_page_${Date.now()}.html`;
      fs.writeFileSync(htmlPath, html);
      console.log(`HTML saved to: ${htmlPath}`);
    } catch (error) {
      console.error('Failed to save debug info:', error.message);
    }
  }

  /**
   * Scrape jobs from the current page
   * @param {Number} maxJobs - Maximum number of jobs to scrape
   */
  async scrapeJobs(maxJobs = config.scraper.maxJobs) {
    console.log('Starting job scraping...');
    const jobs = [];
    
    try {
      const { elements: jobElements } = await this.findJobElements();
      
      if (jobElements.length === 0) {
        console.log('No job elements found to scrape.');
        return jobs;
      }

      const maxJobsToProcess = Math.min(jobElements.length, maxJobs);
      
      for (let i = 0; i < maxJobsToProcess; i++) {
        try {
          const jobData = await this._extractJobData(jobElements[i]);
          
          if (jobData && jobData.title !== 'No title') {
            jobs.push({
              id: jobs.length + 1,
              ...jobData,
              scrapedAt: new Date().toISOString(),
            });
            
            console.log(
              `Job ${jobs.length}: [${jobData.job_id}] ${jobData.title.substring(0, 40)}...`
            );
          } else {
            console.log(`Skipped job ${i + 1} - no valid data found`);
          }
          
          await this._delay(200, 500);
        } catch (error) {
          console.log(`Error processing job ${i + 1}:`, error.message);
        }
      }
    } catch (error) {
      console.error('Scraping error:', error.message);
    }

    return jobs;
  }

  /**
   * Extract job data from a job element
   */
  async _extractJobData(element) {
    return await element.evaluate((el) => {
      const getText = (selector) =>
        el.querySelector(selector)?.textContent.trim() || null;

      const job_id = el.getAttribute('data-ev-job-uid') || null;

      const titleLink = el.querySelector(
        'h2 a[href*="/jobs/"], [data-test="job-tile-title-link"]'
      );
      const title = titleLink?.textContent.trim() || 'No title';
      const url = titleLink?.href || 'No URL';

      const description =
        getText('[data-test="UpClineClamp JobDescription"] p, .air3-line-clamp p') ||
        'No description';

      // Budget and Experience Level
      let budget = 'Not specified';
      let experienceLevel = 'Not specified';
      const jobInfoItems = el.querySelectorAll(
        '[data-test="jobInfo"] li, .job-tile-info-list li'
      );
      
      jobInfoItems.forEach((item) => {
        const text = item.textContent.trim();
        if (text.includes('Hourly') || text.includes('Fixed-price')) {
          budget = text;
        }
        if (text.includes('Entry') || text.includes('Intermediate') || text.includes('Expert')) {
          experienceLevel = text;
        }
      });

      const posted = (
        getText('[data-test="job-published-date"] small, small.text-light') || ''
      )
        .replace('Posted', '')
        .trim() || 'Unknown';

      // Skills
      const skills = Array.from(
        el.querySelectorAll('[data-test="token"] span, .air3-token span')
      ).map((skillEl) => skillEl.textContent.trim());

      // Client Info
      const paymentVerified = getText('[data-test="payment-verification-badge"]')?.includes(
        'Payment verified'
      )
        ? 'Verified'
        : 'Unverified';
      
      const rating = getText('.air3-rating-value-text')
        ? `${getText('.air3-rating-value-text')} stars`
        : 'No rating';
      
      const totalSpent = getText('[data-test="total-spent"] strong')
        ? `${getText('[data-test="total-spent"] strong')} spent`
        : 'No spend';
      
      const location = getText('[data-test="location"]') || 'No location';

      return {
        job_id,
        title,
        description,
        budget,
        experienceLevel,
        posted,
        skills,
        url,
        clientInfo: {
          paymentVerified,
          rating,
          totalSpent,
          location,
        },
      };
    });
  }

  /**
   * Random delay between min and max milliseconds
   */
  async _delay(min = 2000, max = 4000) {
    const delay = Math.random() * (max - min) + min;
    console.log(`Waiting ${Math.round(delay / 1000)}s...`);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Mask password in proxy URL for logging
   */
  _maskProxyPassword(proxyUrl) {
    return proxyUrl.replace(/:[^:]*@/, ':****@');
  }

  /**
   * Close browser
   */
  async close() {
    try {
      if (this.browser) {
        await this.browser.close();
        console.log('Browser closed');
      }
    } catch (error) {
      console.log('Error closing browser:', error.message);
    }
  }
}

module.exports = UpworkScraperService;

