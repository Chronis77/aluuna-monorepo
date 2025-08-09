const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const textToSpeech = require('@google-cloud/text-to-speech');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const OpenAI = require('openai');
const crypto = require('crypto');
// Use native fetch (available in Node.js 18+) instead of node-fetch
require('dotenv').config();

// Create Express app and HTTP server
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

// API Key for authentication
const API_KEY = process.env.ALUUNA_APP_API_KEY || 'your-secret-api-key-here';

// Initialize logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'aluuna-services' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for debugging
    methods: ["GET", "POST", "OPTIONS"],
    credentials: false, // Disable credentials for now
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"]
  },
  transports: ['websocket', 'polling'], // Try websocket first
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  // Railway-specific settings
  allowUpgrades: true,
  upgradeTimeout: 10000,
  maxHttpBufferSize: 1e6,
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ["*"],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

// Increase timeout for long-running requests
app.use((req, res, next) => {
  req.setTimeout(30000); // 30 seconds
  res.setTimeout(30000); // 30 seconds
  next();
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} - ${req.ip} - ${new Date().toISOString()}`);
  next();
});

// API Key authentication middleware
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey) {
    return res.status(401).json({ 
      error: 'API key required',
      message: 'Please provide an API key in the x-api-key header or Authorization header'
    });
  }
  
  if (apiKey !== API_KEY) {
    return res.status(403).json({ 
      error: 'Invalid API key',
      message: 'The provided API key is invalid'
    });
  }
  
  next();
};

// Initialize Google Cloud TTS client
let ttsClient;
if (process.env.GOOGLE_CREDENTIALS) {
  // For Railway deployment - use credentials from environment variable
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  ttsClient = new textToSpeech.TextToSpeechClient({
    credentials: credentials
  });
} else {
  // For local development - use credentials file
  ttsClient = new textToSpeech.TextToSpeechClient({
    keyFilename: './google-creds.json'
  });
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Track active streams for cleanup
const activeStreams = new Map();

// WebSocket handlers
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // New true streaming endpoint using fetch with stream: true
  socket.on('true_streaming_request', async (request, callback) => {
    try {
      console.log('🔍 Server received true_streaming_request:', { 
        messageId: request.messageId, 
        userMessageLength: request.userMessage?.length,
        systemPromptLength: request.systemPrompt?.length,
        conversationHistoryLength: request.conversationHistory?.length
      });
      
      // Import the modern streaming handler with function calling
      const { handleResponsesStreaming } = await import('./src/ws/responsesStreaming.js');
      
      // Extract essential data from the legacy request format
      const {
        userMessage,
        sessionContext,
        conversationHistory,
        sessionId,
        messageId,
        systemPrompt,
        systemPromptEncoded = false,
        temperature = 0.3
      } = request;
      
      // Send acknowledgment immediately
      callback({ success: true });
      
      // Convert legacy request to modern format
      const modernRequest = {
        userId: sessionContext?.userId || sessionContext?.userProfile?.user_id || 'default-user-id',
        userMessage,
        sessionId,
        messageId,
        conversationHistory: conversationHistory || [],
        currentContext: sessionContext || {},
        mode: undefined, // Let the system auto-detect mode
        temperature
      };
      
      // Use the modern streaming handler with function calling
      await handleResponsesStreaming(socket, modernRequest);
      
      return; // Exit early to avoid the old implementation
    } catch (error) {
      logger.error('Error in function calling streaming request', { 
        error: error.message, 
        messageId: request.messageId,
        socketId: socket.id 
      });
      
      socket.emit('true_streaming_message', {
        type: 'error',
        sessionId: request.sessionId,
        messageId: request.messageId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  socket.on('streaming_request', async (request, callback) => {
    try {
      const { userMessage, sessionContext, conversationHistory, sessionId, messageId } = request;
      
      logger.info('Streaming request received', { sessionId, messageId, socketId: socket.id });
      
      // Send acknowledgment
      callback({ success: true });
      
      // Send start message immediately
      socket.emit('streaming_message', {
        type: 'start',
        sessionId,
        messageId,
        timestamp: new Date().toISOString()
      });



      // Create abort controller for this stream with timeout
      const abortController = new AbortController();
      activeStreams.set(messageId, { socket, abortController });
      
      // Set timeout to abort if response takes too long (30 seconds)
      const timeoutId = setTimeout(() => {
        abortController.abort();
        logger.warn('Stream timeout', { messageId });
      }, 30000);

      // Prepare messages for OpenAI
      const messages = [
        { role: 'system', content: buildSystemPrompt(sessionContext) },
        ...conversationHistory,
        { role: 'user', content: userMessage }
      ];

      // Create streaming response with optimized parameters
      const stream = await openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        temperature: 0.3,
        stream: true,
        presence_penalty: 0.1, // Slight penalty for repetition
        frequency_penalty: 0.1, // Slight penalty for repetition
      }, {
        signal: abortController.signal
      });

      let fullResponse = '';
      let structuredData = null;
      let chunkCount = 0;

      let jsonBuffer = '';
      let userResponse = '';
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          fullResponse += content;
          jsonBuffer += content;
          chunkCount++;
          
          // Extract and send only the response text in real-time
          try {
            // Look for the response field and extract new content
            const responseMatch = jsonBuffer.match(/"response"\s*:\s*"((?:[^"\\]|\\.)*)"/);
            if (responseMatch) {
              const extractedResponse = responseMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
              
              // Only send new content that hasn't been sent before
              if (extractedResponse.length > userResponse.length) {
                const newContent = extractedResponse.substring(userResponse.length);
                userResponse = extractedResponse;
                
                // Send only the user-facing text (no JSON)
                socket.emit('streaming_message', {
                  type: 'chunk',
                  sessionId,
                  messageId,
                  content: newContent,
                  chunkIndex: chunkCount,
                  timestamp: new Date().toISOString()
                });
              }
            }
          } catch (parseError) {
            // If parsing fails, don't send anything yet
          }
        }
      }

      // Try to parse structured data from full response
      try {
        const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          structuredData = JSON.parse(cleanJsonResponse(jsonMatch[0]));
          // Extract the final user response from structured data
          userResponse = structuredData.response || userResponse;
        }
      } catch (parseError) {
        logger.warn('Could not parse structured data from response', { messageId });
      }

      // Send end message
      socket.emit('streaming_message', {
        type: 'end',
        sessionId,
        messageId,
        structuredData,
        totalChunks: chunkCount,
        timestamp: new Date().toISOString()
      });

      // Clean up
      clearTimeout(timeoutId);
      activeStreams.delete(messageId);

      logger.info('Streaming completed', { 
        messageId, 
        sessionId, 
        totalChunks: chunkCount,
        responseLength: fullResponse.length 
      });

    } catch (error) {
      logger.error('Error in streaming request', { 
        error: error.message, 
        messageId: request.messageId,
        socketId: socket.id 
      });
      
      // Clean up on error
      activeStreams.delete(request.messageId);
      
      socket.emit('streaming_message', {
        type: 'error',
        sessionId: request.sessionId,
        messageId: request.messageId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  socket.on('cancel_stream', (messageId) => {
    const stream = activeStreams.get(messageId);
    if (stream) {
      stream.abortController.abort();
      activeStreams.delete(messageId);
      logger.info('Stream cancelled by client', { messageId });
    }
  });

  socket.on('disconnect', (reason) => {
    logger.info('Client disconnected', { socketId: socket.id, reason });
    
    // Clean up any active streams for this socket
    for (const [messageId, stream] of activeStreams.entries()) {
      if (stream.socket.id === socket.id) {
        stream.abortController.abort();
        activeStreams.delete(messageId);
      }
    }
  });
});

// Health check endpoint (no authentication required)
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ 
    status: 'OK', 
    message: 'Aluuna Services Server is running',
    services: {
      tts: 'active',
      streaming: 'active',
      websocket: 'active'
    },
    version: '2.0.0'
  });
});

// Get available voices (requires authentication)
app.get('/voices', authenticateApiKey, async (req, res) => {
  try {
    const [result] = await ttsClient.listVoices({});
    const voices = result.voices;
    res.json({ voices });
  } catch (error) {
    logger.error('Error fetching voices:', error);
    res.status(500).json({ error: 'Failed to fetch voices' });
  }
});

// Helpful GET endpoint for TTS (returns usage instructions)
app.get('/tts', (req, res) => {
  res.status(405).json({
    error: 'Method not allowed',
    message: 'TTS endpoint requires POST request with JSON body and API key',
    example: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'your-api-key-here'
      },
      body: {
        text: 'Hello world',
        voice: {
          languageCode: 'en-US',
          name: 'en-US-Standard-A',
          ssmlGender: 'NEUTRAL'
        }
      }
    }
  });
});

// Text-to-Speech endpoint (requires authentication)
app.post('/tts', authenticateApiKey, async (req, res) => {
  console.log('🎵 TTS request received:', { text: req.body.text?.substring(0, 50) + '...', voice: req.body.voice });
  
  try {
    const { text, voice, languageCode, audioConfig } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Default configuration
    const request = {
      input: { text },
      voice: voice || {
        languageCode: languageCode || 'en-US',
        name: 'en-US-Standard-A',
        ssmlGender: 'NEUTRAL'
      },
      audioConfig: audioConfig || {
        audioEncoding: 'MP3',
        speakingRate: 1.0,
        pitch: 0.0,
        volumeGainDb: 0.0
      }
    };

    // Perform the text-to-speech request
    const [response] = await client.synthesizeSpeech(request);
    const audioContent = response.audioContent;

    // Convert audio content to base64 for direct transmission
    const audioBase64 = audioContent.toString('base64');
    
    res.json({
      success: true,
      audioData: audioBase64,
      audioFormat: 'base64',
      text,
      voice: request.voice,
      audioConfig: request.audioConfig
    });

  } catch (error) {
    console.error('TTS Error:', error);
    res.status(500).json({ 
      error: 'Failed to synthesize speech',
      details: error.message 
    });
  }
});

// Chat API endpoint for fallback (requires authentication)
app.post('/api/chat', authenticateApiKey, async (req, res) => {
  try {
    const { messages, model = 'gpt-4', temperature = 0.3 } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    logger.info('📝 Chat API request received', { 
      messageCount: messages.length,
      model,
      temperature 
    });

    // Create chat completion
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature,
    });

    const response = completion.choices[0]?.message?.content || '';

    logger.info('📝 Chat API response completed', { 
      responseLength: response.length 
    });

    res.json({
      success: true,
      choices: completion.choices,
      usage: completion.usage,
    });

  } catch (error) {
    logger.error('Chat API Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate chat response',
      details: error.message 
    });
  }
});

// SSML Text-to-Speech endpoint (requires authentication)
app.post('/tts/ssml', authenticateApiKey, async (req, res) => {
  try {
    const { ssml, voice, audioConfig } = req.body;

    if (!ssml) {
      return res.status(400).json({ error: 'SSML is required' });
    }

    // Default configuration
    const request = {
      input: { ssml },
      voice: voice || {
        languageCode: 'en-US',
        name: 'en-US-Standard-A',
        ssmlGender: 'NEUTRAL'
      },
      audioConfig: audioConfig || {
        audioEncoding: 'MP3',
        speakingRate: 1.0,
        pitch: 0.0,
        volumeGainDb: 0.0
      }
    };

    // Perform the text-to-speech request
    const [response] = await client.synthesizeSpeech(request);
    const audioContent = response.audioContent;

    // Convert audio content to base64 for direct transmission
    const audioBase64 = audioContent.toString('base64');
    
    res.json({
      success: true,
      audioData: audioBase64,
      audioFormat: 'base64',
      ssml,
      voice: request.voice,
      audioConfig: request.audioConfig
    });

  } catch (error) {
    console.error('SSML TTS Error:', error);
    res.status(500).json({ 
      error: 'Failed to synthesize SSML speech',
      details: error.message 
    });
  }
});

// Start server (only for local development)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Aluuna TTS Server running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
    console.log(`🎵 TTS endpoint: http://localhost:${PORT}/tts`);
    console.log(`🔊 SSML endpoint: http://localhost:${PORT}/tts/ssml`);
    console.log(`🌐 Server bound to all interfaces (IPv4 & IPv6)`);
    console.log(`🔑 API Key required for protected endpoints`);
  });
}

