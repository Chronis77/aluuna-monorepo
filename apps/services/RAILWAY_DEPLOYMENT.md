# Railway Deployment Guide - Aluuna Services v2.0 with Bun

## 🚀 Overview

This guide covers deploying the new TypeScript-based Aluuna Services server with Bun runtime to Railway, including database setup, Redis configuration, and environment variables.

## 📋 Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Your code must be in a GitHub repository
3. **Supabase Account**: For PostgreSQL database hosting
4. **Redis Instance**: Railway Redis or external Redis service
5. **OpenAI API Key**: For AI functionality

## 🔧 Step-by-Step Deployment

### 1. Connect Repository to Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your Aluuna repository
5. Select the `apps/services` directory as the source

### 2. Set Environment Variables

In your Railway project dashboard, go to the "Variables" tab and add:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database (Supabase)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Redis
REDIS_URL="redis://default:[YOUR-REDIS-PASSWORD]@[YOUR-REDIS-HOST]:[PORT]"

# OpenAI
OPENAI_API_KEY="sk-..."

# Security
ALUUNA_APP_API_KEY="your-secret-production-api-key"

# CORS
ALLOWED_ORIGINS="https://your-mobile-app.com,https://expo.dev"
```

### 3. Add PostgreSQL Database

#### Option A: Railway PostgreSQL (Recommended)

1. In Railway dashboard, click "New Service"
2. Select "Database" → "PostgreSQL"
3. Wait for provisioning
4. Copy the `DATABASE_URL` from the PostgreSQL service
5. Add it to your main service environment variables

#### Option B: Supabase PostgreSQL

1. Create a new project in [Supabase](https://supabase.com)
2. Go to Settings → Database
3. Copy the connection string
4. Add it to Railway environment variables

### 4. Add Redis Cache

#### Option A: Railway Redis

1. In Railway dashboard, click "New Service"
2. Select "Database" → "Redis"
3. Wait for provisioning
4. Copy the `REDIS_URL` from the Redis service
5. Add it to your main service environment variables

#### Option B: External Redis

Use any Redis provider (Upstash, Redis Cloud, etc.) and add the connection URL to environment variables.

### 5. Database Migration

After deployment, you need to run database migrations:

1. Go to your Railway service
2. Click on "Deployments" tab
3. Find the latest deployment
4. Click "View Logs"
5. Look for Prisma migration logs

If migrations didn't run automatically, you can trigger them:

```bash
# Connect to Railway CLI
railway login
railway link

# Run migrations with Bun
railway run bunx prisma db push
```

### 6. Verify Deployment

1. Check the deployment logs for any errors
2. Test the health endpoint:
   ```bash
   curl https://your-railway-app.railway.app/health
   ```
3. Test the tRPC health endpoint:
   ```bash
   curl -X POST https://your-railway-app.railway.app/api/trpc \
     -H "Content-Type: application/json" \
     -H "x-api-key: your-api-key" \
     -d '{"procedure": "health"}'
   ```

## 🔄 Continuous Deployment

Railway automatically deploys when you push to your main branch. To configure:

1. Go to your Railway project settings
2. Under "GitHub Integration", ensure auto-deploy is enabled
3. Set the branch to `main` (or your preferred branch)

## 📊 Monitoring

### Railway Dashboard

- **Deployments**: View deployment history and logs
- **Metrics**: Monitor CPU, memory, and network usage
- **Logs**: Real-time application logs
- **Variables**: Manage environment variables

### Health Checks

The server includes built-in health checks:

```bash
# Basic health check
curl https://your-app.railway.app/health

# tRPC health check
curl -X POST https://your-app.railway.app/api/trpc \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{"procedure": "health"}'
```

## 🔒 Security Configuration

### API Key Management

1. Generate a strong API key for production
2. Add it to Railway environment variables
3. Never commit API keys to version control
4. Rotate keys regularly

### CORS Configuration

Update `ALLOWED_ORIGINS` to include only your mobile app domains:

```env
ALLOWED_ORIGINS="https://your-mobile-app.com,https://expo.dev"
```

### Rate Limiting

The server includes rate limiting (100 requests per 15 minutes per IP). Adjust if needed in the code.

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify `DATABASE_URL` is correct
   - Check if Supabase/Railway database is accessible
   - Ensure migrations have run

2. **Redis Connection Errors**
   - Verify `REDIS_URL` is correct
   - Check Redis service status
   - Test connection manually

3. **OpenAI API Errors**
   - Verify `OPENAI_API_KEY` is valid
   - Check OpenAI account status
   - Monitor API usage limits

4. **Build Failures**
   - Check TypeScript compilation errors
   - Verify all dependencies are installed
   - Check for missing environment variables

5. **Bun Runtime Issues**
   - Ensure Railway supports Bun runtime
   - Check Bun version compatibility
   - Verify `bunfig.toml` configuration

### Debug Commands

```bash
# View logs
railway logs

# Connect to running container
railway shell

# Run commands in container with Bun
railway run bun run build
railway run bunx prisma generate
railway run bunx prisma db push
```

## 📱 Mobile App Configuration

Update your mobile app configuration to use the new Railway URL:

```typescript
// apps/mobile/lib/config.ts
export const config = {
  server: {
    url: 'https://your-railway-app.railway.app',
    apiKey: 'your-production-api-key',
  },
  // ... other config
};
```

## 🔄 Migration from Old Server

1. **Deploy new server** to Railway following this guide
2. **Test thoroughly** with the new API endpoints
3. **Update mobile app** to use tRPC client
4. **Switch traffic** gradually or all at once
5. **Monitor** for any issues
6. **Decommission** old server once confirmed working

## 📈 Scaling

Railway automatically scales based on traffic. For manual scaling:

1. Go to your service in Railway dashboard
2. Click "Settings" tab
3. Adjust "Scale" settings as needed

## 💰 Cost Optimization

- **Database**: Railway PostgreSQL is pay-per-use
- **Redis**: Railway Redis is pay-per-use
- **Compute**: Railway charges based on usage
- **Bandwidth**: Included in compute costs

Monitor usage in Railway dashboard to optimize costs.

## 🆘 Support

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)
- **Bun Docs**: [bun.sh/docs](https://bun.sh/docs)
- **GitHub Issues**: Create issues in your repository

## 📝 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Yes | Server port (Railway sets automatically) |
| `NODE_ENV` | Yes | Environment (production/development) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `ALUUNA_APP_API_KEY` | Yes | Server API key for authentication |
| `ALLOWED_ORIGINS` | No | CORS allowed origins (comma-separated) |
| `LOG_LEVEL` | No | Logging level (info/error/debug) |

## 🚀 Bun Runtime Benefits

### Performance
- **Faster startup** times compared to Node.js
- **Better memory usage** and garbage collection
- **Optimized bundling** for production builds
- **Native TypeScript support** without compilation step

### Developer Experience
- **Built-in package manager** (faster than npm/yarn)
- **Hot reloading** with `bun --watch`
- **Native test runner** included
- **Simplified tooling** with fewer dependencies

### Production Ready
- **Docker support** for containerization
- **Railway compatibility** for deployment
- **Environment variable handling** built-in
- **Process management** optimized for production 