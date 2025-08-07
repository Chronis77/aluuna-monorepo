import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir, access } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { logger } from '../utils/logger.js';

const execAsync = promisify(exec);

interface MigrationConfig {
  sourceUrl: string;
  outputDir: string;
  includeData: boolean;
  includeSchema: boolean;
  includeIndexes: boolean;
  includeTriggers: boolean;
  includeFunctions: boolean;
  includeViews: boolean;
  tables?: string[];
  excludeTables?: string[];
}

interface MigrationResult {
  success: boolean;
  files: string[];
  errors: string[];
  warnings: string[];
  summary: {
    tables: number;
    dataSize: string;
    schemaSize: string;
    totalSize: string;
  };
}

/**
 * Parse database URL to extract connection details
 */
function parseDatabaseUrl(url: string) {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parsed.port || '5432',
      database: parsed.pathname.slice(1), // Remove leading slash
      username: parsed.username,
      password: parsed.password,
      ssl: parsed.searchParams.get('sslmode') === 'require'
    };
  } catch (error) {
    throw new Error(`Invalid database URL: ${error}`);
  }
}

/**
 * Check if pg_dump is available
 */
async function checkPgDump(): Promise<boolean> {
  try {
    await execAsync('pg_dump --version');
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a safe filename from table name
 */
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * Get table list from database
 */
async function getTableList(config: MigrationConfig): Promise<string[]> {
  const { host, port, database, username, password, ssl } = parseDatabaseUrl(config.sourceUrl);
  
  const sslFlag = ssl ? '--sslmode=require' : '';
  const passwordEnv = password ? `PGPASSWORD="${password}"` : '';
  
  const command = `${passwordEnv} psql -h ${host} -p ${port} -U ${username} -d ${database} ${sslFlag} -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"`;
  
  try {
    const { stdout } = await execAsync(command);
    return stdout
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .filter(table => {
        if (config.tables && config.tables.length > 0) {
          return config.tables.includes(table);
        }
        if (config.excludeTables && config.excludeTables.length > 0) {
          return !config.excludeTables.includes(table);
        }
        return true;
      });
  } catch (error) {
    logger.error('Failed to get table list', { error });
    throw new Error(`Failed to get table list: ${error}`);
  }
}

/**
 * Export database schema only
 */
async function exportSchema(config: MigrationConfig): Promise<string> {
  const { host, port, database, username, password, ssl } = parseDatabaseUrl(config.sourceUrl);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const schemaFile = join(config.outputDir, `schema_${timestamp}.sql`);
  
  const sslFlag = ssl ? '--sslmode=require' : '';
  const passwordEnv = password ? `PGPASSWORD="${password}"` : '';
  
  // Only use valid pg_dump flags for schema
  let command = `${passwordEnv} pg_dump -h ${host} -p ${port} -U ${username} -d ${database} ${sslFlag}`;
  command += ' --schema-only --no-owner --no-privileges';
  command += ` > ${schemaFile}`;
  
  try {
    await execAsync(command);
    logger.info('Schema exported successfully', { file: schemaFile });
    return schemaFile;
  } catch (error) {
    logger.error('Failed to export schema', { error });
    throw new Error(`Failed to export schema: ${error}`);
  }
}

/**
 * Export table data
 */
async function exportTableData(config: MigrationConfig, table: string): Promise<string> {
  const { host, port, database, username, password, ssl } = parseDatabaseUrl(config.sourceUrl);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dataFile = join(config.outputDir, `data_${sanitizeFilename(table)}_${timestamp}.sql`);
  
  const sslFlag = ssl ? '--sslmode=require' : '';
  const passwordEnv = password ? `PGPASSWORD="${password}"` : '';
  
  const command = `${passwordEnv} pg_dump -h ${host} -p ${port} -U ${username} -d ${database} ${sslFlag} --data-only --no-owner --no-privileges --table=${table} > ${dataFile}`;
  
  try {
    await execAsync(command);
    logger.info('Table data exported', { table, file: dataFile });
    return dataFile;
  } catch (error) {
    logger.error('Failed to export table data', { table, error });
    throw new Error(`Failed to export table data for ${table}: ${error}`);
  }
}

/**
 * Export complete database backup
 */
async function exportCompleteBackup(config: MigrationConfig): Promise<string> {
  const { host, port, database, username, password, ssl } = parseDatabaseUrl(config.sourceUrl);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = join(config.outputDir, `complete_backup_${timestamp}.sql`);
  
  const sslFlag = ssl ? '--sslmode=require' : '';
  const passwordEnv = password ? `PGPASSWORD="${password}"` : '';
  
  // Only use valid pg_dump flags for full backup
  let command = `${passwordEnv} pg_dump -h ${host} -p ${port} -U ${username} -d ${database} ${sslFlag}`;
  command += ' --no-owner --no-privileges';
  command += ` > ${backupFile}`;
  
  try {
    await execAsync(command);
    logger.info('Complete backup exported successfully', { file: backupFile });
    return backupFile;
  } catch (error) {
    logger.error('Failed to export complete backup', { error });
    throw new Error(`Failed to export complete backup: ${error}`);
  }
}

/**
 * Get file size in human readable format
 */
function getFileSize(filePath: string): string {
  try {
    const fs = require('fs');
    const stats = fs.statSync(filePath);
    const bytes = stats.size;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  } catch {
    return 'Unknown';
  }
}

/**
 * Main migration function
 */
export async function migrateDatabase(config: MigrationConfig): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    files: [],
    errors: [],
    warnings: [],
    summary: {
      tables: 0,
      dataSize: '0 Bytes',
      schemaSize: '0 Bytes',
      totalSize: '0 Bytes'
    }
  };

  try {
    logger.info('Starting database migration', { 
      source: parseDatabaseUrl(config.sourceUrl).host,
      outputDir: config.outputDir 
    });

    // Check if pg_dump is available
    const pgDumpAvailable = await checkPgDump();
    if (!pgDumpAvailable) {
      throw new Error('pg_dump is not available. Please install PostgreSQL client tools.');
    }

    // Create output directory
    if (!existsSync(config.outputDir)) {
      await mkdir(config.outputDir, { recursive: true });
      logger.info('Created output directory', { dir: config.outputDir });
    }

    // Get table list
    const tables = await getTableList(config);
    logger.info('Found tables', { count: tables.length, tables });

    if (tables.length === 0) {
      result.warnings.push('No tables found to export');
      return result;
    }

    // Export schema if requested
    if (config.includeSchema) {
      try {
        const schemaFile = await exportSchema(config);
        result.files.push(schemaFile);
        result.summary.schemaSize = getFileSize(schemaFile);
        logger.info('Schema exported', { file: schemaFile, size: result.summary.schemaSize });
      } catch (error: any) {
        result.errors.push(`Schema export failed: ${error.message}`);
        logger.error('Schema export failed', { error });
      }
    }

    // Export data if requested
    if (config.includeData) {
      for (const table of tables) {
        try {
          const dataFile = await exportTableData(config, table);
          result.files.push(dataFile);
          result.summary.tables++;
          logger.info('Table data exported', { table, file: dataFile });
        } catch (error: any) {
          result.errors.push(`Data export failed for ${table}: ${error.message}`);
          logger.error('Table data export failed', { table, error });
        }
      }
    }

    // Export complete backup as fallback
    if (config.includeData && config.includeSchema) {
      try {
        const backupFile = await exportCompleteBackup(config);
        result.files.push(backupFile);
        logger.info('Complete backup exported', { file: backupFile });
      } catch (error: any) {
        result.warnings.push(`Complete backup export failed: ${error.message}`);
        logger.warn('Complete backup export failed', { error });
      }
    }

    // Calculate total size
    let totalSize = 0;
    for (const file of result.files) {
      try {
        const fs = require('fs');
        const stats = fs.statSync(file);
        totalSize += stats.size;
      } catch {
        // Ignore size calculation errors
      }
    }
    result.summary.totalSize = getFileSize(result.files[0] || '');

    // Create migration summary
    const summaryFile = join(config.outputDir, 'migration_summary.json');
    const summary = {
      timestamp: new Date().toISOString(),
      source: parseDatabaseUrl(config.sourceUrl).host,
      tables: result.summary.tables,
      files: result.files.map(file => ({
        name: file.split('/').pop(),
        size: getFileSize(file),
        type: file.includes('schema') ? 'schema' : file.includes('data') ? 'data' : 'backup'
      })),
      errors: result.errors,
      warnings: result.warnings
    };

    await writeFile(summaryFile, JSON.stringify(summary, null, 2));
    result.files.push(summaryFile);

    result.success = result.errors.length === 0;
    logger.info('Database migration completed', { 
      success: result.success, 
      files: result.files.length,
      errors: result.errors.length,
      warnings: result.warnings.length
    });

  } catch (error: any) {
    result.errors.push(`Migration failed: ${error.message}`);
    logger.error('Database migration failed', { error });
  }

  return result;
}

