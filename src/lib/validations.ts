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

// Car brands with their models
export const carBrandsWithModels: Record<string, string[]> = {
  // Luxury & Exotic
  "Aston Martin": ["DB11", "DB12", "DBS", "DBX", "Vantage", "Vanquish", "Rapide", "Virage", "DB9", "DB7"],
  "Bentley": ["Continental GT", "Continental GTC", "Flying Spur", "Bentayga", "Mulsanne", "Arnage", "Azure"],
  "Bugatti": ["Chiron", "Veyron", "Divo", "Centodieci", "La Voiture Noire", "Bolide"],
  "Ferrari": ["296 GTB", "296 GTS", "SF90 Stradale", "F8 Tributo", "Roma", "Portofino", "812 Superfast", "812 GTS", "Purosangue", "488", "458", "California", "LaFerrari", "Enzo", "F12", "GTC4Lusso"],
  "Koenigsegg": ["Jesko", "Regera", "Gemera", "Agera", "CC850", "One:1"],
  "Lamborghini": ["Huracán", "Urus", "Revuelto", "Aventador", "Gallardo", "Murciélago", "Diablo", "Countach"],
  "Lotus": ["Emira", "Eletre", "Evija", "Exige", "Elise", "Evora", "Esprit"],
  "McLaren": ["750S", "720S", "GT", "Artura", "765LT", "600LT", "570S", "540C", "P1", "Senna", "Speedtail"],
  "Pagani": ["Huayra", "Zonda", "Utopia"],
  "Rimac": ["Nevera", "Concept One"],
  "Rolls-Royce": ["Phantom", "Ghost", "Wraith", "Dawn", "Cullinan", "Spectre", "Silver Shadow", "Silver Spirit"],

  // Premium
  "Alfa Romeo": ["Giulia", "Stelvio", "Giulietta", "MiTo", "Tonale", "159", "147", "GT", "Brera", "Spider", "4C", "8C"],
  "Audi": ["A1", "A3", "A4", "A5", "A6", "A7", "A8", "Q2", "Q3", "Q4 e-tron", "Q5", "Q6 e-tron", "Q7", "Q8", "Q8 e-tron", "e-tron", "e-tron GT", "TT", "R8", "RS3", "RS4", "RS5", "RS6", "RS7", "RS Q3", "RS Q8", "S3", "S4", "S5", "S6", "S7", "S8", "SQ5", "SQ7", "SQ8"],
  "BMW": ["1er", "2er", "3er", "4er", "5er", "6er", "7er", "8er", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "XM", "iX", "iX1", "iX2", "iX3", "i3", "i4", "i5", "i7", "i8", "Z3", "Z4", "M2", "M3", "M4", "M5", "M8"],
  "Cadillac": ["CT4", "CT5", "Escalade", "XT4", "XT5", "XT6", "Lyriq", "Celestiq", "CTS", "ATS", "SRX"],
  "Genesis": ["G70", "G80", "G90", "GV60", "GV70", "GV80"],
  "Infiniti": ["Q30", "Q50", "Q60", "Q70", "QX30", "QX50", "QX55", "QX60", "QX70", "QX80"],
  "Jaguar": ["XE", "XF", "XJ", "F-Type", "E-Pace", "F-Pace", "I-Pace"],
  "Lexus": ["CT", "IS", "ES", "GS", "LS", "UX", "NX", "RX", "GX", "LX", "LC", "RC", "RZ", "LBX"],
  "Lincoln": ["Aviator", "Corsair", "Nautilus", "Navigator", "Continental", "MKZ", "MKC", "MKX"],
  "Maserati": ["Ghibli", "Quattroporte", "Levante", "MC20", "Grecale", "GranTurismo", "GranCabrio"],
  "Mercedes-Benz": ["A-Klasse", "B-Klasse", "C-Klasse", "E-Klasse", "S-Klasse", "CLA", "CLE", "CLS", "GLA", "GLB", "GLC", "GLE", "GLS", "G-Klasse", "EQA", "EQB", "EQC", "EQE", "EQS", "EQV", "AMG GT", "SL", "SLC", "SLK", "Maybach", "Vito", "V-Klasse", "Sprinter"],
  "Porsche": ["911", "718 Cayman", "718 Boxster", "Panamera", "Taycan", "Macan", "Cayenne", "918 Spyder", "Carrera GT"],

  // Mainstream European
  "Citroën": ["C1", "C3", "C3 Aircross", "C4", "C4 Cactus", "C4 X", "C5", "C5 Aircross", "C5 X", "Berlingo", "Jumpy", "SpaceTourer", "ë-C4"],
  "Cupra": ["Formentor", "Born", "Leon", "Ateca", "Tavascan", "Terramar"],
  "Dacia": ["Sandero", "Duster", "Logan", "Jogger", "Spring"],
  "DS": ["DS3", "DS3 Crossback", "DS4", "DS5", "DS7", "DS9"],
  "Fiat": ["500", "500X", "500L", "Panda", "Tipo", "Punto", "Ducato", "Doblo", "500e", "600"],
  "Opel": ["Corsa", "Astra", "Insignia", "Mokka", "Crossland", "Grandland", "Combo", "Zafira", "Vivaro", "Movano", "Adam", "Meriva", "Ampera"],
  "Peugeot": ["108", "208", "308", "408", "508", "2008", "3008", "5008", "Rifter", "Traveller", "Partner", "Expert", "e-208", "e-2008", "e-308"],
  "Renault": ["Twingo", "Clio", "Megane", "Talisman", "Captur", "Kadjar", "Koleos", "Scenic", "Espace", "Kangoo", "Trafic", "Master", "Zoe", "Megane E-Tech", "Arkana", "Austral", "5 E-Tech"],
  "Seat": ["Ibiza", "Leon", "Arona", "Ateca", "Tarraco", "Alhambra", "Mii"],
  "Skoda": ["Fabia", "Scala", "Octavia", "Superb", "Kamiq", "Karoq", "Kodiaq", "Enyaq", "Citigo", "Elroq"],
  "Volkswagen": ["up!", "Polo", "Golf", "ID.3", "ID.4", "ID.5", "ID.7", "ID.Buzz", "Passat", "Arteon", "T-Cross", "T-Roc", "Tiguan", "Touareg", "Touran", "Sharan", "Caddy", "Multivan", "Transporter", "Amarok"],

  // Mainstream Asian
  "Honda": ["Civic", "Accord", "Jazz", "HR-V", "CR-V", "e", "ZR-V", "e:Ny1", "NSX", "S2000"],
  "Hyundai": ["i10", "i20", "i30", "i40", "Ioniq", "Ioniq 5", "Ioniq 6", "Kona", "Tucson", "Santa Fe", "Bayon", "Nexo", "Staria"],
  "Kia": ["Picanto", "Rio", "Ceed", "Proceed", "Stinger", "Sportage", "Sorento", "Niro", "EV6", "EV9", "Soul", "Stonic", "XCeed"],
  "Mazda": ["2", "3", "6", "CX-3", "CX-30", "CX-5", "CX-60", "CX-80", "MX-5", "MX-30", "RX-7", "RX-8"],
  "Mitsubishi": ["Space Star", "ASX", "Eclipse Cross", "Outlander", "L200", "Pajero", "Colt", "Lancer"],
  "Nissan": ["Micra", "Juke", "Qashqai", "X-Trail", "Leaf", "Ariya", "GT-R", "370Z", "400Z", "Navara", "Pathfinder", "Murano"],
  "Subaru": ["Impreza", "XV", "Crosstrek", "Forester", "Outback", "Legacy", "Levorg", "BRZ", "WRX", "Solterra"],
  "Suzuki": ["Swift", "Ignis", "Baleno", "Vitara", "S-Cross", "Jimny", "Across", "Swace", "SX4"],
  "Toyota": ["Aygo", "Aygo X", "Yaris", "Yaris Cross", "Corolla", "Camry", "Crown", "Prius", "C-HR", "RAV4", "Highlander", "Land Cruiser", "Supra", "GR86", "GR Yaris", "bZ4X", "Mirai", "Proace", "Hilux"],

  // American
  "Chevrolet": ["Camaro", "Corvette", "Cruze", "Malibu", "Spark", "Trax", "Equinox", "Tahoe", "Suburban", "Silverado", "Colorado", "Blazer", "Traverse"],
  "Chrysler": ["300", "Pacifica", "Voyager"],
  "Dodge": ["Challenger", "Charger", "Durango", "Journey", "Ram", "Viper"],
  "Ford": ["Fiesta", "Focus", "Mondeo", "Mustang", "Mustang Mach-E", "Puma", "Kuga", "Explorer", "EcoSport", "Edge", "Ranger", "Transit", "S-Max", "Galaxy", "Bronco", "F-150", "Raptor", "GT"],
  "GMC": ["Sierra", "Canyon", "Yukon", "Acadia", "Terrain", "Hummer EV"],
  "Jeep": ["Renegade", "Compass", "Cherokee", "Grand Cherokee", "Wrangler", "Gladiator", "Avenger"],

  // British
  "Mini": ["Mini 3-Türer", "Mini 5-Türer", "Mini Cabrio", "Mini Clubman", "Mini Countryman", "Mini Electric", "Mini Aceman"],
  "Morgan": ["Plus Four", "Plus Six", "Super 3", "3 Wheeler"],
  "MG": ["ZS", "HS", "MG4", "MG5", "Marvel R", "Cyberster", "3", "4"],

  // Swedish
  "Polestar": ["Polestar 1", "Polestar 2", "Polestar 3", "Polestar 4", "Polestar 5", "Polestar 6"],
  "Volvo": ["S60", "S90", "V40", "V60", "V90", "XC40", "XC60", "XC90", "C40", "EX30", "EX90", "EM90"],

  // Electric Startups
  "Aiways": ["U5", "U6"],
  "BYD": ["Atto 3", "Han", "Tang", "Seal", "Dolphin", "Seal U"],
  "Fisker": ["Ocean", "Pear"],
  "Lucid": ["Air", "Gravity"],
  "NIO": ["ET5", "ET7", "EL6", "EL7", "ES6", "ES8", "EC6", "EC7"],
  "Rivian": ["R1T", "R1S", "R2", "R3"],
  "Smart": ["fortwo", "forfour", "#1", "#3"],
  "Tesla": ["Model 3", "Model S", "Model X", "Model Y", "Cybertruck", "Roadster", "Semi"],
  "Xpeng": ["G3", "G6", "G9", "P5", "P7"],

  // Other European
  "Alpine": ["A110", "A290"],
  "Lancia": ["Ypsilon", "Delta", "Thema", "Fulvia"],

  // Other Asian
  "Daihatsu": ["Terios", "Sirion", "Cuore", "Rocky"],
  "Isuzu": ["D-Max", "MU-X"],
  "SsangYong": ["Tivoli", "Korando", "Rexton", "Musso", "Torres"],

  // Chinese (growing in Europe)
  "Lynk & Co": ["01", "02", "03", "05", "09"],
  "Ora": ["Funky Cat", "03", "07"],
  "Zeekr": ["001", "007", "009", "X"],
}

