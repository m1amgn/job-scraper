# Upwork Job Scraper API

Automated service for scraping job listings from the Upwork platform using Puppeteer in headless mode.

## 🎯 Description

This project is a REST API for scraping job listings from Upwork. It uses:
- **Express.js** - for REST API
- **Puppeteer** - for browser automation
- **puppeteer-real-browser** - to bypass bot protection (Cloudflare, Turnstile)

## ✨ Features

- Scrape jobs from any Upwork search query
- Headless mode for running on servers without GUI
- Bypass Cloudflare and anti-bot protection
- Extract detailed job information:
  - Title and description
  - Budget (Hourly/Fixed-price)
  - Required experience level
  - Skills list
  - Client information (rating, verification, total spent)
  - Job URL

## 📋 Requirements

### For local running:
- Node.js 18+ or 20+
- npm or yarn

### For Docker:
- Docker 20.10+
- Docker Compose 1.29+

### System resources:
- Minimum 2GB RAM
- Minimum 10GB disk space

## 🚀 Quick Start

### Local running (without Docker)

```bash
# Clone repository
git clone <repository-url>
cd job-scraper

# Install dependencies
npm install

# Run in dev mode
npm run dev

# Or production mode
npm start
```

API will be available at `http://localhost:3000`

### Running with Docker (recommended)

```bash
# Build image
docker-compose build

# Start container
docker-compose up -d

# View logs
docker-compose logs -f
```

## 📡 API Endpoints

### Health Check

```bash
GET /
```

**Response:**
```json
{
  "message": "Upwork Scraper API is running."
}
```

### Scrape Jobs

```bash
POST /scrape
Content-Type: application/json
```

**Request parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | Upwork search URL (must start with `https://www.upwork.com`) |
| `cookies` | array | No | Array of cookies for authenticated session |
| `maxJobs` | number | No | Maximum number of jobs (default: 10) |

**Example request:**

```bash
curl -X POST http://localhost:3000/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.upwork.com/nx/search/jobs/?q=nodejs&sort=recency",
    "maxJobs": 20
  }'
```

**Example response:**

```json
[
  {
    "id": 1,
    "job_id": "~012345678901234567",
    "title": "Node.js Backend Developer Needed",
    "description": "Looking for an experienced Node.js developer...",
    "budget": "Hourly: $50.00-$100.00",
    "experienceLevel": "Expert",
    "posted": "3 hours ago",
    "skills": ["Node.js", "Express.js", "MongoDB", "REST API"],
    "url": "https://www.upwork.com/jobs/~012345678901234567",
    "clientInfo": {
      "paymentVerified": "Verified",
      "rating": "4.9 stars",
      "totalSpent": "$10K+ spent",
      "location": "United States"
    },
    "scrapedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

## 🍪 Using Cookies to Bypass Cloudflare

When running on a VPS/server, Cloudflare may block requests from datacenter IPs. Using cookies from a real browser session helps bypass this protection.

### Quick Start with Cookies

**Option 1: Visual Cookie Exporter (Easiest)**

1. Open `export-cookies.html` in your browser
2. Navigate to [Upwork Job Search](https://www.upwork.com/nx/search/jobs/) and log in
3. Click "Export Cookies" button on the export page
4. Save the JSON output to `cookies.json`

**Option 2: Browser Extension**

1. Install [Cookie-Editor](https://chrome.google.com/webstore/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm) for Chrome
2. Go to Upwork and log in
3. Click extension → Export → JSON format
4. Save as `cookies.json`

### Using Cookies with API

```bash
curl -X POST http://your-server:3000/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.upwork.com/nx/search/jobs/?q=python&sort=recency",
    "cookies": [
      {
        "name": "oauth2_global_js_token",
        "value": "your-token-value",
        "domain": ".upwork.com",
        "path": "/",
        "secure": true
      }
    ],
    "maxJobs": 20
  }'
