// Configuration for API keys and environment variables
export const config = {
  openai: {
    apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
    whisperEndpoint: 'https://api.openai.com/v1/audio/transcriptions',
    gptEndpoint: 'https://api.openai.com/v1/chat/completions',
  },
  tts: {
    apiKey: process.env.EXPO_PUBLIC_ALUUNA_APP_API_KEY || '', // Aluuna app API key
    endpoint: 'https://api-inference.huggingface.co/models/facebook/fastspeech2-en-ljspeech',
    serverUrl: process.env.EXPO_PUBLIC_TTS_SERVER_URL || 'https://aluuna-services-production.up.railway.app', // Deployed Railway services server
    timeout: parseInt(process.env.EXPO_PUBLIC_TTS_TIMEOUT || '10000'), // Increased timeout for Railway
  },
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://fkawzuoxbvjzsbozlqbl.supabase.co',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrYXd6dW94YnZqenNib3pscWJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NTk5MDAsImV4cCI6MjA2OTAzNTkwMH0.FRfKPh-KiLFP0oDz43NPI5nZm-kiTuJDNCab6i7LwNQ',
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
    
    return true;
  } catch (error) {
    console.error('Error validating config:', error);
    return false;
  }
}; 