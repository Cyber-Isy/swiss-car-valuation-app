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
