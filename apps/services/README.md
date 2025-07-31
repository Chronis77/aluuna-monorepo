# Aluuna TTS Server

A Google Cloud Text-to-Speech server built with Node.js and Express, designed to work with the Aluuna React Native app.

## Features

- 🎵 Google Cloud Text-to-Speech integration
- 🔧 Docker and Docker Compose support
- 🌐 CORS enabled for cross-origin requests
- 📱 Optimized for React Native apps
- 🎛️ Configurable voice and audio settings
- 📊 Health check endpoints
- 🧹 Automatic audio file cleanup
- 🔒 Rate limiting (with Nginx)
- 📁 Static file serving for generated audio
- ☁️ **Vercel deployment ready** - Public domain for React Native apps

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Google Cloud credentials file (`google-creds.json`)

### Option 1: Deploy to Vercel (Recommended for React Native)

For React Native apps that need a public domain, deploy to Vercel:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add Google Cloud credentials as environment variable
vercel env add GOOGLE_CREDENTIALS
# Paste your google-creds.json content when prompted

# Deploy to production
vercel --prod
```

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed instructions.

### Option 2: Running with Docker Compose

1. **Start the server:**
   ```bash
   docker-compose up -d
   ```

2. **Check if it's running:**
   ```bash
   curl http://localhost:3000/health
   ```

3. **Stop the server:**
   ```bash
   docker-compose down
   ```

### Development Mode

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm run dev
   ```

## API Endpoints

### Health Check
```
GET /health
```
Returns server status.

### Get Available Voices
```
GET /voices
```
Returns list of available Google TTS voices.

### Text-to-Speech
```
POST /tts
```

**Request Body:**
```json
{
  "text": "Hello, this is a test message",
  "voice": {
    "languageCode": "en-US",
    "name": "en-US-Standard-A",
    "ssmlGender": "NEUTRAL"
  },
  "audioConfig": {
    "audioEncoding": "MP3",
    "speakingRate": 1.0,
    "pitch": 0.0,
    "volumeGainDb": 0.0
  }
}
```

**Response (Local/Docker):**
```json
{
  "success": true,
  "audioUrl": "http://localhost:3000/audio/tts_1234567890.mp3",
  "filename": "tts_1234567890.mp3",
  "text": "Hello, this is a test message",
  "voice": { ... },
  "audioConfig": { ... }
}
```

**Response (Vercel):**
```json
{
  "success": true,
  "audioData": "base64EncodedAudioData...",
  "audioFormat": "base64",
  "text": "Hello, this is a test message",
  "voice": { ... },
  "audioConfig": { ... }
}
```

### SSML Text-to-Speech
```
POST /tts/ssml
```

**Request Body:**
```json
{
  "ssml": "<speak>Hello, this is a <break time='1s'/> test message</speak>",
  "voice": {
    "languageCode": "en-US",
    "name": "en-US-Standard-A",
    "ssmlGender": "NEUTRAL"
  },
  "audioConfig": {
    "audioEncoding": "MP3",
    "speakingRate": 1.0,
    "pitch": 0.0,
    "volumeGainDb": 0.0
  }
}
```

### Cleanup Audio Files
```
DELETE /audio/cleanup
```
Removes audio files older than 1 hour.

## React Native Integration

### Basic Usage (Vercel Deployment)

```javascript
import { Audio } from 'expo-av';

const synthesizeSpeech = async (text) => {
  try {
    const API_KEY = 'your-production-api-key-here'; // Use key from generate-api-key.js
    
    const response = await fetch('https://your-project-name.vercel.app/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        text: text,
        voice: {
          languageCode: 'en-US',
          name: 'en-US-Standard-A',
          ssmlGender: 'NEUTRAL'
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 1.0,
          pitch: 0.0,
          volumeGainDb: 0.0
        }
      })
    });

    const result = await response.json();
    
    if (result.success) {
      // Convert base64 to audio blob
      const audioBlob = new Blob([Buffer.from(result.audioData, 'base64')], {
        type: 'audio/mp3'
      });
      
      // Create audio URI from blob
      const audioUri = URL.createObjectURL(audioBlob);
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri }
      );
      await sound.playAsync();
    }
  } catch (error) {
    console.error('TTS Error:', error);
  }
};
```

