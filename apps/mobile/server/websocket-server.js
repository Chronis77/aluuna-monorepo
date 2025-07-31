const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

      // Create streaming response
      const stream = await openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        temperature: 0.3,
        max_tokens: 1000,
        stream: true,
      });

      let fullResponse = '';
      let structuredData = null;

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          fullResponse += content;
          
          // Send chunk to client
          socket.emit('streaming_message', {
            type: 'chunk',
            sessionId,
            messageId,
            content,
          });
        }
      }

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