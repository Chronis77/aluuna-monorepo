#!/bin/bash
# Railway Database Import Script
# Generated on 2025-08-06T10:30:00.000Z

echo "🚀 Starting Railway database import..."

# Check if Railway URL is provided
if [ -z "$1" ]; then
    echo "❌ Error: Please provide your Railway database connection URL"
    echo "Usage: ./import_to_railway.sh <RAILWAY_DATABASE_URL>"
    echo "Example: ./import_to_railway.sh postgresql://user:pass@host:port/db"
    exit 1
fi

# Set Railway database URL
RAILWAY_URL="$1"

echo "📋 Importing schema..."
# Import schema first
psql "$RAILWAY_URL" < schema_*.sql

if [ $? -eq 0 ]; then
    echo "✅ Schema imported successfully!"
else
    echo "❌ Schema import failed!"
    exit 1
fi

echo "📊 Importing data files..."
# Import data files
for file in data_*.sql; do
    if [ -f "$file" ]; then
        echo "Importing $(basename "$file")..."
        psql "$RAILWAY_URL" < "$file"
        if [ $? -eq 0 ]; then
            echo "✅ $(basename "$file") imported successfully!"
        else
            echo "❌ $(basename "$file") import failed!"
        fi
    fi
done

echo "✅ Railway import completed!"
echo "📝 Check the migration_summary.json file for details."
echo ""
echo "🎉 Your database is now ready on Railway!"
echo "🚀 Update your DATABASE_URL in your .env file and restart your app." 