/**
 * Format a price value in Swiss Francs (CHF)
 * @param price - The price to format (can be null)
 * @returns Formatted price string or "—" if null
 */
export const formatPrice = (price: number | null): string => {
  if (!price) return "—"
  return new Intl.NumberFormat("de-CH", {
    style: "currency",
    currency: "CHF",
    minimumFractionDigits: 0,
  }).format(price)
}

/**
 * Format a date string to Swiss German format
 * @param dateString - ISO date string
 * @returns Formatted date string (DD.MM.YYYY HH:MM)
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Format a date string to Swiss German format (date only)
 * @param dateString - ISO date string
 * @returns Formatted date string (DD.MM.YYYY)
 */
export const formatDateOnly = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

/**
 * Format a time string to Swiss German format
 * @param dateString - ISO date string
 * @returns Formatted time string (HH:MM)
 */
export const formatTime = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString("de-CH", {
    hour: "2-digit",
    minute: "2-digit"
  })
}

/**
 * Format mileage with thousands separator
 * @param mileage - The mileage value
 * @returns Formatted string with "km" suffix
 */
export const formatMileage = (mileage: number): string => {
  return `${mileage.toLocaleString("de-CH")} km`
}

/**
 * Format year as string
 * @param year - The year value
 * @returns Year as string
 */
export const formatYear = (year: number): string => {
  return year.toString()
}

/**
 * Format engine power in PS
 * @param power - Power in PS
 * @returns Formatted string with "PS" suffix
 */
export const formatPower = (power: number | null): string => {
  if (!power) return "—"
  return `${power} PS`
}
