# Deployment Guide - Upwork Job Scraper

This guide describes the deployment process for the application on a VPS with Ubuntu/Debian.

## Requirements

- VPS with Ubuntu 20.04+ or Debian 11+
- Minimum 2GB RAM
- Minimum 10GB disk space
- Root or sudo access

## Step 1: VPS Preparation

### 1.1 Connect to server

```bash
ssh user@your-server-ip
```

### 1.2 Install Docker

```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Re-login to apply changes
exit
# Connect again
ssh user@your-server-ip
```

### 1.3 Install Docker Compose

```bash
sudo apt-get install docker-compose -y

# Or install latest version
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 1.4 Verify installation

```bash
docker --version
docker-compose --version
```

## Step 2: Clone Repository

```bash
# Install git (if not installed)
sudo apt-get install git -y

# Clone project
git clone <your-repository-url>
cd job-scraper
```

## Step 3: Environment Configuration

By default, the application works without additional environment variables.

If you want to change the port:

```bash
# Edit docker-compose.yml
nano docker-compose.yml

# Change the ports line:
#   - "3000:3000"  # Format: "HOST_PORT:CONTAINER_PORT"
```

## Step 4: Build and Run

### 4.1 Build image

```bash
docker-compose build
```

This may take 5-10 minutes on first run.

### 4.2 Start container

```bash
# Start in background
docker-compose up -d

# Or start with log viewing
docker-compose up
```

### 4.3 Check status

```bash
# Check running containers
docker-compose ps

# View logs
docker-compose logs -f

# Exit logs: Ctrl+C
```

## Step 5: Verify Functionality

### 5.1 Health Check

```bash
curl http://localhost:3000/
```

Expected response:
```json
{"message":"Upwork Scraper API is running."}
```

### 5.2 Test Request

```bash
curl -X POST http://localhost:3000/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.upwork.com/nx/search/jobs/?q=nodejs",
    "maxJobs": 5
  }'
```

## Step 6: Configure Auto-start

### 6.1 Docker auto-start

```bash
sudo systemctl enable docker
```

### 6.2 Container with auto-restart

Already configured in `docker-compose.yml`:
```yaml
restart: unless-stopped
```

This means the container will automatically restart on:
- Application crash
- Server reboot
- Any other stop (except manual via `docker-compose stop`)

## Application Management

### Stop

```bash
docker-compose stop
```

### Start after stop

```bash
docker-compose start
```

### Restart

```bash
docker-compose restart
```

### Complete removal (with container and image)

```bash
docker-compose down
docker rmi job-scraper_job-scraper
```

### Update application

Use `deploy.sh` script:

```bash
chmod +x deploy.sh
./deploy.sh
```

Or manually:

```bash
docker-compose down
git pull
docker-compose build
docker-compose up -d
```

### View logs

```bash
# All logs
docker-compose logs

# Last 100 lines
docker-compose logs --tail=100

# Real-time
docker-compose logs -f

# Specific container logs
docker logs job-scraper_job-scraper_1
```

## Resource Monitoring

```bash
# Container resource usage
docker stats

# Docker disk space
docker system df

# Clean unused resources
docker system prune -a
```

## Firewall Configuration (optional)

If using UFW:

```bash
# Allow SSH
sudo ufw allow ssh

# Allow application port
sudo ufw allow 3000/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Security

### Recommendations:

1. **Close direct access to port 3000** - use Nginx as reverse proxy
2. **Configure SSL/TLS** via Let's Encrypt
3. **Implement rate limiting** at Nginx level
4. **Regularly update** system and Docker images
5. **Use fail2ban** for brute force protection

### Nginx Configuration (optional)

```bash
sudo apt-get install nginx -y

sudo nano /etc/nginx/sites-available/scraper
```

Add configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/scraper /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs

# Check if port is occupied
sudo lsof -i :3000
```

### Insufficient memory

```bash
# Increase shared memory in docker-compose.yml
# shm_size: '2gb' -> '4gb'
```

### Chrome crashes with errors

Usually related to memory shortage. Solutions:
1. Increase server RAM
2. Add swap:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## Contact and Support

If you encounter issues:
1. Check logs: `docker-compose logs -f`
2. Check resources: `docker stats`
3. Check documentation: README.md