### Basic Usage (Local/Docker)

```javascript
import { Audio } from 'expo-av';

const synthesizeSpeech = async (text) => {
  try {
    const API_KEY = 'your-development-api-key-here'; // Use key from generate-api-key.js
    
    const response = await fetch('http://your-server:3000/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        text: text,
        voice: {
          languageCode: 'en-US',
          name: 'en-US-Standard-A',
          ssmlGender: 'NEUTRAL'
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 1.0,
          pitch: 0.0,
          volumeGainDb: 0.0
        }
      })
    });

    const result = await response.json();
    
    if (result.success) {
      const { sound } = await Audio.Sound.createAsync(
        { uri: result.audioUrl }
      );
      await sound.playAsync();
    }
  } catch (error) {
    console.error('TTS Error:', error);
  }
};
```

### Advanced Usage with Voice Selection

```javascript
const getVoices = async () => {
  try {
    const API_KEY = 'your-api-key-here';
    const response = await fetch('http://your-server:3000/voices', {
      headers: {
        'x-api-key': API_KEY
      }
    });
    const data = await response.json();
    return data.voices;
  } catch (error) {
    console.error('Error fetching voices:', error);
    return [];
  }
};

const synthesizeWithVoice = async (text, voiceName) => {
  try {
    const API_KEY = 'your-api-key-here';
    const response = await fetch('http://your-server:3000/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        text: text,
        voice: {
          languageCode: 'en-US',
          name: voiceName,
          ssmlGender: 'FEMALE'
        }
      })
    });

    const result = await response.json();
    return result.audioUrl;
  } catch (error) {
    console.error('TTS Error:', error);
    throw error;
  }
};
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=production
API_KEY=your-development-api-key-here
```

### Security Best Practices

⚠️ **IMPORTANT**: Never commit sensitive data to version control!

1. **API Keys**: Store them as environment variables, never in code
2. **Google Cloud Credentials**: Keep `google-creds.json` out of version control
3. **Test Files**: Use `test-vercel.example.js` as a template, not with real keys
4. **Environment Variables**: Use `.env` files for local development only

**For Testing:**
```bash
# Set API key as environment variable
export API_KEY=your-actual-api-key

# Run test with environment variable
node test-vercel.js
```

### Google Cloud Setup

1. Enable the Cloud Text-to-Speech API in your Google Cloud Console
2. Create a service account and download the credentials JSON file
3. Place the credentials file as `google-creds.json` in the project root

## Production Deployment

### With Nginx (Recommended)

```bash
docker-compose --profile production up -d
```

This will start both the TTS server and Nginx reverse proxy with:
- Rate limiting (10 requests/second)
- SSL support (configure certificates)
- Audio file caching
- Load balancing ready

### SSL Configuration

1. Create an `ssl` directory
2. Add your SSL certificates:
   - `ssl/cert.pem` - SSL certificate
   - `ssl/key.pem` - Private key
3. Uncomment HTTPS configuration in `nginx.conf`
4. Restart the containers

## Monitoring

### Health Checks

The server includes built-in health checks:

```bash
# Check server health
curl http://localhost:3000/health

# Check Docker container health
docker ps
```

### Logs

```bash
# View server logs
docker-compose logs -f aluuna-tts

# View nginx logs
docker-compose logs -f nginx
```

## Troubleshooting

### Common Issues

1. **Google Cloud Authentication Error**
   - Ensure `google-creds.json` is properly mounted
   - Verify the service account has Text-to-Speech API access

2. **API Key Authentication Error**
   - Generate API keys using `node generate-api-key.js`
   - Ensure the correct API key is used in requests
   - Check that the API key is set as an environment variable

3. **CORS Issues**
   - The server includes CORS middleware
   - For production, configure allowed origins in the server

4. **Audio Files Not Playing**
   - Check if the audio URL is accessible
   - Verify the audio file was generated successfully

5. **Rate Limiting**
   - Default limit is 10 requests/second
   - Adjust in `nginx.conf` if needed

### Debug Mode

```bash
# Run with debug logging
NODE_ENV=development docker-compose up
```

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions, please create an issue in the repository. 