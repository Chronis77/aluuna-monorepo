import { z } from 'zod';

// User input schemas
export const UserInputSchema = z.object({
  user_input: z.string().min(1, 'User input is required'),
  mode: z.enum(['free_journaling', 'daily_check_in', 'crisis_support', 'insight_generation']).optional(),
  mood_score: z.number().min(1).max(10).optional(),
  session_context: z.record(z.any()).optional(),
});

// Memory profile schema
export const MemoryProfileSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string().nullable(),
  age: z.number().nullable(),
  gender: z.string().nullable(),
  occupation: z.string().nullable(),
  location: z.string().nullable(),
  long_term_memory: z.string().nullable(),
  current_context: z.string().nullable(),
  emotional_state: z.string().nullable(),
  recent_events: z.string().nullable(),
  goals: z.string().nullable(),
  challenges: z.string().nullable(),
  coping_strategies: z.string().nullable(),
  support_network: z.string().nullable(),
  triggers: z.string().nullable(),
  patterns: z.string().nullable(),
  progress_notes: z.string().nullable(),
  therapeutic_focus: z.string().nullable(),
  session_preferences: z.string().nullable(),
  communication_style: z.string().nullable(),
  learning_style: z.string().nullable(),
  cultural_background: z.string().nullable(),
  spiritual_beliefs: z.string().nullable(),
  medical_history: z.string().nullable(),
  medications: z.string().nullable(),
  allergies: z.string().nullable(),
  emergency_contact: z.string().nullable(),
  insurance_info: z.string().nullable(),
  payment_method: z.string().nullable(),
  consent_forms: z.string().nullable(),
  privacy_settings: z.string().nullable(),
  notification_preferences: z.string().nullable(),
  accessibility_needs: z.string().nullable(),
  language_preferences: z.string().nullable(),
  timezone: z.string().nullable(),
  availability: z.string().nullable(),
  session_duration: z.string().nullable(),
  session_frequency: z.string().nullable(),
  session_type: z.string().nullable(),
  session_location: z.string().nullable(),
  session_cost: z.string().nullable(),
  session_notes: z.string().nullable(),
  session_goals: z.string().nullable(),
  session_outcomes: z.string().nullable(),
  session_feedback: z.string().nullable(),
  session_rating: z.number().nullable(),
  session_duration_actual: z.number().nullable(),
  session_start_time: z.date().nullable(),
  session_end_time: z.date().nullable(),
  session_status: z.string().nullable(),
  session_type_actual: z.string().nullable(),
  session_location_actual: z.string().nullable(),
  session_cost_actual: z.string().nullable(),
  session_notes_actual: z.string().nullable(),
  session_goals_actual: z.string().nullable(),
  session_outcomes_actual: z.string().nullable(),
  session_feedback_actual: z.string().nullable(),
  session_rating_actual: z.number().nullable(),
  session_duration_planned: z.number().nullable(),
  session_start_time_planned: z.date().nullable(),
  session_end_time_planned: z.date().nullable(),
  session_status_planned: z.string().nullable(),
  session_type_planned: z.string().nullable(),
  session_location_planned: z.string().nullable(),
  session_cost_planned: z.string().nullable(),
  session_notes_planned: z.string().nullable(),
  session_goals_planned: z.string().nullable(),
  session_outcomes_planned: z.string().nullable(),
  session_feedback_planned: z.string().nullable(),
  session_rating_planned: z.number().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
});

// Inner part schema
export const InnerPartSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string(),
  role: z.string(),
  tone: z.string(),
  description: z.string(),
  conversation_message_id: z.string().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
});

// Insight schema
export const InsightSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  insight: z.string(),
  category: z.string().nullable(),
  confidence: z.number().nullable(),
  conversation_message_id: z.string().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
});

// Emotional trend schema
export const EmotionalTrendSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  mood_score: z.number(),
  emotional_state: z.string().nullable(),
  notes: z.string().nullable(),
  conversation_message_id: z.string().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
});

// MCP (Model Context Protocol) schema
export const MCPSchema = z.object({
  userId: z.string(),
  memoryProfile: MemoryProfileSchema.nullable(),
  innerParts: z.array(InnerPartSchema),
  insights: z.array(InsightSchema),
  emotionalTrends: z.array(EmotionalTrendSchema),
  recentSessions: z.array(z.any()),
  currentContext: z.record(z.any()).optional(),
});

// Tool schemas for OpenAI function calling
export const GetMemoryProfileToolSchema = z.object({
  userId: z.string().describe('The user ID to get memory profile for'),
});

export const StoreInsightToolSchema = z.object({
  userId: z.string().describe('The user ID to store insight for'),
  insight: z.string().describe('The insight text to store'),
  category: z.string().optional().describe('The category of the insight'),
  confidence: z.number().optional().describe('Confidence score for the insight (0-1)'),
  sessionId: z.string().optional().describe('The conversation message ID this insight is related to'),
});

export const LogMoodTrendToolSchema = z.object({
  userId: z.string().describe('The user ID to log mood trend for'),
  moodScore: z.number().min(1).max(10).describe('The mood score (1-10)'),
  emotionalState: z.string().optional().describe('The emotional state description'),
  notes: z.string().optional().describe('Additional notes about the mood'),
  sessionId: z.string().optional().describe('The conversation message ID this mood is related to'),
});

export const StoreInnerPartToolSchema = z.object({
  userId: z.string().describe('The user ID to store inner part for'),
  name: z.string().describe('The name of the inner part'),
  role: z.string().describe('The role of the inner part'),
  tone: z.string().describe('The tone of the inner part'),
  description: z.string().describe('The description of the inner part'),
  sessionId: z.string().optional().describe('The conversation message ID this inner part is related to'),
});

// Response schemas
export const GPTResponseSchema = z.object({
  gpt_response: z.string().describe('The main GPT response text'),
  insights: z.array(z.string()).optional().describe('List of insights generated'),
  tts_url: z.string().optional().describe('URL to TTS audio file'),
  metadata: z.record(z.any()).optional().describe('Additional metadata'),
});

// Type exports
export type UserInput = z.infer<typeof UserInputSchema>;
export type MemoryProfile = z.infer<typeof MemoryProfileSchema>;
export type InnerPart = z.infer<typeof InnerPartSchema>;
export type Insight = z.infer<typeof InsightSchema>;
export type EmotionalTrend = z.infer<typeof EmotionalTrendSchema>;
export type MCP = z.infer<typeof MCPSchema>;
export type GPTResponse = z.infer<typeof GPTResponseSchema>; 