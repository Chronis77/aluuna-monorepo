import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import winston from 'winston';
import dotenv from 'dotenv';
import { appRouter } from './api/router.js';
import { createContext } from './api/context.js';
import { logger } from './utils/logger.js';
import { redis } from './cache/redis.js';
import { prisma } from './db/client.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

// API Key for authentication
const API_KEY = process.env.ALUUNA_APP_API_KEY || 'your-secret-api-key-here';

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ["*"],
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`📥 ${req.method} ${req.path} - ${req.ip}`);
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
app.get('/health', (req, res) => {
  logger.info('Health check requested');
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

// Authentication routes (no API key required)
app.use('/api/auth', authRoutes);



// tRPC middleware
app.use('/api/trpc/:procedure', authenticateApiKey, async (req, res) => {
  const { procedure } = req.params;
  const input = req.body;
  
  try {
    const context = await createContext({ req, res });
    const caller = appRouter.createCaller(context);
    
    // Handle nested procedure calls (e.g., "auth.getCurrentUser")
    const procedureParts = procedure?.split('.') || [];
    let result;
    
    if (procedureParts.length === 1) {
      // Direct procedure call (e.g., "respond", "health")
      result = await (caller as any)[procedureParts[0]](input);
    } else if (procedureParts.length === 2) {
      // Nested procedure call (e.g., "auth.getCurrentUser")
      const [routerName, methodName] = procedureParts;
      result = await (caller as any)[routerName][methodName](input);
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

// WebSocket handlers
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

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

// Start server
if (process.env.NODE_ENV !== 'production') {
  server.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 Aluuna Services Server running on port ${PORT}`);
    logger.info(`📡 Health check: http://localhost:${PORT}/health`);
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

export { app, server, io }; 