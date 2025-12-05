/**
 * Rate Limiting System
 * Prevents spam, abuse, and cost attacks
 * Uses in-memory storage (resets on server restart)
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory stores (reset on server restart)
const ipLimits = new Map<string, RateLimitEntry>()
const emailLimits = new Map<string, RateLimitEntry>()

// Rate limit configuration
const IP_LIMIT = 100 // requests per hour
const IP_WINDOW = 60 * 60 * 1000 // 1 hour in ms

const EMAIL_LIMIT = 5 // submissions per day
const EMAIL_WINDOW = 24 * 60 * 60 * 1000 // 24 hours in ms

/**
 * Check if an IP has exceeded the rate limit
 * Returns { allowed: boolean, remaining: number, resetAt: number }
 */
export function checkIpRateLimit(ip: string): {
  allowed: boolean
  remaining: number
  resetAt: number
} {
  const now = Date.now()
  const entry = ipLimits.get(ip)

  // No entry or expired - allow and create/reset
  if (!entry || now > entry.resetAt) {
    const resetAt = now + IP_WINDOW
    ipLimits.set(ip, { count: 1, resetAt })
    return {
      allowed: true,
      remaining: IP_LIMIT - 1,
      resetAt
    }
  }

  // Entry exists and not expired
  if (entry.count >= IP_LIMIT) {
    console.warn(`⚠️ IP rate limit exceeded: ${ip} (${entry.count}/${IP_LIMIT})`)
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt
    }
  }

  // Increment and allow
  entry.count++
  ipLimits.set(ip, entry)
  return {
    allowed: true,
    remaining: IP_LIMIT - entry.count,
    resetAt: entry.resetAt
  }
}

/**
 * Check if an email has exceeded the rate limit
 * Returns { allowed: boolean, remaining: number, resetAt: number }
 */
export function checkEmailRateLimit(email: string): {
  allowed: boolean
  remaining: number
  resetAt: number
} {
  const now = Date.now()
  const normalizedEmail = email.toLowerCase().trim()
  const entry = emailLimits.get(normalizedEmail)

  // No entry or expired - allow and create/reset
  if (!entry || now > entry.resetAt) {
    const resetAt = now + EMAIL_WINDOW
    emailLimits.set(normalizedEmail, { count: 1, resetAt })
    return {
      allowed: true,
      remaining: EMAIL_LIMIT - 1,
      resetAt
    }
  }

  // Entry exists and not expired
  if (entry.count >= EMAIL_LIMIT) {
    console.warn(`⚠️ Email rate limit exceeded: ${normalizedEmail} (${entry.count}/${EMAIL_LIMIT})`)
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt
    }
  }

  // Increment and allow
  entry.count++
  emailLimits.set(normalizedEmail, entry)
  return {
    allowed: true,
    remaining: EMAIL_LIMIT - entry.count,
    resetAt: entry.resetAt
  }
}

/**
 * Get rate limit statistics for monitoring
 */
export function getRateLimitStats(): {
  ipLimits: {
    total: number
    blocked: number
  }
  emailLimits: {
    total: number
    blocked: number
  }
} {
  const now = Date.now()

  // Clean up expired entries while counting
  let ipTotal = 0
  let ipBlocked = 0
  for (const [ip, entry] of ipLimits.entries()) {
    if (now > entry.resetAt) {
      ipLimits.delete(ip)
    } else {
      ipTotal++
      if (entry.count >= IP_LIMIT) ipBlocked++
    }
  }

  let emailTotal = 0
  let emailBlocked = 0
  for (const [email, entry] of emailLimits.entries()) {
    if (now > entry.resetAt) {
      emailLimits.delete(email)
    } else {
      emailTotal++
      if (entry.count >= EMAIL_LIMIT) emailBlocked++
    }
  }

  return {
    ipLimits: { total: ipTotal, blocked: ipBlocked },
    emailLimits: { total: emailTotal, blocked: emailBlocked }
  }
}

/**
 * Clear all rate limits (for testing or admin reset)
 */
export function clearAllRateLimits(): void {
  ipLimits.clear()
  emailLimits.clear()
  console.log('🧹 All rate limits cleared')
}
