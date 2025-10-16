# 🍪 Quick Start: Using Cookies (5 minutes)

## Why do I need cookies?

Your VPS server has a **datacenter IP** that Cloudflare blocks. Cookies from a real browser session make the scraper look like a logged-in user, bypassing Cloudflare.

---

## Step 1: Export Cookies (2 minutes)

### Method A: Visual Tool (Easiest) ✅

1. **Download** `export-cookies.html` to your local computer:
   ```bash
   # On your local machine
   curl -O https://raw.githubusercontent.com/m1amgn/job-scraper/dev/export-cookies.html
   ```

2. **Open** `export-cookies.html` in your browser (Chrome/Firefox)

3. In a **new tab**, go to [Upwork](https://www.upwork.com/nx/search/jobs/) and **log in**

4. Return to the `export-cookies.html` tab and click **"Export Cookies"**

5. **Copy** the JSON output and save it as `cookies.json`

### Method B: Browser Extension

1. Install [Cookie-Editor](https://chrome.google.com/webstore/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm)
2. Go to Upwork and log in
3. Click extension → Export → JSON
4. Save as `cookies.json`

---

## Step 2: Upload to Server (1 minute)

```bash
# From your local machine, upload cookies to server
scp cookies.json root@your-server-ip:~/job-scraper/
```

---

## Step 3: Test on Server (2 minutes)

```bash
# SSH to your server
ssh root@your-server-ip

# Go to project directory
cd ~/job-scraper

# Test with cookies
./test-with-cookies.sh python
```

**Expected output:**
```
✅ SUCCESS! Found 10 jobs
━━━━━━━━━━━━━━━━━━━━━━━━
📋 Python Developer Needed
💰 $50-$100/hr
🏷️  Skills: Python, Django, API
🔗 https://www.upwork.com/jobs/...
━━━━━━━━━━━━━━━━━━━━━━━━
...
```

---

## Step 4: Use with API

### Direct curl request:

```bash
curl -X POST http://localhost:3000/scrape \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "url": "https://www.upwork.com/nx/search/jobs/?q=python&sort=recency",
  "cookies": $(cat cookies.json),
  "maxJobs": 20
}
EOF
```

### From external application:

```bash
# From any machine
curl -X POST http://your-server-ip:3000/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.upwork.com/nx/search/jobs/?q=nodejs&sort=recency",
    "cookies": [YOUR_COOKIES_HERE],
    "maxJobs": 15
  }'
```

---

## Troubleshooting

### ❌ Still getting "Just a moment..."

**Solution:**
- Your cookies may have expired
- Export fresh cookies from Upwork
- Make sure you're logged in when exporting

### ❌ No jobs found

**Solution:**
- Check if you bypassed Cloudflare (logs should show page title)
- Try with different search query
- Increase `maxJobs` parameter

### ❌ Invalid JSON error

**Solution:**
```bash
# Validate your cookies.json
cat cookies.json | jq empty

# If error, re-export cookies properly
```

---

## Security Notes

⚠️ **Important:**
- **Never share** `cookies.json` - it contains your auth tokens
- Never commit to git (already in `.gitignore`)
- Refresh cookies every 7-30 days
- Use different cookies for testing vs production

---

## Next Steps

✅ Once cookies work:
1. Set up automatic cookie refresh (optional)
2. Configure monitoring for cookie expiration
3. Add multiple cookie sets for rotation (optional)

📖 Full documentation: [COOKIES.md](COOKIES.md)

