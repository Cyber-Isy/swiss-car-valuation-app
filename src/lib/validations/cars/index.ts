import { carBrandsWithModels } from './brands'
import { carVariants } from './variants'

// Get all brand names
export const carBrands = [...Object.keys(carBrandsWithModels).sort(), "Andere"]

// Get models for a specific brand
export const getModelsForBrand = (brand: string): string[] => {
  if (brand === "Andere" || !carBrandsWithModels[brand]) {
    return []
  }
  return [...carBrandsWithModels[brand], "Anderes Modell"]
}

// Get variants for a specific brand and model
export const getVariantsForModel = (brand: string, model: string): string[] => {
  if (!carVariants[brand] || !carVariants[brand][model]) {
    return []
  }
  return [...carVariants[brand][model], "Andere Variante"]
}

// Re-export data for direct access if needed
export { carBrandsWithModels } from './brands'
export { carVariants } from './variants'
