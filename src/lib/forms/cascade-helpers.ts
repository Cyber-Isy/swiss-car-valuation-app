import { getModelsForBrand, getVariantsForModel } from '../validations'

/**
 * Handle brand change in cascade selector
 * @param brand - Selected brand
 * @param currentModel - Current model value (if any)
 * @returns Object with available models and whether to reset model field
 */
export function handleBrandChange(brand: string, currentModel?: string) {
  const availableModels = getModelsForBrand(brand)

  // Reset model if current model is not available for new brand
  const shouldResetModel = currentModel && !availableModels.includes(currentModel)

  return {
    availableModels,
    shouldResetModel,
    showCustomModel: brand === "Andere",
  }
}

/**
 * Handle model change in cascade selector
 * @param brand - Selected brand
 * @param model - Selected model
 * @param currentVariant - Current variant value (if any)
 * @returns Object with available variants and whether to reset variant field
 */
export function handleModelChange(
  brand: string,
  model: string,
  currentVariant?: string
) {
  const availableVariants = getVariantsForModel(brand, model)

  // Reset variant if current variant is not available for new model
  const shouldResetVariant = currentVariant && !availableVariants.includes(currentVariant)

  return {
    availableVariants,
    shouldResetVariant,
    showCustomVariant: model === "Anderes Modell",
  }
}

/**
 * Check if a value is a "custom" option that requires text input
 * @param value - The value to check
 * @returns True if this is a custom option
 */
export function isCustomOption(value: string): boolean {
  return value === "Andere" || value === "Anderes Modell" || value === "Andere Variante"
}
