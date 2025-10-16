# Testing Job Scraper

## Local Testing in Docker

### 1. Build image

```bash
docker-compose build
```

**Expected result:** Successful image build with Node.js 20 and all Chrome dependencies.

### 2. Start container

```bash
docker-compose up -d
```

**Expected result:** Container starts and runs in background.

### 3. Check status

```bash
docker-compose ps
```

**Expected output:**
```
NAME                        STATUS          PORTS
job-scraper-job-scraper-1   Up X seconds    0.0.0.0:3000->3000/tcp
```

### 4. Check logs

```bash
docker-compose logs
```

**Expected output:**
```
job-scraper-1  | ✅ Upwork Scraper API listening on http://localhost:3000
```

### 5. Health Check

```bash
curl http://localhost:3000/
```

**Expected response:**
```json
{"message":"Upwork Scraper API is running."}
```

### 6. Test scraping request

**⚠️ Warning:** This request may take 30-60 seconds and requires a real Upwork search URL.

```bash
curl -X POST http://localhost:3000/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.upwork.com/nx/search/jobs/?q=nodejs&sort=recency",
    "maxJobs": 5
  }'
```

**Note:** Replace URL with an actual search query from Upwork.

**Expected result:** JSON array with job data.

### 7. Real-time monitoring

While scraping, you can monitor logs:

```bash
docker-compose logs -f
```

**What you should see:**
```
Initializing browser...
Browser initialized in headless mode
Navigating to https://www.upwork.com/...
Waiting for Cloudflare to complete...
Attempt 1/20 - <page title>
Cloudflare completely bypassed!
Successfully reached the target page
Looking for job elements...
Found X elements with: article[data-test="jobTile"]
Starting job scraping...
Job 1: [~0123...] Some Job Title...
Job 2: [~0456...] Another Job Title...
...
Scraping successful. Found X jobs.
Browser closed
```

### 8. Check resources

```bash
docker stats job-scraper-job-scraper-1
```

**What to check:**
- **Memory:** Should be within 1-2GB during active scraping
- **CPU:** May reach 100% while browser is working

## Testing with cookies (optional)

If you have an authenticated Upwork session, you can pass cookies:

```bash
curl -X POST http://localhost:3000/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.upwork.com/nx/search/jobs/?q=nodejs",
    "maxJobs": 5,
    "cookies": [
      {
        "name": "cookie_name",
        "value": "cookie_value",
        "domain": ".upwork.com"
      }
    ]
  }'
```

## Graceful Shutdown

Test proper termination:

```bash
# Send SIGTERM
docker-compose stop

# Check logs
docker-compose logs --tail=50
```

**Expected output:**
```
SIGTERM received. Starting graceful shutdown...
HTTP server closed
Browser closed
```

## Cleanup

### Stop container

```bash
docker-compose down
```

### Complete cleanup (with images)

```bash
docker-compose down
docker rmi job-scraper-job-scraper
```

## Troubleshooting

### Container won't start

```bash
# Check detailed logs
docker-compose logs

# Check if port 3000 is occupied
lsof -i :3000

# If occupied, change port in docker-compose.yml
```

### "Chrome crashed" error

Usually related to memory shortage. Solutions:

1. Increase `shm_size` in docker-compose.yml:
```yaml
shm_size: '4gb'
```

2. Or reduce `maxJobs` in requests.

### Cloudflare blocking requests

- Try passing cookies from authenticated session
- Increase delays in code (scraper.js file, `delay()` method)
- Use proxy (requires code modification)

### Debug screenshot

If no jobs are found, scraper creates a screenshot. To get it:

```bash
# Find container ID
docker ps

# Copy screenshot from container
docker cp job-scraper-job-scraper-1:/tmp/debug_no_jobs_*.png ./
```

## Automated Testing (script)

Create `test.sh` file:

```bash
#!/bin/bash

echo "🧪 Starting tests..."

# 1. Health check
echo "1. Testing health endpoint..."
HEALTH=$(curl -s http://localhost:3000/)
if echo "$HEALTH" | grep -q "Upwork Scraper API is running"; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    exit 1
fi

# 2. Test invalid request
echo "2. Testing validation..."
ERROR=$(curl -s -X POST http://localhost:3000/scrape \
  -H "Content-Type: application/json" \
  -d '{}')
if echo "$ERROR" | grep -q "error"; then
    echo "✅ Validation works"
else
    echo "❌ Validation test failed"
    exit 1
fi

echo "✅ All tests passed!"
```

Run:

```bash
chmod +x test.sh
./test.sh
```

## Next Steps

After successful local testing:

1. ✅ Everything works locally → ready to deploy to VPS
2. 📚 Follow instructions in [DEPLOYMENT.md](./DEPLOYMENT.md)
3. 🚀 Use `./deploy.sh` script for automated deployment
