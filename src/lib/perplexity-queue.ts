/**
 * Perplexity API Request Queue
 * Limits concurrent API requests to prevent rate limit errors
 * Max 5 simultaneous requests
 */

const MAX_CONCURRENT_REQUESTS = 5
let activeRequests = 0
const queue: Array<() => void> = []

/**
 * Execute a function with queue management
 * Ensures max 5 concurrent Perplexity API requests
 */
export async function withQueue<T>(fn: () => Promise<T>): Promise<T> {
  // Wait for a slot if at capacity
  if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
    console.log(`⏳ Queue: Waiting for slot (${activeRequests}/${MAX_CONCURRENT_REQUESTS} active)`)
    await new Promise<void>(resolve => {
      queue.push(resolve)
    })
  }

  // Execute the function
  activeRequests++
  console.log(`🚀 Queue: Starting request (${activeRequests}/${MAX_CONCURRENT_REQUESTS} active)`)

  try {
    const result = await fn()
    return result
  } finally {
    // Release slot and process queue
    activeRequests--
    console.log(`✅ Queue: Finished request (${activeRequests}/${MAX_CONCURRENT_REQUESTS} active)`)

    if (queue.length > 0) {
      const next = queue.shift()
      if (next) next()
    }
  }
}

/**
 * Get current queue statistics
 */
export function getQueueStats(): {
  activeRequests: number
  queuedRequests: number
  maxConcurrent: number
} {
  return {
    activeRequests,
    queuedRequests: queue.length,
    maxConcurrent: MAX_CONCURRENT_REQUESTS
  }
}