```

### Testing with Cookies

```bash
# Use the included test script
./test-with-cookies.sh python http://your-server:3000
```

📖 **For detailed instructions, see [COOKIES.md](COOKIES.md)**

## 🔧 Configuration

### Environment variables

Create a `.env` file in the project root (optional):

```bash
NODE_ENV=production
PORT=3000
```

### Docker Compose settings

Edit `docker-compose.yml` to change configuration:

```yaml
environment:
  - NODE_ENV=production
  - PORT=3000
ports:
  - "3000:3000"  # HOST_PORT:CONTAINER_PORT
shm_size: '2gb'  # Shared memory for Chrome
```

## 🛠️ Scripts

```bash
# Run in production mode
npm start

# Run in development mode
npm run dev

# Build Docker image
docker-compose build

# Run in Docker
docker-compose up -d

# Stop
docker-compose stop

# View logs
docker-compose logs -f

# Complete cleanup
docker-compose down
```

## 📁 Project Structure

```
job-scraper/
├── server.js              # Express API server
├── scraper.js             # Upwork scraping class
├── package.json           # Dependencies and scripts
├── Dockerfile             # Docker image
├── docker-compose.yml     # Docker Compose configuration
├── .dockerignore          # Docker exclusions
├── deploy.sh              # Deployment script
├── README.md              # Documentation
└── DEPLOYMENT.md          # Deployment guide
```

## 🐛 Debugging

### View logs

```bash
# In Docker
docker-compose logs -f

# Locally - logs output to console
```

### Screenshots on errors

If no jobs are found, the scraper creates a screenshot:
- **Docker:** `/tmp/debug_no_jobs_<timestamp>.png` inside the container
- **Locally:** `/tmp/debug_no_jobs_<timestamp>.png`

To extract screenshot from Docker:

```bash
docker cp job-scraper_job-scraper_1:/tmp/debug_no_jobs_*.png ./
```

### Memory issues

Chrome consumes a lot of RAM. Solutions:

1. **Increase shared memory in Docker:**
```yaml
shm_size: '4gb'
```

2. **Add swap on server** (see DEPLOYMENT.md)

3. **Reduce maxJobs** in requests

### Cloudflare blocking requests

- Use `cookies` parameter to pass authenticated session
- Increase delays between requests
- Make sure `puppeteer-real-browser` is installed correctly

## ⚠️ Important Notes

### Legality

- Scraping public data is in a gray area
- Use for personal purposes, not commercial
- Respect reasonable rate limits
- Don't overload Upwork servers

### Performance

- One request can take 30-60 seconds
- Recommended no more than 5-10 requests per hour
- Each request opens a new browser (resource intensive)

### Security

- Don't share cookies with third parties
- Restrict API access (use API keys in production)
- Configure firewall on server
- Use HTTPS through reverse proxy (nginx)

## 🚀 VPS Deployment

Detailed instructions in [DEPLOYMENT.md](./DEPLOYMENT.md)

Quick version:

```bash
# On server
git clone <repository-url>
cd job-scraper
docker-compose build
docker-compose up -d
```

## 🔄 Updates

```bash
# Use deploy.sh script
chmod +x deploy.sh
./deploy.sh

# Or manually
docker-compose down
git pull
docker-compose build
docker-compose up -d
```

## 📊 Monitoring

```bash
# Resource usage
docker stats

# Container status
docker-compose ps

# Real-time logs
docker-compose logs -f
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📝 Changelog

### v1.0.0 (2024-01-15)
- First release
- Headless mode for server usage
- Docker support
- Graceful shutdown
- Anti-detection protection
- Complete documentation

## 📄 License

ISC

## 👤 Author

Your Name

## 🐛 Known Issues

- Cloudflare may block headless browsers more often than regular ones
- Requires a lot of RAM for multiple concurrent requests
- Upwork HTML structure may change, requiring selector updates

## 🔮 Planned Features

- [ ] Browser pool for resource optimization
- [ ] Task queue (Redis/Bull)
- [ ] Result caching
- [ ] PostgreSQL for history storage
- [ ] RSS Feed integration
- [ ] Webhook notifications
- [ ] Rate limiting
- [ ] API authentication
