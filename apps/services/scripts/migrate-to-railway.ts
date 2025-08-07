#!/usr/bin/env bun

import { quickMigration, generateRailwayImportScript } from '../src/db/migrationUtils.js';
import { logger } from '../src/utils/logger.js';

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  try {
    switch (command) {
      case 'export':
        await handleExport();
        break;
      case 'help':
      case '--help':
      case '-h':
        showHelp();
        break;
      default:
        console.log('❌ Unknown command. Use "help" to see available commands.');
        process.exit(1);
    }
  } catch (error) {
    logger.error('Migration script failed', { error });
    process.exit(1);
  }
}

async function handleExport() {
  const sourceUrl = args[1];
  const outputDir = args[2] || './migration';
  
  if (!sourceUrl) {
    console.log('❌ Please provide the source database URL');
    console.log('Usage: bun run migrate-to-railway.ts export <DATABASE_URL> [output_dir]');
    process.exit(1);
  }

  console.log('🚀 Starting database migration from Supabase to Railway...');
  console.log(`📁 Output directory: ${outputDir}`);
  console.log('');

  const result = await quickMigration(sourceUrl, outputDir);

  if (result.success) {
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   Tables exported: ${result.summary.tables}`);
    console.log(`   Schema size: ${result.summary.schemaSize}`);
    console.log(`   Total files: ${result.files.length}`);
    console.log('');
    console.log('📁 Generated files:');
    result.files.forEach(file => {
      const fileName = file.split('/').pop();
      console.log(`   📄 ${fileName}`);
    });
    console.log('');
    console.log('🚀 Next steps:');
    console.log('1. Create a Railway project and PostgreSQL database');
    console.log('2. Get your Railway database connection URL');
    console.log('3. Run the import script:');
    console.log(`   chmod +x ${outputDir}/import_to_railway.sh`);
    console.log(`   ${outputDir}/import_to_railway.sh <RAILWAY_URL>`);
    console.log('');
    console.log('📝 Or manually import using:');
    console.log('   psql <RAILWAY_URL> < schema_*.sql');
    console.log('   psql <RAILWAY_URL> < data_*.sql');
  } else {
    console.log('❌ Migration failed!');
    console.log('');
    console.log('🚨 Errors:');
    result.errors.forEach(error => {
      console.log(`   ❌ ${error}`);
    });
    console.log('');
    if (result.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      result.warnings.forEach(warning => {
        console.log(`   ⚠️  ${warning}`);
      });
      console.log('');
    }
  }
}

function showHelp() {
  console.log(`
🚀 Supabase to Railway Database Migration Tool

Usage:
  bun run migrate-to-railway.ts export <DATABASE_URL> [output_dir]

Commands:
  export    Export database from Supabase for Railway import
  help      Show this help message

Arguments:
  DATABASE_URL  Your Supabase database connection string
  output_dir    Output directory for migration files (default: ./migration)

Examples:
  # Export with default output directory
  bun run migrate-to-railway.ts export "postgresql://user:pass@host:port/db"

  # Export to custom directory
  bun run migrate-to-railway.ts export "postgresql://user:pass@host:port/db" ./my-migration

Prerequisites:
  - PostgreSQL client tools (pg_dump, psql) must be installed
  - Valid Supabase database connection string
  - Network access to your Supabase database

What it does:
  1. Exports complete database schema (tables, indexes, triggers, functions, views)
  2. Exports all data from each table
  3. Creates a complete backup file
  4. Generates an import script for Railway
  5. Creates a detailed migration summary

Output files:
  - schema_*.sql          Database schema
  - data_*.sql           Table data files
  - complete_backup_*.sql Complete database backup
  - import_to_railway.sh Import script for Railway
  - migration_summary.json Detailed migration report
`);
}

// Run the script
main(); 