# Aluuna Services - Modern TypeScript AI-First Therapy Server with Bun

## 🚀 Overview

This is the completely rewritten Aluuna server using modern TypeScript, Bun runtime, tRPC, and OpenAI tool calling for AI-first mobile therapy. The server provides a scalable, type-safe API for the Aluuna mobile app.

## 🏗️ Architecture

### Tech Stack
- **Language**: TypeScript
- **Runtime**: Bun (fast, modern JavaScript runtime)
- **Framework**: tRPC + Zod for type-safe APIs
- **Database**: PostgreSQL via Prisma ORM
- **Cache**: Redis for memory profiles and session data
- **LLM Integration**: OpenAI API with tool calling
- **Deployment**: Railway
- **Database Hosting**: Supabase

### Key Features
- ✅ **Type-safe APIs** with tRPC and Zod validation
- ✅ **OpenAI Tool Calling** for dynamic database operations
- ✅ **MCP (Model Context Protocol)** for personalized AI responses
- ✅ **Redis Caching** for performance optimization
- ✅ **Server-controlled architecture** - no direct DB access from mobile
- ✅ **Modern TypeScript** with strict type checking
- ✅ **Bun runtime** for superior performance and developer experience

## 📁 Project Structure

```
src/
├── api/                 # tRPC API endpoints
│   ├── context.ts      # tRPC context with DB and Redis
│   └── router.ts       # Main API router
├── cache/              # Redis cache utilities
│   └── redis.ts        # Redis client and cache helpers
├── db/                 # Database layer
│   └── client.ts       # Prisma client
├── mcp/                # Model Context Protocol
│   └── buildMCP.ts     # MCP builder and formatter
├── openai/             # OpenAI integration
│   └── client.ts       # OpenAI client with tool calling
├── schemas/            # Zod schemas
│   └── index.ts        # All API schemas and types
├── tools/              # OpenAI tool handlers
│   └── index.ts        # Tool definitions and handlers
├── utils/              # Utilities
│   └── logger.ts       # Winston logger
└── index.ts            # Main server entry point
```

## 🔧 Setup & Installation

### Prerequisites
- **Bun** (latest version) - [Install Bun](https://bun.sh/)
- PostgreSQL database (Supabase recommended)
- Redis instance
- OpenAI API key

### Environment Variables
Create a `.env` file:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/aluuna"

# Redis
REDIS_URL="redis://localhost:6379"

# OpenAI
OPENAI_API_KEY="sk-..."

# Security
ALUUNA_APP_API_KEY="your-secret-api-key"

# CORS
ALLOWED_ORIGINS="http://localhost:3000,https://your-app.com"
```

### Installation

1. **Install Bun** (if not already installed):
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Install dependencies**:
   ```bash
   bun install
   ```

3. **Generate Prisma client**:
   ```bash
   bunx prisma generate
   ```

4. **Run database migrations**:
   ```bash
   bunx prisma db push
   ```

5. **Start development server**:
   ```bash
   bun run dev
   ```

## 🚀 API Endpoints

### Health Check
```http
GET /health
```

### tRPC Endpoints

All API endpoints are available via tRPC at `/api/trpc`:

#### Respond to User Input
```typescript
POST /api/trpc
{
  "procedure": "respond",
  "input": {
    "user_input": "I felt very angry today when my co-parent ignored my message.",
    "mode": "free_journaling",
    "mood_score": 4,
    "session_context": { "session_type": "therapy" }
  }
}
```

#### Get Memory Profile
```typescript
POST /api/trpc
{
  "procedure": "getMemoryProfile",
  "input": {
    "userId": "user-123"
  }
}
```

#### Health Check
```typescript
POST /api/trpc
{
  "procedure": "health"
}
```

## 🧠 MCP (Model Context Protocol)

The server builds comprehensive user context for AI responses:

### Memory Profile
- User demographics and background
- Long-term memory and current context
- Goals, challenges, and coping strategies
- Therapeutic focus and progress notes

### Inner Parts
- Identified inner parts with roles and tones
- Recent inner part discoveries

### Insights
- AI-generated insights from sessions
- Pattern recognition and themes

### Emotional Trends
- Mood tracking over time
- Emotional state patterns

### Recent Sessions
- Session summaries and outcomes
- Therapeutic progress tracking

## 🔧 OpenAI Tool Calling

The server supports dynamic tool calling for:

### Available Tools
- `getMemoryProfile` - Retrieve user memory profile
- `storeInsight` - Store new therapeutic insights
- `logMoodTrend` - Log emotional trends
- `storeInnerPart` - Store discovered inner parts

### Tool Flow
1. User sends input to server
2. Server builds MCP context
3. OpenAI receives context + user input
4. OpenAI may call tools to update database
5. Server processes tool calls and updates data
6. OpenAI generates final response with updated context

## 📱 Mobile App Integration

The mobile app communicates exclusively through the server API:

### Key Changes
- ❌ **Removed**: Direct database access from mobile
- ✅ **Added**: tRPC client for type-safe API calls
- ✅ **Added**: Server-controlled data operations
- ✅ **Added**: Centralized AI response generation

### Example Mobile App Flow
```typescript
import { AIService } from './lib/aiService';

// Send user input and get AI response
const response = await AIService.respond({
  user_input: "I felt very angry today when my co-parent ignored my message.",
  mode: "free_journaling",
  mood_score: 4
});

// Get memory profile
const profile = await AIService.getMemoryProfile("user-123");
```

## 🚀 Deployment

### Railway Deployment
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production
```env
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."
OPENAI_API_KEY="sk-..."
ALUUNA_APP_API_KEY="your-production-key"
NODE_ENV="production"
```

## 🔒 Security

- **API Key Authentication**: All endpoints require valid API key
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS Protection**: Configurable allowed origins
- **Input Validation**: Zod schemas validate all inputs
- **Error Handling**: Comprehensive error logging and handling

## 📊 Monitoring & Logging

- **Winston Logger**: Structured logging with file and console output
- **Request Logging**: All API requests logged with metadata
- **Error Tracking**: Detailed error logging with stack traces
- **Performance Monitoring**: Response time and tool call tracking

## 🔄 Migration from Old Server

### Key Changes
1. **Language**: JavaScript → TypeScript
2. **Runtime**: Node.js → Bun
3. **Architecture**: Monolith → tRPC + modular structure
4. **Database Access**: Direct → Server-controlled via tools
5. **Type Safety**: None → Full type safety with Zod
6. **Caching**: None → Redis caching for performance
7. **Tool Calling**: None → OpenAI function calling

### Migration Steps
1. Deploy new server to Railway
2. Update mobile app to use tRPC client
3. Remove all DB logic from frontend
4. Test all functionality with new architecture
5. Switch traffic to new server

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with proper TypeScript types
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details 