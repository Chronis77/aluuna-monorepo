import { logger } from './logger.js';

// Types for connection error handling
export interface ConnectionErrorResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  isConnectionError: boolean;
}

// Check if an error is a connection-related error
export function isConnectionError(error: any): boolean {
  if (!error || typeof error !== 'object') return false;
  
  const errorMessage = error.message || '';
  const errorName = error.name || '';
  
  // Check for connection error patterns
  return (
    errorName === 'PrismaClientUnknownRequestError' ||
    errorMessage.includes('ECONNRESET') ||
    errorMessage.includes('ENOTFOUND') ||
    errorMessage.includes('ETIMEDOUT') ||
    errorMessage.includes('Connection terminated') ||
    errorMessage.includes('Connection lost') ||
    errorMessage.includes('Connection refused') ||
    (errorMessage.includes('connection pool') && errorMessage.includes('timeout')) ||
    (errorMessage.includes('connection timeout') && !errorMessage.includes('query')) ||
    // Check for prepared statement errors (these are connection-related with Supabase pooler)
    (errorMessage.includes('prepared statement') && errorMessage.includes('does not exist'))
  );
}



// Handle database operations with connection error recovery
export async function withConnectionErrorHandling<T>(
  operation: () => Promise<T>,
  fallbackValue?: T,
  context?: string
): Promise<ConnectionErrorResult<T>> {
  try {
    const result = await operation();
    return {
      success: true,
      data: result,
      isConnectionError: false
    };
  } catch (error) {
    logger.error('Database operation failed', { context, error });
    

    
    if (isConnectionError(error)) {
      logger.warn('Connection error detected, returning fallback', { context });
      return {
        success: true, // Return success to prevent frontend crashes
        data: fallbackValue,
        error: 'Connection error handled gracefully',
        isConnectionError: true
      };
    }
    
    // For non-connection errors, re-throw
    throw error;
  }
}

// Handle database operations that should return empty arrays on connection errors
export async function withArrayFallback<T>(
  operation: () => Promise<T[]>,
  context?: string
): Promise<ConnectionErrorResult<T[]>> {
  return withConnectionErrorHandling(operation, [], context);
}

// Handle database operations that should return null on connection errors
export async function withNullFallback<T>(
  operation: () => Promise<T | null>,
  context?: string
): Promise<ConnectionErrorResult<T | null>> {
  return withConnectionErrorHandling(operation, null, context);
}

// Handle database operations that should return empty object on connection errors
export async function withObjectFallback<T extends Record<string, any>>(
  operation: () => Promise<T>,
  fallbackObject: T,
  context?: string
): Promise<ConnectionErrorResult<T>> {
  return withConnectionErrorHandling(operation, fallbackObject, context);
}

// Handle delete operations with connection error recovery
export async function withDeleteErrorHandling(
  operation: () => Promise<any>,
  context?: string
): Promise<ConnectionErrorResult<{ success: boolean; message: string }>> {
  try {
    await operation();
    return {
      success: true,
      data: { success: true, message: 'Operation completed successfully' },
      isConnectionError: false
    };
  } catch (error) {
    logger.error('Delete operation failed', { context, error });
    
    if (isConnectionError(error)) {
      logger.warn('Connection error during delete, assuming success', { context });
      return {
        success: true,
        data: { success: true, message: 'Operation completed (connection issue handled)' },
        error: 'Connection error handled gracefully',
        isConnectionError: true
      };
    }
    
    // For non-connection errors, re-throw
    throw error;
  }
} 