// Helper functions

// Base64 encoding/decoding functions for secure transmission
function encodeBase64(text) {
  return Buffer.from(text, 'utf8').toString('base64');
}

function decodeBase64(encodedText) {
  return Buffer.from(encodedText, 'base64').toString('utf8');
}

function cleanJsonResponse(response) {
  const jsonStart = response.indexOf('{');
  if (jsonStart > 0) {
    response = response.substring(jsonStart);
  }
  
  const jsonEnd = response.lastIndexOf('}');
  if (jsonEnd !== -1 && jsonEnd < response.length - 1) {
    response = response.substring(0, jsonEnd + 1);
  }
  
  return response
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']')
    .replace(/true or false/g, 'false')
    .replace(/null or ".*?"/g, 'null')
    .replace(/"null"/g, 'null')
    .replace(/"true"/g, 'true')
    .replace(/"false"/g, 'false');
}

// Start server (for both local and Railway)
if (process.env.NODE_ENV !== 'production') {
  server.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 Aluuna Services Server running on port ${PORT}`);
    logger.info(`📡 Health check: http://localhost:${PORT}/health`);
    logger.info(`🎵 TTS endpoint: http://localhost:${PORT}/tts`);
    logger.info(`🔊 SSML endpoint: http://localhost:${PORT}/tts/ssml`);
    logger.info(`🔌 WebSocket: ws://localhost:${PORT}`);
    logger.info(`🌐 Server bound to all interfaces (IPv4 & IPv6)`);
    logger.info(`🔑 API Key required for protected endpoints`);
  });
} else {
  // For Railway production - ensure server is listening
  server.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 Aluuna Services Server running on Railway port ${PORT}`);
    logger.info(`🔌 WebSocket server active`);
  });
}

module.exports = { app, server, io }; 