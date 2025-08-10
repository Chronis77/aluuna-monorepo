import { prisma } from '../db/client.js';
import { logger } from '../utils/logger.js';
import { z } from 'zod';
import { 
  GetMemoryProfileToolSchema,
  StoreInsightToolSchema,
  LogMoodTrendToolSchema,
  StoreInnerPartToolSchema
} from '../schemas/index.js';
import { withNullFallback, withConnectionErrorHandling } from '../utils/connectionUtils.js';
import { embedText } from '../openai/embeddings.js';
import { getVectorStore } from '../vector/vectorStore.js';
import { enqueueEmbeddingUpsert } from '../jobs/queues.js';
import { toolCalls } from '../metrics/prom.js';
const DEDUPE_WINDOW_MS = Number(process.env['TOOL_DEDUPE_WINDOW_MS'] || 5 * 60 * 1000);

// Additional tool schemas consolidated here
const StoreGoalToolSchema = z.object({
  userId: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  priority: z.number().int().min(1).max(5).optional()
});

const StoreCopingToolSchema = z.object({
  userId: z.string().uuid(),
  name: z.string(),
  category: z.string().optional(),
  effectiveness: z.number().int().min(1).max(10).optional(),
  description: z.string().optional(),
  when_to_use: z.string().optional()
});

const StoreMantraToolSchema = z.object({
  userId: z.string().uuid(),
  text: z.string(),
  source: z.string().optional(),
  tags: z.array(z.string()).optional()
});

const StorePreferenceToolSchema = z.object({
  userId: z.string().uuid(),
  preferences: z.object({
    preferred_therapy_styles: z.array(z.string()).optional(),
    preferred_tone: z.string().optional(),
    communication_style: z.string().optional(),
  })
});

const MemorySearchToolSchema = z.object({
  userId: z.string().uuid(),
  query: z.string(),
  namespace: z.enum(['insight','inner_part','session','journal']).optional().default('insight'),
  topK: z.number().int().min(1).max(20).optional().default(5)
});

const StoreRelationshipToolSchema = z.object({
  userId: z.string().uuid(),
  name: z.string(),
  role: z.string().optional(),
  notes: z.string().optional()
});

const StoreThemeToolSchema = z.object({
  userId: z.string().uuid(),
  theme: z.string(),
  category: z.string().optional(),
  importance: z.number().int().min(1).max(10).optional()
});

const LogFreeJournalEntryToolSchema = z.object({
  userId: z.string().uuid(),
  entry: z.string(),
  tags: z.array(z.string()).optional(),
  moodScore: z.number().int().min(1).max(10).optional()
});

const StoreGrowthMilestoneToolSchema = z.object({
  userId: z.string().uuid(),
  milestone: z.string(),
  category: z.string().optional(),
  date: z.string().optional(),
  lessons: z.string().optional(),
});

const FlagCrisisToolSchema = z.object({
  userId: z.string().uuid(),
  sessionId: z.string().uuid().optional(),
  flagType: z.string().default('crisis'),
});

const StoreRiskFactorToolSchema = z.object({
  userId: z.string().uuid(),
  name: z.string(),
  category: z.string().optional(),
  severity: z.number().int().min(1).max(10).optional(),
  triggers: z.array(z.string()).optional(),
  warningSigns: z.array(z.string()).optional(),
  safetyPlan: z.string().optional(),
});

const SetValuesCompassToolSchema = z.object({
  userId: z.string().uuid(),
  coreValues: z.array(z.string()).optional(),
  antiValues: z.array(z.string()).optional(),
  narrative: z.string().optional(),
});

const UpdateAIPreferencesToolSchema = z.object({
  userId: z.string().uuid(),
  preferences: z.object({
    ai_voice_style: z.string().optional(),
    growth_vs_support: z.string().optional(),
    pushback_level: z.number().int().min(1).max(10).optional(),
    self_awareness_level: z.number().int().min(1).max(10).optional(),
    goal_modeling_level: z.number().int().min(1).max(10).optional(),
    therapeutic_approach: z.string().optional(),
    validation_vs_challenge: z.number().int().min(1).max(10).optional(),
    directness_level: z.number().int().min(1).max(10).optional(),
    emotional_tone: z.string().optional(),
    reflection_depth: z.number().int().min(1).max(10).optional(),
    memory_recall_frequency: z.number().int().min(1).max(10).optional(),
    goal_focus_level: z.number().int().min(1).max(10).optional(),
    session_length_preference: z.string().optional(),
    voice_output_style: z.string().optional(),
    check_in_frequency: z.string().optional(),
    crisis_sensitivity_level: z.number().int().min(1).max(10).optional(),
    preferred_language: z.string().optional(),
    notes: z.string().optional(),
  })
});

const CreateDailyPracticeToolSchema = z.object({
  userId: z.string().uuid(),
  practiceName: z.string(),
  practiceType: z.string().optional(),
  frequency: z.string().optional(),
  notes: z.string().optional(),
  isSuggested: z.boolean().optional(),
  isPinned: z.boolean().optional(),
});

const LogDailyPracticeToolSchema = z.object({
  userId: z.string().uuid(),
  practiceId: z.string().uuid().optional(),
  practiceName: z.string().optional(),
  date: z.string().optional(),
  moodBefore: z.number().int().min(1).max(10).optional(),
  moodAfter: z.number().int().min(1).max(10).optional(),
  reflection: z.string().optional(),
});

