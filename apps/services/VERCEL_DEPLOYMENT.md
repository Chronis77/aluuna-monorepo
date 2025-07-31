# Vercel Deployment Guide for Aluuna TTS Server

## Overview
This guide will help you deploy your Aluuna TTS Server to Vercel, providing a public domain that your React Native app can access.

## Prerequisites
1. A Vercel account (free at [vercel.com](https://vercel.com))
2. Vercel CLI installed: `npm i -g vercel`
3. Your Google Cloud credentials file (`google-creds.json`)

## Deployment Steps

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy to Vercel
```bash
vercel
```

During deployment, Vercel will ask you a few questions:
- Set up and deploy? → **Yes**
- Which scope? → **Select your account**
- Link to existing project? → **No**
- Project name? → **aluuna-tts** (or your preferred name)
- Directory? → **./** (current directory)
- Override settings? → **No**

### 4. Generate API Keys
First, generate secure API keys for authentication:

```bash
node generate-api-key.js
```

This will generate different keys for development and production environments.

### 5. Add Environment Variables
After deployment, you need to add your Google Cloud credentials and API key as environment variables:

```bash
# Add Google Cloud credentials
vercel env add GOOGLE_CREDENTIALS
# Paste your google-creds.json content when prompted

# Add API key for authentication
vercel env add API_KEY
# Paste the production API key when prompted
```

### 6. Redeploy with Environment Variables
```bash
vercel --prod
```

## API Endpoints

Once deployed, your API will be available at:
- **Production URL**: `https://your-project-name.vercel.app`
- **Health Check**: `https://your-project-name.vercel.app/health`
- **TTS Endpoint**: `https://your-project-name.vercel.app/tts`
- **SSML Endpoint**: `https://your-project-name.vercel.app/tts/ssml`
- **Voices Endpoint**: `https://your-project-name.vercel.app/voices`

## React Native Integration

Update your React Native app to use the new Vercel URL:

```javascript
// Example React Native API call
const API_KEY = 'your-production-api-key-here'; // Use the key from generate-api-key.js

const response = await fetch('https://your-project-name.vercel.app/tts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY
  },
  body: JSON.stringify({
    text: 'Hello from React Native!',
    voice: {
      languageCode: 'en-US',
      name: 'en-US-Standard-A',
      ssmlGender: 'NEUTRAL'
    }
  })
});

const result = await response.json();

// The audio data is returned as base64
const audioBase64 = result.audioData;

// Convert base64 to audio blob for playback
const audioBlob = new Blob([Buffer.from(audioBase64, 'base64')], {
  type: 'audio/mp3'
});

// Play the audio using your preferred audio library
```

## Important Notes

### Security
- Your `google-creds.json` file is now stored as an environment variable in Vercel
- The file is not committed to your repository (it's in `.gitignore`)
- The file is not deployed to Vercel (it's in `.vercelignore`)
- Vercel automatically handles HTTPS and CORS
- **API key authentication** protects all TTS endpoints from unauthorized access
- Only your React Native app with the correct API key can use the service

### Limitations
- Vercel has a 10-second timeout for serverless functions
- For longer audio generation, consider using Vercel's Pro plan or alternative hosting
- Audio files are returned as base64 instead of file URLs (better for serverless)

### Custom Domain (Optional)
You can add a custom domain in the Vercel dashboard:
1. Go to your project in Vercel dashboard
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Update your React Native app to use the custom domain

## Troubleshooting

### Common Issues

1. **Timeout Errors**: If you get timeout errors, your audio generation might be taking too long. Consider:
   - Using shorter text
   - Upgrading to Vercel Pro for longer timeouts
   - Using a different hosting solution

2. **CORS Errors**: CORS is already configured, but if you still get errors:
   - Check that your React Native app is using the correct URL
   - Ensure you're making POST requests (not GET) to the TTS endpoints

3. **Google Cloud Authentication Errors**: 
   - Verify your `google-creds.json` is properly set as an environment variable
   - Check that your Google Cloud project has the Text-to-Speech API enabled

### Support
- Vercel Documentation: [vercel.com/docs](https://vercel.com/docs)
- Google Cloud TTS Documentation: [cloud.google.com/text-to-speech](https://cloud.google.com/text-to-speech) 