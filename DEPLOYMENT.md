# Invoice Generator SaaS - Production Deployment Guide

## Overview

This document provides a comprehensive guide for deploying the Invoice Generator
SaaS application to production. The application includes Redis caching, security
measures, comprehensive testing, and a complete CI/CD pipeline.

## Infrastructure Requirements

### Minimum System Requirements

- **CPU**: 2 vCPUs
- **Memory**: 4GB RAM (2GB for app, 1GB for Redis, 1GB for MongoDB)
- **Storage**: 20GB SSD
- **Network**: 1Gbps connection

### Recommended Production Setup

- **CPU**: 4+ vCPUs
- **Memory**: 8GB+ RAM
- **Storage**: 50GB+ SSD with backup strategy
- **Load Balancer**: For high availability
- **CDN**: For static asset delivery

## Environment Variables

Create a `.env.production` file with the following variables:

```bash
# Application
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-super-secret-jwt-key-min-32-chars

# Database
MONGODB_URI=mongodb://username:password@mongodb:27017/invoice-generator
MONGO_ROOT_PASSWORD=secure-root-password

# Redis Cache
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=optional-redis-password

# Authentication
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret

# Email Service
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Security
ENCRYPTION_KEY=32-char-encryption-key-for-sensitive-data
RATE_LIMIT_SECRET=secret-for-rate-limiting

# Monitoring
SENTRY_DSN=your-sentry-dsn-for-error-tracking
ANALYTICS_ID=your-analytics-tracking-id
```

## Deployment Options

### Option 1: Docker Compose (Recommended for small to medium deployments)

1. **Clone the repository**:

   ```bash
   git clone https://github.com/yourusername/invoice-generator.git
   cd invoice-generator
   ```

2. **Set up environment variables**:

   ```bash
   cp .env.example .env.production
   # Edit .env.production with your actual values
   ```

3. **Generate SSL certificates** (for HTTPS):

   ```bash
   # Using Let's Encrypt (recommended)
   certbot certonly --standalone -d yourdomain.com

   # Copy certificates
   mkdir ssl
   cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
   cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
   ```

4. **Deploy with Docker Compose**:

   ```bash
   docker-compose up -d
   ```

5. **Verify deployment**:

   ```bash
   # Check all services are running
   docker-compose ps

   # Check application health
   curl https://yourdomain.com/api/health
   ```

### Option 2: Vercel Deployment (Recommended for automatic scaling)

1. **Install Vercel CLI**:

   ```bash
   npm install -g vercel
   ```

2. **Deploy to Vercel**:

   ```bash
   vercel --prod
   ```

3. **Configure environment variables in Vercel Dashboard**:
   - Add all environment variables from `.env.production`
   - Set up external Redis and MongoDB services

### Option 3: AWS/GCP/Azure Deployment

1. **Use the provided Dockerfile for container deployment**
2. **Set up managed services**:
   - **Database**: MongoDB Atlas, AWS DocumentDB, or Azure Cosmos DB
   - **Cache**: AWS ElastiCache, GCP Memorystore, or Azure Cache for Redis
   - **Container Orchestration**: EKS, GKE, or AKS

## Security Checklist

### Pre-Deployment Security

- [ ] All environment variables are set securely
- [ ] SSL certificates are properly configured
- [ ] Rate limiting is enabled
- [ ] Security headers are configured
- [ ] Input validation is implemented
- [ ] CORS is properly configured
- [ ] API routes are protected with authentication

### Post-Deployment Security

- [ ] Run security audit: `npm audit`
- [ ] Test rate limiting endpoints
- [ ] Verify HTTPS redirection
- [ ] Check security headers with tools like securityheaders.com
- [ ] Monitor logs for suspicious activity
- [ ] Set up error tracking with Sentry

## Performance Optimization

### Caching Strategy

- **Redis Cache**: Configured for sessions, API responses, and database queries
- **CDN**: Configure CloudFlare or similar for static assets
- **Database Indexing**: Ensure proper indexes on frequently queried fields

### Monitoring Setup

```bash
# Application metrics are available at:
GET /api/metrics

# Health check endpoint:
GET /api/health

# Cache statistics:
GET /api/admin/cache-stats
```

