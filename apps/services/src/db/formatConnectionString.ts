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
    // Handle malformed URLs with double question marks
    let cleanUrl = baseUrl;
    if (cleanUrl.includes('??')) {
      cleanUrl = cleanUrl.replace('??', '?');
    }
    if (cleanUrl.includes('?pgbouncer=true?sslmode=')) {
      cleanUrl = cleanUrl.replace('?pgbouncer=true?sslmode=', '?pgbouncer=true&sslmode=');
    }
    
    // Parse the cleaned URL
    const url = new URL(cleanUrl);
    
    // Remove pgbouncer=true to enable prepared statements for better performance
    if (url.searchParams.has('pgbouncer')) {
      url.searchParams.delete('pgbouncer');
      logger.info('Removed pgbouncer=true to enable prepared statements for better performance');
    }
    
    const formattedUrl = url.toString();
    
    logger.info('Formatted DATABASE_URL', {
      originalLength: baseUrl.length,
      formattedLength: formattedUrl.length,
      hasPgbouncer: url.searchParams.has('pgbouncer'),
      pgbouncerValue: url.searchParams.get('pgbouncer') || null,
      note: 'Prepared statements enabled for better performance'
    });
    
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
    
    // Check for pgbouncer parameter
    if (!parsedUrl.searchParams.has('pgbouncer')) {
      logger.warn('pgbouncer=true parameter not found');
    }
    
    return true;
  } catch (error: any) {
    logger.error('Invalid connection string format', { error: error.message });
    return false;
  }
} 