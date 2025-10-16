const { connect } = require("puppeteer-real-browser");

class WorkingUpworkScraper_NoCookie {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init(cookieData = null) {
    console.log("Initializing browser...");
    try {
      const { browser, page } = await connect({
        headless: "new",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-software-rasterizer",
          "--disable-extensions",
          "--disable-background-networking",
          "--disable-default-apps",
          "--disable-sync",
          "--disable-translate",
          "--hide-scrollbars",
          "--metrics-recording-only",
          "--mute-audio",
          "--no-first-run",
          "--safebrowsing-disable-auto-update",
          "--window-size=1920,1080",
        ],
        fingerprint: true,
        turnstile: true,
        connectOption: {
          defaultViewport: {
            width: 1920,
            height: 1080,
            deviceScaleFactor: 1,
          },
        },
      });

      this.browser = browser;
      this.page = page;

      if (cookieData && Array.isArray(cookieData) && cookieData.length > 0) {
        console.log("Attempting to load provided cookies...");
        try {
          await this.page.setCookie(...cookieData);
          console.log("Cookies loaded successfully.");
        } catch (error) {
          console.error("Failed to load or set cookies:", error.message);
        }
      }

      await this.page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      await this.page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
        
        window.chrome = {
          runtime: {},
        };
        
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
          parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
        );
      });

      console.log("Browser initialized in headless mode");
      return true;
    } catch (error) {
      console.error("Failed to initialize browser:", error.message);
      return false;
    }
  }

  async navigateToUpwork(targetUrl) {
    console.log(`Navigating to ${targetUrl}...`);
    try {
      await this.page.goto(targetUrl, {
        waitUntil: "networkidle0",
        timeout: 60000,
      });
      await this.waitForCloudflareComplete();
      await this.delay(3000, 5000);
      console.log("Successfully reached the target page");
      return true;
    } catch (error) {
      console.error("Navigation failed:", error.message);
      return false;
    }
  }

  async delay(min = 2000, max = 4000) {
    const delay = Math.random() * (max - min) + min;
    console.log(`Waiting ${Math.round(delay / 1000)}s...`);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  async waitForCloudflareComplete() {
    console.log("Waiting for Cloudflare to complete...");
    let attempts = 0;
    const maxAttempts = 20;
    while (attempts < maxAttempts) {
      attempts++;
      const title = await this.page.title();
      const url = this.page.url();
      console.log(`Attempt ${attempts}/${maxAttempts} - ${title}`);
      if (
        url.includes("upwork.com") &&
        !title.toLowerCase().includes("cloudflare") &&
        !title.toLowerCase().includes("checking")
      ) {
        console.log("Cloudflare completely bypassed!");
        return true;
      }
      await this.delay(5000, 8000);
    }
    console.log("Continuing despite potential Cloudflare...");
    return true;
  }

  async findJobElements() {
    console.log("Looking for job elements...");
    const selectors = [
      'article[data-test="jobTile"]',
      ".job-tile",
      ".air3-card.job-tile"
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
    console.log("No job elements found.");
    
    // Диагностика: выводим структуру страницы
    const bodyHTML = await this.page.evaluate(() => {
      const body = document.body;
      const articles = body.querySelectorAll('article');
      const sections = body.querySelectorAll('section');
      const divs = body.querySelectorAll('div[class*="card"], div[class*="tile"], div[class*="job"]');
      return {
        articleCount: articles.length,
        sectionCount: sections.length,
        cardDivCount: divs.length,
        firstArticleClasses: articles[0]?.className || 'none',
        firstSectionClasses: sections[0]?.className || 'none',
        bodyClasses: body.className,
      };
    });
    console.log('Page structure:', JSON.stringify(bodyHTML, null, 2));
    
    await this.page.screenshot({ path: `/tmp/debug_no_jobs_${Date.now()}.png`, fullPage: true });
    
    // Сохраняем HTML для анализа
    const html = await this.page.content();
    const fs = require('fs');
    const htmlPath = `/tmp/debug_page_${Date.now()}.html`;
    fs.writeFileSync(htmlPath, html);
    console.log(`HTML saved to: ${htmlPath}`);
    
    return { elements: [], selector: "none" };
  }

  async scrapeJobs(maxJobs = 20) {
    console.log("Starting job scraping...");
    const jobs = [];
    try {
      const { elements: jobElements } = await this.findJobElements();
      if (jobElements.length === 0) {
        console.log("No job elements found to scrape.");
        return jobs;
      }

      const maxJobsToProcess = Math.min(jobElements.length, maxJobs);
      for (let i = 0; i < maxJobsToProcess; i++) {
        try {
          const jobData = await jobElements[i].evaluate((element) => {
            const getText = (selector) =>
              element.querySelector(selector)?.textContent.trim() || null;

            const job_id = element.getAttribute("data-ev-job-uid") || null;

            const titleLink = element.querySelector(
              'h2 a[href*="/jobs/"], [data-test="job-tile-title-link"]'
            );
            const title = titleLink?.textContent.trim() || "No title";
            const url = titleLink?.href || "No URL";

            const description =
              getText(
                '[data-test="UpClineClamp JobDescription"] p, .air3-line-clamp p'
              ) || "No description";

            // Budget, Experience, and Posted Time
            let budget = "Not specified";
            let experienceLevel = "Not specified";
            const jobInfoItems = element.querySelectorAll(
              '[data-test="jobInfo"] li, .job-tile-info-list li'
            );
            jobInfoItems.forEach((item) => {
              const text = item.textContent.trim();
              if (text.includes("Hourly") || text.includes("Fixed-price"))
                budget = text;
              if (
                text.includes("Entry") ||
                text.includes("Intermediate") ||
                text.includes("Expert")
              ) {
                experienceLevel = text;
              }
            });

            const posted =
              (getText(
                '[data-test="job-published-date"] small, small.text-light'
              ) || "")
                .replace("Posted", "")
                .trim() || "Unknown";

            // Skills
            const skills = Array.from(
              element.querySelectorAll(
                '[data-test="token"] span, .air3-token span'
              )
            ).map((el) => el.textContent.trim());

            // Client Info
            const paymentVerified = getText(
              '[data-test="payment-verification-badge"]'
            )?.includes("Payment verified")
              ? "Verified"
              : "Unverified";
            const rating = getText(".air3-rating-value-text")
              ? `${getText(".air3-rating-value-text")} stars`
              : "No rating";
            const totalSpent = getText('[data-test="total-spent"] strong')
              ? `${getText('[data-test="total-spent"] strong')} spent`
              : "No spend";
            const location = getText('[data-test="location"]') || "No location";

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

          if (jobData && jobData.title !== "No title") {
            jobs.push({
              id: jobs.length + 1,
              ...jobData,
              scrapedAt: new Date().toISOString(),
            });
            console.log(
              `Job ${jobs.length}: [${jobData.job_id}] ${jobData.title.substring(
                0,
                40
              )}...`
            );
          } else {
            console.log(`Skipped job ${i + 1} - no valid data found`);
          }
          await this.delay(200, 500);
        } catch (error) {
          console.log(`Error processing job ${i + 1}:`, error.message);
        }
      }
    } catch (error) {
      console.error("Scraping error", error.message);
    }

    return jobs;
  }

  async close() {
    try {
      if (this.browser) {
        await this.browser.close();
        console.log("Browser closed");
      }
    } catch (error) {
      console.log("Error closing browser", error.message);
    }
  }
}

module.exports = WorkingUpworkScraper_NoCookie;
