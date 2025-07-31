const fetch = require('node-fetch');

const TTS_SERVER_URL = 'http://172.28.152.95:3000';

async function testReactNativeRequest() {
  console.log('🧪 Testing React Native-style request...\n');

  const testText = "It's truly inspiring to hear how passionate you are about providing a space for people to express themselves, no matter what they're going through. It sounds like you deeply value empathy and understanding. How does it feel to know that your work is making such a difference in people's lives?";

  console.log('📝 Test text length:', testText.length, 'characters');
  console.log('🌐 Server URL:', TTS_SERVER_URL);
  console.log('⏱️ Timeout: 5000ms (same as React Native app)\n');

  // Test 1: Simple TTS request
  console.log('🔍 Test 1: Simple TTS request');
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const startTime = Date.now();
    const response = await fetch(`${TTS_SERVER_URL}/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        text: testText,
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
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`✅ Request completed in ${duration}ms`);
    console.log(`📊 Response status: ${response.status}`);
    
    const result = await response.json();
    console.log(`🎵 Success: ${result.success}`);
    console.log(`📁 Audio file: ${result.filename}`);
    console.log(`🔗 Audio URL: ${result.audioUrl}`);

    // Test audio file accessibility
    console.log('\n🔍 Test 2: Audio file accessibility');
    const audioResponse = await fetch(result.audioUrl);
    console.log(`📊 Audio file status: ${audioResponse.status}`);
    console.log(`📁 Audio file size: ${audioResponse.headers.get('content-length')} bytes`);
    console.log(`🎵 Audio content type: ${audioResponse.headers.get('content-type')}`);

  } catch (error) {
    console.log(`❌ Request failed: ${error.name} - ${error.message}`);
    
    if (error.name === 'AbortError') {
      console.log('⏰ Request timed out after 5 seconds');
    }
  }

  // Test 3: Health check
  console.log('\n🔍 Test 3: Health check');
  try {
    const response = await fetch(`${TTS_SERVER_URL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    const result = await response.json();
    console.log(`✅ Health check: ${result.status} - ${result.message}`);
  } catch (error) {
    console.log(`❌ Health check failed: ${error.message}`);
  }

  // Test 4: Network connectivity
  console.log('\n🔍 Test 4: Network connectivity test');
  try {
    const startTime = Date.now();
    const response = await fetch(`${TTS_SERVER_URL}/health`);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Network connectivity: ${duration}ms response time`);
  } catch (error) {
    console.log(`❌ Network connectivity failed: ${error.message}`);
  }
}

testReactNativeRequest().catch(console.error); 