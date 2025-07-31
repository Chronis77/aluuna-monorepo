# Google Cloud Setup Guide

## Enable Text-to-Speech API

The error logs show that the Google Cloud Text-to-Speech API is disabled for your project. Follow these steps to enable it:

### Step 1: Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Make sure you're in the correct project (`aluuna-tts`)

### Step 2: Enable the Text-to-Speech API
1. In the left sidebar, click on **"APIs & Services"** > **"Library"**
2. Search for **"Cloud Text-to-Speech API"**
3. Click on **"Cloud Text-to-Speech API"**
4. Click **"Enable"** button

### Step 3: Verify API is Enabled
1. Go to **"APIs & Services"** > **"Enabled APIs"**
2. You should see **"Cloud Text-to-Speech API"** in the list

### Step 4: Check Service Account Permissions
1. Go to **"IAM & Admin"** > **"Service Accounts"**
2. Find your service account: `aluuna-tts-access@aluuna-tts.iam.gserviceaccount.com`
3. Make sure it has the **"Cloud Text-to-Speech API User"** role

### Step 5: Restart the Server
After enabling the API, restart your Docker containers:

```bash
docker-compose down
docker-compose up -d
```

### Step 6: Test Again
Run the test script to verify everything is working:

```bash
node test-api.js
```

## Alternative: Quick Enable via Command Line

If you have the Google Cloud CLI installed:

```bash
# Install gcloud CLI if you haven't already
# https://cloud.google.com/sdk/docs/install

# Set your project
gcloud config set project aluuna-tts

# Enable the Text-to-Speech API
gcloud services enable texttospeech.googleapis.com

# Verify it's enabled
gcloud services list --enabled --filter="name:texttospeech.googleapis.com"
```

## Troubleshooting

### API Still Disabled
- Wait a few minutes after enabling the API - it can take time to propagate
- Check if you're in the correct Google Cloud project
- Verify your service account has the necessary permissions

### Permission Issues
If you get permission errors, make sure your service account has these roles:
- **Cloud Text-to-Speech API User**
- **Service Account User** (if needed)

### Billing
Make sure billing is enabled for your Google Cloud project, as the Text-to-Speech API requires billing to be active.

## Next Steps

Once the API is enabled and working:
1. Your TTS server will be fully functional
2. You can integrate it with your React Native app
3. Test with different voices and languages
4. Consider setting up usage quotas and monitoring

## Support

If you continue to have issues:
1. Check the Google Cloud Console for any error messages
2. Verify your `google-creds.json` file is valid
3. Ensure your service account has the correct permissions
4. Check that billing is enabled for your project 