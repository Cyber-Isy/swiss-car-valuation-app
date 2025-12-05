/**
 * Input Sanitization for Perplexity AI Prompts
 * Protects against prompt injection and ensures clean, safe user input
 */

// Dangerous patterns that might indicate prompt injection attempts
const DANGEROUS_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions?/i,
  /ignore\s+the\s+above/i,
  /disregard\s+(all\s+)?previous/i,
  /forget\s+(all\s+)?previous/i,
  /new\s+instructions?:/i,
  /system\s*:/i,
  /assistant\s*:/i,
  /user\s*:/i,
  /\[system\]/i,
  /\[assistant\]/i,
  /\[user\]/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /\{system\}/i,
  /\{assistant\}/i,
  /\{user\}/i,
]

// Special characters to remove or escape
const SPECIAL_CHARS_REGEX = /[<>{}[\]|\\`"]/g

// Newline patterns (prevent multi-line injection)
const NEWLINE_REGEX = /[\r\n\t]+/g

/**
 * Sanitize a string for use in AI prompts
 * Removes dangerous patterns, special characters, and normalizes whitespace
 */
export function sanitizeForPrompt(input: string | undefined | null, maxLength: number = 200): string {
  if (!input) return ''

  let sanitized = input.trim()

  // Check for dangerous injection patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(sanitized)) {
      console.warn('⚠️ Detected potential prompt injection attempt:', {
        input: sanitized.substring(0, 100),
        pattern: pattern.source
      })
      // Replace the entire match with a safe placeholder
      sanitized = sanitized.replace(pattern, '[FILTERED]')
    }
  }

  // Replace newlines and tabs with single spaces
  sanitized = sanitized.replace(NEWLINE_REGEX, ' ')

  // Remove/escape special characters
  sanitized = sanitized.replace(SPECIAL_CHARS_REGEX, '')

  // Normalize multiple spaces
  sanitized = sanitized.replace(/\s{2,}/g, ' ').trim()

  // Truncate to max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength).trim()
  }

  return sanitized
}

/**
 * Validate that a brand exists in the known brands list
 * Helps prevent injection via unknown brand names
 */
export function validateBrand(brand: string, knownBrands: string[]): boolean {
  const normalizedBrand = brand.trim().toLowerCase()
  return knownBrands.some(known => known.toLowerCase() === normalizedBrand)
}

/**
 * Create a safe vehicle description for prompts
 * Sanitizes all components and combines them safely
 */
export function createSafeVehicleDescription(
  brand: string,
  model: string,
  variant?: string
): string {
  const safeBrand = sanitizeForPrompt(brand, 50)
  const safeModel = sanitizeForPrompt(model, 50)
  const safeVariant = variant ? sanitizeForPrompt(variant, 50) : null

  const parts = [safeBrand, safeModel, safeVariant].filter(Boolean)
  return parts.join(' ')
}

/**
 * Sanitize numeric input to prevent injection via number fields
 */
export function sanitizeNumeric(value: number | undefined | null): number | null {
  if (value === undefined || value === null) return null

  // Ensure it's actually a number
  const num = Number(value)
  if (isNaN(num) || !isFinite(num)) {
    console.warn('⚠️ Invalid numeric value detected:', value)
    return null
  }

  return num
}

/**
 * Sanitize enum values to ensure they match expected values
 */
export function sanitizeEnum<T extends string>(
  value: string | undefined | null,
  allowedValues: readonly T[]
): T | null {
  if (!value) return null

  const normalized = value.trim().toUpperCase()
  const match = allowedValues.find(v => v === normalized)

  if (!match) {
    console.warn('⚠️ Invalid enum value detected:', {
      value,
      allowed: allowedValues
    })
    return null
  }

  return match
}

/**
 * Check if input contains suspicious patterns without sanitizing
 * Useful for logging/monitoring without modifying the input
 */
export function containsSuspiciousPatterns(input: string): boolean {
  return DANGEROUS_PATTERNS.some(pattern => pattern.test(input))
}
