const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const OpenAI = null;

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// OpenAI usage disabled in mobile dev server; route through services instead
const openai = null;

app.use(cors());
app.use(express.json());

// Store active streaming sessions
const activeStreams = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('streaming_request', async (request, callback) => {
    try {
      const { userMessage, sessionContext, conversationHistory, sessionId, messageId } = request;
      
      console.log('Received streaming request:', { sessionId, messageId });
      
      // Send acknowledgment
      callback({ success: true });
      
      // Send start message
      socket.emit('streaming_message', {
        type: 'start',
        sessionId,
        messageId,
      });

      // Prepare messages for OpenAI
      const messages = [
        { role: 'system', content: 'You are Aluuna, a therapeutic AI companion. Provide empathetic, supportive responses.' },
        ...conversationHistory,
        { role: 'user', content: userMessage }
      ];

      throw new Error('Local websocket-server OpenAI usage is disabled. Use the services server.');

      let fullResponse = '';
      let structuredData = null;

      // No streaming here; handled by services server

      // Try to parse structured data from response
      try {
        const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          structuredData = JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.log('Could not parse structured data from response');
      }

      // Send end message
      socket.emit('streaming_message', {
        type: 'end',
        sessionId,
        messageId,
        structuredData,
      });

      console.log('Streaming completed for:', messageId);

    } catch (error) {
      console.error('Error in streaming request:', error);
      
      socket.emit('streaming_message', {
        type: 'error',
        sessionId: request.sessionId,
        messageId: request.messageId,
        error: error.message,
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
}); 