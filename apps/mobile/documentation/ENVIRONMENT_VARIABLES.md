# Environment Variables Configuration

This document describes all environment variables used in the Aluuna project.

## React Native App (.env)

### Required Variables

```env
# OpenAI API Configuration
EXPO_PUBLIC_OPENAI_API_KEY=

# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# TTS Server Configuration
EXPO_PUBLIC_TTS_SERVER_URL=http://localhost:3000
```

### Optional Variables

```env
# Hugging Face API (for enhanced TTS rate limits)
EXPO_PUBLIC_HUGGINGFACE_API_KEY=hf-your-huggingface-key-here

# UI Configuration
EXPO_PUBLIC_LOADING_TIMEOUT=5000
EXPO_PUBLIC_TOAST_DURATION=3000
EXPO_PUBLIC_SESSION_TIMEOUT=3000
EXPO_PUBLIC_TTS_TIMEOUT=5000
```

## TTS Server (.env)

### Required Variables

```env
# Server Configuration
SERVER_URL=http://localhost:3000
PORT=3000
```

### Optional Variables

```env
# Google Cloud TTS Configuration
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account-key.json
```

## Variable Descriptions

### React Native App Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `EXPO_PUBLIC_OPENAI_API_KEY` | Not used on mobile (server handles OpenAI) | - | ❌ |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | - | ✅ |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | - | ✅ |
| `EXPO_PUBLIC_TTS_SERVER_URL` | Local TTS server URL | `http://localhost:3000` | ❌ |
| `EXPO_PUBLIC_HUGGINGFACE_API_KEY` | Hugging Face API key for TTS | - | ❌ |
| `EXPO_PUBLIC_LOADING_TIMEOUT` | Loading screen timeout (ms) | `5000` | ❌ |
| `EXPO_PUBLIC_TOAST_DURATION` | Toast notification duration (ms) | `3000` | ❌ |
| `EXPO_PUBLIC_SESSION_TIMEOUT` | Session timeout for UI elements (ms) | `3000` | ❌ |
| `EXPO_PUBLIC_TTS_TIMEOUT` | TTS request timeout (ms) | `5000` | ❌ |

### TTS Server Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SERVER_URL` | Server URL for audio file generation | `http://localhost:3000` | ❌ |
| `PORT` | Server port | `3000` | ❌ |
| `GOOGLE_APPLICATION_CREDENTIALS` | Google Cloud service account key path | - | ❌ |

## Setup Instructions

### 1. Create React Native App .env file

Create a `.env` file in the project root:

```env
# Required
EXPO_PUBLIC_OPENAI_API_KEY=
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here

# Optional
EXPO_PUBLIC_TTS_SERVER_URL=http://localhost:3000
EXPO_PUBLIC_LOADING_TIMEOUT=5000
EXPO_PUBLIC_TOAST_DURATION=3000
EXPO_PUBLIC_SESSION_TIMEOUT=3000
EXPO_PUBLIC_TTS_TIMEOUT=5000
```

### 2. Create TTS Server .env file

Create a `.env` file in the `server/` directory:

```env
# Required
SERVER_URL=http://localhost:3000
PORT=3000

# Optional
GOOGLE_APPLICATION_CREDENTIALS=./aluuna-tts-9a6f8164b721.json
```

### 3. Restart Applications

After updating environment variables:

1. **React Native App**: Restart the development server
2. **TTS Server**: Restart the server process

## Security Notes

- Never commit `.env` files to version control
- Keep API keys secure and rotate them regularly
- Use different keys for development and production
- The `EXPO_PUBLIC_` prefix makes variables available to the client-side code

## Troubleshooting

### Common Issues

1. "API key not found": Not applicable; mobile does not use an OpenAI key.
2. **"Supabase connection failed"**: Verify `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. **"TTS server not available"**: Ensure `EXPO_PUBLIC_TTS_SERVER_URL` points to your running server
4. **"Port already in use"**: Change `PORT` in TTS server .env file

### Validation

The app includes automatic validation for required environment variables. Check the console for warnings about missing or invalid configuration. 