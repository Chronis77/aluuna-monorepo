import { logger } from '../utils/logger.js';

interface QueryMetrics {
  operation: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  error?: string;
}

class PerformanceMonitor {
  private metrics: QueryMetrics[] = [];
  private slowQueryThreshold = 1000; // 1 second

  recordQuery(operation: string, duration: number, success: boolean, error?: string) {
    const metric: QueryMetrics = {
      operation,
      duration,
      timestamp: new Date(),
      success,
      error
    };

    this.metrics.push(metric);

    // Log slow queries immediately
    if (duration > this.slowQueryThreshold) {
      logger.warn('Slow database query detected', {
        operation,
        duration: `${duration}ms`,
        threshold: `${this.slowQueryThreshold}ms`,
        success,
        error
      });
    }

    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  getStats() {
    if (this.metrics.length === 0) return null;

    const successfulQueries = this.metrics.filter(m => m.success);
    const failedQueries = this.metrics.filter(m => !m.success);

    const avgDuration = successfulQueries.length > 0 
      ? successfulQueries.reduce((sum, m) => sum + m.duration, 0) / successfulQueries.length 
      : 0;

    const slowQueries = successfulQueries.filter(m => m.duration > this.slowQueryThreshold);

    return {
      totalQueries: this.metrics.length,
      successfulQueries: successfulQueries.length,
      failedQueries: failedQueries.length,
      averageDuration: Math.round(avgDuration),
      slowQueries: slowQueries.length,
      slowQueryPercentage: successfulQueries.length > 0 
        ? Math.round((slowQueries.length / successfulQueries.length) * 100) 
        : 0,
      recentQueries: this.metrics.slice(-10).map(m => ({
        operation: m.operation,
        duration: m.duration,
        success: m.success,
        timestamp: m.timestamp.toISOString()
      }))
    };
  }

  logStats() {
    const stats = this.getStats();
    if (stats) {
      logger.info('Database performance stats', stats);
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator to measure query performance
 */
export function measureQuery<T extends (...args: any[]) => Promise<any>>(
  operation: string,
  fn: T
): T {
  return (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    const start = Date.now();
    let success = false;
    let error: string | undefined;

    try {
      const result = await fn(...args);
      success = true;
      return result;
    } catch (err: any) {
      error = err.message;
      throw err;
    } finally {
      const duration = Date.now() - start;
      performanceMonitor.recordQuery(operation, duration, success, error);
    }
  }) as T;
} 