// Get all brand names
export const carBrands = [...Object.keys(carBrandsWithModels).sort(), "Andere"]

// Get models for a specific brand
export const getModelsForBrand = (brand: string): string[] => {
  if (brand === "Andere" || !carBrandsWithModels[brand]) {
    return []
  }
  return [...carBrandsWithModels[brand], "Anderes Modell"]
}

// Variants/Trims for popular models (brand -> model -> variants)
export const carVariants: Record<string, Record<string, string[]>> = {
  // Luxury & Exotic
  "Lamborghini": {
    "Huracán": ["EVO", "EVO Spyder", "Performante", "STO", "Tecnica", "Sterrato"],
    "Urus": ["S", "Performante", "SE"],
    "Aventador": ["S", "SVJ", "Ultimae", "LP 700-4", "LP 750-4 SV"],
    "Revuelto": ["Standard"],
  },
  "Ferrari": {
    "296 GTB": ["Standard", "Assetto Fiorano"],
    "296 GTS": ["Standard", "Assetto Fiorano"],
    "SF90 Stradale": ["Standard", "Spider", "XX Stradale"],
    "F8 Tributo": ["Standard", "Spider"],
    "Roma": ["Standard", "Spider"],
    "Purosangue": ["Standard"],
    "812 Superfast": ["Standard", "GTS", "Competizione"],
  },
  "Porsche": {
    "911": ["Carrera", "Carrera S", "Carrera 4", "Carrera 4S", "Carrera GTS", "Turbo", "Turbo S", "GT3", "GT3 RS", "GT3 Touring", "Targa 4", "Targa 4S", "Dakar"],
    "718 Cayman": ["Standard", "S", "GTS 4.0", "GT4", "GT4 RS"],
    "718 Boxster": ["Standard", "S", "GTS 4.0", "Spyder", "Spyder RS"],
    "Panamera": ["Standard", "4", "4S", "GTS", "Turbo", "Turbo S", "4 E-Hybrid", "Turbo S E-Hybrid"],
    "Taycan": ["Standard", "4S", "GTS", "Turbo", "Turbo S", "Cross Turismo"],
    "Macan": ["Standard", "S", "GTS", "Turbo", "T", "Electric"],
    "Cayenne": ["Standard", "S", "GTS", "Turbo", "Turbo GT", "E-Hybrid", "Turbo S E-Hybrid"],
  },
  "McLaren": {
    "750S": ["Coupé", "Spider"],
    "720S": ["Coupé", "Spider"],
    "765LT": ["Coupé", "Spider"],
    "Artura": ["Standard", "Spider"],
    "GT": ["Standard"],
  },
  "Aston Martin": {
    "DB11": ["V8", "V12", "AMR"],
    "DB12": ["Coupé", "Volante"],
    "DBS": ["Superleggera", "770 Ultimate"],
    "Vantage": ["V8", "F1 Edition", "Roadster"],
    "DBX": ["Standard", "707"],
  },
  "Bentley": {
    "Continental GT": ["V8", "Speed", "Mulliner", "S"],
    "Continental GTC": ["V8", "Speed", "Mulliner", "S"],
    "Flying Spur": ["V8", "Speed", "Mulliner", "Hybrid"],
    "Bentayga": ["V8", "Speed", "EWB", "S", "Hybrid"],
  },
  "Rolls-Royce": {
    "Phantom": ["Standard", "EWB", "Series II"],
    "Ghost": ["Standard", "EWB", "Black Badge"],
    "Cullinan": ["Standard", "Black Badge"],
    "Spectre": ["Standard"],
    "Wraith": ["Standard", "Black Badge"],
    "Dawn": ["Standard", "Black Badge"],
  },
  // Premium German
  "Mercedes-Benz": {
    "A-Klasse": ["A 180", "A 200", "A 220", "A 250", "A 250 e", "A 35 AMG", "A 45 AMG", "A 45 S AMG"],
    "B-Klasse": ["B 180", "B 200", "B 220", "B 250 e"],
    "C-Klasse": ["C 180", "C 200", "C 220 d", "C 300", "C 300 d", "C 300 e", "C 43 AMG", "C 63 AMG", "C 63 S AMG"],
    "E-Klasse": ["E 200", "E 220 d", "E 300", "E 300 d", "E 300 e", "E 400 d", "E 450", "E 53 AMG", "E 63 AMG", "E 63 S AMG"],
    "S-Klasse": ["S 350 d", "S 400 d", "S 450", "S 500", "S 580", "S 580 e", "S 63 AMG", "S 680 Maybach"],
    "CLA": ["CLA 180", "CLA 200", "CLA 220", "CLA 250", "CLA 35 AMG", "CLA 45 AMG", "CLA 45 S AMG"],
    "CLE": ["CLE 200", "CLE 300", "CLE 450", "CLE 53 AMG"],
    "GLA": ["GLA 180", "GLA 200", "GLA 220", "GLA 250", "GLA 35 AMG", "GLA 45 AMG", "GLA 45 S AMG"],
    "GLB": ["GLB 180", "GLB 200", "GLB 220", "GLB 250", "GLB 35 AMG"],
    "GLC": ["GLC 200", "GLC 220 d", "GLC 300", "GLC 300 d", "GLC 300 e", "GLC 400 d", "GLC 43 AMG", "GLC 63 AMG", "GLC 63 S AMG"],
    "GLE": ["GLE 300 d", "GLE 350 d", "GLE 400 d", "GLE 450", "GLE 580", "GLE 53 AMG", "GLE 63 AMG", "GLE 63 S AMG"],
    "GLS": ["GLS 350 d", "GLS 400 d", "GLS 450", "GLS 580", "GLS 63 AMG", "GLS 600 Maybach"],
    "G-Klasse": ["G 400 d", "G 500", "G 63 AMG"],
    "EQA": ["EQA 250", "EQA 300", "EQA 350"],
    "EQB": ["EQB 250", "EQB 300", "EQB 350"],
    "EQC": ["EQC 400"],
    "EQE": ["EQE 300", "EQE 350", "EQE 500", "EQE 43 AMG", "EQE 53 AMG"],
    "EQS": ["EQS 450", "EQS 500", "EQS 580", "EQS 53 AMG", "EQS 680 Maybach"],
    "AMG GT": ["43", "53", "55", "63", "63 S", "Black Series"],
    "SL": ["SL 43", "SL 55", "SL 63"],
  },
  "BMW": {
    "1er": ["116i", "118i", "120i", "128ti", "M135i xDrive"],
    "2er": ["218i", "220i", "223i", "M235i xDrive"],
    "3er": ["318i", "320i", "320d", "330i", "330d", "330e", "M340i", "M340d"],
    "4er": ["420i", "420d", "430i", "430d", "M440i"],
    "5er": ["520i", "520d", "530i", "530d", "530e", "540i", "540d", "M550i"],
    "7er": ["735i", "740i", "740d", "750e", "760i", "i7 xDrive60", "M760e"],
    "8er": ["840i", "840d", "M850i"],
    "X1": ["sDrive18i", "sDrive20i", "xDrive20i", "xDrive23i", "xDrive25e", "M35i"],
    "X2": ["sDrive18i", "sDrive20i", "xDrive20i", "xDrive25e", "M35i"],
    "X3": ["sDrive20i", "xDrive20i", "xDrive20d", "xDrive30i", "xDrive30d", "xDrive30e", "M40i", "M40d"],
    "X4": ["xDrive20i", "xDrive20d", "xDrive30i", "xDrive30d", "M40i", "M40d"],
    "X5": ["xDrive40i", "xDrive40d", "xDrive45e", "xDrive50e", "M50i", "M60i"],
    "X6": ["xDrive40i", "xDrive40d", "M50i", "M60i"],
    "X7": ["xDrive40i", "xDrive40d", "M60i"],
    "iX": ["xDrive40", "xDrive50", "M60"],
    "iX1": ["xDrive30"],
    "iX3": ["Standard"],
    "i4": ["eDrive35", "eDrive40", "M50"],
    "i5": ["eDrive40", "M60 xDrive"],
    "i7": ["xDrive60", "M70 xDrive"],
    "Z4": ["sDrive20i", "sDrive30i", "M40i"],
    "M2": ["Standard", "Competition"],
    "M3": ["Standard", "Competition", "CS", "Touring"],
    "M4": ["Standard", "Competition", "CS", "CSL"],
    "M5": ["Standard", "Competition", "CS"],
    "M8": ["Competition", "Competition Gran Coupé"],
  },
  "Audi": {
    "A1": ["25 TFSI", "30 TFSI", "35 TFSI", "40 TFSI"],
    "A3": ["30 TFSI", "35 TFSI", "35 TDI", "40 TFSI", "40 TDI", "45 TFSI e", "S3", "RS 3"],
    "A4": ["35 TFSI", "40 TFSI", "40 TDI", "45 TFSI", "50 TDI", "S4", "RS 4"],
    "A5": ["35 TFSI", "40 TFSI", "40 TDI", "45 TFSI", "S5", "RS 5"],
    "A6": ["40 TFSI", "45 TFSI", "40 TDI", "45 TDI", "50 TDI", "55 TFSI e", "S6", "RS 6"],
    "A7": ["45 TFSI", "50 TDI", "55 TFSI e", "S7", "RS 7"],
    "A8": ["50 TDI", "55 TFSI", "60 TFSI e", "S8"],
    "Q2": ["30 TFSI", "35 TFSI", "35 TDI", "SQ2"],
    "Q3": ["35 TFSI", "40 TFSI", "35 TDI", "45 TFSI e", "RS Q3"],
    "Q4 e-tron": ["35", "40", "45", "50", "Sportback"],
    "Q5": ["40 TFSI", "45 TFSI", "40 TDI", "50 TDI", "55 TFSI e", "SQ5"],
    "Q7": ["45 TFSI", "50 TDI", "55 TFSI e", "60 TFSI e", "SQ7"],
    "Q8": ["50 TDI", "55 TFSI", "60 TFSI e", "SQ8", "RS Q8"],
    "e-tron": ["50", "55", "S", "GT", "RS e-tron GT"],
    "TT": ["40 TFSI", "45 TFSI", "TTS", "TT RS"],
    "R8": ["V10", "V10 Performance", "V10 GT"],
  },
  "Volkswagen": {
    "Polo": ["1.0 TSI", "1.0 TSI DSG", "GTI"],
    "Golf": ["1.0 TSI", "1.5 TSI", "2.0 TDI", "1.4 eHybrid", "GTI", "GTI Clubsport", "GTD", "GTE", "R"],
    "ID.3": ["Pure", "Pro", "Pro S", "GTX"],
    "ID.4": ["Pure", "Pro", "Pro S", "GTX"],
    "ID.5": ["Pro", "Pro S", "GTX"],
    "ID.7": ["Pro", "Pro S", "GTX"],
    "Passat": ["1.5 TSI", "2.0 TSI", "2.0 TDI", "1.4 eHybrid", "GTE"],
    "Arteon": ["2.0 TSI", "2.0 TDI", "R"],
    "T-Cross": ["1.0 TSI", "1.5 TSI"],
    "T-Roc": ["1.0 TSI", "1.5 TSI", "2.0 TSI", "2.0 TDI", "R"],
    "Tiguan": ["1.5 TSI", "2.0 TSI", "2.0 TDI", "1.4 eHybrid", "R"],
    "Touareg": ["3.0 TSI", "3.0 TDI", "eHybrid", "R"],
  },
  // Japanese
  "Toyota": {
    "Yaris": ["1.0", "1.5", "1.5 Hybrid", "GR Yaris"],
    "Yaris Cross": ["1.5", "1.5 Hybrid", "GR Sport"],
    "Corolla": ["1.8 Hybrid", "2.0 Hybrid", "GR Sport"],
    "Camry": ["2.5 Hybrid"],
    "C-HR": ["1.8 Hybrid", "2.0 Hybrid", "GR Sport"],
    "RAV4": ["2.5 Hybrid", "2.5 Plug-in Hybrid", "Adventure"],
    "Supra": ["2.0", "3.0", "GR"],
    "GR86": ["Standard", "Premium"],
    "Land Cruiser": ["2.8 D-4D", "3.5 V6"],
    "Hilux": ["2.4 D-4D", "2.8 D-4D", "GR Sport"],
  },
  "Honda": {
    "Civic": ["1.5 VTEC", "2.0 VTEC", "e:HEV", "Type R"],
    "Accord": ["2.0 i-VTEC", "Hybrid"],
    "Jazz": ["1.5 e:HEV"],
    "HR-V": ["1.5 e:HEV"],
    "CR-V": ["1.5 VTEC", "2.0 e:HEV", "PHEV"],
    "ZR-V": ["2.0 e:HEV"],
    "e": ["Standard", "Advance"],
  },
  "Mazda": {
    "2": ["1.5 Skyactiv-G", "Hybrid"],
    "3": ["2.0 Skyactiv-G", "2.0 Skyactiv-X", "e-Skyactiv X"],
    "6": ["2.0 Skyactiv-G", "2.5 Skyactiv-G", "2.2 Skyactiv-D"],
    "CX-3": ["2.0 Skyactiv-G"],
    "CX-30": ["2.0 Skyactiv-G", "2.0 Skyactiv-X", "e-Skyactiv G"],
    "CX-5": ["2.0 Skyactiv-G", "2.5 Skyactiv-G", "2.2 Skyactiv-D"],
    "CX-60": ["2.5 e-Skyactiv G", "3.3 e-Skyactiv D", "PHEV"],
    "MX-5": ["1.5 Skyactiv-G", "2.0 Skyactiv-G", "RF"],
    "MX-30": ["e-Skyactiv", "R-EV"],
  },
  // Korean
  "Hyundai": {
    "i10": ["1.0", "1.2", "N Line"],
    "i20": ["1.0 T-GDi", "1.2", "N Line", "N"],
    "i30": ["1.0 T-GDi", "1.5 T-GDi", "1.6 CRDi", "N Line", "N"],
    "Ioniq 5": ["Standard Range", "Long Range", "N"],
    "Ioniq 6": ["Standard Range", "Long Range"],
    "Kona": ["1.0 T-GDi", "1.6 T-GDi", "Hybrid", "Electric", "N"],
    "Tucson": ["1.6 T-GDi", "1.6 CRDi", "Hybrid", "Plug-in Hybrid", "N Line"],
    "Santa Fe": ["2.2 CRDi", "Hybrid", "Plug-in Hybrid"],
  },
  "Kia": {
    "Picanto": ["1.0", "1.2", "GT-Line"],
    "Rio": ["1.0 T-GDi", "1.2", "GT-Line"],
    "Ceed": ["1.0 T-GDi", "1.5 T-GDi", "1.6 CRDi", "GT-Line", "GT"],
    "Proceed": ["1.5 T-GDi", "GT-Line", "GT"],
    "Stinger": ["2.0 T-GDi", "3.3 T-GDi GT"],
    "Sportage": ["1.6 T-GDi", "1.6 CRDi", "Hybrid", "Plug-in Hybrid", "GT-Line"],
    "Sorento": ["2.2 CRDi", "Hybrid", "Plug-in Hybrid"],
    "Niro": ["Hybrid", "Plug-in Hybrid", "EV"],
    "EV6": ["Standard Range", "Long Range", "GT-Line", "GT"],
    "EV9": ["Standard Range", "Long Range", "GT-Line"],
  },
  // Electric
  "Tesla": {
    "Model 3": ["Standard Range", "Long Range", "Performance", "Highland"],
    "Model S": ["Long Range", "Plaid"],
    "Model X": ["Long Range", "Plaid"],
    "Model Y": ["Standard Range", "Long Range", "Performance"],
  },
  "Rivian": {
    "R1T": ["Adventure", "Launch Edition", "Explore"],
    "R1S": ["Adventure", "Launch Edition", "Explore"],
  },
  "Lucid": {
    "Air": ["Pure", "Touring", "Grand Touring", "Sapphire"],
  },
  "Polestar": {
    "Polestar 2": ["Standard Range", "Long Range Single Motor", "Long Range Dual Motor", "BST Edition"],
    "Polestar 3": ["Long Range Dual Motor", "Performance"],
    "Polestar 4": ["Long Range Single Motor", "Long Range Dual Motor"],
  },
  // British
  "Jaguar": {
    "XE": ["P250", "P300", "D200"],
    "XF": ["P250", "P300", "D200"],
    "F-Type": ["P300", "P450", "P575", "R"],
    "E-Pace": ["P160", "P200", "P250", "P300"],
    "F-Pace": ["P250", "P340", "P400", "P550 SVR"],
    "I-Pace": ["EV320", "EV400"],
  },
  "Mini": {
    "Mini 3-Türer": ["One", "Cooper", "Cooper S", "John Cooper Works"],
    "Mini 5-Türer": ["One", "Cooper", "Cooper S", "John Cooper Works"],
    "Mini Cabrio": ["Cooper", "Cooper S", "John Cooper Works"],
    "Mini Clubman": ["Cooper", "Cooper S", "John Cooper Works"],
    "Mini Countryman": ["Cooper", "Cooper S", "Cooper SE", "John Cooper Works"],
    "Mini Electric": ["Standard", "SE"],
  },
}

