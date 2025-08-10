import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { appRouter } from './api/router.js';
import { createContext } from './api/context.js';
import { logger } from './utils/logger.js';
import { redis } from './cache/redis.js';
import { prisma } from './db/client.js';
import authRoutes from './routes/authRoutes.js';
import ttsRoutes from './routes/ttsRoutes.js';
// import OpenAI from 'openai';
import { extractTokenFromHeader, verifyToken } from './utils/authUtils.js';
import { initQdrantFromEnv } from './vector/qdrant.js';
import { setVectorStore } from './vector/vectorStore.js';
import { getEmbeddingDimension } from './openai/embeddings.js';
import { handleResponsesStreaming } from './ws/responsesStreaming.js';
import { register as promRegister, httpRequestDurationMs } from './metrics/prom.js';
import { ToolRegistry } from './tools/registry.js';
import './jobs/queues.js';

dotenv.config();

// Confirm OpenAI logging setting at startup
if (process.env['LOG_OPENAI'] === 'true') {
  logger.warn('OpenAI I/O logging enabled', {
    chatModel: process.env['OPENAI_CHAT_MODEL'] || 'gpt-4o',
  });
}

// Initialize Qdrant vector store if configured
const qdrantStore = initQdrantFromEnv();
if (qdrantStore) {
  setVectorStore(qdrantStore);
  // Ensure collection exists with correct dimensions and cosine metric
  const dim = getEmbeddingDimension();
  qdrantStore.createCollectionIfMissing(dim, 'Cosine').catch(err => {
    logger.error('Failed to ensure Qdrant collection', { err });
  });
}

const app = express();
const server = createServer(app);
const PORT = Number(process.env['PORT'] || 3000);

// API Key for authentication
const API_KEY = process.env['ALUUNA_APP_API_KEY'] || 'your-secret-api-key-here';

// Initialize Socket.IO with CORS
const io = new Server(server as any, {
  cors: {
    origin: (process.env['ALLOWED_ORIGINS'] ? process.env['ALLOWED_ORIGINS'].split(',') : ["*"]) as any,
    methods: ["GET", "POST", "OPTIONS"],
    credentials: false,
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"]
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  allowUpgrades: true,
  upgradeTimeout: 10000,
  maxHttpBufferSize: 1e6,
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env['ALLOWED_ORIGINS']?.split(',') || ["*"],
  credentials: true
}));

// Rate limiting
// Use granular limiters per route to avoid blocking tRPC onboarding bursts
const AUTH_RATE_LIMIT_MAX = Number(process.env['AUTH_RATE_LIMIT_MAX'] || 20);
const TRPC_RATE_LIMIT_MAX = Number(
  process.env['TRPC_RATE_LIMIT_MAX'] || (process.env.NODE_ENV !== 'production' ? 2000 : 600)
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP'
});

// More generous limiter for tRPC since onboarding Step 6 performs many writes
const trpcLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: TRPC_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP',
  // In dev, optionally skip limiting altogether
  skip: () => process.env.NODE_ENV !== 'production'
});

// Increase timeout for long-running requests
app.use((req, res, next) => {
  const REQ_TIMEOUT_MS = Number(process.env['HTTP_REQUEST_TIMEOUT_MS'] || 120000); // 120s
  req.setTimeout(REQ_TIMEOUT_MS);
  res.setTimeout(REQ_TIMEOUT_MS);
  next();
});

// Middleware
// Increase JSON/body limits to support base64 audio payloads for quick transcription
const JSON_LIMIT_MB = Number(process.env['JSON_BODY_LIMIT_MB'] || 25);
app.use(express.json({ limit: `${JSON_LIMIT_MB}mb` }));
app.use(express.urlencoded({ extended: true, limit: `${JSON_LIMIT_MB}mb` }));

