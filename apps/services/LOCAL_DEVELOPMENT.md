# Local Development Setup

## Overview
This guide explains how to set up the Aluuna TTS server for local development while keeping sensitive files secure.

## Prerequisites
- Node.js installed
- Google Cloud credentials file (`google-creds.json`)
- API key for authentication

## Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Google Cloud Credentials
Place your `google-creds.json` file in the project root:
```bash
# The file should be in the same directory as server.js
ls google-creds.json
```

**Important**: This file is excluded from Vercel deployment via `.vercelignore`, so it will only be used for local development.

### 3. Set Up Environment Variables
Create a `.env` file for local development:
```bash
# .env file
PORT=3000
NODE_ENV=development
API_KEY=your-development-api-key-here
```

### 4. Generate API Keys (if needed)
```bash
node generate-api-key.js
```

### 5. Start Local Development Server
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Testing Locally

### Test the Server
```bash
# Health check (no API key needed)
curl http://localhost:3000/health

# Test TTS with API key
curl -X POST http://localhost:3000/tts \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{"text": "Hello from local development!"}'
```

### Test with Node.js Script
```bash
# Set API key as environment variable
export API_KEY=your-api-key-here

# Run test script
node test-api.js
```

## Security Notes

### Local Development
- ✅ `google-creds.json` is safe to use locally
- ✅ File is excluded from Vercel deployment
- ✅ Local environment variables are not deployed
- ✅ API keys can be stored in `.env` file

### Production Deployment
- ✅ Vercel uses environment variables for credentials
- ✅ No sensitive files are deployed
- ✅ API keys are stored securely in Vercel

## File Structure for Local Development

```
aluuna-tts/
├── server.js                 # Main server file
├── google-creds.json         # ✅ Local only (excluded from Vercel)
├── .env                      # ✅ Local only (excluded from Vercel)
├── .vercelignore            # Excludes sensitive files from Vercel
├── .gitignore               # Excludes sensitive files from Git
├── package.json
├── test-api.js              # Local testing script
└── ... (other files)
```

## Troubleshooting

### Google Cloud Authentication Issues
1. Ensure `google-creds.json` is in the project root
2. Verify the service account has Text-to-Speech API access
3. Check that the file format is correct JSON

### API Key Issues
1. Generate new keys: `node generate-api-key.js`
2. Set environment variable: `export API_KEY=your-key`
3. Check that the key is being sent in requests

### Port Issues
1. Change port in `.env` file
2. Check if port 3000 is already in use
3. Use `lsof -i :3000` to check port usage

## Development Workflow

1. **Local Development**: Use `google-creds.json` and `.env`
2. **Testing**: Use local server with real credentials
3. **Deployment**: Vercel uses environment variables
4. **Security**: Sensitive files never leave your machine

This setup ensures you can develop locally with full functionality while keeping your production deployment secure. 