// Get variants for a specific brand and model
export const getVariantsForModel = (brand: string, model: string): string[] => {
  if (!carVariants[brand] || !carVariants[brand][model]) {
    return []
  }
  return [...carVariants[brand][model], "Andere Variante"]
}

// Fuel types with German labels
export const fuelTypes = [
  { value: "BENZIN", label: "Benzin" },
  { value: "DIESEL", label: "Diesel" },
  { value: "ELEKTRO", label: "Elektro" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "PLUGIN_HYBRID", label: "Plug-in Hybrid" },
]

// Condition options with German labels (ordered from poor to excellent)
export const conditions = [
  { value: "POOR", label: "Schlecht", description: "Erhebliche Mängel" },
  { value: "FAIR", label: "Akzeptabel", description: "Sichtbare Mängel" },
  { value: "GOOD", label: "Gut", description: "Gebrauchsspuren" },
  { value: "EXCELLENT", label: "Ausgezeichnet", description: "Wie neu" },
]

// Transmission types with German labels
export const transmissionTypes = [
  { value: "MANUAL", label: "Manuell" },
  { value: "AUTOMATIC", label: "Automatik" },
]

// Body types with German labels
export const bodyTypes = [
  { value: "LIMOUSINE", label: "Limousine" },
  { value: "KOMBI", label: "Kombi" },
  { value: "SUV", label: "SUV" },
  { value: "COUPE", label: "Coupé" },
  { value: "CABRIO", label: "Cabrio" },
  { value: "VAN", label: "Van" },
  { value: "KLEINWAGEN", label: "Kleinwagen" },
]

