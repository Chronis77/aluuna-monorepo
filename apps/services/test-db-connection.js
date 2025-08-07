const { Client } = require('pg');

async function testConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL + '?sslmode=require',
  });

  try {
    console.log('🔗 Attempting to connect to database...');
    await client.connect();
    console.log('✅ Successfully connected to database!');
    
    const result = await client.query('SELECT NOW()');
    console.log('📅 Current database time:', result.rows[0].now);
    
    await client.end();
    console.log('🔌 Connection closed successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('🔍 Error details:', error);
  }
}

testConnection(); 