/**
 * Connection Retry Utility with Exponential Backoff
 *
 * Implements exponential backoff strategy for retrying failed connections
 * to external services (RabbitMQ, Redis, MySQL).
 *
 * @example
 * await connectWithRetry(async () => {
 *   await rabbitmqService.connect();
 * }, 10);
 *
 * Reference: specs/001-bist30-streaming-platform/spec.md (NFR-006)
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  onRetry?: (attempt: number, delay: number, error: Error) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 10,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  onRetry: () => {},
};

/**
 * Execute a function with exponential backoff retry logic
 *
 * @param fn - Async function to execute
 * @param options - Retry configuration
 * @returns Promise that resolves when function succeeds
 * @throws Error if max retries exceeded
 */
export async function connectWithRetry(
  fn: () => Promise<void>,
  options: RetryOptions = {},
): Promise<void> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let attempt = 0;

  while (attempt < config.maxRetries) {
    try {
      await fn();
      return; // Success!
    } catch (error) {
      attempt++;

      if (attempt >= config.maxRetries) {
        throw new Error(
          `Connection failed after ${config.maxRetries} attempts: ${error.message}`,
        );
      }

      // Calculate exponential backoff delay
      const exponentialDelay = config.initialDelayMs * Math.pow(2, attempt - 1);
      const delay = Math.min(exponentialDelay, config.maxDelayMs);

      config.onRetry(attempt, delay, error);

      // Wait before next retry
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
