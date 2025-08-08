import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { Context } from '../context.js';
import { logger } from '../../utils/logger.js';
import { getPresignedPutUrl, deleteObjectByKey } from '../../services/storage/s3.js';
import { enqueueTranscriptionJob, getJobStatus } from '../../queues/voiceQueue.js';
import OpenAI from 'openai';

const t = initTRPC.context<Context>().create();

export const voiceRouter = t.router({
  transcribeQuick: t.procedure
    .input(z.object({
      user_id: z.string(),
      audio_base64: z.string(),
      mime_type: z.string().optional(),
      model: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Initialize to validate presence; requests are made via fetch to avoid SDK multipart
      new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] });
      const maxRetries = 3;
      const baseDelay = 1000;
      let lastErr: any = null;
      const mimeType = input.mime_type ?? 'audio/m4a';
      const ext = /mp4|m4a/i.test(mimeType) ? 'm4a' : 'wav';
      const buffer = Buffer.from(input.audio_base64, 'base64');
      const blob = new Blob([buffer], { type: mimeType });

      const form = new FormData();
      form.append('file', blob, `recording.${ext}`);
      form.append('model', input.model ?? process.env['OPENAI_TRANSCRIBE_MODEL'] ?? 'whisper-1');
      form.append('response_format', 'json');

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${process.env['OPENAI_API_KEY']}` } as any,
            body: form as any,
          });
          if (!resp.ok) {
            const errText = await resp.text();
            const retryable = resp.status >= 500 || resp.status === 429 || /overload|try again/i.test(errText);
            if (retryable && attempt < maxRetries) {
              const delay = baseDelay * Math.pow(2, attempt - 1);
              await new Promise(r => setTimeout(r, delay));
              continue;
            }
            throw new Error(errText);
          }
          const data = await resp.json();
          return { text: data.text || '' };
        } catch (e) {
          lastErr = e;
          if (attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt - 1);
            await new Promise(r => setTimeout(r, delay));
            continue;
          }
        }
      }
      logger.error('transcribeQuick failed', { userId: input.user_id, error: lastErr });
      throw new Error('Transcription failed');
    }),
  getPresignedUpload: t.procedure
    .input(z.object({
      user_id: z.string(),
      file_name: z.string().optional(),
      content_type: z.string().optional(),
      max_mb: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const maxMb = input.max_mb ?? Number(process.env['VOICE_MAX_PAYLOAD_MB'] ?? 200);
        const result = await getPresignedPutUrl({
          fileName: input.file_name ?? `voice/${input.user_id}/${Date.now()}.m4a`,
          contentType: input.content_type ?? 'audio/m4a',
          maxMb,
        });
        return result;
      } catch (error) {
        logger.error('Error generating presigned upload URL', { userId: input.user_id, error });
        throw new Error('Failed to generate upload URL');
      }
    }),

  createJob: t.procedure
    .input(z.object({
      user_id: z.string(),
      audio_url: z.string().url(),
      language: z.string().optional(),
      model: z.string().optional(),
      conversation_id: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const job = await enqueueTranscriptionJob({
          userId: input.user_id,
          audioUrl: input.audio_url,
          ...(input.language ? { language: input.language } : {}),
          ...(input.model ? { model: input.model } : {}),
          ...(input.conversation_id ? { conversationId: input.conversation_id } : {}),
        } as any);
        return { job_id: job.id, state: 'queued' as const };
      } catch (error) {
        logger.error('Error enqueuing transcription job', { userId: input.user_id, error });
        throw new Error('Failed to enqueue transcription job');
      }
    }),

  getJobStatus: t.procedure
    .input(z.object({ job_id: z.string() }))
    .query(async ({ input }) => {
      try {
        const status = await getJobStatus(input.job_id);
        return status;
      } catch (error) {
        logger.error('Error getting transcription job status', { jobId: input.job_id, error });
        throw new Error('Failed to get job status');
      }
    }),

  transcribeFromUrl: t.procedure
    .input(z.object({
      user_id: z.string(),
      audio_url: z.string().url(),
      mime_type: z.string().optional(),
      model: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Fetch audio bytes from R2 public URL
        const resp = await fetch(input.audio_url);
        if (!resp.ok) {
          throw new Error(`Failed to download audio: HTTP ${resp.status}`);
        }
        const mimeType = input.mime_type ?? 'audio/m4a';
        const ext = /mp4|m4a/i.test(mimeType) ? 'm4a' : 'wav';
        // Stream to a Blob without buffering entire file in memory if runtime supports it
        const arrayBuffer = await resp.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: mimeType });

        // Build multipart form-data for OpenAI Whisper
        const form = new FormData();
        form.append('file', blob, `recording.${ext}`);
        form.append('model', input.model ?? process.env['OPENAI_TRANSCRIBE_MODEL'] ?? 'whisper-1');
        form.append('response_format', 'json');

        const maxRetries = 2; // initial attempt + 1 retry
        const baseDelay = 1000;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          const oaiRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${process.env['OPENAI_API_KEY']}` } as any,
            body: form as any,
          });
          if (oaiRes.ok) {
            const data = await oaiRes.json();
            const text: string = data.text || '';
            // Optionally delete the file from R2 after successful transcription (non-empty)
            if (text.trim().length > 0 && process.env['VOICE_DELETE_AFTER_TRANSCRIBE'] === 'true') {
              try {
                // Derive object key from the public URL by stripping the public base URL
                const base = (process.env['CLOUDFLARE_R2_PUBLIC_BASE_URL'] || '').replace(/\/$/, '');
                const key = base && input.audio_url.startsWith(base)
                  ? input.audio_url.slice(base.length + 1)
                  : new URL(input.audio_url).pathname.replace(/^\//, '');
                await deleteObjectByKey(key);
              } catch (delErr) {
                logger.warn('Failed to delete R2 object after transcription', { url: input.audio_url, error: delErr });
              }
            }
            return { text };
          }
          const errText = await oaiRes.text();
          const retryable = oaiRes.status >= 500 || oaiRes.status === 429 || /overload|try again/i.test(errText);
          if (attempt < maxRetries && retryable) {
            const delay = baseDelay * Math.pow(2, attempt - 1);
            await new Promise(r => setTimeout(r, delay));
            continue;
          }
          throw new Error(errText);
        }
        throw new Error('Transcription failed after retries');
      } catch (error) {
        logger.error('Error transcribing from URL', { userId: input.user_id, url: input.audio_url, error });
        throw new Error('Failed to transcribe from URL');
      }
    }),
});


