// Re-export everything from the modular structure

// Schema and types
export { submissionSchema, type SubmissionInput } from './submission'

// Car data
export {
  carBrands,
  carBrandsWithModels,
  carVariants,
  getModelsForBrand,
  getVariantsForModel
} from './cars'

// Enums and options
export {
  fuelTypes,
  conditions,
  transmissionTypes,
  bodyTypes,
  driveTypes,
  serviceHistoryOptions,
  previousOwnersOptions,
  exteriorColors,
  equipmentOptions,
  generateMonthOptions,
  generateYearOptions,
} from './enums'
