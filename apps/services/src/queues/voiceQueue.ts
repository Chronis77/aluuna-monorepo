import { logger } from '../utils/logger.js';

export interface TranscriptionJob {
  userId: string;
  audioUrl: string;
  language?: string;
  model?: string;
  conversationId?: string;
}

export async function enqueueTranscriptionJob(job: TranscriptionJob) {
  // Placeholder: In production, push to BullMQ queue with Redis.
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  logger.info('Queued transcription job (placeholder)', { id, job });
  // Return a fake job object so tRPC compiles
  return { id } as const;
}

export async function getJobStatus(jobId: string) {
  // Placeholder status; replace with BullMQ job lookup
  return { job_id: jobId, state: 'queued' as const };
}


