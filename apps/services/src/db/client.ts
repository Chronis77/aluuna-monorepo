import { PrismaClient } from '@prisma/client';
import { validateDatabaseUrl, getSanitizedDatabaseUrl } from './validateConnection.js';
import { formatDatabaseUrl, validateConnectionString } from './formatConnectionString.js';
import { logger } from '../utils/logger.js';
import { performanceMonitor } from './performanceMonitor.js';

// Validate database connection string on startup
validateDatabaseUrl();

// Format the database URL with pgbouncer=true
let formattedDatabaseUrl: string;
try {
  formattedDatabaseUrl = formatDatabaseUrl();
  validateConnectionString(formattedDatabaseUrl);
} catch (error: any) {
  logger.error('Failed to format database URL', { error: error.message });
  throw error;
}

// Create a more robust Prisma client with configurable logging
// Control Prisma logs via PRISMA_LOG env (comma-separated), default: error
// Example: PRISMA_LOG=error,warn or PRISMA_LOG=error
const prismaLogEnv = (process.env.PRISMA_LOG || 'error')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
// Force only valid levels
const validLevels = new Set(['query', 'info', 'warn', 'error']);
const prismaLogLevels = Array.from(new Set(prismaLogEnv.filter((l) => validLevels.has(l))));
if (prismaLogLevels.length === 0) prismaLogLevels.push('error');

export const prisma = new PrismaClient({
  log: prismaLogLevels as any,
  datasources: {
    db: {
      url: formattedDatabaseUrl,
    },
  },
});

// Log connection info
logger.info('Prisma client initialized', { 
  databaseUrl: getSanitizedDatabaseUrl(),
  nodeEnv: process.env.NODE_ENV 
});

// Track connection health and error patterns
let connectionErrorCount = 0;
let lastErrorTime = 0;
const ERROR_THRESHOLD = 50; // Number of errors before considering connection unhealthy (much more conservative)
const ERROR_WINDOW = 60000; // 1 minute window for error counting

// Function to check if we should reset the connection
function shouldResetConnection() {
  const now = Date.now();
  
  // Reset error count if outside the error window
  if (now - lastErrorTime > ERROR_WINDOW) {
    connectionErrorCount = 0;
  }
  
  connectionErrorCount++;
  lastErrorTime = now;
  
  // Only reset if we have multiple errors in a short time
  return connectionErrorCount >= ERROR_THRESHOLD;
}

// Function to force a complete connection reset (only when necessary)
export async function forceConnectionReset() {
  try {
    console.log('🔄 Force resetting database connection due to persistent errors...');
    
    // Disconnect completely
    await prisma.$disconnect();
    
    // Wait a bit to ensure all connections are closed
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Reconnect
    await prisma.$connect();
    
    // Reset error tracking
    connectionErrorCount = 0;
    lastErrorTime = 0;
    
    console.log('✅ Database connection reset successful');
  } catch (error) {
    console.error('❌ Failed to reset database connection:', error);
    throw error;
  }
}

// Query performance tracking
let queryCount = 0;
let totalQueryTime = 0;
const queryStats = {
  total: 0,
  averageTime: 0,
  slowQueries: 0, // queries > 1 second
  verySlowQueries: 0, // queries > 5 seconds
  timeoutQueries: 0, // queries that hit timeout
  connectionErrors: 0 // prepared statement errors
};

