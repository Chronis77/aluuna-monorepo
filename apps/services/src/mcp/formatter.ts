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

  if (mcp.goals && mcp.goals.length) {
    const text = mcp.goals
      .slice(0, 10)
      .map(g => `- ${g.title}${g.priority ? ` (p${g.priority})` : ''}${g.status ? ` [${g.status}]` : ''}`)
      .join('\n');
    sections.push(`## GOALS (Top 10)
${text}`);
  }

  if (mcp.themes && mcp.themes.length) {
    const text = mcp.themes
      .slice(0, 10)
      .map(t => `- ${t.name}${t.category ? ` [${t.category}]` : ''}${t.importance ? ` (⭐${t.importance})` : ''}`)
      .join('\n');
    sections.push(`## THEMES (Top 10)
${text}`);
  }

  if (mcp.copingTools && mcp.copingTools.length) {
    const text = mcp.copingTools
      .slice(0, 10)
      .map(c => `- ${c.name}${c.category ? ` [${c.category}]` : ''}${c.effectiveness ? ` (eff ${c.effectiveness}/10)` : ''}${c.when_to_use ? ` — ${c.when_to_use}` : ''}`)
      .join('\n');
    sections.push(`## COPING TOOLS (Top 10)
${text}`);
  }

  if (mcp.mantras && mcp.mantras.length) {
    const text = mcp.mantras
      .slice(0, 8)
      .map(m => `- ${m.text}${m.source ? ` — ${m.source}` : ''}`)
      .join('\n');
    sections.push(`## MANTRAS (Top 8)
${text}`);
  }

  if (mcp.valueCompass) {
    const v = mcp.valueCompass;
    const values = (v.core_values || []).slice(0, 6).join(', ');
    const anti = (v.anti_values || []).slice(0, 4).join(', ');
    sections.push(`## VALUES COMPASS
Core: ${values || '—'}
Anti: ${anti || '—'}${v.narrative ? `\nNarrative: ${v.narrative}` : ''}`);
  }

  if (mcp.aiPreferences) {
    const p = mcp.aiPreferences;
    const prefs = [
      p.therapeutic_approach && `approach=${p.therapeutic_approach}`,
      p.emotional_tone && `tone=${p.emotional_tone}`,
      p.directness_level && `directness=${p.directness_level}`,
      p.validation_vs_challenge && `validation_vs_challenge=${p.validation_vs_challenge}`,
      p.pushback_level && `pushback=${p.pushback_level}`,
    ].filter(Boolean).join(', ');
    if (prefs)
      sections.push(`## AI PREFERENCES
${prefs}`);
  }

  if (mcp.relationships && mcp.relationships.length) {
    const text = mcp.relationships
      .slice(0, 8)
      .map(r => `- ${r.name}${r.relationship_type ? ` (${r.relationship_type})` : ''}${r.notes ? ` — ${r.notes}` : ''}`)
      .join('\n');
    sections.push(`## RELATIONSHIPS (Top 8)
${text}`);
  }

  if (mcp.milestones && mcp.milestones.length) {
    const text = mcp.milestones
      .slice(0, 8)
      .map(m => `- ${safeDate(m.date)}: ${m.title}${m.category ? ` [${m.category}]` : ''}`)
      .join('\n');
    sections.push(`## GROWTH MILESTONES (Top 8)
${text}`);
  }

  if (mcp.journalEntries && mcp.journalEntries.length) {
    const text = mcp.journalEntries
      .slice(0, 6)
      .map(j => `- ${safeDate(j.created_at)}: ${j.text.slice(0, 120)}${j.mood_score ? ` (mood ${j.mood_score})` : ''}`)
      .join('\n');
    sections.push(`## JOURNAL (Last 6)
${text}`);
  }

  if (mcp.shadowThemes && mcp.shadowThemes.length) {
    const text = mcp.shadowThemes
      .slice(0, 6)
      .map(s => `- ${s.name}${s.description ? ` — ${s.description}` : ''}`)
      .join('\n');
    sections.push(`## SHADOW THEMES (Top 6)
${text}`);
  }

  if (mcp.patternLoops && mcp.patternLoops.length) {
    const text = mcp.patternLoops
      .slice(0, 6)
      .map(p => `- ${p.name}${p.trigger ? ` [trigger: ${p.trigger}]` : ''}${p.automatic_response ? ` → ${p.automatic_response}` : ''}`)
      .join('\n');
    sections.push(`## PATTERN LOOPS (Top 6)
${text}`);
  }

  if (mcp.regulationStrategies && mcp.regulationStrategies.length) {
    const text = mcp.regulationStrategies
      .slice(0, 8)
      .map(r => `- ${r.name}${r.type ? ` [${r.type}]` : ''}${r.when_to_use ? ` — ${r.when_to_use}` : ''}${r.effectiveness ? ` (eff ${r.effectiveness}/10)` : ''}`)
      .join('\n');
    sections.push(`## REGULATION STRATEGIES (Top 8)
${text}`);
  }

  if (mcp.dysregulatingFactors && mcp.dysregulatingFactors.length) {
    const text = mcp.dysregulatingFactors
      .slice(0, 8)
      .map(d => `- ${d.name}${d.type ? ` [${d.type}]` : ''}${(d.triggers || []).length ? ` — triggers: ${(d.triggers || []).slice(0,3).join(', ')}` : ''}`)
      .join('\n');
    sections.push(`## DYSREGULATING FACTORS (Top 8)
${text}`);
  }

  if (mcp.strengths && mcp.strengths.length) {
    const text = mcp.strengths
      .slice(0, 8)
      .map(s => `- ${s.name}${s.category ? ` [${s.category}]` : ''}${s.confidence_level ? ` (conf ${s.confidence_level}/10)` : ''}`)
      .join('\n');
    sections.push(`## STRENGTHS (Top 8)
${text}`);
  }

  if (mcp.supportSystem && mcp.supportSystem.length) {
    const text = mcp.supportSystem
      .slice(0, 8)
      .map(s => `- ${s.person_name}${s.relationship_type ? ` (${s.relationship_type})` : ''}`)
      .join('\n');
    sections.push(`## SUPPORT SYSTEM (Top 8)
${text}`);
  }

  if (mcp.dailyPractices && mcp.dailyPractices.length) {
    const text = mcp.dailyPractices
      .slice(0, 6)
      .map(p => `- ${p.text}${p.is_pinned ? ' [pinned]' : ''}${p.is_suggested ? ' [suggested]' : ''}`)
      .join('\n');
    sections.push(`## DAILY PRACTICES (Top 6)
${text}`);
  }

  if (mcp.habitStreaks && mcp.habitStreaks.length) {
    const text = mcp.habitStreaks
      .slice(0, 8)
      .map(h => `- ${h.habit_type}: ${h.current_streak ?? 0} (max ${h.longest_streak ?? 0})`)
      .join('\n');
    sections.push(`## HABIT STREAKS (Top 8)
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


