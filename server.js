const express = require("express");
const WorkingUpworkScraper_NoCookie = require("./scraper");

const app = express();

app.use(express.json({ limit: "5mb" }));

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.status(200).json({ message: "Upwork Scraper API is running." });
});

app.post("/scrape", async (req, res) => {
  const { url, cookies, maxJobs = 10 } = req.body;

  if (!url) {
    return res.status(400).json({ error: "Upwork search URL is required." });
  }

  console.log(`Received scrape request for URL: ${url}`);
  const scraper = new WorkingUpworkScraper_NoCookie();

  try {
    const initSuccess = await scraper.init(cookies);
    if (!initSuccess) {
      throw new Error("Failed to initialize the scraping browser.");
    }

    const navSuccess = await scraper.navigateToUpwork(url);
    if (!navSuccess) {
      throw new Error(`Failed to navigate to the specified URL: ${url}`);
    }

    const jobs = await scraper.scrapeJobs(maxJobs);

    console.log(`Scraping successful. Found ${jobs.length} jobs.`);
    res.status(200).json(jobs);
  } catch (error) {
    console.error("SCRAPING FAILED:", error.message);
    res.status(500).json({
      error: "An internal server error occurred during the scraping process.",
      details: error.message,
    });
  } finally {
    await scraper.close();
  }
});

const server = app.listen(PORT, () => {
  console.log(`✅ Upwork Scraper API listening on http://localhost:${PORT}`);
});

let activeBrowsers = new Set();

app.use((req, res, next) => {
  res.on('finish', () => {
  });
  next();
});

const shutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close(() => {
    console.log('HTTP server closed');
  });

  setTimeout(() => {
    console.log('Forcing shutdown...');
    process.exit(0);
  }, 30000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
