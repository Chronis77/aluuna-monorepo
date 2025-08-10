import { z } from 'zod';

// Core MCP (Memory-Context Profile) model that the AI consumes
// Keep this compact, structured, and stable.
export const MCPInnerPartSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  role: z.string().nullable().optional(),
  tone: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  updated_at: z.date().optional(),
});

export type MCPInnerPart = z.infer<typeof MCPInnerPartSchema>;

export const MCPInsightSchema = z.object({
  id: z.string().uuid().optional(),
  text: z.string(),
  related_theme: z.string().nullable().optional(),
  importance: z.number().int().min(1).max(10).optional(),
  created_at: z.date().optional(),
});

export type MCPInsight = z.infer<typeof MCPInsightSchema>;

export const MCPMoodTrendSchema = z.object({
  id: z.string().uuid().optional(),
  recorded_at: z.date(),
  mood_score: z.number().int().min(1).max(10),
  mood_label: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type MCPMoodTrend = z.infer<typeof MCPMoodTrendSchema>;

export const MCPSessionSchema = z.object({
  id: z.string().uuid(),
  type: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  mood_at_time: z.number().int().min(1).max(10).nullable().optional(),
  created_at: z.date(),
});

export type MCPSession = z.infer<typeof MCPSessionSchema>;

export const MCPUserSummarySchema = z.object({
  user_id: z.string().uuid(),
  suicidal_risk_level: z.number().int().min(0).max(4).nullable().optional(),
  sleep_quality: z.string().nullable().optional(),
  biggest_challenge: z.string().nullable().optional(),
  biggest_obstacle: z.string().nullable().optional(),
  motivation_for_joining: z.string().nullable().optional(),
  hopes_to_achieve: z.string().nullable().optional(),
  mood_score_initial: z.number().int().nullable().optional(),
  updated_at: z.date().optional(),
});

export type MCPUserSummary = z.infer<typeof MCPUserSummarySchema>;

export const MCPContextSchema = z.object({
  // A small, curated set of context flags
  isFirstSession: z.boolean().optional(),
  isDailyCheckin: z.boolean().optional(),
  isCrisis: z.boolean().optional(),
  isDeepWork: z.boolean().optional(),
  timezone: z.string().optional(),
});

export type MCPContext = z.infer<typeof MCPContextSchema>;

// New modular schemas for additional MCP sections
export const MCPGoalSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string(),
  priority: z.number().int().nullable().optional(),
  status: z.string().nullable().optional(),
  updated_at: z.date().optional(),
});
export type MCPGoal = z.infer<typeof MCPGoalSchema>;

export const MCPThemeSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  category: z.string().nullable().optional(),
  importance: z.number().int().nullable().optional(),
});
export type MCPTheme = z.infer<typeof MCPThemeSchema>;

export const MCPCopingToolSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  category: z.string().nullable().optional(),
  effectiveness: z.number().int().nullable().optional(),
  when_to_use: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});
export type MCPCopingTool = z.infer<typeof MCPCopingToolSchema>;

export const MCPMantraSchema = z.object({
  id: z.string().uuid().optional(),
  text: z.string(),
  source: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});
export type MCPMantra = z.infer<typeof MCPMantraSchema>;

export const MCPValueCompassSchema = z.object({
  core_values: z.array(z.string()).optional(),
  anti_values: z.array(z.string()).optional(),
  narrative: z.string().nullable().optional(),
  last_reflected_at: z.date().optional(),
});
export type MCPValueCompass = z.infer<typeof MCPValueCompassSchema>;

export const MCPAIPreferencesSchema = z.object({
  ai_voice_style: z.string().nullable().optional(),
  growth_vs_support: z.string().nullable().optional(),
  pushback_level: z.number().int().nullable().optional(),
  self_awareness_level: z.number().int().nullable().optional(),
  goal_modeling_level: z.number().int().nullable().optional(),
  therapeutic_approach: z.string().nullable().optional(),
  validation_vs_challenge: z.number().int().nullable().optional(),
  directness_level: z.number().int().nullable().optional(),
  emotional_tone: z.string().nullable().optional(),
  reflection_depth: z.number().int().nullable().optional(),
  memory_recall_frequency: z.number().int().nullable().optional(),
  goal_focus_level: z.number().int().nullable().optional(),
  session_length_preference: z.string().nullable().optional(),
  voice_output_style: z.string().nullable().optional(),
  check_in_frequency: z.string().nullable().optional(),
  crisis_sensitivity_level: z.number().int().nullable().optional(),
  preferred_language: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type MCPAIPreferences = z.infer<typeof MCPAIPreferencesSchema>;

export const MCPRelationshipSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  relationship_type: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type MCPRelationship = z.infer<typeof MCPRelationshipSchema>;

export const MCPMilestoneSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string(),
  category: z.string().nullable().optional(),
  date: z.date().nullable().optional(),
});
export type MCPMilestone = z.infer<typeof MCPMilestoneSchema>;

