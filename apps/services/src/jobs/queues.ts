import { Queue, Worker, JobsOptions } from 'bullmq';
import { logger } from '../utils/logger.js';
import { embedText } from '../openai/embeddings.js';
import { getVectorStore, VectorRecord } from '../vector/vectorStore.js';

const connection = (() => {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  return { url } as any;
})();

export const embeddingsQueue = new Queue('embeddings', { connection });
export const postSessionQueue = new Queue('postSession', { connection });

// Note: QueueScheduler is optional in BullMQ >=2; delayed/retried jobs are handled by default in many setups

// Workers in-process (can be split to separate service later)
export const embeddingsWorker = new Worker(
  'embeddings',
  async job => {
    if (job.name === 'embedding-upsert') {
      const rec = job.data as VectorRecord & { force?: boolean };
      const text = rec.content;
      const embedding = await embedText(text);
      if (!embedding) {
        logger.warn('Embedding null, skipping vector upsert', { id: rec.id });
        return;
      }
      await getVectorStore().upsert({ ...rec, embedding });
      logger.info('Vector upserted from queue', { id: rec.id, namespace: rec.namespace });
    }
  },
  { connection }
);

export const postSessionWorker = new Worker(
  'postSession',
  async job => {
    // Placeholder for titles, summaries, synthesis, etc.
    logger.info('Post-session job received', { name: job.name, id: job.id });
  },
  { connection }
);

export async function enqueueEmbeddingUpsert(record: VectorRecord, opts?: JobsOptions) {
  await embeddingsQueue.add('embedding-upsert', record, { attempts: 3, backoff: { type: 'exponential', delay: 1000 }, ...opts });
}


