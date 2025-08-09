import client from 'prom-client';

export const register = new client.Registry();
client.collectDefaultMetrics({ register });

export const httpRequestDurationMs = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'code'],
  buckets: [50, 100, 200, 500, 1000, 2000, 5000],
});

export const modelTokens = new client.Counter({
  name: 'model_tokens_total',
  help: 'Total model tokens used',
  labelNames: ['model', 'type'],
});

export const toolCalls = new client.Counter({
  name: 'tool_calls_total',
  help: 'Total tool calls executed',
  labelNames: ['tool_name', 'status'],
});

register.registerMetric(httpRequestDurationMs);
register.registerMetric(modelTokens);
register.registerMetric(toolCalls);