// Drive types with German labels
export const driveTypes = [
  { value: "FWD", label: "Frontantrieb" },
  { value: "RWD", label: "Hinterradantrieb" },
  { value: "AWD", label: "Allrad (4x4)" },
]

// Service history options with German labels
export const serviceHistoryOptions = [
  { value: "FULL", label: "Vollständig (Markenservice)" },
  { value: "PARTIAL", label: "Teilweise" },
  { value: "NONE", label: "Keine" },
]

// Previous owners options
export const previousOwnersOptions = [
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
  { value: 5, label: "5+" },
]

// Exterior colors with German labels
export const exteriorColors = [
  { value: "SCHWARZ", label: "Schwarz" },
  { value: "WEISS", label: "Weiss" },
  { value: "SILBER", label: "Silber" },
  { value: "GRAU", label: "Grau" },
  { value: "BLAU", label: "Blau" },
  { value: "ROT", label: "Rot" },
  { value: "GRUEN", label: "Grün" },
  { value: "BRAUN", label: "Braun" },
  { value: "BEIGE", label: "Beige" },
  { value: "ANDERE", label: "Andere" },
]

// Equipment options with German labels
export const equipmentOptions = [
  { value: "NAVIGATION", label: "Navigation" },
  { value: "LEATHER", label: "Lederausstattung" },
  { value: "PANORAMA", label: "Panoramadach" },
  { value: "HEATED_SEATS", label: "Sitzheizung" },
  { value: "PARKING_SENSORS", label: "Einparkhilfe" },
  { value: "BACKUP_CAMERA", label: "Rückfahrkamera" },
  { value: "LED_LIGHTS", label: "LED-Scheinwerfer" },
  { value: "SUNROOF", label: "Schiebedach" },
  { value: "SPORT_PACKAGE", label: "Sportpaket" },
  { value: "ADAPTIVE_CRUISE", label: "Tempomat adaptiv" },
  { value: "KEYLESS", label: "Keyless Entry" },
  { value: "HEATED_STEERING", label: "Lenkradheizung" },
  { value: "VENTILATED_SEATS", label: "Sitzbelüftung" },
  { value: "HEAD_UP_DISPLAY", label: "Head-Up Display" },
  { value: "HARMAN_KARDON", label: "Premium Audio (Harman Kardon/B&O/etc.)" },
]

// Helper function to generate month options
export const generateMonthOptions = () => {
  return [
    { value: "01", label: "Januar" },
    { value: "02", label: "Februar" },
    { value: "03", label: "März" },
    { value: "04", label: "April" },
    { value: "05", label: "Mai" },
    { value: "06", label: "Juni" },
    { value: "07", label: "Juli" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Dezember" },
  ]
}

// Helper function to generate year options (from 2004 to next year)
export const generateYearOptions = () => {
  const currentYear = new Date().getFullYear()
  const minYear = 2004 // Minimum accepted year
  const years = []
  for (let year = currentYear + 1; year >= minYear; year--) {
    years.push({ value: year.toString(), label: year.toString() })
  }
  return years
}
