const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function checkServerStatus() {
  console.log('🔍 Checking Aluuna TTS Server Status...\n');

  // Check if server is running
  try {
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Server Status:', healthData);
  } catch (error) {
    console.log('❌ Server not responding:', error.message);
    return;
  }

  // Check voices endpoint
  try {
    const voicesResponse = await fetch(`${BASE_URL}/voices`);
    const voicesData = await voicesResponse.json();
    
    if (voicesData.error) {
      console.log('❌ Voices API Error:', voicesData.error);
      console.log('📋 Error Details:', voicesData.details || 'No details provided');
    } else if (voicesData.voices && Array.isArray(voicesData.voices)) {
      console.log('✅ Voices API Working:', voicesData.voices.length, 'voices available');
    } else {
      console.log('⚠️ Unexpected voices response:', voicesData);
    }
  } catch (error) {
    console.log('❌ Voices API failed:', error.message);
  }

  // Test TTS endpoint
  try {
    const ttsResponse = await fetch(`${BASE_URL}/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'Test message',
        voice: {
          languageCode: 'en-US',
          name: 'en-US-Standard-A',
          ssmlGender: 'NEUTRAL'
        }
      })
    });

    const ttsData = await ttsResponse.json();
    
    if (ttsData.success) {
      console.log('✅ TTS API Working');
      console.log('📁 Generated file:', ttsData.filename);
    } else {
      console.log('❌ TTS API Error:', ttsData.error);
      console.log('📋 Error Details:', ttsData.details || 'No details provided');
    }
  } catch (error) {
    console.log('❌ TTS API failed:', error.message);
  }

  console.log('\n📋 Next Steps:');
  console.log('1. If you see "SERVICE_DISABLED" errors, follow the setup guide in GOOGLE_CLOUD_SETUP.md');
  console.log('2. If you see permission errors, check your service account roles');
  console.log('3. If you see billing errors, ensure billing is enabled for your Google Cloud project');
  console.log('4. After fixing issues, restart the server: docker-compose down && docker-compose up -d');
}

checkServerStatus().catch(console.error); 