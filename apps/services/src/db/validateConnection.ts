import { logger } from '../utils/logger.js';

/**
 * Validate and log the database connection string format
 * This helps debug connection string issues
 */
export function validateDatabaseUrl(): void {
  const databaseUrl = process.env['DATABASE_URL'];
  
  logger.info('Environment check:', {
    hasDatabaseUrl: !!databaseUrl,
    databaseUrlLength: databaseUrl?.length,
    nodeEnv: process.env.NODE_ENV,
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('DATABASE'))
  });
  
  if (!databaseUrl) {
    logger.error('DATABASE_URL environment variable is not set');
    return;
  }
  
  try {
    // Basic validation - check if it's a valid URL
    const url = new URL(databaseUrl);
    
    logger.info('Database URL validation:', {
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port,
      pathname: url.pathname,
      searchParams: Object.fromEntries(url.searchParams.entries()),
      hasPgbouncer: url.searchParams.has('pgbouncer'),
      pgbouncerValue: url.searchParams.get('pgbouncer'),
      note: 'Supabase now uses Supavisor instead of PgBouncer',
      fullUrl: getSanitizedDatabaseUrl()
    });
    
    // Check for common issues
    if (url.port !== '6543') {
      logger.warn('DATABASE_URL port is not 6543 (Supabase Supavisor pooler port)');
    }
    
    // Check for unescaped special characters in password
    const password = url.password;
    if (password && (password.includes('@') || password.includes('#'))) {
      logger.warn('Password may contain unescaped special characters. Consider URL-encoding: @=%40, #=%23');
    }
    
  } catch (error: any) {
    logger.error('Invalid DATABASE_URL format:', { error: error.message });
  }
}

/**
 * Get a sanitized version of the database URL for logging (hides password)
 */
export function getSanitizedDatabaseUrl(): string {
  const databaseUrl = process.env['DATABASE_URL'];
  
  if (!databaseUrl) {
    return 'DATABASE_URL not set';
  }
  
  try {
    const url = new URL(databaseUrl);
    return `${url.protocol}//${url.username}:***@${url.host}${url.pathname}${url.search}`;
  } catch {
    return 'Invalid DATABASE_URL format';
  }
} 