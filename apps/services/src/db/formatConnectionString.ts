import { logger } from '../utils/logger.js';

/**
 * Format the database connection string with proper pgbouncer=true parameter
 */
export function formatDatabaseUrl(): string {
  const baseUrl = process.env['DATABASE_URL'];
  
  if (!baseUrl) {
    logger.error('DATABASE_URL environment variable is not set');
    throw new Error('DATABASE_URL is required');
  }
  
  try {
    const url = new URL(baseUrl);
    // Ensure SSL is required for external providers like Railway
    if (url.searchParams.get('sslmode')?.toLowerCase() !== 'require') {
      url.searchParams.set('sslmode', 'require');
      logger.debug('Applied sslmode=require to DATABASE_URL');
    }
    const formattedUrl = url.toString();
    logger.debug('Formatted DATABASE_URL');
    return formattedUrl;
  } catch (error: any) {
    logger.error('Error formatting DATABASE_URL', { error: error.message, baseUrl });
    throw new Error(`Invalid DATABASE_URL format: ${error.message}`);
  }
}

/**
 * Validate that the connection string is properly formatted
 */
export function validateConnectionString(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    
    // Check required components
    if (parsedUrl.protocol !== 'postgresql:') {
      logger.error('Invalid protocol', { protocol: parsedUrl.protocol });
      return false;
    }
    
    if (!parsedUrl.hostname) {
      logger.error('Missing hostname');
      return false;
    }
    
    if (!parsedUrl.pathname || parsedUrl.pathname === '/') {
      logger.error('Missing database name');
      return false;
    }
    
    return true;
  } catch (error: any) {
    logger.error('Invalid connection string format', { error: error.message });
    return false;
  }
} 