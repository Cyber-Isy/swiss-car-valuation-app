import '@testing-library/jest-dom'

// Setup environment for tests
globalThis.console = {
  ...console,
  error: (...args: any[]) => {
    // Suppress expected errors in tests
    if (args[0]?.includes?.('Failed to parse')) return
    console.error(...args)
  }
}
