const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testHealth() {
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    console.log('✅ Health check:', data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function testVoices() {
  try {
    const response = await fetch(`${BASE_URL}/voices`);
    const data = await response.json();
    if (data.voices && Array.isArray(data.voices)) {
      console.log('✅ Voices fetched:', data.voices.length, 'voices available');
      return true;
    } else {
      console.log('⚠️ Voices response:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ Voices fetch failed:', error.message);
    return false;
  }
}

async function testTTS() {
  try {
    const response = await fetch(`${BASE_URL}/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'Hello from Aluuna TTS Server! This is a test message.',
        voice: {
          languageCode: 'en-US',
          name: 'en-US-Standard-A',
          ssmlGender: 'NEUTRAL'
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 1.0,
          pitch: 0.0,
          volumeGainDb: 0.0
        }
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ TTS test successful!');
      console.log('📁 Audio file:', data.filename);
      console.log('🔗 Audio URL:', data.audioUrl);
      return true;
    } else {
      console.error('❌ TTS test failed:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ TTS test failed:', error.message);
    return false;
  }
}

async function testSSML() {
  try {
    const response = await fetch(`${BASE_URL}/tts/ssml`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ssml: '<speak>Hello from Aluuna TTS Server! <break time="1s"/> This is an SSML test message.</speak>',
        voice: {
          languageCode: 'en-US',
          name: 'en-US-Standard-A',
          ssmlGender: 'NEUTRAL'
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 1.0,
          pitch: 0.0,
          volumeGainDb: 0.0
        }
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ SSML TTS test successful!');
      console.log('📁 Audio file:', data.filename);
      console.log('🔗 Audio URL:', data.audioUrl);
      return true;
    } else {
      console.error('❌ SSML TTS test failed:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ SSML TTS test failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Starting Aluuna TTS Server Tests...\n');

  const tests = [
    { name: 'Health Check', fn: testHealth },
    { name: 'Voices API', fn: testVoices },
    { name: 'TTS API', fn: testTTS },
    { name: 'SSML TTS API', fn: testSSML }
  ];

  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    console.log(`\n🔍 Testing: ${test.name}`);
    const result = await test.fn();
    if (result) passed++;
  }

  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Your TTS server is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check your server configuration.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testHealth, testVoices, testTTS, testSSML, runTests }; 