const UpdateHabitStreakToolSchema = z.object({
  userId: z.string().uuid(),
  habitType: z.string(),
  completedDate: z.string().optional(),
});

const SuggestNextStepToolSchema = z.object({
  userId: z.string().uuid(),
  // optional orchestrations
  insight: z.string().optional(),
  goalTitle: z.string().optional(),
  goalDescription: z.string().optional(),
  mantra: z.string().optional(),
  copingToolName: z.string().optional(),
  practiceName: z.string().optional(),
  theme: z.string().optional(),
});

// New tool schemas for additional memory types (shadow themes, pattern loops, regulation, dysregulation, strengths, support)
const StoreShadowThemeToolSchema = z.object({
  userId: z.string().uuid(),
  themeName: z.string(),
  themeDescription: z.string().optional(),
  triggers: z.array(z.string()).optional(),
  avoidanceBehaviors: z.array(z.string()).optional(),
  integrationStrategies: z.array(z.string()).optional(),
});

const StorePatternLoopToolSchema = z.object({
  userId: z.string().uuid(),
  loopName: z.string(),
  triggerSituation: z.string().optional(),
  automaticResponse: z.string().optional(),
  consequences: z.string().optional(),
  alternativeResponses: z.array(z.string()).optional(),
});

const StoreRegulationStrategyToolSchema = z.object({
  userId: z.string().uuid(),
  strategyName: z.string(),
  strategyType: z.string().optional(),
  when_to_use: z.string().optional(),
  effectiveness: z.number().int().min(1).max(10).optional(),
  notes: z.string().optional(),
});

const StoreDysregulatingFactorToolSchema = z.object({
  userId: z.string().uuid(),
  factorName: z.string(),
  factorType: z.string().optional(),
  impactLevel: z.number().int().min(1).max(10).optional(),
  triggers: z.array(z.string()).optional(),
  copingStrategies: z.array(z.string()).optional(),
});

const StoreStrengthToolSchema = z.object({
  userId: z.string().uuid(),
  name: z.string(),
  category: z.string().optional(),
  confidenceLevel: z.number().int().min(1).max(10).optional(),
  howDeveloped: z.string().optional(),
  howUtilized: z.string().optional(),
});

const StoreSupportSystemToolSchema = z.object({
  userId: z.string().uuid(),
  personName: z.string(),
  relationshipType: z.string().optional(),
  supportType: z.array(z.string()).optional(),
  reliabilityLevel: z.number().int().min(1).max(10).optional(),
  contactInfo: z.string().optional(),
});

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
  },
  {
    type: 'function' as const,
    function: {
      name: 'storeGoal',
      description: 'Create or update a user goal with category and priority for tracking progress.',
      parameters: StoreGoalToolSchema
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'storeCopingTool',
      description: 'Save a coping tool the user finds helpful with effectiveness and usage guidance.',
      parameters: StoreCopingToolSchema
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'storeMantra',
      description: 'Save a personalized mantra or affirmation with optional tags.',
      parameters: StoreMantraToolSchema
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'storePreferences',
      description: 'Update therapy-related preferences to better personalize responses.',
      parameters: StorePreferenceToolSchema
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'memorySearch',
      description: 'Search vector memory for the most relevant past items to the current query.',
      parameters: MemorySearchToolSchema
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'storeRelationship',
      description: 'Store a relationship/person relevant to the user’s world with role and notes.',
      parameters: StoreRelationshipToolSchema
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'storeTheme',
      description: 'Add a key user theme with optional category and importance.',
      parameters: StoreThemeToolSchema
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'logFreeJournalEntry',
      description: 'Log a free journal entry, optionally tagging and recording a mood score.',
      parameters: LogFreeJournalEntryToolSchema
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'storeGrowthMilestone',
      description: 'Store a growth milestone with optional category, date, and lessons learned.',
      parameters: StoreGrowthMilestoneToolSchema
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'flagCrisis',
      description: 'Flag a crisis signal for review; triggers risk workflows.',
      parameters: FlagCrisisToolSchema
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'storeRiskFactor',
      description: 'Store a user risk factor with category, severity, and safety plan.',
      parameters: StoreRiskFactorToolSchema
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'setValuesCompass',
      description: 'Set the user value compass (core values, anti-values, narrative).',
      parameters: SetValuesCompassToolSchema
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'updateAIPreferences',
      description: 'Update deeper AI preferences to personalize tone, pacing, and style.',
      parameters: UpdateAIPreferencesToolSchema
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'createDailyPractice',
      description: 'Create a daily practice item (can be suggested or pinned).',
      parameters: CreateDailyPracticeToolSchema
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'logDailyPractice',
      description: 'Log a completed daily practice entry, optionally updating streaks.',
      parameters: LogDailyPracticeToolSchema
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'updateHabitStreak',
      description: 'Update or create a habit streak for a given habit type.',
      parameters: UpdateHabitStreakToolSchema
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'suggestNextStep',
      description: 'Orchestrate multiple helpful writes (insight, goal, mantra, coping tool, practice, theme) as a next step.',
      parameters: SuggestNextStepToolSchema
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'storeShadowTheme',
      description: 'Store a shadow theme including unconscious aspects of themselves that they do not fully accept, acknowledge, or express.',
      parameters: StoreShadowThemeToolSchema
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'storePatternLoop',
      description: 'Store a pattern loop including trigger, automatic response, consequences, and alternatives.',
      parameters: StorePatternLoopToolSchema
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'storeRegulationStrategy',
      description: 'Store a nervous-system regulation strategy with type, usage guidance, and effectiveness.',
      parameters: StoreRegulationStrategyToolSchema
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'storeDysregulatingFactor',
      description: 'Store a dysregulating factor with triggers and coping strategies.',
      parameters: StoreDysregulatingFactorToolSchema
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'storeStrength',
      description: 'Store a personal strength with category, confidence, and usage context.',
      parameters: StoreStrengthToolSchema
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'storeSupportSystem',
      description: 'Store a support system member and their relationship/support types.',
      parameters: StoreSupportSystemToolSchema
    }
  },
];

