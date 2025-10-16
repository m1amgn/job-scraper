# 🍪 Using Cookies to Bypass Cloudflare

## Why Cookies?

Cloudflare blocks datacenter IPs (like VPS servers). Using cookies from a real browser session allows the scraper to appear as an authenticated user, bypassing Cloudflare protection.

## Method 1: Export Cookies from Browser (Easiest)

### Step 1: Install Cookie Editor Extension

**Chrome/Edge:**
- Install [Cookie-Editor](https://chrome.google.com/webstore/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm)

**Firefox:**
- Install [Cookie-Editor](https://addons.mozilla.org/en-US/firefox/addon/cookie-editor/)

### Step 2: Get Upwork Cookies

1. **Open Upwork** in your browser and **log in**
2. Navigate to any job search page (e.g., `https://www.upwork.com/nx/search/jobs/?q=python`)
3. **Wait until the page fully loads** (Cloudflare should be bypassed)
4. Click the **Cookie-Editor extension icon**
5. Click **"Export"** button (bottom right)
6. Choose **"JSON"** format
7. **Copy the JSON** to clipboard

### Step 3: Save Cookies to File

Create a file `cookies.json` with the exported content:

```json
[
  {
    "domain": ".upwork.com",
    "expirationDate": 1234567890,
    "hostOnly": false,
    "httpOnly": false,
    "name": "oauth2_global_js_token",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": true,
    "session": false,
    "storeId": null,
    "value": "your-token-value"
  },
  ...
]
```

---

## Method 2: Extract Cookies via DevTools

### Step 1: Open DevTools

1. Open Upwork and log in
2. Navigate to a job search page
3. Press **F12** or **Ctrl+Shift+I** (Windows/Linux) / **Cmd+Option+I** (Mac)
4. Go to **Console** tab

### Step 2: Run Cookie Extraction Script

Paste this code in the console:

```javascript
copy(JSON.stringify(document.cookie.split('; ').map(c => {
  const [name, value] = c.split('=');
  return {
    name: name,
    value: value,
    domain: '.upwork.com',
    path: '/',
    secure: true,
    httpOnly: false,
    sameSite: 'Lax'
  };
})));
```

3. Cookies are now **copied to clipboard**
4. Paste into `cookies.json` file

---

## Using Cookies with the API

### Option 1: Direct API Call with Cookies

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

### Option 2: Using a Cookies File

Save your `cookies.json` and use it:

```bash
COOKIES=$(cat cookies.json)
curl -X POST http://your-server:3000/scrape \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"https://www.upwork.com/nx/search/jobs/?q=nodejs&sort=recency\",
    \"cookies\": $COOKIES,
    \"maxJobs\": 20
  }"
```

### Option 3: Python Example

```python
import requests
import json

# Load cookies from file
with open('cookies.json', 'r') as f:
    cookies = json.load(f)

# Make API request
response = requests.post('http://your-server:3000/scrape', json={
    'url': 'https://www.upwork.com/nx/search/jobs/?q=python&sort=recency',
    'cookies': cookies,
    'maxJobs': 20
})

jobs = response.json()
print(f"Found {len(jobs)} jobs")
```

---

## Important Notes

### 🔐 Security

- **Never share your cookies** - they contain authentication tokens
- **Never commit `cookies.json`** to git (already in `.gitignore`)
- Cookies expire - you'll need to refresh them periodically (usually every 1-30 days)

### ⏰ Cookie Lifespan

- **Session cookies**: Expire when browser closes (less useful)
- **Persistent cookies**: Last days/weeks (what we need)
- Some Upwork cookies last 30 days

### 🔄 When to Refresh Cookies

Refresh cookies when you see:
- Still getting Cloudflare challenges
- "Unauthorized" or "Session expired" errors
- Scraper returns 0 jobs unexpectedly

### 📝 Cookie Format

The API accepts cookies in this format:

```json
[
  {
    "name": "cookie_name",
    "value": "cookie_value",
    "domain": ".upwork.com",  // Must start with dot for all subdomains
    "path": "/",
    "secure": true,
    "httpOnly": false,
    "sameSite": "Lax" // or "None" or "Strict"
  }
]
```

---

## Troubleshooting

### Issue: Still Getting Cloudflare

**Solution:**
1. Make sure you copied **ALL cookies** from Upwork
2. Look for these important cookies:
   - `oauth2_global_js_token`
   - `user_oauth2_slave_*`
   - `master_access_token`
   - `cf_clearance` (Cloudflare bypass cookie)

### Issue: Cookies Not Working

**Solution:**
1. Log out and log in to Upwork again
2. Export fresh cookies
3. Make sure you're on the **same domain** (www.upwork.com)
4. Check cookie expiration dates

### Issue: Jobs Still Not Found

**Solution:**
1. After solving Cloudflare, the selectors might need updates
2. Check logs for actual page title/content
3. May need to add more wait time for page to load

---

## Quick Test

Test if your cookies work:

```bash
curl -X POST http://localhost:3000/scrape \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "url": "https://www.upwork.com/nx/search/jobs/?q=test&sort=recency",
  "cookies": [YOUR_COOKIES_HERE],
  "maxJobs": 5
}
EOF
```

Look in the logs for:
- ✅ "Cloudflare completely bypassed!" 
- ✅ Page title is NOT "Just a moment..."
- ✅ Found job elements

---

## Next Steps

After getting cookies to work:
1. Consider setting up a **proxy** for better stability
2. **Rotate cookies** from different accounts (if you have multiple)
3. Add **cookie refresh automation** (re-export weekly)

