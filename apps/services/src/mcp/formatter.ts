import { MCP } from './types.js';

export function formatMCPForOpenAI(mcp: MCP): string {
  const sections: string[] = [];

  const safeDate = (d: any): string => {
    if (d === null || d === undefined) return '';
    try {
      const date: Date = d instanceof Date ? d : new Date(d as any);
      if (Number.isNaN(date.getTime())) return '';
      const isoStr: string = (date as Date).toISOString();
      const parts: string[] = isoStr.split('T');
      const first: string | undefined = parts[0];
      const day: string = (typeof first === 'string' && first.length > 0) ? first : isoStr;
      return day;
    } catch {
      return '';
    }
  };

  if (mcp.profileSummary) {
    const s = mcp.profileSummary;
    sections.push(`## USER SUMMARY
Suicidal Risk: ${s.suicidal_risk_level ?? 'n/a'}
Sleep Quality: ${s.sleep_quality ?? 'n/a'}
Biggest Challenge: ${s.biggest_challenge ?? 'n/a'}
Biggest Obstacle: ${s.biggest_obstacle ?? 'n/a'}
Motivation: ${s.motivation_for_joining ?? 'n/a'}
Hopes: ${s.hopes_to_achieve ?? 'n/a'}`);
  }

  if (mcp.innerParts.length) {
    const text = mcp.innerParts
      .slice(0, 10)
      .map(p => `- ${p.name}${p.role ? ` (${p.role})` : ''}: ${p.description ?? '—'}${p.tone ? ` [Tone: ${p.tone}]` : ''}`)
      .join('\n');
    sections.push(`## INNER PARTS (Top 10)
${text}`);
  }

  if (mcp.insights.length) {
    const text = mcp.insights
      .slice(0, 15)
      .map(i => `- ${i.text}${i.related_theme ? ` [${i.related_theme}]` : ''}${i.importance ? ` (⭐${i.importance})` : ''}`)
      .join('\n');
    sections.push(`## RECENT INSIGHTS (Top 15)
${text}`);
  }

  if (mcp.emotionalTrends.length) {
    const text = mcp.emotionalTrends
      .slice(0, 10)
      .map(t => `- ${safeDate(t.recorded_at)}: ${t.mood_score}${t.mood_label ? ` (${t.mood_label})` : ''}${t.notes ? ` - ${t.notes}` : ''}`)
      .join('\n');
    sections.push(`## EMOTIONAL TRENDS (Last 10)
${text}`);
  }

  if (mcp.recentSessions.length) {
    const text = mcp.recentSessions
      .slice(0, 5)
      .map(s => `- ${safeDate(s.created_at)}: ${s.summary ? s.summary.slice(0, 120) : 'Session'}`)
      .join('\n');
    sections.push(`## RECENT SESSIONS (Last 5)
${text}`);
  }

  if (mcp.currentContext && Object.keys(mcp.currentContext).length) {
    const text = Object.entries(mcp.currentContext)
      .map(([k, v]) => `${k}: ${String(v)}`)
      .join('\n');
    sections.push(`## CURRENT CONTEXT
${text}`);
  }

  return sections.join('\n\n');
}