export const MCPJournalEntrySchema = z.object({
  id: z.string().uuid().optional(),
  text: z.string(),
  tags: z.array(z.string()).optional(),
  mood_score: z.number().int().nullable().optional(),
  created_at: z.date().optional(),
});
export type MCPJournalEntry = z.infer<typeof MCPJournalEntrySchema>;

export const MCPShadowThemeSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  description: z.string().nullable().optional(),
  triggers: z.array(z.string()).optional(),
});
export type MCPShadowTheme = z.infer<typeof MCPShadowThemeSchema>;

export const MCPPatternLoopSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  trigger: z.string().nullable().optional(),
  automatic_response: z.string().nullable().optional(),
  consequences: z.string().nullable().optional(),
});
export type MCPPatternLoop = z.infer<typeof MCPPatternLoopSchema>;

export const MCPRegulationStrategySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  type: z.string().nullable().optional(),
  when_to_use: z.string().nullable().optional(),
  effectiveness: z.number().int().nullable().optional(),
});
export type MCPRegulationStrategy = z.infer<typeof MCPRegulationStrategySchema>;

export const MCPDysregulatingFactorSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  type: z.string().nullable().optional(),
  impact_level: z.number().int().nullable().optional(),
  triggers: z.array(z.string()).optional(),
});
export type MCPDysregulatingFactor = z.infer<typeof MCPDysregulatingFactorSchema>;

export const MCPStrengthSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  category: z.string().nullable().optional(),
  confidence_level: z.number().int().nullable().optional(),
});
export type MCPStrength = z.infer<typeof MCPStrengthSchema>;

export const MCPSupportSystemMemberSchema = z.object({
  id: z.string().uuid().optional(),
  person_name: z.string(),
  relationship_type: z.string().nullable().optional(),
  support_type: z.array(z.string()).optional(),
  reliability_level: z.number().int().nullable().optional(),
});
export type MCPSupportSystemMember = z.infer<typeof MCPSupportSystemMemberSchema>;

export const MCPDailyPracticeSchema = z.object({
  id: z.string().uuid().optional(),
  text: z.string(),
  is_suggested: z.boolean().nullable().optional(),
  is_pinned: z.boolean().nullable().optional(),
});
export type MCPDailyPractice = z.infer<typeof MCPDailyPracticeSchema>;

export const MCPHabitStreakSchema = z.object({
  id: z.string().uuid().optional(),
  habit_type: z.string(),
  current_streak: z.number().int().nullable().optional(),
  longest_streak: z.number().int().nullable().optional(),
  last_entry: z.date().nullable().optional(),
});
export type MCPHabitStreak = z.infer<typeof MCPHabitStreakSchema>;

export const MCPSchema = z.object({
  userId: z.string().uuid(),
  profileSummary: MCPUserSummarySchema.nullable().optional(),
  innerParts: z.array(MCPInnerPartSchema).default([]),
  insights: z.array(MCPInsightSchema).default([]),
  emotionalTrends: z.array(MCPMoodTrendSchema).default([]),
  recentSessions: z.array(MCPSessionSchema).default([]),
  currentContext: MCPContextSchema.default({}),
  // Optional sections, only included when data exists
  goals: z.array(MCPGoalSchema).optional(),
  themes: z.array(MCPThemeSchema).optional(),
  copingTools: z.array(MCPCopingToolSchema).optional(),
  mantras: z.array(MCPMantraSchema).optional(),
  valueCompass: MCPValueCompassSchema.nullable().optional(),
  aiPreferences: MCPAIPreferencesSchema.nullable().optional(),
  relationships: z.array(MCPRelationshipSchema).optional(),
  milestones: z.array(MCPMilestoneSchema).optional(),
  journalEntries: z.array(MCPJournalEntrySchema).optional(),
  shadowThemes: z.array(MCPShadowThemeSchema).optional(),
  patternLoops: z.array(MCPPatternLoopSchema).optional(),
  regulationStrategies: z.array(MCPRegulationStrategySchema).optional(),
  dysregulatingFactors: z.array(MCPDysregulatingFactorSchema).optional(),
  strengths: z.array(MCPStrengthSchema).optional(),
  supportSystem: z.array(MCPSupportSystemMemberSchema).optional(),
  dailyPractices: z.array(MCPDailyPracticeSchema).optional(),
  habitStreaks: z.array(MCPHabitStreakSchema).optional(),
});

export type MCP = z.infer<typeof MCPSchema>;

export type MCPBuildFlags = Record<string, any>;