// Request logging middleware
app.use((req, res, next) => {
  const end = httpRequestDurationMs.startTimer({ method: req.method, route: req.path });
  res.on('finish', () => {
    try { end({ code: String(res.statusCode) }); } catch {}
  });
  logger.debug(`📥 ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// API Key authentication middleware
const authenticateApiKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
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

// Health check endpoint (no authentication required)
app.get('/health', (_req, res) => {
  logger.debug('Health check requested');
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ 
    status: 'OK', 
    message: 'Aluuna Services Server is running',
    services: {
      tts: 'active',
      streaming: 'active',
      websocket: 'active',
      trpc: 'active',
      auth: 'active'
    },
    version: '2.0.0'
  });
});

// Prometheus metrics endpoint
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', promRegister.contentType);
  res.end(await promRegister.metrics());
});

// Authentication routes (no API key required) with stricter limits
app.use('/api/auth', authLimiter, authRoutes);



// tRPC middleware with more generous rate limit
app.use('/api/trpc/:procedure', trpcLimiter, authenticateApiKey, async (req, res) => {
  const { procedure } = req.params;
  const input = req.body;
  
  try {
    const context = await createContext({ req, res } as any);
    const caller = appRouter.createCaller(context);
    
    // Handle nested procedure calls (e.g., "auth.getCurrentUser")
    const procedureParts = procedure?.split('.') || [];
    let result;
    
    if (procedureParts.length === 1) {
      // Direct procedure call (e.g., "respond", "health")
      const method = (caller as any)[procedureParts[0] as string];
      if (typeof method !== 'function') throw new Error(`Unknown procedure: ${procedure}`);
      result = await method(input);
    } else if (procedureParts.length === 2) {
      // Nested procedure call (e.g., "auth.getCurrentUser")
      const [routerName, methodName] = procedureParts as [string, string];
      const router = (caller as any)[routerName as string];
      if (!router) throw new Error(`Unknown router: ${routerName}`);
      const method = router[methodName as string];
      if (typeof method !== 'function') throw new Error(`Unknown procedure: ${procedure}`);
      result = await method(input);
    } else {
      throw new Error(`Invalid procedure format: ${procedure}`);
    }
    
    res.json(result);
  } catch (error) {
    logger.error('tRPC error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Internal server error', details: errorMessage });
  }
});

// TTS endpoint (protected by API key)
app.use('/api/tts', trpcLimiter, authenticateApiKey, ttsRoutes);

// Voice transcription endpoint (server-side Whisper proxy)

// Accept base64 audio to avoid multipart libs and keep Expo client simple
app.post('/api/voice/transcribe', trpcLimiter, authenticateApiKey, async (req, res) => {
  try {
    const authHeader = req.headers.authorization as string | undefined;
    const token = authHeader ? extractTokenFromHeader(authHeader) : undefined;
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Missing JWT' });
    }
    try {
      verifyToken(token);
    } catch {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid JWT' });
    }

    const { audio_base64, mime_type } = req.body || {};
    if (!audio_base64) {
      return res.status(400).json({ error: 'Bad request', message: 'audio_base64 is required' });
    }

    // Prepare multipart form-data with Blob (available in Bun/Node 18+)
    const form = new FormData();
    const buffer = Buffer.from(audio_base64, 'base64');
    const ext = (mime_type && (mime_type.includes('mp4') || mime_type.includes('m4a'))) ? 'm4a' : 'wav';
    const blob = new Blob([buffer], { type: mime_type || 'audio/m4a' });
    form.append('file', blob, `recording.${ext}`);
    form.append('model', process.env['OPENAI_TRANSCRIBE_MODEL'] || 'whisper-1');
    form.append('response_format', 'json');

    const maxRetries = 3;
    const baseDelay = 1000;
    let lastErr: any = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env['OPENAI_API_KEY']}`,
          } as any,
          body: form as any,
        });
        if (!resp.ok) {
          const errText = await resp.text();
          const retryable = resp.status >= 500 || resp.status === 429 || /overload|try again/i.test(errText);
          if (retryable && attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt - 1);
            await new Promise(r => setTimeout(r, delay));
            continue;
          }
          return res.status(resp.status).json({ error: 'Transcription failed', details: errText });
        }
        const data = await resp.json();
        return res.json({ text: data.text || '' });
      } catch (e) {
        lastErr = e;
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
      }
    }
    logger.error('Voice transcription error', { error: lastErr });
    return res.status(500).json({ error: 'Internal server error', details: 'Transcription failed' });
  } catch (error) {
    logger.error('Voice transcription endpoint error', { error });
    res.status(500).json({ error: 'Internal server error', details: 'Unexpected error' });
  }
});

