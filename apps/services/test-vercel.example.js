const fetch = require('node-fetch');
const fs = require('fs');

// Replace with your actual Vercel URL and API key after deployment
const VERCEL_URL = 'https://your-project-name.vercel.app';
const API_KEY = process.env.API_KEY || 'your-api-key-here'; // Set via environment variable

async function testVercelDeployment() {
  console.log('🧪 Testing Vercel TTS Deployment...\n');

  try {
    // Test health check
    console.log('1. Testing health check...');
    const healthResponse = await fetch(`${VERCEL_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    console.log('');

    // Test voices endpoint
    console.log('2. Testing voices endpoint...');
    const voicesResponse = await fetch(`${VERCEL_URL}/voices`, {
      headers: {
        'x-api-key': API_KEY
      }
    });
    const voicesData = await voicesResponse.json();
    console.log(`✅ Found ${voicesData.voices?.length || 0} voices`);
    console.log('');

    // Test TTS endpoint
    console.log('3. Testing TTS endpoint...');
    const ttsResponse = await fetch(`${VERCEL_URL}/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        text: 'Hello from Vercel! This is a test of the text-to-speech service.',
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

    const ttsData = await ttsResponse.json();
    
    if (ttsData.success) {
      console.log('✅ TTS request successful!');
      console.log(`📝 Text: ${ttsData.text}`);
      console.log(`🎵 Audio format: ${ttsData.audioFormat}`);
      console.log(`📊 Audio data length: ${ttsData.audioData?.length || 0} characters`);
      
      // Save the audio file locally for testing
      if (ttsData.audioData) {
        const audioBuffer = Buffer.from(ttsData.audioData, 'base64');
        fs.writeFileSync('test-vercel-audio.mp3', audioBuffer);
        console.log('💾 Audio saved as test-vercel-audio.mp3');
      }
    } else {
      console.log('❌ TTS request failed:', ttsData.error);
    }
    console.log('');

    // Test SSML endpoint
    console.log('4. Testing SSML endpoint...');
    const ssmlResponse = await fetch(`${VERCEL_URL}/tts/ssml`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        ssml: '<speak>Hello from <break time="0.5s"/> SSML! This is a test.</speak>',
        voice: {
          languageCode: 'en-US',
          name: 'en-US-Standard-A',
          ssmlGender: 'NEUTRAL'
        }
      })
    });

    const ssmlData = await ssmlResponse.json();
    
    if (ssmlData.success) {
      console.log('✅ SSML request successful!');
      console.log(`📝 SSML: ${ssmlData.ssml}`);
      console.log(`🎵 Audio format: ${ssmlData.audioFormat}`);
      console.log(`📊 Audio data length: ${ssmlData.audioData?.length || 0} characters`);
      
      // Save the SSML audio file locally for testing
      if (ssmlData.audioData) {
        const audioBuffer = Buffer.from(ssmlData.audioData, 'base64');
        fs.writeFileSync('test-vercel-ssml-audio.mp3', audioBuffer);
        console.log('💾 SSML audio saved as test-vercel-ssml-audio.mp3');
      }
    } else {
      console.log('❌ SSML request failed:', ssmlData.error);
    }

    console.log('\n🎉 All tests completed!');
    console.log('\n📱 For React Native integration, use the Vercel URL:');
    console.log(`   ${VERCEL_URL}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure to:');
    console.log('   1. Replace the VERCEL_URL with your actual deployment URL');
    console.log('   2. Set API_KEY environment variable or replace manually');
    console.log('   3. Set up Google Cloud credentials as environment variables');
    console.log('   4. Deploy to Vercel using: vercel --prod');
  }
}

// Run the test
testVercelDeployment(); 