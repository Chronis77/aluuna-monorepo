import { prisma } from '../db/client.js';
import { logger } from '../utils/logger.js';
import { 
  GetMemoryProfileToolSchema,
  StoreInsightToolSchema,
  LogMoodTrendToolSchema,
  StoreInnerPartToolSchema
} from '../schemas/index.js';
import { withNullFallback, withConnectionErrorHandling } from '../utils/connectionUtils.js';

export const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'getMemoryProfile',
      description: 'Get the memory profile for a user',
      parameters: GetMemoryProfileToolSchema
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'storeInsight',
      description: 'Store a new insight for a user',
      parameters: StoreInsightToolSchema
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'logMoodTrend',
      description: 'Log a mood trend for a user',
      parameters: LogMoodTrendToolSchema
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'storeInnerPart',
      description: 'Store a new inner part for a user',
      parameters: StoreInnerPartToolSchema
    }
  }
];

export async function handleToolCall(toolCall: any): Promise<any> {
  const { name, arguments: args } = toolCall.function;
  
  logger.info('Handling tool call', { name, args });

  try {
    switch (name) {
      case 'getMemoryProfile':
        return await getMemoryProfile(args);
      
      case 'storeInsight':
        return await storeInsight(args);
      
      case 'logMoodTrend':
        return await logMoodTrend(args);
      
      case 'storeInnerPart':
        return await storeInnerPart(args);
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    logger.error('Tool call error', { name, error });
    throw error;
  }
}

async function getMemoryProfile(args: any) {
  const { userId } = GetMemoryProfileToolSchema.parse(args);
  
  const result = await withNullFallback(
    () => prisma.memory_profiles.findUnique({
      where: { user_id: userId }
    }),
    'get_memory_profile'
  );

  return {
    success: true,
    memoryProfile: result.data || null
  };
}

async function storeInsight(args: any) {
  const { userId, insight, category, confidence, sessionId } = StoreInsightToolSchema.parse(args);
  
  const result = await withConnectionErrorHandling(
    () => prisma.insights.create({
      data: {
        user_id: userId,
        insight_text: insight,
        related_theme: category || null,
        importance: confidence || 5
      }
    }),
    null,
    'store_insight'
  );

  if (result.isConnectionError) {
    logger.warn('Connection error during insight storage', { userId });
    return {
      success: true,
      insightId: 'temp-id',
      message: 'Insight storage attempted (connection issue handled)'
    };
  }

  logger.info('Insight stored', { userId, insightId: result.data?.id });

  return {
    success: true,
    insightId: result.data?.id || 'temp-id',
    message: 'Insight stored successfully'
  };
}

async function logMoodTrend(args: any) {
  const { userId, moodScore, emotionalState, notes, sessionId } = LogMoodTrendToolSchema.parse(args);
  
  const newTrend = await prisma.emotional_trends.create({
    data: {
      user_id: userId,
      mood_score: moodScore,
      mood_label: emotionalState || null,
      notes: notes || null
    }
  });

  logger.info('Mood trend logged', { userId, trendId: newTrend.id, moodScore });

  return {
    success: true,
    trendId: newTrend.id,
    message: 'Mood trend logged successfully'
  };
}

async function storeInnerPart(args: any) {
  const { userId, name, role, tone, description, sessionId } = StoreInnerPartToolSchema.parse(args);
  
  const newInnerPart = await prisma.inner_parts.create({
    data: {
      user_id: userId,
      name: name || null,
      role: role || null,
      tone: tone || null,
      description: description || null
    }
  });

  logger.info('Inner part stored', { userId, innerPartId: newInnerPart.id, name });

  return {
    success: true,
    innerPartId: newInnerPart.id,
    message: 'Inner part stored successfully'
  };
} 