export async function handleToolCall(toolCall: any): Promise<any> {
  const { name, arguments: rawArgs } = toolCall.function;
  
  // Parse arguments if they come as a JSON string (which they do from OpenAI)
  let args;
  try {
    args = typeof rawArgs === 'string' ? JSON.parse(rawArgs) : rawArgs;
  } catch (e) {
    logger.error('Failed to parse tool arguments', { name, rawArgs });
    throw new Error(`Invalid tool arguments for ${name}`);
  }
  
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
      case 'storeGoal':
        return await storeGoal(args);
      case 'storeCopingTool':
        return await storeCopingTool(args);
      case 'storeMantra':
        return await storeMantra(args);
      case 'storePreferences':
        return await storePreferences(args);
      case 'memorySearch':
        return await memorySearch(args);
      case 'storeRelationship':
        return await storeRelationship(args);
      case 'storeTheme':
        return await storeTheme(args);
      case 'logFreeJournalEntry':
        return await logFreeJournalEntry(args);
      case 'storeGrowthMilestone':
        return await storeGrowthMilestone(args);
      case 'flagCrisis':
        return await flagCrisis(args);
      case 'storeRiskFactor':
        return await storeRiskFactor(args);
      case 'setValuesCompass':
        return await setValuesCompass(args);
      case 'updateAIPreferences':
        return await updateAIPreferences(args);
      case 'createDailyPractice':
        return await createDailyPractice(args);
      case 'logDailyPractice':
        return await logDailyPractice(args);
      case 'updateHabitStreak':
        return await updateHabitStreak(args);
      case 'suggestNextStep':
        return await suggestNextStep(args);
      case 'storeShadowTheme':
        return await storeShadowTheme(args);
      case 'storePatternLoop':
        return await storePatternLoop(args);
      case 'storeRegulationStrategy':
        return await storeRegulationStrategy(args);
      case 'storeDysregulatingFactor':
        return await storeDysregulatingFactor(args);
      case 'storeStrength':
        return await storeStrength(args);
      case 'storeSupportSystem':
        return await storeSupportSystem(args);
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    logger.error('Tool call error', { name, error });
    try { toolCalls.inc({ tool_name: name, status: 'error' }); } catch {}
    throw error;
  }
}

async function getMemoryProfile(args: any) {
  const { userId } = GetMemoryProfileToolSchema.parse(args);
  
  const [summaryRes, prefs, goals, parts, insights, trends] = await Promise.all([
    withNullFallback(
      () => prisma.user_profile_summary.findUnique({ where: { user_id: userId } }),
      'get_user_profile_summary'
    ),
    prisma.user_therapy_preferences.findUnique({ where: { user_id: userId } }).catch(() => null),
    prisma.user_goals.findMany({
      where: { user_id: userId, status: 'active' },
      orderBy: [{ priority_level: 'asc' }, { updated_at: 'desc' }],
      take: 5,
    }).catch(() => []),
    prisma.user_inner_parts.findMany({
      where: { user_id: userId },
      orderBy: { updated_at: 'desc' },
      take: 5,
    }).catch(() => []),
    prisma.user_insights.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 5,
    }).catch(() => []),
    prisma.user_emotional_trends.findMany({
      where: { user_id: userId },
      orderBy: { recorded_at: 'desc' },
      take: 5,
    }).catch(() => []),
  ]);

  const summary = summaryRes.data;
  return {
    success: true,
    profile: {
      summary: summary || null,
      preferences: prefs || null,
      goals: goals?.map(g => ({ id: g.id, title: g.goal_title, priority: g.priority_level, status: g.status })) || [],
      inner_parts: parts?.map(p => ({ id: p.id, name: p.name, role: p.role, tone: p.tone })) || [],
      insights: insights?.map(i => ({ id: i.id, text: i.insight_text, theme: i.related_theme })) || [],
      emotional_trends: trends?.map(t => ({ id: t.id, mood: t.mood_score, label: t.mood_label, recorded_at: t.recorded_at })) || [],
    }
  };
}

