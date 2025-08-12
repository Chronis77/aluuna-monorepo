import OpenAI from 'openai';
import { MCP } from '../mcp/types.js';
import { logger } from '../utils/logger.js';
import { withTemperatureIfSupported } from './modelCaps.js';

const CHAT_MODEL = process.env['OPENAI_CHAT_MODEL'] || 'gpt-4o-mini';

export type ConversationMode = 'crisis_support' | 'daily_check_in' | 'insight_generation' | 'free';

export async function classifyMode(userMessage: string, mcp: MCP): Promise<{ mode: ConversationMode; confidence: number; reason: string } | null> {
  try {
    const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] });
    const system = `You classify the most appropriate conversation mode.
Return ONLY strict JSON: {"mode":"<one of crisis_support|daily_check_in|insight_generation|free>","confidence":0-1,"reason":"<short>"}.
Rules:
- crisis_support: ONLY for explicit crisis signals in the current message (suicide ideation, self-harm, immediate danger). Do NOT use crisis_support for simple responses like "yes", "ok", "thanks" even if user has historical risk.
- daily_check_in: brief present-focused updates or mood check.
- insight_generation: pattern/theme exploration, meta-reflection, deeper analysis requests.
- free: general journaling or open conversation.
Focus primarily on the current message content, not just background risk level.`;

    const user = `Message: ${userMessage}\nRiskLevel:${mcp.profileSummary?.suicidal_risk_level ?? 'n/a'}\nRecentMood:${mcp.emotionalTrends?.[0]?.mood_score ?? 'n/a'}`;
    if (process.env['LOG_OPENAI'] === 'true') {
      logger.warn('Mode classify preflight', {
        model: CHAT_MODEL,
        userMessageLength: userMessage.length,
      });
    }
    const resp = await openai.chat.completions.create({
      model: CHAT_MODEL,
      ...withTemperatureIfSupported(CHAT_MODEL, 0),
      max_tokens: 120,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });
    const content = resp.choices?.[0]?.message?.content || '';
    if (process.env['LOG_OPENAI'] === 'true') {
      logger.warn('Mode classify response', { contentSnippet: content.slice(0, 200) });
    }
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}');
    const jsonStr = jsonStart >= 0 && jsonEnd >= 0 ? content.slice(jsonStart, jsonEnd + 1) : content;
    const parsed = JSON.parse(jsonStr);
    let mode: string = String(parsed.mode || 'free');
    // normalize synonyms
    if (mode === 'free_journaling' || mode === 'journaling') mode = 'free';
    if (!['crisis_support','daily_check_in','insight_generation','free'].includes(mode)) mode = 'free';
    const confidence = Math.max(0, Math.min(1, Number(parsed.confidence ?? 0.7)));
    const reason = String(parsed.reason || '');
    if (process.env['LOG_OPENAI'] === 'true') {
      logger.warn('Mode classify parsed', { mode, confidence, reasonSnippet: reason.slice(0, 120) });
    }
    return { mode: mode as ConversationMode, confidence, reason };
  } catch (error) {
    logger.error('Mode classification failed', { error });
    return null;
  }
}


