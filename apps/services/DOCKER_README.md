# 🐳 Aluuna Services - Docker Setup

This guide covers running the Aluuna Services server with Bun runtime using Docker and Docker Compose.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Git repository cloned

### 1. Setup Environment
```bash
cd apps/services
./scripts/docker-setup.sh env
```

### 2. Update Environment Variables
Edit the `.env` file with your actual API keys:
```env
OPENAI_API_KEY=sk-your-actual-openai-key
ALUUNA_APP_API_KEY=your-secret-api-key
```

### 3. Start Development Environment
```bash
./scripts/docker-setup.sh dev
```

## 📋 What's Included

### Services
- **aluuna-services**: Bun-based TypeScript server
- **postgres**: PostgreSQL database
- **redis**: Redis cache
- **redis-commander**: Redis management UI (optional)

### Features
- ✅ **Bun runtime** for superior performance
- ✅ **TypeScript** with full type safety
- ✅ **tRPC** for type-safe APIs
- ✅ **Prisma ORM** for database management
- ✅ **Redis caching** for performance
- ✅ **OpenAI tool calling** for dynamic operations
- ✅ **Health checks** for all services
- ✅ **Hot reloading** in development

## 🔧 Development

### Start Development Environment
```bash
./scripts/docker-setup.sh dev
```

This will:
1. Create `.env` file if it doesn't exist
2. Build Docker images
3. Start all services
4. Run database migrations
5. Display service URLs

### View Logs
```bash
./scripts/docker-setup.sh logs
```

### Stop Services
```bash
./scripts/docker-setup.sh stop
```

### Check Status
```bash
./scripts/docker-setup.sh status
```

## 🚀 Production

### Start Production Environment
```bash
./scripts/docker-setup.sh prod
```

### Production Features
- **Nginx reverse proxy** with SSL support
- **Health checks** for all services
- **Persistent volumes** for data
- **Security** with non-root users
- **Optimized builds** with multi-stage Dockerfile

## 📊 Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Aluuna Services | http://localhost:3000 | Main API server |
| Health Check | http://localhost:3000/health | Server health endpoint |
| PostgreSQL | localhost:5432 | Database |
| Redis | localhost:6379 | Cache |
| Redis Commander | http://localhost:8081 | Redis management UI |

## 🔧 Manual Docker Commands

### Build and Start
```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

### Database Operations
```bash
# Run migrations
docker-compose exec aluuna-services bunx prisma db push

# Generate Prisma client
docker-compose exec aluuna-services bunx prisma generate

# Access database
docker-compose exec postgres psql -U postgres -d aluuna
```

### Redis Operations
```bash
# Access Redis CLI
docker-compose exec redis redis-cli

# Monitor Redis
docker-compose exec redis redis-cli monitor
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the port
lsof -i :3000

# Stop conflicting services
sudo systemctl stop nginx  # if nginx is running
```

#### 2. Database Connection Issues
```bash
# Check database logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

#### 3. Redis Connection Issues
```bash
# Check Redis logs
docker-compose logs redis

# Restart Redis
docker-compose restart redis
```

#### 4. Build Issues
```bash
# Clean build
docker-compose build --no-cache

# Clean up Docker resources
./scripts/docker-setup.sh cleanup
```

### Debug Commands
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f aluuna-services

# Access container shell
docker-compose exec aluuna-services sh

# Check container status
docker-compose ps
```

## 🔒 Security

### Environment Variables
- Never commit `.env` files to version control
- Use strong API keys for production
- Rotate keys regularly

### Network Security
- Services communicate via Docker network
- Only necessary ports are exposed
- Redis can be password-protected in production

### Container Security
- Non-root user in production containers
- Minimal base images
- Regular security updates

## 📈 Monitoring

### Health Checks
All services include health checks:
- **aluuna-services**: HTTP health endpoint
- **postgres**: Database connectivity
- **redis**: Redis connectivity

### Logging
- Structured logging with Winston
- Log rotation and management
- Error tracking and monitoring

## 🔄 Updates and Maintenance

### Update Dependencies
```bash
# Rebuild with latest dependencies
docker-compose build --no-cache
docker-compose up -d
```

### Backup Database
```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres aluuna > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U postgres aluuna < backup.sql
```

### Clean Up
```bash
# Remove unused resources
./scripts/docker-setup.sh cleanup
```

## 🎯 Benefits of Docker Setup

### Consistency
- Same environment across development and production
- No "works on my machine" issues
- Reproducible builds

### Isolation
- Services run in isolated containers
- No conflicts with system packages
- Easy to manage dependencies

### Scalability
- Easy to scale individual services
- Load balancing support
- Horizontal scaling ready

### Development Experience
- Quick setup with one command
- Hot reloading in development
- Easy debugging and logging

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Bun Documentation](https://bun.sh/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [tRPC Documentation](https://trpc.io/docs)

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section
2. View service logs
3. Verify environment variables
4. Check Docker and Docker Compose versions
5. Create an issue in the repository 