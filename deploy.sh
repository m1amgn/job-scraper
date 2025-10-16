#!/bin/bash

# Deployment script for Upwork Job Scraper
# This script automates the deployment process

set -e  # Exit on any error

echo "🚀 Starting deployment..."

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed"
    exit 1
fi

# Stop existing containers
echo "📦 Stopping existing containers..."
docker-compose down

# Pull latest changes (if in git repo)
if [ -d .git ]; then
    echo "📥 Pulling latest changes..."
    git pull
else
    echo "⚠️  Not a git repository, skipping git pull"
fi

# Build new image
echo "🔨 Building Docker image..."
docker-compose build --no-cache

# Start containers
echo "▶️  Starting containers..."
docker-compose up -d

# Wait for the service to start
echo "⏳ Waiting for service to start..."
sleep 5

# Check if container is running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Deployment successful!"
    echo ""
    echo "📊 Container status:"
    docker-compose ps
    echo ""
    echo "📝 View logs with: docker-compose logs -f"
else
    echo "❌ Deployment failed! Container is not running."
    echo "Check logs with: docker-compose logs"
    exit 1
fi

# Show logs
echo ""
echo "📋 Recent logs:"
docker-compose logs --tail=50