## Backup Strategy

### Database Backup

```bash
# Daily MongoDB backup
docker exec mongodb mongodump --out /backup/$(date +%Y%m%d)

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR
docker exec mongodb mongodump --out $BACKUP_DIR
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR
rm -rf $BACKUP_DIR
```

### Redis Backup

```bash
# Redis persistence is enabled by default
# Additional backup can be done with:
docker exec redis redis-cli BGSAVE
```

## CI/CD Pipeline

The application includes a complete GitHub Actions CI/CD pipeline:

### Workflow Features

- **Quality Gates**: Linting, type checking, security scanning
- **Testing**: Unit tests, integration tests, e2e tests
- **Security**: CodeQL analysis, dependency scanning
- **Deployment**: Automated deployments with rollback capability
- **Monitoring**: Post-deployment smoke tests

### Pipeline Triggers

- **Pull Requests**: Run tests and security checks
- **Main Branch**: Deploy to staging environment
- **Release Tags**: Deploy to production
- **Daily**: Security and dependency scans

## Maintenance Tasks

### Daily

- [ ] Monitor application logs
- [ ] Check cache hit rates
- [ ] Review security alerts
- [ ] Monitor performance metrics

### Weekly

- [ ] Review and apply dependency updates
- [ ] Analyze user analytics and performance
- [ ] Check backup integrity
- [ ] Review security scan results

### Monthly

- [ ] Update SSL certificates (if not automated)
- [ ] Review and rotate API keys
- [ ] Performance optimization review
- [ ] Disaster recovery testing

## Troubleshooting

### Common Issues

1. **High Memory Usage**:

   ```bash
   # Check Redis memory usage
   docker exec redis redis-cli info memory

   # Monitor application memory
   docker stats
   ```

2. **Slow Database Queries**:

   ```bash
   # Enable MongoDB profiling
   docker exec mongodb mongosh --eval "db.setProfilingLevel(2)"

   # Check slow queries
   docker exec mongodb mongosh --eval "db.system.profile.find().limit(5).sort({ts:-1})"
   ```

3. **Cache Issues**:

   ```bash
   # Check Redis connection
   docker exec redis redis-cli ping

   # Monitor cache hit rate
   curl https://yourdomain.com/api/admin/cache-stats
   ```

### Emergency Procedures

1. **Application Rollback**:

   ```bash
   # Rollback to previous version
   docker-compose down
   git checkout previous-stable-tag
   docker-compose up -d
   ```

2. **Database Recovery**:

   ```bash
   # Restore from backup
   docker exec mongodb mongorestore /backup/YYYYMMDD
   ```

3. **Cache Flush**:
   ```bash
   # Clear Redis cache if needed
   docker exec redis redis-cli FLUSHALL
   ```

## Support and Monitoring

### Monitoring Endpoints

- **Health Check**: `GET /api/health`
- **Metrics**: `GET /api/metrics`
- **Cache Stats**: `GET /api/admin/cache-stats`

### Log Locations

- **Application Logs**: `docker logs invoice-generator_app_1`
- **Redis Logs**: `docker logs invoice-generator_redis_1`
- **MongoDB Logs**: `docker logs invoice-generator_mongodb_1`
- **Nginx Logs**: `docker logs invoice-generator_nginx_1`

### Performance Monitoring

Set up monitoring with:

- **Application Performance**: Vercel Analytics or New Relic
- **Error Tracking**: Sentry
- **Uptime Monitoring**: Pingdom or UptimeRobot
- **Log Aggregation**: ELK Stack or Datadog

## Scaling Considerations

### Horizontal Scaling

- Use multiple application instances behind a load balancer
- Implement Redis clustering for cache scaling
- Use MongoDB replica sets for database high availability

### Vertical Scaling

- Monitor CPU and memory usage
- Scale container resources as needed
- Optimize database queries and indexing

## Conclusion

This production deployment guide provides a comprehensive approach to deploying
the Invoice Generator SaaS application. The application is built with
enterprise-grade features including Redis caching, security measures,
comprehensive testing, and CI/CD automation.

For additional support or questions, refer to the project documentation or
create an issue in the GitHub repository.
