const crypto = require('crypto');

// Generate a secure random API key
function generateApiKey(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

// Generate multiple keys for different environments
console.log('🔑 Generating secure API keys for Aluuna TTS Server...\n');

const developmentKey = generateApiKey(32);
const productionKey = generateApiKey(32);
const testKey = generateApiKey(32);

console.log('📋 Generated API Keys:');
console.log('======================');
console.log(`Development: ${developmentKey}`);
console.log(`Production:  ${productionKey}`);
console.log(`Test:        ${testKey}`);
console.log('\n💡 Usage Instructions:');
console.log('=====================');
console.log('1. For local development, add to your .env file:');
console.log(`   API_KEY=${developmentKey}`);
console.log('\n2. For Vercel deployment, add as environment variable:');
console.log(`   vercel env add API_KEY`);
console.log(`   (Then paste: ${productionKey})`);
console.log('\n3. For React Native app, use the production key:');
console.log(`   const API_KEY = '${productionKey}';`);
console.log('\n🔒 Security Notes:');
console.log('=================');
console.log('• Never commit API keys to version control');
console.log('• Use different keys for development and production');
console.log('• Rotate keys periodically for security');
console.log('• Store keys securely in your React Native app');
console.log('\n📱 React Native Integration:');
console.log('==========================');
console.log('Add the API key to your requests:');
console.log(`
const response = await fetch('https://your-project.vercel.app/tts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': '${productionKey}'
  },
  body: JSON.stringify({
    text: 'Hello world!'
  })
});
`); 