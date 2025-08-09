import winston from 'winston';

const baseJsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const prettyConsoleFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: false }),
  winston.format.printf((info) => {
    const { timestamp, level } = info as any;
    const service = (info as any).service || 'aluuna-services';
    const message = info.message;
    const { stack, ...rest } = info as any;

    // Remove winston internal symbols/metadata
    delete rest.level; delete rest.timestamp; delete rest.message;
    delete rest['@metadata'];

    const lines: string[] = [];
    lines.push(`${timestamp} [${service}] ${level.toUpperCase()}: ${message}`);

    // Prefer common fields first for readability
    const orderedKeys = ['userId', 'mode', 'totalChunks'];
    for (const key of orderedKeys) {
      if (key in rest) {
        lines.push(`${key}: ${rest[key]}`);
        delete rest[key];
      }
    }

    if (typeof rest.payload !== 'undefined') {
      const payload = rest.payload;
      lines.push(`payload:\n${typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2)}`);
      delete rest.payload;
    }

    if (typeof rest.response !== 'undefined') {
      const response = rest.response;
      lines.push(`response:\n${typeof response === 'string' ? response : JSON.stringify(response, null, 2)}`);
      delete rest.response;
    }

    // Print any remaining metadata
    const remainingKeys = Object.keys(rest).filter(k => k !== 'service');
    if (remainingKeys.length > 0) {
      for (const key of remainingKeys) {
        const val = rest[key];
        if (val === undefined) continue;
        if (typeof val === 'object') {
          lines.push(`${key}:\n${JSON.stringify(val, null, 2)}`);
        } else {
          lines.push(`${key}: ${val}`);
        }
      }
    }

    if (stack) {
      lines.push(`stack:\n${stack}`);
    }

    return lines.join('\n');
  })
);

export const logger = winston.createLogger({
  level: process.env['LOG_LEVEL'] || 'warn',
  format: baseJsonFormat,
  defaultMeta: { service: 'aluuna-services' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error', format: baseJsonFormat }),
    new winston.transports.File({ filename: 'combined.log', format: baseJsonFormat })
  ]
});

// Always log to console unless explicitly disabled
if ((process.env['LOG_TO_CONSOLE'] || 'true').toLowerCase() !== 'false') {
  const usePretty = (process.env['LOG_PRETTY'] || 'false').toLowerCase() === 'true';
  logger.add(new winston.transports.Console({
    format: usePretty ? prettyConsoleFormat : baseJsonFormat
  }));
}