# 🚀 Supabase to Railway Database Migration Guide

This guide will help you migrate your database from Supabase to Railway for better performance and direct PostgreSQL connections.

## 🎯 Why Migrate?

- **Faster queries**: Direct PostgreSQL connections with prepared statement caching
- **Better performance**: No forced connection pooling that disables query optimization
- **Simpler setup**: All services on Railway for easier management
- **Cost effective**: Railway's free tier is generous for development

## 📋 Prerequisites

1. **PostgreSQL client tools** installed on your system:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql-client
   
   # macOS
   brew install postgresql
   
   # Windows
   # Download from https://www.postgresql.org/download/windows/
   ```

2. **Supabase database connection string** (from your Supabase dashboard)
3. **Railway account** (sign up at https://railway.app/)

## 🔧 Step 1: Export Your Supabase Database

### Option A: Using the Migration Script (Recommended)

```bash
# Navigate to your services directory
cd apps/services

# Run the migration export
bun run migrate:export "postgresql://your-supabase-connection-string" ./migration
```

### Option B: Manual Export

```bash
# Export schema
pg_dump --schema-only --no-owner --no-privileges \
  --host=your-supabase-host \
  --port=5432 \
  --username=your-username \
  --dbname=your-database \
  > schema.sql

# Export data
pg_dump --data-only --no-owner --no-privileges \
  --host=your-supabase-host \
  --port=5432 \
  --username=your-username \
  --dbname=your-database \
  > data.sql
```

## 🚀 Step 2: Create Railway Database

1. Go to [Railway](https://railway.app/) and sign in
2. Click **New Project**
3. Select **Provision PostgreSQL**
4. Wait for the database to be created
5. Click on the **PostgreSQL** service
6. Go to **Connect** tab and copy the **Postgres Connection URL**

## 📥 Step 3: Import to Railway

### Option A: Using the Generated Script

```bash
# Make the script executable
chmod +x ./migration/import_to_railway.sh

# Run the import
./migration/import_to_railway.sh "your-railway-connection-url"
```

### Option B: Manual Import

```bash
# Import schema first
psql "your-railway-connection-url" < ./migration/schema_*.sql

# Import data
psql "your-railway-connection-url" < ./migration/data_*.sql
```

## ⚙️ Step 4: Update Your Application

1. **Update your `.env` file**:
   ```bash
   # Replace your Supabase DATABASE_URL with Railway
   DATABASE_URL=postgresql://your-railway-connection-url
   ```

2. **Update your Docker Compose** (if using):
   ```yaml
   environment:
     - DATABASE_URL=${DATABASE_URL}
     # Remove the &sslmode=require if Railway doesn't need it
   ```

3. **Regenerate Prisma client**:
   ```bash
   bunx prisma generate
   ```

4. **Test your application**:
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

## 🎉 Step 5: Verify Migration

1. **Check your application logs** - queries should now be fast (< 100ms)
2. **Test CRUD operations** - create, read, update, delete should work smoothly
3. **Monitor performance** - no more "prepared statement does not exist" errors

## 📊 Expected Performance Improvement

| Metric | Supabase (Pooler) | Railway (Direct) |
|--------|------------------|------------------|
| Query Speed | 1-2 seconds | < 100ms |
| Prepared Statements | ❌ Disabled | ✅ Enabled |
| Connection Pooling | ✅ Yes | ✅ Yes |
| Error Rate | High (connection issues) | Low |

## 🔍 Troubleshooting

### Common Issues

1. **"pg_dump: command not found"**
   - Install PostgreSQL client tools (see Prerequisites)

2. **"Connection refused"**
   - Check your Supabase connection string
   - Ensure your IP is whitelisted in Supabase

3. **"Permission denied" on import script**
   - Run: `chmod +x ./migration/import_to_railway.sh`

4. **"SSL connection required"**
   - Add `?sslmode=require` to your Railway connection string

### Getting Help

- Check the `migration_summary.json` file for detailed error information
- Review the generated SQL files to ensure they look correct
- Test the connection string manually with `psql`

## 🧹 Cleanup

After successful migration:

1. **Test thoroughly** - ensure all functionality works
2. **Update documentation** - update any references to Supabase
3. **Monitor for a few days** - ensure stability
4. **Consider removing Supabase** - once confident everything works

## 📝 Migration Files Generated

- `schema_*.sql` - Database structure (tables, indexes, etc.)
- `data_*.sql` - Table data files
- `complete_backup_*.sql` - Full database backup
- `import_to_railway.sh` - Automated import script
- `migration_summary.json` - Detailed migration report

---

**🎉 Congratulations!** You've successfully migrated from Supabase to Railway and should now enjoy much faster database performance. 