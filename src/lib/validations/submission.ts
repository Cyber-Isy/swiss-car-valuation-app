import { z } from "zod"

// Dangerous patterns that might indicate prompt injection attempts
const DANGEROUS_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions?/i,
  /ignore\s+the\s+above/i,
  /disregard\s+(all\s+)?previous/i,
  /forget\s+(all\s+)?previous/i,
  /new\s+instructions?:/i,
  /system\s*:/i,
  /assistant\s*:/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
]

// Helper function to check for dangerous patterns
function containsDangerousPatterns(value: string): boolean {
  return DANGEROUS_PATTERNS.some(pattern => pattern.test(value))
}

export const submissionSchema = z.object({
  // Vehicle info - Basic
  brand: z.string()
    .min(1, "Marke ist erforderlich")
    .refine(val => !containsDangerousPatterns(val), {
      message: "Ungültige Zeichen in Marke erkannt"
    }),
  model: z.string()
    .min(1, "Modell ist erforderlich")
    .refine(val => !containsDangerousPatterns(val), {
      message: "Ungültige Zeichen in Modell erkannt"
    }),
  variant: z.string()
    .optional()
    .refine(val => !val || !containsDangerousPatterns(val), {
      message: "Ungültige Zeichen in Variante erkannt"
    }), // e.g., "A 180 AMG Line", "320d xDrive", "GTI"
  mileage: z.coerce.number().min(0, "Kilometerstand muss positiv sein").max(180000, "Wir akzeptieren nur Fahrzeuge mit maximal 180'000 km"),
  fuelType: z.enum(["BENZIN", "DIESEL", "ELEKTRO", "HYBRID", "PLUGIN_HYBRID"], {
    required_error: "Treibstoffart ist erforderlich",
  }),
  condition: z.enum(["EXCELLENT", "GOOD", "FAIR", "POOR"], {
    required_error: "Zustand ist erforderlich",
  }),

  // Vehicle info - Tier 1 (Critical)
  firstRegistration: z.string().min(1, "Erstzulassung ist erforderlich").refine(
    (val) => {
      const year = parseInt(val.split("/")[1])
      return !isNaN(year) && year >= 2004
    },
    { message: "Wir akzeptieren nur Fahrzeuge ab Baujahr 2004" }
  ), // MM/YYYY format
  transmission: z.enum(["MANUAL", "AUTOMATIC"], {
    required_error: "Getriebe ist erforderlich",
  }),
  enginePower: z.coerce.number().min(1, "Leistung ist erforderlich").max(2000, "Ungültige Leistung"),
  bodyType: z.enum(["LIMOUSINE", "KOMBI", "SUV", "COUPE", "CABRIO", "VAN", "KLEINWAGEN"], {
    required_error: "Karosserie ist erforderlich",
  }),

  // Vehicle info - Tier 2 (Swiss Market) - Optional
  driveType: z.enum(["FWD", "RWD", "AWD"]).default("FWD"),
  mfkDate: z.string().optional(), // MM/YYYY format
  previousOwners: z.coerce.number().min(1).max(10).optional(),
  accidentFree: z.boolean().default(false),

  // Vehicle info - Tier 3 (Value Modifiers) - Optional
  serviceHistory: z.enum(["FULL", "PARTIAL", "NONE"]).optional(),
  exteriorColor: z.string()
    .optional()
    .refine(val => !val || !containsDangerousPatterns(val), {
      message: "Ungültige Zeichen in Farbe erkannt"
    }),
  equipment: z.array(z.string()).default([]),

  // Legacy field (derived from firstRegistration for backwards compatibility)
  year: z.coerce.number().min(2004, "Wir akzeptieren nur Fahrzeuge ab Baujahr 2004").max(new Date().getFullYear() + 1),

  // Seller info
  sellerName: z.string()
    .min(2, "Name ist erforderlich")
    .refine(val => !containsDangerousPatterns(val), {
      message: "Ungültige Zeichen in Name erkannt"
    }),
  sellerEmail: z.string().email("Ungültige E-Mail-Adresse"),
  sellerPhone: z.string().min(10, "Ungültige Telefonnummer"),
  sellerLocation: z.string()
    .min(2, "PLZ/Ort ist erforderlich")
    .refine(val => !containsDangerousPatterns(val), {
      message: "Ungültige Zeichen in PLZ/Ort erkannt"
    }),
})

export type SubmissionInput = z.infer<typeof submissionSchema>
