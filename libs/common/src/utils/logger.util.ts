/**
 * Structured Logger Utility
 *
 * Provides JSON-formatted logging with level filtering based on LOG_LEVEL env var.
 *
 * Levels: debug < info < warn < error
 *
 * @example
 * import { Logger } from '@app/common/utils/logger.util';
 *
 * const logger = new Logger('DataSourceService');
 * logger.info('Price generation started', { symbols: 30 });
 * logger.error('RabbitMQ connection failed', error);
 *
 * Reference: specs/001-bist30-streaming-platform/spec.md (NFR-008, NFR-009)
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const LOG_LEVEL_MAP: Record<string, LogLevel> = {
  debug: LogLevel.DEBUG,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
};

export class Logger {
  private readonly context: string;
  private readonly minLevel: LogLevel;

  constructor(context: string) {
    this.context = context;
    const envLevel = (process.env.LOG_LEVEL || "info").toLowerCase();
    this.minLevel = LOG_LEVEL_MAP[envLevel] ?? LogLevel.INFO;
  }

  debug(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, meta);
  }

  info(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, meta);
  }

  warn(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, meta);
  }

  error(message: string, error?: Error | Record<string, any>): void {
    const meta =
      error instanceof Error
        ? { error: error.message, stack: error.stack }
        : error;
    this.log(LogLevel.ERROR, message, meta);
  }

  private log(
    level: LogLevel,
    message: string,
    meta?: Record<string, any>,
  ): void {
    if (level < this.minLevel) {
      return; // Skip if below min level
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level].toLowerCase(),
      context: this.context,
      message,
      ...meta,
    };

    const output = JSON.stringify(logEntry);

    // Use appropriate console method based on level
    switch (level) {
      case LogLevel.ERROR:
        console.error(output);
        break;
      case LogLevel.WARN:
        console.warn(output);
        break;
      default:
        console.log(output);
    }
  }
}