// Add middleware to handle connection errors with comprehensive error detection
prisma.$use(async (params, next) => {
  const startTime = Date.now();
  let retryCount = 0;
  const maxRetries = 3; // Increased retries for better resilience
  
  // Add query timeout protection
  const queryTimeout = 10000; // 10 seconds timeout
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Query timeout')), queryTimeout);
  });
  
  while (retryCount <= maxRetries) {
    try {
      // Race between query execution and timeout
      const result = await Promise.race([
        next(params),
        timeoutPromise
      ]);
      
      // Track query performance
      const duration = Date.now() - startTime;
      queryStats.total++;
      totalQueryTime += duration;
      queryStats.averageTime = totalQueryTime / queryStats.total;
      
      const logSlow = process.env.LOG_SLOW_QUERIES === 'true';
      if (logSlow) {
        if (duration > 5000) {
          queryStats.verySlowQueries++;
          logger.warn('Very slow query detected', { durationMs: duration, model: params.model, action: params.action });
        } else if (duration > 1000) {
          queryStats.slowQueries++;
          logger.debug('Slow query detected', { durationMs: duration, model: params.model, action: params.action });
        }
      }
      
      // Optional: log connection pool health
      if (process.env.LOG_QUERY_STATS === 'true' && queryStats.total % 100 === 0) {
        logger.debug('📊 Query stats', {
          total: queryStats.total,
          slow: queryStats.slowQueries,
          verySlow: queryStats.verySlowQueries,
          connectionErrors: queryStats.connectionErrors,
        });
      }
      
      return result;
    } catch (error: any) {
      // Track connection errors (simplified since prepared statements are disabled)
      if (error?.message?.includes('ECONNRESET') || error?.message?.includes('ETIMEDOUT')) {
        queryStats.connectionErrors++;
      }
      
      // Connection error detection
      const isConnectionError = 
        error?.name === 'PrismaClientUnknownRequestError' ||
        (error?.message && (
          error.message.includes('ECONNRESET') ||
          error.message.includes('ENOTFOUND') ||
          error.message.includes('ETIMEDOUT') ||
          error.message.includes('Connection terminated') ||
          error.message.includes('Connection lost') ||
          error.message.includes('Connection refused') ||
          (error.message.includes('connection pool') && error.message.includes('timeout')) ||
          (error.message.includes('connection timeout') && !error.message.includes('query'))
        ));
      
      // Data validation errors should NOT trigger connection resets
      const isDataValidationError = 
        error?.message && (
          error.message.includes('array contains too many dimensions') ||
          error.message.includes('invalid input syntax') ||
          error.message.includes('malformed array literal') ||
          error.message.includes('data type mismatch') ||
          error.message.includes('invalid type')
        );
      
      if (isConnectionError && !isDataValidationError) {
        retryCount++;
        const errorType = error?.message?.includes('does not exist') ? 'does not exist' : 
                         error?.message?.includes('already exists') ? 'already exists' : 'connection';
        logger.debug('Connection error detected', { errorType, attempt: `${retryCount}/${maxRetries + 1}`, message: error?.message });
        

        
        if (retryCount <= maxRetries) {
          try {
            // Only reset connection for actual persistent connection issues
            const isPersistentError = shouldResetConnection();
            
            if (isPersistentError && retryCount > 4) {
              logger.debug('🔄 Persistent connection error detected, resetting connection', { attempt: retryCount });
              await forceConnectionReset();
            } else {
              logger.debug('🔄 Attempting retry without connection reset', { attempt: retryCount });
              // Just wait a bit and retry without resetting connection
              await new Promise(resolve => setTimeout(resolve, 100 * retryCount)); // Slightly more backoff
            }
            
            continue; // Retry the operation
          } catch (resetError) {
            logger.error('Failed to handle connection error', { error: resetError });
            throw error; // Throw the original error if handling fails
          }
        }
      }
      
      throw error;
    }
  }
});

// Connection health monitoring
let isConnected = true;

// Export connection status for monitoring
export function getConnectionStatus() {
  return {
    isConnected,
    errorCount: connectionErrorCount,
    lastErrorTime: lastErrorTime ? new Date(lastErrorTime).toISOString() : null,
    poolInfo: {
      // Note: Prisma doesn't expose direct pool metrics, but we can track usage patterns
      activeConnections: 'Managed by Prisma',
      maxConnections: 'Managed by Prisma',
      connectionStrategy: 'Connection Pooling'
    },
    queryPerformance: {
      totalQueries: queryStats.total,
      averageQueryTime: Math.round(queryStats.averageTime),
      slowQueries: queryStats.slowQueries,
      verySlowQueries: queryStats.verySlowQueries,
      slowQueryPercentage: queryStats.total > 0 ? Math.round((queryStats.slowQueries / queryStats.total) * 100) : 0
    }
  };
}

// Add a health check endpoint for connection monitoring
export async function checkDatabaseHealth() {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const duration = Date.now() - start;
    
    return {
      status: 'healthy',
      responseTime: duration,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Handle SIGINT and SIGTERM for graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// Log performance stats every 5 minutes
setInterval(() => {
  performanceMonitor.logStats();
}, 5 * 60 * 1000); 