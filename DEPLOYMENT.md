# WorkLens Deployment Guide

This guide covers various deployment strategies for WorkLens.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Docker Deployment](#docker-deployment)
4. [Cloud Platform Deployment](#cloud-platform-deployment)
5. [VPS/Self-Hosted Deployment](#vpsself-hosted-deployment)
6. [Post-Deployment Checklist](#post-deployment-checklist)

---

## Prerequisites

### Required
- Node.js 18+ (for non-Docker deployments)
- Google Gemini API Key ([Get one here](https://makersuite.google.com/app/apikey))
- Domain name (recommended for production)
- SSL certificate (recommended - use Let's Encrypt)

### Recommended
- Docker & Docker Compose (for containerized deployment)
- CI/CD pipeline (GitHub Actions, GitLab CI, etc.)
- Monitoring solution (PM2, New Relic, DataDog, etc.)

---

## Environment Configuration

### Production Environment Variables

Create a `.env` file (or configure in your hosting platform):

```env
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Server Configuration
NODE_ENV=production
PORT=5000

# CORS & Security
FRONTEND_URL=https://yourdomain.com

# Optional: Custom backend URL for frontend
VITE_API_URL=https://api.yourdomain.com
```

---

## Docker Deployment

### Option 1: Using Docker Compose (Recommended)

1. **Build and run:**
```bash
docker-compose up -d
```

2. **View logs:**
```bash
docker-compose logs -f
```

3. **Stop services:**
```bash
docker-compose down
```

### Option 2: Using Docker Only

1. **Build the image:**
```bash
docker build -t worklens:latest .
```

2. **Run the container:**
```bash
docker run -d \
  --name worklens \
  -p 5000:5000 \
  -e GEMINI_API_KEY=your_key_here \
  -e NODE_ENV=production \
  -v $(pwd)/uploads:/app/uploads \
  worklens:latest
```

3. **Check health:**
```bash
curl http://localhost:5000/api/health
```

---

## Cloud Platform Deployment

### AWS Deployment

#### Option A: AWS ECS (Elastic Container Service)

1. **Push image to ECR:**
```bash
# Create ECR repository
aws ecr create-repository --repository-name worklens

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ECR_URL

# Build and push
docker build -t worklens:latest .
docker tag worklens:latest YOUR_ECR_URL/worklens:latest
docker push YOUR_ECR_URL/worklens:latest
```

2. **Create ECS Task Definition** with:
   - Container: Your ECR image
   - Port: 5000
   - Environment variables (use AWS Secrets Manager for API key)
   - Health check: `/api/health`

3. **Create ECS Service** and configure ALB

#### Option B: AWS Elastic Beanstalk

1. Install EB CLI: `pip install awsebcli`
2. Initialize: `eb init -p docker worklens`
3. Create environment: `eb create worklens-prod`
4. Set environment variables: `eb setenv GEMINI_API_KEY=your_key`
5. Deploy: `eb deploy`

### Google Cloud Platform (GCP)

#### Cloud Run (Recommended)

1. **Build and push to Artifact Registry:**
```bash
gcloud builds submit --tag gcr.io/YOUR_PROJECT/worklens
```

2. **Deploy to Cloud Run:**
```bash
gcloud run deploy worklens \
  --image gcr.io/YOUR_PROJECT/worklens \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your_key,NODE_ENV=production
```

### Azure

#### Azure Container Instances

```bash
az container create \
  --resource-group myResourceGroup \
  --name worklens \
  --image YOUR_REGISTRY/worklens:latest \
  --dns-name-label worklens-app \
  --ports 5000 \
  --environment-variables \
    NODE_ENV=production \
    GEMINI_API_KEY=your_key
```

### Vercel (Frontend) + Railway/Render (Backend)

#### Frontend on Vercel

1. Connect GitHub repository to Vercel
2. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. Add environment variables:
   - `VITE_API_URL`: Your backend URL

#### Backend on Railway

1. Connect GitHub repository to Railway
2. Add environment variables:
   - `GEMINI_API_KEY`
   - `NODE_ENV=production`
   - `FRONTEND_URL`: Your Vercel URL

3. Railway auto-detects Node.js and runs `node server.js`

#### Backend on Render

1. Create new Web Service
2. Connect GitHub repository
3. Configure:
   - Build Command: `npm install`
   - Start Command: `node server.js`
4. Add environment variables (same as Railway)

---

## VPS/Self-Hosted Deployment

### Using PM2 (Process Manager)

1. **Install PM2:**
```bash
npm install -g pm2
```

2. **Create PM2 ecosystem file** (`ecosystem.config.js`):
```javascript
module.exports = {
  apps: [{
    name: 'worklens',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
```

3. **Start with PM2:**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

4. **Monitor:**
```bash
pm2 monit
pm2 logs worklens
```

### Nginx Reverse Proxy Setup

1. **Install Nginx:**
```bash
sudo apt update
sudo apt install nginx
```

2. **Create Nginx config** (`/etc/nginx/sites-available/worklens`):
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend (static files)
    location / {
        root /var/www/worklens/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # File uploads
    location /uploads {
        proxy_pass http://localhost:5000;
        client_max_body_size 50M;
    }
}
```

3. **Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/worklens /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

4. **Setup SSL with Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Post-Deployment Checklist

### Security

- [ ] API keys stored in environment variables (not in code)
- [ ] HTTPS enabled with valid SSL certificate
- [ ] CORS properly configured for your domain
- [ ] File upload limits set appropriately
- [ ] Rate limiting implemented (if needed)
- [ ] Security headers configured (Helmet.js recommended)
- [ ] `.env` files not committed to version control

### Performance

- [ ] Frontend built and minified (`npm run build`)
- [ ] Gzip/Brotli compression enabled (in Nginx or Express)
- [ ] Static assets cached properly
- [ ] CDN configured (if using)
- [ ] Database indexed (if applicable)

### Monitoring

- [ ] Health check endpoint working (`/api/health`)
- [ ] Error logging configured (e.g., Sentry, LogRocket)
- [ ] Uptime monitoring setup (e.g., UptimeRobot, Pingdom)
- [ ] Performance monitoring (e.g., New Relic, DataDog)
- [ ] Backup strategy in place for uploads

### Testing

- [ ] API endpoints tested in production
- [ ] File upload tested with various file types
- [ ] CORS tested from frontend domain
- [ ] Error handling verified
- [ ] Load testing performed

### Documentation

- [ ] Deployment process documented
- [ ] Environment variables documented
- [ ] Rollback procedure defined
- [ ] Team access configured
- [ ] Support/escalation process defined

---

## Troubleshooting

### Common Issues

**CORS Errors:**
```javascript
// In server.js, ensure FRONTEND_URL matches your actual frontend
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
};
```

**API Connection Errors:**
- Check `VITE_API_URL` in frontend env matches backend URL
- Verify backend is running and accessible
- Check firewall rules

**File Upload Failures:**
- Verify upload directory exists and has write permissions
- Check file size limits (default 50MB)
- Ensure sufficient disk space

### Health Checks

Test your deployment:

```bash
# Health check
curl https://yourdomain.com/api/health

# Expected response:
# {"status":"active","service":"WorkLens-Intelligence-Engine","timestamp":"..."}
```

---

## Scaling Considerations

### Horizontal Scaling

For high traffic, consider:

1. **Load Balancer**: Use ALB (AWS), Cloud Load Balancing (GCP), or Nginx
2. **Container Orchestration**: Kubernetes for multi-container deployments
3. **Managed Services**: Use managed container services (ECS, Cloud Run)

### Vertical Scaling

Adjust resources based on usage:
- **Memory**: Increase if processing large files
- **CPU**: Increase for faster AI processing
- **Storage**: Scale uploads directory

---

## Support

For deployment issues:
1. Check application logs
2. Verify environment variables
3. Test health endpoint
4. Review Nginx/proxy logs (if applicable)
5. Open GitHub issue with deployment details

---

**Note**: Always test deployments in a staging environment before production!
