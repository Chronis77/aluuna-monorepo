# Railway Deployment Guide for Aluuna Services

## 🚀 Quick Setup

### 1. Install Railway CLI
```bash
npm install -g @railway/cli
```

### 2. Login to Railway
```bash
railway login
```

### 3. Initialize Railway Project
```bash
cd apps/services
railway init
```

### 4. Set Environment Variables
In Railway dashboard or via CLI:
```bash
railway variables set OPENAI_API_KEY=your_openai_api_key
railway variables set API_KEY=your_secret_api_key
railway variables set GOOGLE_CREDENTIALS='{"type":"service_account",...}'
railway variables set NODE_ENV=production
railway variables set ALLOWED_ORIGINS=https://your-mobile-app-domain.com
```

### 5. Deploy
```bash
railway up
```

## 🔧 Environment Variables Required

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | `sk-...` |
| `API_KEY` | Secret key for API authentication | `your-secret-key` |
| `GOOGLE_CREDENTIALS` | Google Cloud service account JSON | `{"type":"service_account",...}` |
| `NODE_ENV` | Environment mode | `production` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `https://your-app.com` |
| `PORT` | Server port (auto-set by Railway) | `3000` |

## 🌐 Railway Features

- **WebSocket Support**: Full WebSocket streaming
- **Low Latency**: Global CDN
- **Auto-scaling**: Based on traffic
- **Health Checks**: Automatic monitoring
- **Logs**: Real-time logging
- **Custom Domains**: Available

## 📊 Pricing

- **Starter**: $5/month (1GB RAM, 1GB storage)
- **Standard**: $10/month (2GB RAM, 2GB storage)
- **Pro**: $20/month (4GB RAM, 4GB storage)

## 🔗 After Deployment

1. Get your Railway URL from the dashboard
2. Update mobile app config with the new URL
3. Test WebSocket streaming
4. Monitor logs and performance

## 🛠️ Troubleshooting

### WebSocket Connection Issues
- Check CORS settings
- Verify environment variables
- Check Railway logs

### Performance Issues
- Upgrade to higher tier
- Monitor resource usage
- Check for memory leaks

## 📱 Mobile App Configuration

Update your mobile app config:
```typescript
websocket: {
  url: 'https://your-railway-app.railway.app',
  timeout: 20000,
},
``` 