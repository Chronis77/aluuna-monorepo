import OpenAI from 'openai';
import { logger } from '../utils/logger.js';

const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';

let openai: OpenAI | null = null;
function getClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  if (!openai) openai = new OpenAI({ apiKey });
  return openai;
}

export async function embedText(text: string): Promise<number[] | null> {
  const client = getClient();
  if (!client) {
    logger.warn('OpenAI API key not set; embeddings disabled');
    return null;
  }
  try {
    const res = await client.embeddings.create({
      input: text,
      model: EMBEDDING_MODEL,
    });
    return res.data[0]?.embedding || null;
  } catch (error) {
    logger.error('Embedding generation failed', { error });
    return null;
  }
}

export async function embedBatch(texts: string[]): Promise<(number[] | null)[]> {
  const client = getClient();
  if (!client) {
    logger.warn('OpenAI API key not set; embeddings disabled');
    return texts.map(() => null);
  }
  try {
    const res = await client.embeddings.create({
      input: texts,
      model: EMBEDDING_MODEL,
    });
    return res.data.map(d => d.embedding ?? null);
  } catch (error) {
    logger.error('Batch embedding generation failed', { error });
    return texts.map(() => null);
  }
}

export function getEmbeddingModel(): string {
  return EMBEDDING_MODEL;
}

export function getEmbeddingDimension(): number {
  switch (EMBEDDING_MODEL) {
    case 'text-embedding-3-large':
      return 3072;
    case 'text-embedding-3-small':
    default:
      return 1536;
  }
}


