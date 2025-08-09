import { VectorQueryResult, VectorRecord, VectorStore } from './vectorStore.js';
import { logger } from '../utils/logger.js';

type QdrantPayload = Record<string, any>;

interface QdrantPoint {
  id: string;
  vector: number[];
  payload: QdrantPayload;
}

interface QdrantSearchRequest {
  vector: number[];
  limit: number;
  filter?: {
    must?: Array<{ key: string; match: { value: string } } | { key: string; match: { any: string[] } }>;
  };
  with_payload?: boolean;
  with_vector?: boolean;
  score_threshold?: number;
}

export class QdrantVectorStore implements VectorStore {
  private url: string;
  private apiKey?: string;
  private collection: string;

  constructor(params?: { url?: string; apiKey?: string; collection?: string }) {
    this.url = (params?.url || process.env.QDRANT_URL || '').replace(/\/$/, '');
    this.apiKey = params?.apiKey || process.env.QDRANT_API_KEY || undefined;
    this.collection = params?.collection || process.env.QDRANT_COLLECTION || 'aluuna_memory';

    if (!this.url) {
      logger.warn('Qdrant URL not set; QdrantVectorStore will not operate');
    }
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) h['api-key'] = this.apiKey;
    return h;
  }

  async createCollectionIfMissing(dimension: number, distance: 'Cosine' | 'Euclid' | 'Dot' = 'Cosine'): Promise<void> {
    if (!this.url) return;
    try {
      const getRes = await fetch(`${this.url}/collections/${this.collection}`, {
        headers: this.headers(),
      });
      if (getRes.ok) return; // already exists
    } catch {}
    try {
      const createRes = await fetch(`${this.url}/collections/${this.collection}`, {
        method: 'PUT',
        headers: this.headers(),
        body: JSON.stringify({
          vectors: { size: dimension, distance },
          on_disk: true,
          optimizers_config: { default_segment_number: 2 },
          hnsw_config: { m: 16, ef_construct: 100 },
          replication_factor: 1,
          shard_number: 1,
          write_consistency_factor: 1,
          wal_config: { wal_capacity_mb: 64 },
        }),
      });
      if (createRes.status === 409) {
        // Already exists — treat as success to avoid noisy errors
        logger.info('Qdrant collection already exists', { collection: this.collection });
        return;
      }
      if (!createRes.ok) {
        const text = await createRes.text();
        logger.error('Failed to create Qdrant collection', { status: createRes.status, text });
      } else {
        logger.info('Qdrant collection created', { collection: this.collection, dimension, distance });
      }
    } catch (err) {
      logger.error('Error creating Qdrant collection', { err });
    }
  }

  async upsert(record: VectorRecord): Promise<void> {
    if (!this.url || !record.embedding) return;
    const point: QdrantPoint = {
      id: record.id,
      vector: record.embedding,
      payload: {
        userId: record.userId,
        namespace: record.namespace,
        content: record.content,
        ...record.metadata,
      },
    };

    const res = await fetch(`${this.url}/collections/${this.collection}/points?wait=true`, {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify({ points: [point] }),
    });
    if (!res.ok) {
      const text = await res.text();
      logger.error('Qdrant upsert failed', { status: res.status, text });
    }
  }

  async upsertMany(records: VectorRecord[]): Promise<void> {
    if (!this.url) return;
    const points: QdrantPoint[] = records
      .filter(r => !!r.embedding)
      .map(r => ({
        id: r.id,
        vector: r.embedding as number[],
        payload: { userId: r.userId, namespace: r.namespace, content: r.content, ...r.metadata },
      }));
    if (points.length === 0) return;
    const res = await fetch(`${this.url}/collections/${this.collection}/points?wait=true`, {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify({ points }),
    });
    if (!res.ok) {
      const text = await res.text();
      logger.error('Qdrant batch upsert failed', { status: res.status, text });
    }
  }

  async query(userId: string, namespace: string, embedding: number[], topK: number): Promise<VectorQueryResult[]> {
    if (!this.url) return [];
    const req: QdrantSearchRequest = {
      vector: embedding,
      limit: topK,
      with_payload: true,
      with_vector: false,
      filter: {
        must: [
          { key: 'userId', match: { value: userId } },
          { key: 'namespace', match: { value: namespace } },
        ],
      },
    };

    const res = await fetch(`${this.url}/collections/${this.collection}/points/search`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const text = await res.text();
      logger.error('Qdrant search failed', { status: res.status, text });
      return [];
    }
    const data = await res.json();
    const result = (data?.result || []) as Array<{ id: string; score: number; payload: QdrantPayload }>;
    return result.map(r => ({
      id: String(r.id),
      score: r.score,
      record: {
        id: String(r.id),
        userId: r.payload.userId,
        namespace: r.payload.namespace,
        content: r.payload.content,
        metadata: r.payload,
      },
    }));
  }
}

export function initQdrantFromEnv(): QdrantVectorStore | null {
  const url = process.env.QDRANT_URL;
  const apiKey = process.env.QDRANT_API_KEY;
  const collection = process.env.QDRANT_COLLECTION;
  if (!url) {
    logger.warn('Qdrant not initialized: QDRANT_URL missing');
    return null;
  }
  const store = new QdrantVectorStore({ url, apiKey, collection });
  logger.info('Qdrant vector store initialized', { url, collection });
  return store;
}


