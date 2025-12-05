/**
 * Power unit conversion utilities for PS (Pferdestärke) and KW (Kilowatt)
 */

export type PowerUnit = 'PS' | 'KW'

/**
 * Conversion factors
 * 1 PS = 0.7355 KW
 * 1 KW = 1.35962 PS
 */
const PS_TO_KW = 0.7355
const KW_TO_PS = 1.35962

/**
 * Convert power value between PS and KW
 * @param value - The power value to convert
 * @param from - Source unit
 * @param to - Target unit
 * @returns Converted power value (rounded)
 */
export function convertPowerUnit(value: number, from: PowerUnit, to: PowerUnit): number {
  if (from === to) return value

  if (from === 'KW' && to === 'PS') {
    return Math.round(value * KW_TO_PS)
  }

  if (from === 'PS' && to === 'KW') {
    return Math.round(value * PS_TO_KW)
  }

  return value
}

/**
 * Convert PS to KW
 * @param ps - Power in PS
 * @returns Power in KW (rounded)
 */
export function psToKw(ps: number): number {
  return Math.round(ps * PS_TO_KW)
}

/**
 * Convert KW to PS
 * @param kw - Power in KW
 * @returns Power in PS (rounded)
 */
export function kwToPs(kw: number): number {
  return Math.round(kw * KW_TO_PS)
}
