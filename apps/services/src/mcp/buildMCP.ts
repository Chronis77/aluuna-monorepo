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
      recentSessionsResult,
      goalsResult,
      themesResult,
      copingToolsResult,
      mantrasResult,
      valueCompassResult,
      aiPreferencesResult,
      relationshipsResult,
      milestonesResult,
      journalEntriesResult,
      shadowThemesResult,
      patternLoopsResult,
      regulationStrategiesResult,
      dysregulatingFactorsResult,
      strengthsResult,
      supportSystemResult,
      dailyPracticesResult,
      habitStreaksResult
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

      // Goals
      withArrayFallback(
        () => prisma.user_goals.findMany({
          where: { user_id: userId, status: 'active' },
          orderBy: [{ priority_level: 'asc' }, { updated_at: 'desc' }],
          take: 10,
        }),
        'user_goals'
      ),

      // Themes
      withArrayFallback(
        () => prisma.user_themes.findMany({
          where: { user_id: userId },
          orderBy: { created_at: 'desc' },
          take: 15,
        }),
        'user_themes'
      ),

      // Coping tools
      withArrayFallback(
        () => prisma.user_coping_tools.findMany({
          where: { user_id: userId },
          orderBy: { created_at: 'desc' },
          take: 15,
        }),
        'user_coping_tools'
      ),

      // Mantras
      withArrayFallback(
        () => prisma.user_mantras.findMany({
          where: { user_id: userId },
          orderBy: { created_at: 'desc' },
          take: 10,
        }),
        'user_mantras'
      ),

      // Value compass
      withNullFallback(
        () => prisma.user_value_compass.findUnique({ where: { user_id: userId } }),
        'user_value_compass'
      ),

      // AI preferences
      withNullFallback(
        () => prisma.user_ai_preferences.findUnique({ where: { user_id: userId } }),
        'user_ai_preferences'
      ),

      // Relationships
      withArrayFallback(
        () => prisma.user_relationships.findMany({
          where: { user_id: userId },
          orderBy: { created_at: 'desc' },
          take: 10,
        }),
        'user_relationships'
      ),

      // Growth milestones
      withArrayFallback(
        () => prisma.user_growth_milestones.findMany({
          where: { user_id: userId },
          orderBy: { date_achieved: 'desc' },
          take: 10,
        }),
        'user_growth_milestones'
      ),

      // Journal entries
      withArrayFallback(
        () => prisma.user_free_journal_entries.findMany({
          where: { user_id: userId },
          orderBy: { created_at: 'desc' },
          take: 10,
        }),
        'user_free_journal_entries'
      ),

      // Shadow themes
      withArrayFallback(
        () => prisma.user_shadow_themes.findMany({
          where: { user_id: userId },
          orderBy: { created_at: 'desc' },
          take: 10,
        }),
        'user_shadow_themes'
      ),

      // Pattern loops
      withArrayFallback(
        () => prisma.user_pattern_loops.findMany({
          where: { user_id: userId },
          orderBy: { created_at: 'desc' },
          take: 10,
        }),
        'user_pattern_loops'
      ),

      // Regulation strategies
      withArrayFallback(
        () => prisma.user_regulation_strategies.findMany({
          where: { user_id: userId },
          orderBy: { created_at: 'desc' },
          take: 10,
        }),
        'user_regulation_strategies'
      ),

      // Dysregulating factors
      withArrayFallback(
        () => prisma.user_dysregulating_factors.findMany({
          where: { user_id: userId },
          orderBy: { created_at: 'desc' },
          take: 10,
        }),
        'user_dysregulating_factors'
      ),

      // Strengths
      withArrayFallback(
        () => prisma.user_strengths.findMany({
          where: { user_id: userId },
          orderBy: { created_at: 'desc' },
          take: 10,
        }),
        'user_strengths'
      ),

      // Support system
      withArrayFallback(
        () => prisma.user_support_system.findMany({
          where: { user_id: userId },
          orderBy: { created_at: 'desc' },
          take: 10,
        }),
        'user_support_system'
      ),

      // Daily practices
      withArrayFallback(
        () => prisma.user_daily_practices.findMany({
          where: { user_id: userId },
          orderBy: { created_at: 'desc' },
          take: 10,
        }),
        'user_daily_practices'
      ),

      // Habit streaks
      withArrayFallback(
        () => prisma.user_habit_streaks.findMany({ where: { user_id: userId } }),
        'user_habit_streaks'
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
      // Conditionally include optional sections only when data is present
      ...(goalsResult.data?.length
        ? { goals: (goalsResult.data || []).map((g: any) => ({
        id: g.id,
        title: g.goal_title,
        priority: g.priority_level,
        status: g.status,
        updated_at: g.updated_at ?? undefined,
        })) }
        : {}),
      ...(themesResult.data?.length
        ? { themes: (themesResult.data || []).map((t: any) => ({
        id: t.id,
        name: t.theme_name,
        category: t.theme_category,
        importance: t.importance_level,
        })) }
        : {}),
      ...(copingToolsResult.data?.length
        ? { copingTools: (copingToolsResult.data || []).map((c: any) => ({
        id: c.id,
        name: c.tool_name,
        category: c.tool_category,
        effectiveness: c.effectiveness_rating,
        when_to_use: c.when_to_use,
        description: c.description,
        })) }
        : {}),
      ...(mantrasResult.data?.length
        ? { mantras: (mantrasResult.data || []).map((m: any) => ({
        id: m.id,
        text: m.text,
        source: m.source,
        tags: m.tags || [],
        })) }
        : {}),
      ...(valueCompassResult.data
        ? {
            valueCompass: {
              core_values: valueCompassResult.data.core_values || [],
              anti_values: valueCompassResult.data.anti_values || [],
              narrative: valueCompassResult.data.narrative ?? null,
              last_reflected_at: valueCompassResult.data.last_reflected_at ?? undefined,
            }
          }
        : {}),
      ...(aiPreferencesResult.data
        ? {
            aiPreferences: {
              ai_voice_style: aiPreferencesResult.data.ai_voice_style ?? null,
              growth_vs_support: aiPreferencesResult.data.growth_vs_support ?? null,
              pushback_level: aiPreferencesResult.data.pushback_level ?? null,
              self_awareness_level: aiPreferencesResult.data.self_awareness_level ?? null,
              goal_modeling_level: aiPreferencesResult.data.goal_modeling_level ?? null,
              therapeutic_approach: aiPreferencesResult.data.therapeutic_approach ?? null,
              validation_vs_challenge: aiPreferencesResult.data.validation_vs_challenge ?? null,
              directness_level: aiPreferencesResult.data.directness_level ?? null,
              emotional_tone: aiPreferencesResult.data.emotional_tone ?? null,
              reflection_depth: aiPreferencesResult.data.reflection_depth ?? null,
              memory_recall_frequency: aiPreferencesResult.data.memory_recall_frequency ?? null,
              goal_focus_level: aiPreferencesResult.data.goal_focus_level ?? null,
              session_length_preference: aiPreferencesResult.data.session_length_preference ?? null,
              voice_output_style: aiPreferencesResult.data.voice_output_style ?? null,
              check_in_frequency: aiPreferencesResult.data.check_in_frequency ?? null,
              crisis_sensitivity_level: aiPreferencesResult.data.crisis_sensitivity_level ?? null,
              preferred_language: aiPreferencesResult.data.preferred_language ?? null,
              notes: aiPreferencesResult.data.notes ?? null,
            }
          }
        : {}),
      ...(relationshipsResult.data?.length
        ? { relationships: (relationshipsResult.data || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        relationship_type: r.role,
        notes: r.notes,
        })) }
        : {}),
      ...(milestonesResult.data?.length
        ? { milestones: (milestonesResult.data || []).map((m: any) => ({
        id: m.id,
        title: m.milestone_title,
        category: m.category,
        date: m.date_achieved,
        })) }
        : {}),
      ...(journalEntriesResult.data?.length
        ? { journalEntries: (journalEntriesResult.data || []).map((j: any) => ({
        id: j.id,
        text: j.entry_text,
        tags: j.tags || [],
        mood_score: j.mood_score ?? null,
        created_at: j.created_at ?? undefined,
        })) }
        : {}),
      ...(shadowThemesResult.data?.length
        ? { shadowThemes: (shadowThemesResult.data || []).map((s: any) => ({
        id: s.id,
        name: s.theme_name,
        description: s.theme_description,
        triggers: s.triggers || [],
        })) }
        : {}),
      ...(patternLoopsResult.data?.length
        ? { patternLoops: (patternLoopsResult.data || []).map((p: any) => ({
        id: p.id,
        name: p.loop_name,
        trigger: p.trigger_situation,
        automatic_response: p.automatic_response,
        consequences: p.consequences,
        })) }
        : {}),
      ...(regulationStrategiesResult.data?.length
        ? { regulationStrategies: (regulationStrategiesResult.data || []).map((rs: any) => ({
        id: rs.id,
        name: rs.strategy_name,
        type: rs.strategy_type,
        when_to_use: rs.when_to_use,
        effectiveness: rs.effectiveness_rating,
        })) }
        : {}),
      ...(dysregulatingFactorsResult.data?.length
        ? { dysregulatingFactors: (dysregulatingFactorsResult.data || []).map((d: any) => ({
        id: d.id,
        name: d.factor_name,
        type: d.factor_type,
        impact_level: d.impact_level,
        triggers: d.triggers || [],
        })) }
        : {}),
      ...(strengthsResult.data?.length
        ? { strengths: (strengthsResult.data || []).map((s: any) => ({
        id: s.id,
        name: s.strength_name,
        category: s.strength_category,
        confidence_level: s.confidence_level,
        })) }
        : {}),
      ...(supportSystemResult.data?.length
        ? { supportSystem: (supportSystemResult.data || []).map((u: any) => ({
        id: u.id,
        person_name: u.person_name,
        relationship_type: u.relationship_type,
        support_type: u.support_type || [],
        reliability_level: u.reliability_level,
        })) }
        : {}),
      ...(dailyPracticesResult.data?.length
        ? { dailyPractices: (dailyPracticesResult.data || []).map((p: any) => ({
        id: p.id,
        text: p.prompt_text,
        is_suggested: p.is_suggested,
        is_pinned: p.is_pinned,
        })) }
        : {}),
      ...(habitStreaksResult.data?.length
        ? { habitStreaks: (habitStreaksResult.data || []).map((h: any) => ({
        id: h.id,
        habit_type: h.habit_type,
        current_streak: h.current_streak,
        longest_streak: h.longest_streak,
        last_entry: h.last_entry,
        })) }
        : {}),
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