// WebSocket handlers
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // True streaming request compatible with mobile client
  socket.on('true_streaming_request', async (request: any, callback: (resp: any) => void) => {
    try {
      callback?.({ success: true });
      if (process.env['LOG_OPENAI'] === 'true') {
        try {
          const preview = {
            hasUserMessage: typeof request?.userMessage === 'string',
            userMessageLength: (request?.userMessage || '').length,
            hasSystemPrompt: Boolean(request?.systemPrompt),
            systemPromptEncoded: Boolean(request?.systemPromptEncoded),
            conversationHistoryCount: Array.isArray(request?.conversationHistory) ? request.conversationHistory.length : 0,
            temperature: request?.temperature,
          };
          logger.warn('WS true_streaming_request received', preview);
        } catch {}
      }
      const messageId = request?.messageId;
      if (messageId) {
        try {
          // Use native options signature
          const dedupe = await (redis as any).set(`ws:msg:${messageId}`, '1', { EX: 600, NX: true });
          if (dedupe === null) {
            logger.info('Duplicate streaming request suppressed', { messageId });
            return;
          }
        } catch {}
      }
      await handleResponsesStreaming(socket, request);
    } catch (error: any) {
      logger.error('true_streaming_request error', { error: error?.message });
      socket.emit('true_streaming_message', { type: 'error', sessionId: request?.sessionId, messageId: request?.messageId, error: error?.message || 'Unknown error', timestamp: new Date().toISOString() });
    }
  });

  socket.on('disconnect', (reason) => {
    logger.info('Client disconnected', { socketId: socket.id, reason });
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await redis.quit();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await redis.quit();
  await prisma.$disconnect();
  process.exit(0);
});

async function startServerWithDbBackoff() {
  const maxAttempts = Number(process.env['DB_STARTUP_MAX_ATTEMPTS'] || 8);
  const baseDelayMs = Number(process.env['DB_STARTUP_BASE_DELAY_MS'] || 500);
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await prisma.$connect();
      logger.info('✅ Database connection established');
      
      // Initialize tool registry after database connection
      try {
        const toolRegistry = ToolRegistry.getInstance();
        await toolRegistry.initialize();
        logger.info('✅ Tool registry initialized successfully');
      } catch (toolError) {
        logger.error('Failed to initialize tool registry', { error: toolError });
      }
      
      break;
    } catch (err) {
      const delay = Math.min(10000, baseDelayMs * Math.pow(2, attempt - 1));
      logger.warn('Database connection failed, retrying', { attempt, maxAttempts, delayMs: delay });
      if (attempt === maxAttempts) {
        logger.error('Failed to connect to database after retries, starting server anyway');
      } else {
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
    }
  }

  server.listen(PORT, '0.0.0.0', () => {
    const envLabel = process.env.NODE_ENV !== 'production' ? 'port' : 'Railway port';
    logger.info(`🚀 Aluuna Services Server running on ${envLabel} ${PORT}`);
    logger.debug(`📡 Health check: http://localhost:${PORT}/health`);
    logger.debug(`🔌 WebSocket: ws://localhost:${PORT}`);
    logger.debug(`🌐 Server bound to all interfaces (IPv4 & IPv6)`);
    logger.debug(`🔑 API Key required for protected endpoints`);
  });
}

// Start server with DB backoff
startServerWithDbBackoff().catch((e) => {
  logger.error('Fatal startup error', { error: e });
  process.exit(1);
});

export { app, server, io }; 