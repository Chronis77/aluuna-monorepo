import { prisma } from '../db/client.js';
import { cache } from '../cache/redis.js';
import { logger } from '../utils/logger.js';
import { MCP, MCPSchema } from './types.js';
import { withArrayFallback, withNullFallback } from '../utils/connectionUtils.js';

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
      userProfileSummaryResult,
      innerPartsResult,
      insightsResult,
      emotionalTrendsResult,
      recentSessionsResult
    ] = await Promise.all([
      // User profile summary
      withNullFallback(
        () => prisma.user_profile_summary.findUnique({
          where: { user_id: userId }
        }),
        'user_profile_summary'
      ),

      // Inner parts
      withArrayFallback(
        () => prisma.user_inner_parts.findMany({
          where: { user_id: userId },
          orderBy: { updated_at: 'desc' },
          take: 15
        }),
        'user_inner_parts'
      ),

      // Insights
      withArrayFallback(
        () => prisma.user_insights.findMany({
          where: { user_id: userId },
          orderBy: { created_at: 'desc' },
          take: 30
        }),
        'user_insights'
      ),

      // Emotional trends
      withArrayFallback(
        () => prisma.user_emotional_trends.findMany({
          where: { user_id: userId },
          orderBy: { recorded_at: 'desc' },
          take: 30
        }),
        'user_emotional_trends'
      ),

      // Recent sessions/messages
      withArrayFallback(
        () => prisma.user_conversation_messages.findMany({
          where: { user_id: userId },
          orderBy: { created_at: 'desc' },
          take: 5,
          select: {
            id: true,
            input_type: true,
            summary: true,
            mood_at_time: true,
            created_at: true,
          },
        }),
        'recent_sessions'
      ),
    ]);

    // Extract data from results
    const profileSummary = userProfileSummaryResult.data
      ? {
          user_id: userId,
          suicidal_risk_level: userProfileSummaryResult.data.suicidal_risk_level ?? null,
          sleep_quality: userProfileSummaryResult.data.sleep_quality ?? null,
          biggest_challenge: userProfileSummaryResult.data.biggest_challenge ?? null,
          biggest_obstacle: userProfileSummaryResult.data.biggest_obstacle ?? null,
          motivation_for_joining: userProfileSummaryResult.data.motivation_for_joining ?? null,
          hopes_to_achieve: userProfileSummaryResult.data.hopes_to_achieve ?? null,
          mood_score_initial: userProfileSummaryResult.data.mood_score_initial ?? null,
          updated_at: userProfileSummaryResult.data.updated_at ?? undefined,
        }
      : null;

    const innerParts = (innerPartsResult.data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      role: p.role,
      tone: p.tone,
      description: p.description,
      updated_at: p.updated_at ?? undefined,
    }));

    const insights = (insightsResult.data || []).map((i: any) => ({
      id: i.id,
      text: i.insight_text,
      related_theme: i.related_theme,
      importance: i.importance,
      created_at: i.created_at ?? undefined,
    }));

    const emotionalTrends = (emotionalTrendsResult.data || []).map((t: any) => ({
      id: t.id,
      recorded_at: t.recorded_at,
      mood_score: t.mood_score,
      mood_label: t.mood_label,
      notes: t.notes,
    }));

    const recentSessions = (recentSessionsResult.data || []).map((s: any) => ({
      id: s.id,
      type: s.input_type,
      summary: s.summary,
      mood_at_time: s.mood_at_time,
      created_at: s.created_at,
    }));

    // Build MCP object
    const mcp: MCP = {
      userId,
      profileSummary,
      innerParts,
      insights,
      emotionalTrends,
      recentSessions,
      currentContext: flags || {},
    };

    // Validate MCP with Zod schema
    const validatedMCP = MCPSchema.parse(mcp);

    // Cache for 5 minutes
    await cache.set(cacheKey, validatedMCP, 300);

    logger.info('MCP built and cached successfully', { 
      userId, 
      hasProfileSummary: !!profileSummary,
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
// Formatter moved to ./formatter.ts to keep responsibilities separate