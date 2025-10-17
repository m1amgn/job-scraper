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
| `proxy` | string | No | Proxy URL (e.g., `http://user:pass@proxy:port`) |
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

## 🌐 Using Proxy (Recommended for VPS)

When running on a VPS, Cloudflare blocks datacenter IPs. Use a **residential proxy** to bypass this.

### Quick Setup

**1. Get a proxy** (recommended providers):

**2. Configure proxy** in `docker-compose.yml`:

```yaml
environment:
  - PROXY_URL=http://username:password@proxy-server:port
```

**3. Restart container:**

```bash
docker-compose down
docker-compose up -d
```

### Alternative: Pass Proxy in Request

```bash
curl -X POST http://your-server:3000/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.upwork.com/nx/search/jobs/?q=python",
    "proxy": "http://user:pass@proxy:port",
    "maxJobs": 20
  }'
```

📖 **For detailed proxy setup, see [PROXY.md](PROXY.md)**

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

2. **Add swap on server**

3. **Reduce maxJobs** in requests

### Cloudflare blocking requests

- Use `cookies` parameter to pass authenticated session
- Increase delays between requests
- Make sure `puppeteer-real-browser` is installed correctly

## ⚠️ Important Notes

### Performance

- One request can take 30-60 seconds
- Recommended no more than 5-10 requests per hour
- Each request opens a new browser (resource intensive)


## 🚀 VPS Deployment

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