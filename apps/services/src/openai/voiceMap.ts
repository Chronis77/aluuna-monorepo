const OPENAI_VOICES = new Set(['verse', 'shimmer', 'alloy', 'sage', 'echo']);

export function mapVoiceIdToOpenAIVoice(voiceId?: string, genderHint?: 'male' | 'female'): string | undefined {
  if (!voiceId) return undefined;
  // If already an OpenAI voice id, pass through
  if (OPENAI_VOICES.has(voiceId)) return voiceId;
  // Legacy mapping fallback if any old ids are present
  switch (voiceId) {
    case 'male-1':
    case 'male-2':
    case 'male-3':
      return 'verse';
    case 'female-1':
      return 'shimmer';
    case 'female-2':
      return 'alloy';
    case 'female-3':
      return 'alloy';
    default:
      return genderHint === 'female' ? 'shimmer' : 'verse';
  }
}


