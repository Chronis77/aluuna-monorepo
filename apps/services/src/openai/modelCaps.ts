// Utilities for model capability quirks/caps

/**
 * Returns true if the model supports specifying a non-default temperature.
 * Some models (e.g., gpt-5 family) only allow the default and reject custom values.
 */
export function supportsCustomTemperature(model?: string): boolean {
  if (!model) return true;
  const normalized = model.toLowerCase();
  if (normalized.startsWith('gpt-5')) return false;
  return true;
}

/**
 * Returns an object containing { temperature } only if the model supports it; else returns {}.
 */
export function withTemperatureIfSupported(model: string | undefined, temperature: number | undefined): Record<string, number> {
  if (temperature === undefined) return {};
  return supportsCustomTemperature(model) ? { temperature } : {};
}


