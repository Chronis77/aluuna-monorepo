# Free TTS Setup Guide

## Overview

This app now supports **Free TTS** for natural-sounding speech synthesis using multiple TTS services. The system prioritizes:

1. **Local Google TTS Server** (if available) - Highest quality, real Google TTS
2. **Online TTS Services** - Reliable fallback options
3. **Default Speech Engine** - Final fallback

## Features

- 🎯 **Natural Speech**: Human-like voice synthesis
- 🆓 **Completely Free**: No paid services required
- ⚡ **Reliable**: Multiple fallback options
- ⚙️ **Zero Configuration**: Works out of the box
- 🎛️ **Audio Routing**: Works with speaker/earpiece routing
- 🎤 **Recording Compatible**: Doesn't interfere with voice recording
- 🏠 **Local Server Support**: Optional local Google TTS server for highest quality

## How It Works

The app uses a tiered approach:

### Tier 1: Local Google TTS Server (Optional)
- **URL**: `http://localhost:3000/tts`
- **Quality**: Highest - Real Google TTS voices
- **Setup**: Requires running your local TTS server
- **Fallback**: Automatically falls back to online services if unavailable

### Tier 2: Online TTS Services
- **VoiceRSS**: Most reliable free TTS service
- **Google Translate TTS**: Alternative option
- **Other Services**: Additional fallbacks

### Tier 3: Default Speech Engine
- **Expo Speech**: Built-in speech synthesis
- **Always Available**: Final fallback option

## Setup Instructions

### Option 1: Use Immediately (No Setup Required!)
1. Open the app
2. Tap the volume icon in the top-right corner
3. Toggle "Speech Engine" to "Free TTS (Natural)"
4. That's it! Start using natural speech immediately

### Option 2: Local Google TTS Server (Highest Quality)
1. Start your local Google TTS server on `http://localhost:3000`
2. The app will automatically detect and use it
3. If the server is unavailable, it falls back to online services
4. No additional configuration needed

### Option 3: Custom TTS Server URL (Advanced)
If your TTS server is running on a different URL, you can configure it:

1. **For React Native App**: Add to your `.env` file:
   ```
   EXPO_PUBLIC_TTS_SERVER_URL=http://your-server-url:port
   ```

2. **For TTS Server**: Add to your server environment:
   ```
   SERVER_URL=http://your-server-url:port
   ```

3. The app will automatically use the configured URL

## Testing the Setup

1. In Audio Settings, tap "Show Audio Test"
2. Try the "Free TTS Test" button
3. You should hear natural-sounding speech
4. Check the console for which TTS service is being used

## Troubleshooting

### Local Server Not Detected
- Ensure your server is running on `http://localhost:3000`
- Check that the `/tts` endpoint accepts POST requests
- The app will automatically fall back to online services

### "Unable to generate speech" Error
- Check your internet connection
- The app will automatically fall back to default speech
- Try again in a few moments

### "Media may be damaged" Error
- This has been fixed in the latest version
- The audio format is now properly handled
- Should work reliably now

### Fallback to Default Speech
- If all TTS services fail, the app automatically uses default speech
- Check the console for error messages
- Verify your internet connection

## Audio Routing

Free TTS works with the same audio routing system:
- **Speaker**: Plays through main speaker
- **Earpiece**: Plays through earpiece (when phone is held to ear)
- **Recording**: Automatically restores recording capability after speech

## Testing

Use the Audio Test panel to verify:
1. **Basic Speech Test**: Core functionality
2. **Free TTS Test**: Natural speech quality
3. **Speaker/Earpiece Tests**: Audio routing
4. **Recording Compatibility**: Voice recording works after speech

## Technical Details

### Local Google TTS Server
- **Endpoint**: `POST http://localhost:3000/tts`
- **Request Format**: JSON with text, voice, and audioConfig
- **Response**: JSON with success flag and audioUrl
- **Fallback**: Automatic fallback to online services

### Online Services
- **Primary**: VoiceRSS Free TTS API
- **Format**: MP3 (44kHz, 16-bit, stereo)
- **Language**: English (US)
- **Fallback**: Multiple online services

### Default Speech
- **Engine**: Expo Speech
- **Always Available**: Final fallback
- **Audio Session**: Cooperative with recording functionality

## Cost

- **Completely Free**: No charges for any TTS usage
- **No Limits**: Use as much as you want
- **No API Keys**: No setup required (unless using local server)

## Rate Limits

- **Free Tier**: Generous limits for personal use
- **No Registration**: Works immediately
- **Reliable**: Proven services with fallbacks

## Support

If you encounter issues:
1. Check the console for error messages
2. Verify your internet connection
3. Test with the default speech engine
4. The app will automatically use fallbacks
5. For local server issues, check server logs

## Why This Approach?

- **Quality**: Local Google TTS provides highest quality
- **Reliability**: Multiple fallback options ensure availability
- **Simplicity**: No complex configuration required
- **Compatibility**: Works well with React Native
- **Flexibility**: Can use local server when available, online services otherwise 