const io = require('socket.io-client');

// Test the new true streaming WebSocket endpoint
async function testTrueStreaming() {
  console.log('🔌 Connecting to WebSocket server...');
  
  const socket = io('https://aluuna-services-production.up.railway.app', {
    transports: ['websocket'],
    timeout: 10000
  });

  socket.on('connect', () => {
    console.log('✅ Connected to WebSocket server');
    
    // Test the new true streaming endpoint
    const testRequest = {
      userMessage: "Hello! Can you tell me a short story?",
      sessionContext: {
        userId: "test-user-123",
        sessionId: "test-session-456",
        userProfile: {
          name: "Test User",
          preferences: {
            communicationStyle: "friendly",
            responseLength: "medium"
          }
        }
      },
      conversationHistory: [],
      sessionId: "test-session-456",
      messageId: "test-message-" + Date.now(),
      systemPrompt: "You are a helpful AI assistant. Keep responses concise and engaging.",
      temperature: 0.7,
      maxTokens: 200
    };

    console.log('📤 Sending true streaming request...');
    socket.emit('true_streaming_request', testRequest, (response) => {
      console.log('📥 Received acknowledgment:', response);
    });
  });

  socket.on('true_streaming_message', (message) => {
    switch (message.type) {
      case 'start':
        console.log('🚀 Streaming started:', message);
        break;
      case 'token':
        process.stdout.write(message.token); // Print tokens as they arrive
        break;
      case 'done':
        console.log('\n✅ Streaming completed. Total chunks:', message.totalChunks);
        socket.disconnect();
        break;
      case 'error':
        console.error('❌ Streaming error:', message.error);
        socket.disconnect();
        break;
      default:
        console.log('📨 Unknown message type:', message.type);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error.message);
  });
}

// Test the old streaming endpoint for comparison
async function testOldStreaming() {
  console.log('\n🔄 Testing old streaming endpoint...');
  
  const socket = io('https://aluuna-services-production.up.railway.app', {
    transports: ['websocket'],
    timeout: 10000
  });

  socket.on('connect', () => {
    console.log('✅ Connected to WebSocket server');
    
    const testRequest = {
      userMessage: "Hello! Can you tell me a short story?",
      sessionContext: {
        userId: "test-user-123",
        sessionId: "test-session-456",
        userProfile: {
          name: "Test User",
          preferences: {
            communicationStyle: "friendly",
            responseLength: "medium"
          }
        }
      },
      conversationHistory: [],
      sessionId: "test-session-456",
      messageId: "test-message-old-" + Date.now()
    };

    console.log('📤 Sending old streaming request...');
    socket.emit('streaming_request', testRequest, (response) => {
      console.log('📥 Received acknowledgment:', response);
    });
  });

  socket.on('streaming_message', (message) => {
    switch (message.type) {
      case 'start':
        console.log('🚀 Old streaming started:', message);
        break;
      case 'chunk':
        process.stdout.write(message.content); // Print chunks as they arrive
        break;
      case 'end':
        console.log('\n✅ Old streaming completed. Total chunks:', message.totalChunks);
        socket.disconnect();
        break;
      case 'error':
        console.error('❌ Old streaming error:', message.error);
        socket.disconnect();
        break;
      default:
        console.log('📨 Unknown message type:', message.type);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error.message);
  });
}

// Run tests
async function runTests() {
  console.log('🧪 Testing WebSocket Streaming Endpoints\n');
  
  // Test new true streaming
  await testTrueStreaming();
  
  // Wait a bit before testing old streaming
  setTimeout(() => {
    testOldStreaming();
  }, 5000);
}

runTests().catch(console.error); 