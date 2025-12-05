// Submission status constants
export const SUBMISSION_STATUS = {
  NEW: "NEW",
  CONTACTED: "CONTACTED",
  OFFER_SENT: "OFFER_SENT",
  ACCEPTED: "ACCEPTED",
  COMPLETED: "COMPLETED",
  REJECTED: "REJECTED",
} as const

export type SubmissionStatus = typeof SUBMISSION_STATUS[keyof typeof SUBMISSION_STATUS]

// Fuel type constants
export const FUEL_TYPE = {
  BENZIN: "BENZIN",
  DIESEL: "DIESEL",
  ELEKTRO: "ELEKTRO",
  HYBRID: "HYBRID",
  PLUGIN_HYBRID: "PLUGIN_HYBRID",
} as const

// Condition constants
export const CONDITION = {
  EXCELLENT: "EXCELLENT",
  GOOD: "GOOD",
  FAIR: "FAIR",
  POOR: "POOR",
} as const

// Transmission constants
export const TRANSMISSION = {
  MANUAL: "MANUAL",
  AUTOMATIC: "AUTOMATIC",
} as const

// Body type constants
export const BODY_TYPE = {
  LIMOUSINE: "LIMOUSINE",
  KOMBI: "KOMBI",
  SUV: "SUV",
  COUPE: "COUPE",
  CABRIO: "CABRIO",
  VAN: "VAN",
  KLEINWAGEN: "KLEINWAGEN",
} as const

// Drive type constants
export const DRIVE_TYPE = {
  FWD: "FWD",
  RWD: "RWD",
  AWD: "AWD",
} as const

// Service history constants
export const SERVICE_HISTORY = {
  FULL: "FULL",
  PARTIAL: "PARTIAL",
  NONE: "NONE",
} as const