/**
 * Generate Railway import script
 */
export function generateRailwayImportScript(outputDir: string, railwayUrl: string): string {
  const script = `#!/bin/bash
# Railway Database Import Script
# Generated on ${new Date().toISOString()}

echo "🚀 Starting Railway database import..."

# Set Railway database URL
RAILWAY_URL="${railwayUrl}"

# Import schema first
echo "📋 Importing schema..."
psql "$RAILWAY_URL" < ${outputDir}/schema_*.sql

# Import data files
echo "📊 Importing data..."
for file in ${outputDir}/data_*.sql; do
  if [ -f "$file" ]; then
    echo "Importing $(basename "$file")..."
    psql "$RAILWAY_URL" < "$file"
  fi
done

echo "✅ Railway import completed!"
echo "📝 Check the migration_summary.json file for details."
`;

  const scriptPath = join(outputDir, 'import_to_railway.sh');
  writeFile(scriptPath, script);
  return scriptPath;
}

/**
 * Quick migration function for common use case
 */
export async function quickMigration(sourceUrl: string, outputDir: string = './migration'): Promise<MigrationResult> {
  const config: MigrationConfig = {
    sourceUrl,
    outputDir,
    includeData: true,
    includeSchema: true,
    includeIndexes: true,
    includeTriggers: true,
    includeFunctions: true,
    includeViews: true
  };

  return migrateDatabase(config);
} 