async function storeInsight(args: any) {
  const { userId, insight, category, confidence, sessionId } = StoreInsightToolSchema.parse(args);
  // Dedupe: skip if identical insight exists recently
  const recent = await prisma.user_insights.findFirst({
    where: {
      user_id: userId,
      insight_text: insight,
      created_at: { gte: new Date(Date.now() - DEDUPE_WINDOW_MS) },
    }
  });

  // (moved) New tool schemas declared above
  if (recent) {
    logger.info('Duplicate insight suppressed', { userId });
    try { toolCalls.inc({ tool_name: 'storeInsight', status: 'deduped' }); } catch {}
    return { success: true, insightId: recent.id, message: 'Duplicate suppressed' };
  }
  
  const result = await withConnectionErrorHandling(
    () => prisma.user_insights.create({
      data: {
        user_id: userId,
        insight_text: insight,
        related_theme: category || null,
        importance: confidence || 5,
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
  try { toolCalls.inc({ tool_name: 'storeInsight', status: 'ok' }); } catch {}

  // Upsert to vector store
  const record = {
    id: result.data?.id || `tmp-${Date.now()}`,
    userId,
    namespace: 'insight',
    content: insight,
    metadata: { category, confidence, sessionId },
  } as const;
  await enqueueEmbeddingUpsert(record);

  return {
    success: true,
    insightId: result.data?.id || 'temp-id',
    message: 'Insight stored successfully'
  };
}

async function logMoodTrend(args: any) {
  const { userId, moodScore, emotionalState, notes } = LogMoodTrendToolSchema.parse(args);
  // Optional dedupe: if same mood score + label in short window
  const dupTrend = await prisma.user_emotional_trends.findFirst({
    where: {
      user_id: userId,
      mood_score: moodScore,
      mood_label: emotionalState ?? null,
      created_at: { gte: new Date(Date.now() - DEDUPE_WINDOW_MS) },
    }
  }).catch(() => null);
  if (dupTrend) {
    logger.info('Duplicate mood trend suppressed', { userId });
    try { toolCalls.inc({ tool_name: 'logMoodTrend', status: 'deduped' }); } catch {}
    return { success: true, trendId: dupTrend.id, message: 'Duplicate suppressed' };
  }
  
  const newTrend = await prisma.user_emotional_trends.create({
    data: {
      user_id: userId,
      mood_score: moodScore,
      mood_label: emotionalState || null,
      notes: notes || null
    }
  });

  logger.info('Mood trend logged', { userId, trendId: newTrend.id, moodScore });
  try { toolCalls.inc({ tool_name: 'logMoodTrend', status: 'ok' }); } catch {}

  return {
    success: true,
    trendId: newTrend.id,
    message: 'Mood trend logged successfully'
  };
}

async function storeInnerPart(args: any) {
  const { userId, name, role, tone, description } = StoreInnerPartToolSchema.parse(args);
  const dup = await prisma.user_inner_parts.findFirst({
    where: {
      user_id: userId,
      name,
      role: role ?? undefined,
      tone: tone ?? undefined,
      updated_at: { gte: new Date(Date.now() - DEDUPE_WINDOW_MS) },
    }
  }).catch(() => null);
  if (dup) {
    logger.info('Duplicate inner part suppressed', { userId, name });
    try { toolCalls.inc({ tool_name: 'storeInnerPart', status: 'deduped' }); } catch {}
    return { success: true, innerPartId: dup.id, message: 'Duplicate suppressed' };
  }
  
  const newInnerPart = await prisma.user_inner_parts.create({
    data: {
      user_id: userId,
      name: name,
      role: role || null,
      tone: tone || null,
      description: description || null
    }
  });

  logger.info('Inner part stored', { userId, innerPartId: newInnerPart.id, name });
  try { toolCalls.inc({ tool_name: 'storeInnerPart', status: 'ok' }); } catch {}

  // Upsert to vector store
  const toEmbed = `${name ?? ''} ${role ?? ''} ${tone ?? ''} ${description ?? ''}`.trim();
  const record = {
    id: newInnerPart.id,
    userId,
    namespace: 'inner_part',
    content: toEmbed,
    metadata: { role, tone },
  } as const;
  await enqueueEmbeddingUpsert(record);

  return {
    success: true,
    innerPartId: newInnerPart.id,
    message: 'Inner part stored successfully'
  };
} 

async function storeGoal(args: any) {
  const { userId, title, description, category, priority } = StoreGoalToolSchema.parse(args);
  const dup = await prisma.user_goals.findFirst({
    where: {
      user_id: userId,
      goal_title: title,
      goal_description: description ?? null,
      created_at: { gte: new Date(Date.now() - DEDUPE_WINDOW_MS) },
    }
  }).catch(() => null);
  if (dup) {
    logger.info('Duplicate goal suppressed', { userId, title });
    try { toolCalls.inc({ tool_name: 'storeGoal', status: 'deduped' }); } catch {}
    return { success: true, goalId: dup.id, message: 'Duplicate suppressed' };
  }
  const goal = await prisma.user_goals.create({
    data: {
      user_id: userId,
      goal_title: title,
      goal_description: description ?? null,
      goal_category: category ?? null,
      priority_level: priority ?? 3,
    }
  });
  const content = `${title} ${description ?? ''}`.trim();
  await enqueueEmbeddingUpsert({ id: goal.id, userId, namespace: 'insight', content, metadata: { type: 'goal', category, priority } });
  logger.info('Goal stored', { userId, goalId: goal.id });
  return { success: true, goalId: goal.id };
}

async function storeCopingTool(args: any) {
  const { userId, name, category, effectiveness, description, when_to_use } = StoreCopingToolSchema.parse(args);
  // Check for exact duplicate (same name) - but allow different coping tools
  const dup = await prisma.user_coping_tools.findFirst({
    where: {
      user_id: userId,
      tool_name: name,
      created_at: { gte: new Date(Date.now() - DEDUPE_WINDOW_MS) },
    }
  }).catch(() => null);
  if (dup) {
    logger.info('Duplicate coping tool suppressed', { userId, name });
    try { toolCalls.inc({ tool_name: 'storeCopingTool', status: 'deduped' }); } catch {}
    return { success: true, copingToolId: dup.id, message: 'Duplicate suppressed' };
  }
  const tool = await prisma.user_coping_tools.create({
    data: {
      user_id: userId,
      tool_name: name,
      tool_category: category ?? null,
      effectiveness_rating: effectiveness ?? null,
      description: description ?? null,
      when_to_use: when_to_use ?? null,
    }
  });
  const content = `${name} ${category ?? ''} ${description ?? ''}`.trim();
  await enqueueEmbeddingUpsert({ id: tool.id, userId, namespace: 'insight', content, metadata: { type: 'coping_tool', category, effectiveness } });
  logger.info('Coping tool stored', { userId, copingToolId: tool.id });
  return { success: true, copingToolId: tool.id };
}

async function storeMantra(args: any) {
  const { userId, text, source, tags } = StoreMantraToolSchema.parse(args);
  const dup = await prisma.user_mantras.findFirst({
    where: { user_id: userId, text, created_at: { gte: new Date(Date.now() - DEDUPE_WINDOW_MS) } }
  }).catch(() => null);
  if (dup) {
    logger.info('Duplicate mantra suppressed', { userId });
    try { toolCalls.inc({ tool_name: 'storeMantra', status: 'deduped' }); } catch {}
    return { success: true, mantraId: dup.id, message: 'Duplicate suppressed' };
  }
  const mantra = await prisma.user_mantras.create({
    data: {
      user_id: userId,
      text,
      source: source ?? null,
      tags: tags ?? [],
    }
  });
  await enqueueEmbeddingUpsert({ id: mantra.id, userId, namespace: 'insight', content: text, metadata: { type: 'mantra', source, tags } });
  logger.info('Mantra stored', { userId, mantraId: mantra.id });
  return { success: true, mantraId: mantra.id };
}

async function storePreferences(args: any) {
  const { userId, preferences } = StorePreferenceToolSchema.parse(args);
  const existing = await prisma.user_therapy_preferences.findUnique({ where: { user_id: userId } });
  if (existing) {
    await prisma.user_therapy_preferences.update({
      where: { user_id: userId },
      data: {
        preferred_therapy_styles: preferences.preferred_therapy_styles ?? existing.preferred_therapy_styles,
        preferred_tone: preferences.preferred_tone ?? existing.preferred_tone,
        communication_style: preferences.communication_style ?? existing.communication_style,
      }
    });
  } else {
    await prisma.user_therapy_preferences.create({
      data: {
        user_id: userId,
        preferred_therapy_styles: preferences.preferred_therapy_styles ?? [],
        preferred_tone: preferences.preferred_tone ?? null,
        communication_style: preferences.communication_style ?? null,
      }
    });
  }
  logger.info('Preferences updated', { userId });
  return { success: true };
}

async function memorySearch(args: any) {
  const { userId, query, namespace, topK } = MemorySearchToolSchema.parse(args);
  const embedding = await embedText(query);
  if (!embedding) return { success: true, results: [] };
  const results = await getVectorStore().query(userId, namespace, embedding, topK);
  return { success: true, results };
}

async function storeRelationship(args: any) {
  const { userId, name, role, notes } = StoreRelationshipToolSchema.parse(args);
  const dup = await prisma.user_relationships.findFirst({
    where: { user_id: userId, name, created_at: { gte: new Date(Date.now() - DEDUPE_WINDOW_MS) } }
  }).catch(() => null);
  if (dup) {
    try { toolCalls.inc({ tool_name: 'storeRelationship', status: 'deduped' }); } catch {}
    return { success: true, relationshipId: dup.id, message: 'Duplicate suppressed' };
  }
  const r = await prisma.user_relationships.create({
    data: { user_id: userId, name, role: role ?? null, notes: notes ?? null }
  });
  const content = `${name} ${role ?? ''} ${notes ?? ''}`.trim();
  await enqueueEmbeddingUpsert({ id: r.id, userId, namespace: 'insight', content, metadata: { type: 'relationship', role } });
  return { success: true, relationshipId: r.id };
}

async function storeTheme(args: any) {
  const { userId, theme, category, importance } = StoreThemeToolSchema.parse(args);
  const dup = await prisma.user_themes.findFirst({
    where: { user_id: userId, theme_name: theme, created_at: { gte: new Date(Date.now() - DEDUPE_WINDOW_MS) } }
  }).catch(() => null);
  if (dup) {
    try { toolCalls.inc({ tool_name: 'storeTheme', status: 'deduped' }); } catch {}
    return { success: true, themeId: dup.id, message: 'Duplicate suppressed' };
  }
  const t = await prisma.user_themes.create({
    data: { user_id: userId, theme_name: theme, theme_category: category ?? null, importance_level: importance ?? 5 }
  });
  const content = `${theme} ${category ?? ''}`.trim();
  await enqueueEmbeddingUpsert({ id: t.id, userId, namespace: 'insight', content, metadata: { type: 'theme', category, importance } });
  return { success: true, themeId: t.id };
}

async function logFreeJournalEntry(args: any) {
  const { userId, entry, tags, moodScore } = LogFreeJournalEntryToolSchema.parse(args);
  const dup = await prisma.user_free_journal_entries.findFirst({
    where: { user_id: userId, entry_text: entry, created_at: { gte: new Date(Date.now() - DEDUPE_WINDOW_MS) } }
  }).catch(() => null);
  if (dup) {
    try { toolCalls.inc({ tool_name: 'logFreeJournalEntry', status: 'deduped' }); } catch {}
    return { success: true, journalEntryId: dup.id, message: 'Duplicate suppressed' };
  }
  const j = await prisma.user_free_journal_entries.create({
    data: { user_id: userId, entry_text: entry, tags: tags ?? [], mood_score: moodScore ?? null }
  });
  await enqueueEmbeddingUpsert({ id: j.id, userId, namespace: 'journal', content: entry, metadata: { tags, moodScore } });
  return { success: true, journalEntryId: j.id };
}

async function storeGrowthMilestone(args: any) {
  const { userId, milestone, category, date, lessons } = StoreGrowthMilestoneToolSchema.parse(args);
  const dup = await prisma.user_growth_milestones.findFirst({
    where: { user_id: userId, milestone_title: milestone, created_at: { gte: new Date(Date.now() - DEDUPE_WINDOW_MS) } }
  }).catch(() => null);
  if (dup) {
    try { toolCalls.inc({ tool_name: 'storeGrowthMilestone', status: 'deduped' }); } catch {}
    return { success: true, milestoneId: dup.id, message: 'Duplicate suppressed' };
  }
  const m = await prisma.user_growth_milestones.create({
    data: {
      user_id: userId,
      milestone_title: milestone,
      milestone_description: lessons ?? null,
      category: category ?? null,
      date_achieved: date ? new Date(date) : null,
    }
  });
  const content = `${milestone} ${lessons ?? ''}`.trim();
  await enqueueEmbeddingUpsert({ id: m.id, userId, namespace: 'insight', content, metadata: { type: 'milestone', category, date } });
  return { success: true, milestoneId: m.id };
}

async function flagCrisis(args: any) {
  const { userId, sessionId, flagType } = FlagCrisisToolSchema.parse(args);
  const c = await prisma.user_crisis_flags.create({
    data: { user_id: userId, session_id: sessionId ?? null, flag_type: flagType }
  });
  logger.warn('Crisis flag created', { userId, sessionId, flagId: c.id, flagType });
  return { success: true, crisisFlagId: c.id };
}

async function storeRiskFactor(args: any) {
  const { userId, name, category, severity, triggers, warningSigns, safetyPlan } = StoreRiskFactorToolSchema.parse(args);
  const r = await prisma.user_risk_factors.create({
    data: {
      user_id: userId,
      risk_factor_name: name,
      risk_category: category ?? null,
      severity_level: severity ?? null,
      triggers: triggers ?? [],
      warning_signs: warningSigns ?? [],
      safety_plan: safetyPlan ?? null,
    }
  });
  return { success: true, riskFactorId: r.id };
}

async function setValuesCompass(args: any) {
  const { userId, coreValues, antiValues, narrative } = SetValuesCompassToolSchema.parse(args);
  const existing = await prisma.user_value_compass.findUnique({ where: { user_id: userId } });
  if (existing) {
    await prisma.user_value_compass.update({
      where: { user_id: userId },
      data: {
        core_values: coreValues ?? existing.core_values,
        anti_values: antiValues ?? existing.anti_values,
        narrative: narrative ?? existing.narrative,
        last_reflected_at: new Date(),
      }
    });
  } else {
    await prisma.user_value_compass.create({
      data: {
        user_id: userId,
        core_values: coreValues ?? [],
        anti_values: antiValues ?? [],
        narrative: narrative ?? null,
        last_reflected_at: new Date(),
      }
    });
  }
  return { success: true };
}

async function updateAIPreferences(args: any) {
  const { userId, preferences } = UpdateAIPreferencesToolSchema.parse(args);
  const existing = await prisma.user_ai_preferences.findUnique({ where: { user_id: userId } });
  const mapped = {
    ai_voice_style: preferences.ai_voice_style ?? null,
    growth_vs_support: preferences.growth_vs_support ?? null,
    pushback_level: preferences.pushback_level ?? null,
    self_awareness_level: preferences.self_awareness_level ?? null,
    goal_modeling_level: preferences.goal_modeling_level ?? null,
    therapeutic_approach: preferences.therapeutic_approach ?? null,
    validation_vs_challenge: preferences.validation_vs_challenge ?? null,
    directness_level: preferences.directness_level ?? null,
    emotional_tone: preferences.emotional_tone ?? null,
    reflection_depth: preferences.reflection_depth ?? null,
    memory_recall_frequency: preferences.memory_recall_frequency ?? null,
    goal_focus_level: preferences.goal_focus_level ?? null,
    session_length_preference: preferences.session_length_preference ?? null,
    voice_output_style: preferences.voice_output_style ?? null,
    check_in_frequency: preferences.check_in_frequency ?? null,
    crisis_sensitivity_level: preferences.crisis_sensitivity_level ?? null,
    preferred_language: preferences.preferred_language ?? null,
    notes: preferences.notes ?? null,
  };
  if (existing) {
    await prisma.user_ai_preferences.update({ where: { user_id: userId }, data: mapped as any });
  } else {
    await prisma.user_ai_preferences.create({ data: { user_id: userId, ...(mapped as any) } });
  }
  return { success: true };
}

async function createDailyPractice(args: any) {
  const { userId, practiceName, isSuggested, isPinned } = CreateDailyPracticeToolSchema.parse(args);
  const p = await prisma.user_daily_practices.create({
    data: {
      user_id: userId,
      source: 'ai',
      prompt_text: practiceName,
      is_suggested: isSuggested ?? false,
      is_pinned: isPinned ?? false,
    }
  });
  return { success: true, practiceId: p.id };
}

async function logDailyPractice(args: any) {
  const { userId, practiceId, practiceName, date, moodBefore, moodAfter, reflection } = LogDailyPracticeToolSchema.parse(args);
  let pid = practiceId || null;
  if (!pid && practiceName) {
    const p = await prisma.user_daily_practices.create({ data: { user_id: userId, source: 'ai', prompt_text: practiceName } });
    pid = p.id;
  }
  if (!pid) {
    throw new Error('practiceId or practiceName is required');
  }
  const log = await prisma.user_daily_practice_logs.create({
    data: {
      user_id: userId,
      practice_id: pid,
      date: date ? new Date(date) : new Date(),
      mood_before: moodBefore ?? null,
      mood_after: moodAfter ?? null,
      reflection: reflection ?? null,
    }
  });
  // Also update streaks for this practice type/name
  if (practiceName) {
    await updateHabitStreak({ userId, habitType: practiceName, completedDate: date });
  }
  return { success: true, practiceLogId: log.id };
}

async function updateHabitStreak(args: any) {
  const { userId, habitType, completedDate } = UpdateHabitStreakToolSchema.parse(args);
  const date = completedDate ? new Date(completedDate) : new Date();
  const existing = await prisma.user_habit_streaks.findFirst({ where: { user_id: userId, habit_type: habitType } });
  if (!existing) {
    const created = await prisma.user_habit_streaks.create({
      data: { user_id: userId, habit_type: habitType, current_streak: 1, longest_streak: 1, last_entry: date }
    });
    return { success: true, streakId: created.id, current: 1 };
  }
  const last = existing.last_entry ? new Date(existing.last_entry) : null;
  let current = existing.current_streak || 0;
  if (last) {
    const diffDays = Math.floor((date.setHours(0,0,0,0) as unknown as number - new Date(last).setHours(0,0,0,0)) / (1000*60*60*24));
    if (diffDays === 1) current += 1;
    else if (diffDays > 1) current = 1;
  } else {
    current = 1;
  }
  const longest = Math.max(existing.longest_streak || 0, current);
  const updated = await prisma.user_habit_streaks.update({
    where: { id: existing.id },
    data: { current_streak: current, longest_streak: longest, last_entry: date }
  });
  return { success: true, streakId: updated.id, current, longest };
}

async function suggestNextStep(args: any) {
  const { userId, insight, goalTitle, goalDescription, mantra, copingToolName, practiceName, theme } = SuggestNextStepToolSchema.parse(args);
  const results: Record<string, any> = {};
  if (insight) {
    results['insight'] = await storeInsight({ userId, insight });
  }
  if (theme) {
    results['theme'] = await storeTheme({ userId, theme });
  }
  if (goalTitle) {
    results['goal'] = await storeGoal({ userId, title: goalTitle, description: goalDescription });
  }
  if (mantra) {
    results['mantra'] = await storeMantra({ userId, text: mantra });
  }
  if (copingToolName) {
    results['coping_tool'] = await storeCopingTool({ userId, name: copingToolName });
  }
  if (practiceName) {
    results['practice'] = await createDailyPractice({ userId, practiceName });
  }
  return { success: true, results };
}

async function storeShadowTheme(args: any) {
  const { userId, themeName, themeDescription, triggers, avoidanceBehaviors, integrationStrategies } = StoreShadowThemeToolSchema.parse(args);
  const dup = await prisma.user_shadow_themes.findFirst({
    where: { user_id: userId, theme_name: themeName, created_at: { gte: new Date(Date.now() - DEDUPE_WINDOW_MS) } }
  }).catch(() => null);
  if (dup) {
    try { toolCalls.inc({ tool_name: 'storeShadowTheme', status: 'deduped' }); } catch {}
    return { success: true, shadowThemeId: dup.id, message: 'Duplicate suppressed' };
  }
  const st = await prisma.user_shadow_themes.create({
    data: {
      user_id: userId,
      theme_name: themeName,
      theme_description: themeDescription ?? null,
      triggers: triggers ?? [],
      avoidance_behaviors: avoidanceBehaviors ?? [],
      integration_strategies: integrationStrategies ?? [],
    }
  });
  const content = `${themeName} ${themeDescription ?? ''}`.trim();
  await enqueueEmbeddingUpsert({ id: st.id, userId, namespace: 'insight', content, metadata: { type: 'shadow_theme', triggers, avoidanceBehaviors } });
  return { success: true, shadowThemeId: st.id };
}

async function storePatternLoop(args: any) {
  const { userId, loopName, triggerSituation, automaticResponse, consequences, alternativeResponses } = StorePatternLoopToolSchema.parse(args);
  const dup = await prisma.user_pattern_loops.findFirst({
    where: { user_id: userId, loop_name: loopName, created_at: { gte: new Date(Date.now() - DEDUPE_WINDOW_MS) } }
  }).catch(() => null);
  if (dup) {
    try { toolCalls.inc({ tool_name: 'storePatternLoop', status: 'deduped' }); } catch {}
    return { success: true, patternLoopId: dup.id, message: 'Duplicate suppressed' };
  }
  const pl = await prisma.user_pattern_loops.create({
    data: {
      user_id: userId,
      loop_name: loopName,
      trigger_situation: triggerSituation ?? null,
      automatic_response: automaticResponse ?? null,
      consequences: consequences ?? null,
      alternative_responses: alternativeResponses ?? [],
    }
  });
  const content = `${loopName} ${triggerSituation ?? ''} ${automaticResponse ?? ''} ${consequences ?? ''}`.trim();
  await enqueueEmbeddingUpsert({ id: pl.id, userId, namespace: 'insight', content, metadata: { type: 'pattern_loop' } });
  return { success: true, patternLoopId: pl.id };
}

async function storeRegulationStrategy(args: any) {
  const { userId, strategyName, strategyType, when_to_use, effectiveness, notes } = StoreRegulationStrategyToolSchema.parse(args);
  const dup = await prisma.user_regulation_strategies.findFirst({
    where: { user_id: userId, strategy_name: strategyName, created_at: { gte: new Date(Date.now() - DEDUPE_WINDOW_MS) } }
  }).catch(() => null);
  if (dup) {
    try { toolCalls.inc({ tool_name: 'storeRegulationStrategy', status: 'deduped' }); } catch {}
    return { success: true, regulationStrategyId: dup.id, message: 'Duplicate suppressed' };
  }
  const rs = await prisma.user_regulation_strategies.create({
    data: {
      user_id: userId,
      strategy_name: strategyName,
      strategy_type: strategyType ?? null,
      when_to_use: when_to_use ?? null,
      effectiveness_rating: effectiveness ?? null,
      notes: notes ?? null,
    }
  });
  const content = `${strategyName} ${strategyType ?? ''} ${when_to_use ?? ''}`.trim();
  await enqueueEmbeddingUpsert({ id: rs.id, userId, namespace: 'insight', content, metadata: { type: 'regulation_strategy', effectiveness } });
  return { success: true, regulationStrategyId: rs.id };
}

async function storeDysregulatingFactor(args: any) {
  const { userId, factorName, factorType, impactLevel, triggers, copingStrategies } = StoreDysregulatingFactorToolSchema.parse(args);
  const dup = await prisma.user_dysregulating_factors.findFirst({
    where: { user_id: userId, factor_name: factorName, created_at: { gte: new Date(Date.now() - DEDUPE_WINDOW_MS) } }
  }).catch(() => null);
  if (dup) {
    try { toolCalls.inc({ tool_name: 'storeDysregulatingFactor', status: 'deduped' }); } catch {}
    return { success: true, dysregulatingFactorId: dup.id, message: 'Duplicate suppressed' };
  }
  const df = await prisma.user_dysregulating_factors.create({
    data: {
      user_id: userId,
      factor_name: factorName,
      factor_type: factorType ?? null,
      impact_level: impactLevel ?? null,
      triggers: triggers ?? [],
      coping_strategies: copingStrategies ?? [],
    }
  });
  const content = `${factorName} ${factorType ?? ''}`.trim();
  await enqueueEmbeddingUpsert({ id: df.id, userId, namespace: 'insight', content, metadata: { type: 'dysregulating_factor', impactLevel } });
  return { success: true, dysregulatingFactorId: df.id };
}

async function storeStrength(args: any) {
  const { userId, name, category, confidenceLevel, howDeveloped, howUtilized } = StoreStrengthToolSchema.parse(args);
  const dup = await prisma.user_strengths.findFirst({
    where: { user_id: userId, strength_name: name, created_at: { gte: new Date(Date.now() - DEDUPE_WINDOW_MS) } }
  }).catch(() => null);
  if (dup) {
    try { toolCalls.inc({ tool_name: 'storeStrength', status: 'deduped' }); } catch {}
    return { success: true, strengthId: dup.id, message: 'Duplicate suppressed' };
  }
  const s = await prisma.user_strengths.create({
    data: {
      user_id: userId,
      strength_name: name,
      strength_category: category ?? null,
      confidence_level: confidenceLevel ?? null,
      how_developed: howDeveloped ?? null,
      how_utilized: howUtilized ?? null,
    }
  });
  const content = `${name} ${category ?? ''}`.trim();
  await enqueueEmbeddingUpsert({ id: s.id, userId, namespace: 'insight', content, metadata: { type: 'strength', confidenceLevel } });
  return { success: true, strengthId: s.id };
}

async function storeSupportSystem(args: any) {
  const { userId, personName, relationshipType, supportType, reliabilityLevel, contactInfo } = StoreSupportSystemToolSchema.parse(args);
  const dup = await prisma.user_support_system.findFirst({
    where: { user_id: userId, person_name: personName, created_at: { gte: new Date(Date.now() - DEDUPE_WINDOW_MS) } }
  }).catch(() => null);
  if (dup) {
    try { toolCalls.inc({ tool_name: 'storeSupportSystem', status: 'deduped' }); } catch {}
    return { success: true, supportSystemId: dup.id, message: 'Duplicate suppressed' };
  }
  const u = await prisma.user_support_system.create({
    data: {
      user_id: userId,
      person_name: personName,
      relationship_type: relationshipType ?? null,
      support_type: supportType ?? [],
      reliability_level: reliabilityLevel ?? null,
      contact_info: contactInfo ?? null,
    }
  });
  const content = `${personName} ${relationshipType ?? ''}`.trim();
  await enqueueEmbeddingUpsert({ id: u.id, userId, namespace: 'insight', content, metadata: { type: 'support_system', relationshipType } });
  return { success: true, supportSystemId: u.id };
}