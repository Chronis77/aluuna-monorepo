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

export const MCPSchema = z.object({
  userId: z.string().uuid(),
  profileSummary: MCPUserSummarySchema.nullable().optional(),
  innerParts: z.array(MCPInnerPartSchema).default([]),
  insights: z.array(MCPInsightSchema).default([]),
  emotionalTrends: z.array(MCPMoodTrendSchema).default([]),
  recentSessions: z.array(MCPSessionSchema).default([]),
  currentContext: MCPContextSchema.default({}),
});

export type MCP = z.infer<typeof MCPSchema>;

export type MCPBuildFlags = Record<string, any>;


