import { logger } from '../utils/logger.js';

export type OpenAITtsOptions = {
  model?: string;
  voice?: string;
  genderHint?: 'male' | 'female';
  format?: 'mp3' | 'wav' | 'flac' | 'aac' | 'opus';
};

const DEFAULT_MODEL = process.env['OPENAI_TTS_MODEL'] || 'gpt-4o-mini-tts';
const DEFAULT_FORMAT: NonNullable<OpenAITtsOptions['format']> = 'mp3';

// Conservatively define a set of known voice names. If the requested name isn't present,
// we will select a sensible default based on genderHint.
const KNOWN_VOICES = new Set([
  'verse',
  'shimmer',
  'alloy',
  'sage',
  'echo',
]);

function chooseVoice(requestedVoice: string | undefined, genderHint: OpenAITtsOptions['genderHint']): string {
  if (requestedVoice && KNOWN_VOICES.has(requestedVoice)) return requestedVoice;
  // Defaults per gender hint
  if (genderHint === 'female') return 'shimmer';
  return 'verse';
}

export async function synthesizeSpeechOpenAI(text: string, opts: OpenAITtsOptions = {}): Promise<{
  audioBase64: string;
  format: NonNullable<OpenAITtsOptions['format']>;
}> {
  if (!text || text.trim().length === 0) {
    throw new Error('Text is required for TTS');
  }

  const apiKey = process.env['OPENAI_API_KEY'];
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const model = opts.model || DEFAULT_MODEL;
  const format: NonNullable<OpenAITtsOptions['format']> = (opts.format ?? DEFAULT_FORMAT);
  const voice = chooseVoice(opts.voice, opts.genderHint);

  const url = 'https://api.openai.com/v1/audio/speech';

  const payload = {
    model,
    input: text,
    voice,
    format,
  } as const;

  const maxRetries = 3;
  const baseDelayMs = 1000;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const errText = await safeReadText(resp);
        const retryable = resp.status === 429 || resp.status >= 500 || /rate|overload|try again/i.test(errText);
        if (retryable && attempt < maxRetries) {
          const delay = baseDelayMs * Math.pow(2, attempt - 1);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        throw new Error(`OpenAI TTS failed (${resp.status}): ${errText}`);
      }

      // Response is binary audio
      const arrayBuf = await resp.arrayBuffer();
      const audioBase64 = Buffer.from(arrayBuf).toString('base64');
      return { audioBase64, format };
    } catch (error: any) {
      if (attempt === maxRetries) {
        logger.error('OpenAI TTS error', { error: error?.message || String(error) });
        throw error;
      }
    }
  }

  throw new Error('OpenAI TTS failed after retries');
}

async function safeReadText(resp: Response): Promise<string> {
  try {
    return await resp.text();
  } catch {
    return '<no body>';
  }
}


