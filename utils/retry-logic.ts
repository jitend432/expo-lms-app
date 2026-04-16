export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any, attempt: number) => boolean;
  onRetry?: (error: any, attempt: number, delay: number) => void;
}

const defaultOptions: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  shouldRetry: (error: any) => {
    // Retry on network errors, timeouts, and 5xx server errors
    if (error.isNetworkError || error.isTimeout) return true;
    if (error.status && error.status >= 500) return true;
    if (error.status === 429) return true; // Rate limit
    return false;
  },
  onRetry: () => {},
};

// Sleep utility
const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Calculate delay with exponential backoff and jitter
const calculateDelay = (
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number
): number => {
  const exponentialDelay = initialDelay * Math.pow(multiplier, attempt - 1);
  const delay = Math.min(exponentialDelay, maxDelay);
  
  // Add jitter (±20%) to prevent thundering herd
  const jitter = delay * 0.2 * (Math.random() * 2 - 1);
  return Math.floor(delay + jitter);
};

// Retry async function
export const retry = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const opts = { ...defaultOptions, ...options };
  let lastError: any;
  
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Check if we should retry
      if (!opts.shouldRetry(error, attempt) || attempt === opts.maxAttempts) {
        throw error;
      }
      
      // Calculate delay
      const delay = calculateDelay(
        attempt,
        opts.initialDelay,
        opts.maxDelay,
        opts.backoffMultiplier
      );
      
      // Notify about retry
      opts.onRetry(error, attempt, delay);
      
      // Wait before retrying
      await sleep(delay);
    }
  }
  
  throw lastError;
};

// Retry with exponential backoff
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  return retry(fn, {
    ...options,
    backoffMultiplier: options.backoffMultiplier ?? 2,
  });
};

// Retry until condition is met
export const retryUntil = async <T>(
  fn: () => Promise<T>,
  condition: (result: T) => boolean,
  options: RetryOptions = {}
): Promise<T> => {
  const opts = { ...defaultOptions, maxAttempts: 10, ...options };
  
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      const result = await fn();
      
      if (condition(result)) {
        return result;
      }
      
      if (attempt === opts.maxAttempts) {
        throw new Error('Max attempts reached without meeting condition');
      }
      
      const delay = calculateDelay(
        attempt,
        opts.initialDelay,
        opts.maxDelay,
        opts.backoffMultiplier
      );
      
      await sleep(delay);
    } catch (error) {
      if (attempt === opts.maxAttempts) {
        throw error;
      }
      
      const delay = calculateDelay(
        attempt,
        opts.initialDelay,
        opts.maxDelay,
        opts.backoffMultiplier
      );
      
      await sleep(delay);
    }
  }
  
  throw new Error('Retry failed');
};

// Debounced retry (wait for stable period before retrying)
export const createDebouncedRetry = (
  fn: (...args: any[]) => Promise<any>,
  options: RetryOptions & { debounceDelay?: number } = {}
) => {
  const { debounceDelay = 500, ...retryOptions } = options;
  let timeoutId: NodeJS.Timeout | null = null;
  let pendingRetry: (() => void) | null = null;
  
  return (...args: any[]) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    return new Promise((resolve, reject) => {
      pendingRetry = async () => {
        try {
          const result = await retry(() => fn(...args), retryOptions);
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          pendingRetry = null;
          timeoutId = null;
        }
      };
      
      timeoutId = setTimeout(() => {
        if (pendingRetry) {
          pendingRetry();
        }
      }, debounceDelay);
    });
  };
};

// Circuit breaker pattern
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private failureThreshold: number = 5,
    private resetTimeout: number = 60000,
    private halfOpenMaxAttempts: number = 3
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (
      this.state === 'CLOSED' && this.failures >= this.failureThreshold ||
      this.state === 'HALF_OPEN'
    ) {
      this.state = 'OPEN';
    }
  }
  
  getState(): string {
    return this.state;
  }
  
  reset(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }
}