import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '../../utils/logger.js';

interface PresignInput {
  fileName: string;
  contentType: string;
  maxMb: number;
}

const s3 = new S3Client({
  region: process.env['CLOUDFLARE_R2_REGION'] || 'auto',
  endpoint: process.env['CLOUDFLARE_R2_ENDPOINT'], // e.g., https://<account_id>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env['CLOUDFLARE_R2_ACCESS_KEY_ID'] || '',
    secretAccessKey: process.env['CLOUDFLARE_R2_SECRET_ACCESS_KEY'] || '',
  },
  forcePathStyle: true,
});

export async function getPresignedPutUrl(input: PresignInput) {
  const bucket = process.env['CLOUDFLARE_R2_BUCKET'] as string;
  if (!bucket) {
    throw new Error('CLOUDFLARE_R2_BUCKET is not configured');
  }

  const key = input.fileName.replace(/^\/+/, '');
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: input.contentType,
  });

  // Expire in 15 minutes
  const expiresIn = Number(process.env['VOICE_PRESIGN_EXPIRES_SECONDS'] || 900);
  const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn });

  const cdnBase = process.env['CLOUDFLARE_R2_PUBLIC_BASE_URL']; // e.g., https://cdn.example.com
  const fileUrl = cdnBase ? `${cdnBase.replace(/\/$/, '')}/${key}` : `${process.env['CLOUDFLARE_R2_ENDPOINT']}/${bucket}/${key}`;

  logger.info('Generated Cloudflare R2 presigned URL', { key, contentType: input.contentType });
  return {
    upload_url: uploadUrl,
    file_url: fileUrl,
    expires_in: expiresIn,
    max_mb: input.maxMb,
  };
}

export async function deleteObjectByKey(key: string): Promise<void> {
  const bucket = process.env['CLOUDFLARE_R2_BUCKET'] as string;
  if (!bucket) {
    throw new Error('CLOUDFLARE_R2_BUCKET is not configured');
  }
  const normalizedKey = key.replace(/^\/+/, '');
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: normalizedKey }));
  logger.info('Deleted object from Cloudflare R2', { key: normalizedKey });
}


