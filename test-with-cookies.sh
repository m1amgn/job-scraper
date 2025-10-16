#!/bin/bash

# Test Upwork Scraper with Cookies
# Usage: ./test-with-cookies.sh [search_query] [server_url]

QUERY="${1:-python}"
SERVER="${2:-http://localhost:3000}"
COOKIES_FILE="cookies.json"

echo "🔍 Testing Upwork Scraper with Cookies"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Search Query: $QUERY"
echo "Server: $SERVER"
echo "Cookies File: $COOKIES_FILE"
echo ""

# Check if cookies file exists
if [ ! -f "$COOKIES_FILE" ]; then
    echo "❌ Error: cookies.json not found!"
    echo ""
    echo "📝 How to get cookies:"
    echo "1. Open export-cookies.html in your browser"
    echo "2. Go to Upwork and log in"
    echo "3. Click 'Export Cookies' button"
    echo "4. Save the JSON to cookies.json in this directory"
    echo ""
    echo "Or use browser extension:"
    echo "- Chrome: https://chrome.google.com/webstore/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm"
    echo "- Firefox: https://addons.mozilla.org/firefox/addon/cookie-editor/"
    exit 1
fi

echo "✅ Found cookies.json"
echo ""

# Read cookies
COOKIES=$(cat "$COOKIES_FILE")

# Validate JSON
if ! echo "$COOKIES" | jq empty 2>/dev/null; then
    echo "❌ Error: cookies.json is not valid JSON"
    exit 1
fi

COOKIE_COUNT=$(echo "$COOKIES" | jq 'length')
echo "📊 Loaded $COOKIE_COUNT cookies"
echo ""

# Build search URL
SEARCH_URL="https://www.upwork.com/nx/search/jobs/?q=${QUERY}&sort=recency"

echo "🚀 Sending request to scraper..."
echo ""

# Make request
RESPONSE=$(curl -s -X POST "$SERVER/scrape" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"$SEARCH_URL\",
    \"cookies\": $COOKIES,
    \"maxJobs\": 10
  }")

# Check if response is valid JSON
if ! echo "$RESPONSE" | jq empty 2>/dev/null; then
    echo "❌ Error: Invalid response from server"
    echo "$RESPONSE"
    exit 1
fi

# Check for errors
if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
    echo "❌ Scraping Failed:"
    echo "$RESPONSE" | jq -r '.error'
    echo ""
    echo "Details:"
    echo "$RESPONSE" | jq -r '.details // "No details provided"'
    exit 1
fi

# Success - display results
JOB_COUNT=$(echo "$RESPONSE" | jq 'length')

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SUCCESS! Found $JOB_COUNT jobs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Display jobs
echo "$RESPONSE" | jq -r '.[] | "
📋 \(.title // "No Title")
💰 \(.budget // "No Budget")
🏷️  Skills: \(.skills // "N/A")
🔗 \(.link // "No Link")
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"'

# Save to file
OUTPUT_FILE="jobs_${QUERY}_$(date +%Y%m%d_%H%M%S).json"
echo "$RESPONSE" | jq '.' > "$OUTPUT_FILE"
echo ""
echo "💾 Results saved to: $OUTPUT_FILE"

