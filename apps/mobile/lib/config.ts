import { Platform } from 'react-native';

// Helper function to get the appropriate server URL based on environment
const getServerUrl = () => {
  // Debug logging to see what's happening
  console.log(`🔍 Debug: __DEV__ = ${__DEV__}`);
  console.log(`🔍 Debug: EXPO_PUBLIC_DEV_SERVER_URL = ${process.env.EXPO_PUBLIC_DEV_SERVER_URL}`);
  console.log(`🔍 Debug: EXPO_PUBLIC_SERVER_URL = ${process.env.EXPO_PUBLIC_SERVER_URL}`);
  
  // Development server URL (local machine) - prioritize this in development
  if (__DEV__ && process.env.EXPO_PUBLIC_DEV_SERVER_URL) {
    console.log(`🔧 Using development server URL: ${process.env.EXPO_PUBLIC_DEV_SERVER_URL}`);
    return process.env.EXPO_PUBLIC_DEV_SERVER_URL;
  }
  
  // Production server URL (Railway) - only use if not in development or no dev URL set
  if (process.env.EXPO_PUBLIC_SERVER_URL) {
    console.log(`🌐 Using production server URL: ${process.env.EXPO_PUBLIC_SERVER_URL}`);
    return process.env.EXPO_PUBLIC_SERVER_URL;
  }
  
  // For iOS Simulator, use localhost
  if (Platform.OS === 'ios' && __DEV__) {
    // Check if we're in simulator vs physical device
    const url = 'http://localhost:3000';
    console.log(`🍎 iOS Simulator detected, using localhost: ${url}`);
    return url;
  }
  
  // For Android emulator, use 10.0.2.2 (special IP for host access)
  if (Platform.OS === 'android' && __DEV__) {
    const url = 'http://10.0.2.2:3000';
    console.log(`🤖 Android Emulator detected, using 10.0.2.2: ${url}`);
    return url;
  }
  
  // For physical devices (Expo Go on iPhone/Android), use host IP
  const url = 'http://172.28.152.95:3000';
  console.log(`📱 Physical device detected (Expo Go), using host IP: ${url}`);
  console.log(`💡 Make sure your device is on the same network as your development machine`);
  console.log(`💡 If connection fails, check firewall settings and try: EXPO_PUBLIC_SERVER_URL=http://YOUR_COMPUTER_IP:3000`);
  return url;
};

// Configuration for API keys and environment variables
export const config = {
  openai: {
    apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
    whisperEndpoint: 'https://api.openai.com/v1/audio/transcriptions',
    gptEndpoint: 'https://api.openai.com/v1/chat/completions',
  },
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    apiKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  server: {
    url: getServerUrl(),
    apiKey: process.env.EXPO_PUBLIC_ALUUNA_APP_API_KEY || 'your-secret-api-key-here',
  },
  tts: {
    apiKey: process.env.EXPO_PUBLIC_ALUUNA_APP_API_KEY || '', // Aluuna app API key
    endpoint: 'https://api-inference.huggingface.co/models/facebook/fastspeech2-en-ljspeech',
    serverUrl: process.env.EXPO_PUBLIC_TTS_SERVER_URL || 'https://aluuna-services-production.up.railway.app', // Deployed Railway services server
    timeout: parseInt(process.env.EXPO_PUBLIC_TTS_TIMEOUT || '10000'), // Increased timeout for Railway
  },
  ui: {
    loadingTimeout: parseInt(process.env.EXPO_PUBLIC_LOADING_TIMEOUT || '5000'), // Loading screen timeout
    toastDuration: parseInt(process.env.EXPO_PUBLIC_TOAST_DURATION || '3000'), // Toast notification duration
    sessionTimeout: parseInt(process.env.EXPO_PUBLIC_SESSION_TIMEOUT || '3000'), // Session timeout
  },
  websocket: {
    url: process.env.EXPO_PUBLIC_WEBSOCKET_URL || 'https://aluuna-services-production.up.railway.app', // WebSocket server URL (HTTP for Socket.IO)
    timeout: parseInt(process.env.EXPO_PUBLIC_WEBSOCKET_TIMEOUT || '20000'), // WebSocket connection timeout
  },
};

// Validate that required environment variables are set
export const validateConfig = () => {
  try {
    if (!config.openai.apiKey || config.openai.apiKey.trim() === '') {
      console.warn('OpenAI API key not found. Please set EXPO_PUBLIC_OPENAI_API_KEY in your environment variables.');
      return false;
    }
    
    // Basic validation that it looks like an API key
    if (!config.openai.apiKey.startsWith('sk-')) {
      console.warn('OpenAI API key format appears invalid. Should start with "sk-"');
      return false;
    }
    
    if (!config.server.apiKey || config.server.apiKey.trim() === '') {
      console.warn('Server API key not found. Please set EXPO_PUBLIC_ALUUNA_APP_API_KEY in your environment variables.');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error validating config:', error);
    return false;
  }
}; 