import { prisma } from '../db/client.js';
import { cache } from '../cache/redis.js';
import { logger } from '../utils/logger.js';
import { MCP, MCPSchema } from '../schemas/index.js';
import { withArrayFallback, withNullFallback } from '../utils/connectionUtils.js';
import { fromJsonbArray } from '../utils/jsonbUtils.js';

export async function buildMCP(userId: string, flags?: Record<string, any>): Promise<MCP> {
  const cacheKey = `mcp:${userId}`;
  
  // Try to get from cache first
  const cachedMCP = await cache.get<MCP>(cacheKey);
  if (cachedMCP) {
    logger.info('MCP retrieved from cache', { userId });
    return cachedMCP;
  }

  logger.info('Building MCP for user', { userId });

  try {
    // Fetch all data in parallel with connection error handling
    const [
      memoryProfileResult,
      innerPartsResult,
      insightsResult,
      emotionalTrendsResult,
      recentSessionsResult
    ] = await Promise.all([
      // Get memory profile
      withNullFallback(
        () => prisma.memory_profiles.findUnique({
          where: { user_id: userId }
        }),
        'memory_profile'
      ),
      
      // Get inner parts (limit to recent ones)
      withArrayFallback(
        () => prisma.inner_parts.findMany({
          where: { user_id: userId },
          orderBy: { updated_at: 'desc' },
          take: 10
        }),
        'inner_parts'
      ),
      
      // Get recent insights
      withArrayFallback(
        () => prisma.insights.findMany({
          where: { user_id: userId },
          orderBy: { created_at: 'desc' },
          take: 20
        }),
        'insights'
      ),
      
      // Get recent emotional trends
      withArrayFallback(
        () => prisma.emotional_trends.findMany({
          where: { user_id: userId },
          orderBy: { recorded_at: 'desc' },
          take: 30
        }),
        'emotional_trends'
      ),
      
      // Get recent sessions
      withArrayFallback(
        () => prisma.conversation_messages.findMany({
          where: { user_id: userId },
          orderBy: { created_at: 'desc' },
          take: 5,
          select: {
            id: true,
            input_type: true,
            summary: true,
            mood_at_time: true,
            created_at: true
          }
        }),
        'recent_sessions'
      )
    ]);

    // Extract data from results
    const memoryProfile = memoryProfileResult.data;
    const innerParts = innerPartsResult.data || [];
    const insights = insightsResult.data || [];
    const emotionalTrends = emotionalTrendsResult.data || [];
    const recentSessions = recentSessionsResult.data || [];

    // Build MCP object
    const mcp: MCP = {
      userId,
      memoryProfile,
      innerParts,
      insights,
      emotionalTrends,
      recentSessions,
      currentContext: flags || {}
    };

    // Validate MCP with Zod schema
    const validatedMCP = MCPSchema.parse(mcp);

    // Cache for 5 minutes
    await cache.set(cacheKey, validatedMCP, 300);

    logger.info('MCP built and cached successfully', { 
      userId, 
      memoryProfile: !!memoryProfile,
      innerPartsCount: innerParts.length,
      insightsCount: insights.length,
      emotionalTrendsCount: emotionalTrends.length,
      recentSessionsCount: recentSessions.length
    });

    return validatedMCP;

  } catch (error) {
    logger.error('Error building MCP', { userId, error });
    throw new Error(`Failed to build MCP for user ${userId}: ${error}`);
  }
}

export function formatMCPForOpenAI(mcp: MCP): string {
  const sections = [];

  // Memory Profile Section
  if (mcp.memoryProfile) {
    sections.push(`## MEMORY PROFILE
Name: ${mcp.memoryProfile.name || 'Not specified'}
Age: ${mcp.memoryProfile.age || 'Not specified'}
Occupation: ${mcp.memoryProfile.occupation || 'Not specified'}
Location: ${mcp.memoryProfile.location || 'Not specified'}

Long-term Memory: ${mcp.memoryProfile.long_term_memory || 'No long-term memory recorded'}

Current Context: ${mcp.memoryProfile.current_context || 'No current context recorded'}

Emotional State: ${mcp.memoryProfile.emotional_state || 'No emotional state recorded'}

Recent Events: ${mcp.memoryProfile.recent_events || 'No recent events recorded'}

Goals: ${mcp.memoryProfile.goals || 'No goals recorded'}

Challenges: ${mcp.memoryProfile.challenges || 'No challenges recorded'}

Coping Strategies: ${mcp.memoryProfile.coping_strategies || 'No coping strategies recorded'}

Support Network: ${mcp.memoryProfile.support_network || 'No support network recorded'}

Triggers: ${mcp.memoryProfile.triggers || 'No triggers recorded'}

Patterns: ${mcp.memoryProfile.patterns || 'No patterns recorded'}

Progress Notes: ${mcp.memoryProfile.progress_notes || 'No progress notes recorded'}

Therapeutic Focus: ${mcp.memoryProfile.therapeutic_focus || 'No therapeutic focus recorded'}`);
  }

  // Inner Parts Section
  if (mcp.innerParts.length > 0) {
    const innerPartsText = mcp.innerParts.map(part => 
      `- ${part.name} (${part.role}): ${part.description} [Tone: ${part.tone}]`
    ).join('\n');
    
    sections.push(`## INNER PARTS
${innerPartsText}`);
  }

  // Recent Insights Section
  if (mcp.insights.length > 0) {
    const insightsText = mcp.insights.map(insight => 
      `- ${insight.insight}${insight.category ? ` [${insight.category}]` : ''}`
    ).join('\n');
    
    sections.push(`## RECENT INSIGHTS
${insightsText}`);
  }

  // Emotional Trends Section
  if (mcp.emotionalTrends.length > 0) {
    const trendsText = mcp.emotionalTrends.slice(0, 10).map(trend => 
      `- ${trend.created_at.toISOString().split('T')[0]}: Score ${trend.mood_score}${trend.emotional_state ? ` (${trend.emotional_state})` : ''}${trend.notes ? ` - ${trend.notes}` : ''}`
    ).join('\n');
    
    sections.push(`## EMOTIONAL TRENDS (Last 10)
${trendsText}`);
  }

  // Recent Sessions Section
  if (mcp.recentSessions.length > 0) {
    const sessionsText = mcp.recentSessions.map(session => 
      `- ${session.created_at.toISOString().split('T')[0]}: ${session.type || 'Session'}${session.mood_score ? ` (Mood: ${session.mood_score})` : ''}${session.summary ? ` - ${session.summary.substring(0, 100)}...` : ''}`
    ).join('\n');
    
    sections.push(`## RECENT SESSIONS
${sessionsText}`);
  }

  // Current Context Section
  if (mcp.currentContext && Object.keys(mcp.currentContext).length > 0) {
    const contextText = Object.entries(mcp.currentContext)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
    
    sections.push(`## CURRENT CONTEXT
${contextText}`);
  }

  return sections.join('\n\n');
} 