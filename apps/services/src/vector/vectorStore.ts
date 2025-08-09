import { logger } from '../utils/logger.js';

export interface VectorRecord {
  id: string;
  userId: string;
  namespace: string; // e.g., 'insight', 'inner_part', 'session', 'journal'
  content: string;
  metadata?: Record<string, any>;
  embedding?: number[] | null;
}

export interface VectorQueryResult {
  id: string;
  score: number;
  record: VectorRecord;
}

export interface VectorStore {
  upsert(record: VectorRecord): Promise<void>;
  upsertMany(records: VectorRecord[]): Promise<void>;
  query(userId: string, namespace: string, embedding: number[], topK: number): Promise<VectorQueryResult[]>;
}

// Default no-op vector store to allow running without external dependencies
class NoopVectorStore implements VectorStore {
  async upsert(): Promise<void> {
    logger.debug('NoopVectorStore.upsert called');
  }
  async upsertMany(): Promise<void> {
    logger.debug('NoopVectorStore.upsertMany called');
  }
  async query(): Promise<VectorQueryResult[]> {
    logger.debug('NoopVectorStore.query called');
    return [];
  }
}

let vectorStore: VectorStore = new NoopVectorStore();

export function setVectorStore(store: VectorStore) {
  vectorStore = store;
}

export function getVectorStore(): VectorStore {
  return vectorStore;
}


