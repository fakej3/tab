/**
 * Curated, deliberately non-exhaustive unit conversion for the search bar
 * — length, weight, volume, temperature. Parses "<number> <unit> to
 * <unit>" (or "in"). Returns null for anything it doesn't recognize so it
 * never intercepts a normal search query.
 */
export interface ConversionResult {
  value: number;
  fromLabel: string;
  toLabel: string;
}

const LENGTH_TO_METERS: Record<string, number> = {
  m: 1,
  meter: 1,
  meters: 1,
  metre: 1,
  metres: 1,
  km: 1000,
  kilometer: 1000,
  kilometers: 1000,
  cm: 0.01,
  centimeter: 0.01,
  centimeters: 0.01,
  mm: 0.001,
  millimeter: 0.001,
  millimeters: 0.001,
  mi: 1609.34,
  mile: 1609.34,
  miles: 1609.34,
  ft: 0.3048,
  foot: 0.3048,
  feet: 0.3048,
  in: 0.0254,
  inch: 0.0254,
  inches: 0.0254,
  yd: 0.9144,
  yard: 0.9144,
  yards: 0.9144
};

const WEIGHT_TO_KG: Record<string, number> = {
  kg: 1,
  kilogram: 1,
  kilograms: 1,
  g: 0.001,
  gram: 0.001,
  grams: 0.001,
  lb: 0.453592,
  lbs: 0.453592,
  pound: 0.453592,
  pounds: 0.453592,
  oz: 0.0283495,
  ounce: 0.0283495,
  ounces: 0.0283495
};

const VOLUME_TO_LITERS: Record<string, number> = {
  l: 1,
  liter: 1,
  liters: 1,
  litre: 1,
  litres: 1,
  ml: 0.001,
  milliliter: 0.001,
  milliliters: 0.001,
  gal: 3.78541,
  gallon: 3.78541,
  gallons: 3.78541,
  cup: 0.236588,
  cups: 0.236588
};

const TEMPERATURE_UNITS = new Set(['c', 'celsius', 'f', 'fahrenheit', 'k', 'kelvin']);

const PATTERN = /^\s*(-?[0-9]*\.?[0-9]+)\s*([a-zA-Z]+)\s+(?:to|in)\s+([a-zA-Z]+)\s*$/;

export function convertUnits(input: string): ConversionResult | null {
  const match = input.match(PATTERN);
  if (!match) return null;
  const [, rawValue, rawFrom, rawTo] = match;
  const value = Number(rawValue);
  const from = rawFrom!.toLowerCase();
  const to = rawTo!.toLowerCase();
  if (!Number.isFinite(value)) return null;

  if (TEMPERATURE_UNITS.has(from) && TEMPERATURE_UNITS.has(to)) {
    return convertTemperature(value, from, to);
  }

  const tableResult =
    convertViaTable(value, from, to, LENGTH_TO_METERS) ??
    convertViaTable(value, from, to, WEIGHT_TO_KG) ??
    convertViaTable(value, from, to, VOLUME_TO_LITERS);

  return tableResult;
}

function convertViaTable(value: number, from: string, to: string, table: Record<string, number>): ConversionResult | null {
  const fromFactor = table[from];
  const toFactor = table[to];
  if (fromFactor === undefined || toFactor === undefined) return null;
  const converted = (value * fromFactor) / toFactor;
  return { value: converted, fromLabel: from, toLabel: to };
}

function convertTemperature(value: number, from: string, to: string): ConversionResult {
  const toCelsius = (v: number, unit: string): number => {
    if (unit.startsWith('c')) return v;
    if (unit.startsWith('f')) return ((v - 32) * 5) / 9;
    return v - 273.15; // kelvin
  };
  const fromCelsius = (v: number, unit: string): number => {
    if (unit.startsWith('c')) return v;
    if (unit.startsWith('f')) return (v * 9) / 5 + 32;
    return v + 273.15; // kelvin
  };
  const celsius = toCelsius(value, from);
  const converted = fromCelsius(celsius, to);
  return { value: converted, fromLabel: from, toLabel: to };
}

export function formatConversionResult(result: ConversionResult): string {
  const rounded = Math.round(result.value * 1000) / 1000;
  return `${rounded} ${result.toLabel}`;
}
