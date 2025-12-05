/**
 * Retry with Exponential Backoff
 * Handles transient failures gracefully
 */

interface RetryOptions {
  maxRetries?: number
  initialDelayMs?: number
  maxDelayMs?: number
  backoffFactor?: number
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000, // 1 second
  maxDelayMs: 10000, // 10 seconds
  backoffFactor: 2
}

/**
 * Retry a function with exponential backoff
 * Useful for handling rate limit errors or transient API failures
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // Don't retry on last attempt
      if (attempt === opts.maxRetries) {
        break
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelayMs * Math.pow(opts.backoffFactor, attempt),
        opts.maxDelayMs
      )

      console.warn(
        `⚠️ Retry attempt ${attempt + 1}/${opts.maxRetries} after ${delay}ms delay`,
        error instanceof Error ? error.message : error
      )

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  // All retries exhausted
  console.error(`❌ All ${opts.maxRetries} retry attempts failed`)
  throw lastError
}

/**
 * Check if an error is retryable (rate limit, timeout, network error)
 */
export function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false

  const message = error.message.toLowerCase()

  return (
    message.includes('rate limit') ||
    message.includes('timeout') ||
    message.includes('network') ||
    message.includes('econnreset') ||
    message.includes('429') ||
    message.includes('503') ||
    message.includes('504')
  )
}

/**
 * Retry only if the error is retryable
 */
export async function retryIfRetryable<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (isRetryableError(error)) {
      console.log('🔄 Retryable error detected, initiating retry with backoff')
      return await retryWithBackoff(fn, options)
    }
    throw error
  }
}
