import type { InventoryItem } from '../store/useBioStackStore';

export interface InjectionMetrics {
  dose: number;
  doseUnit: InventoryItem['doseUnit'];
  concentration: number;
  concentrationUnit: InventoryItem['unit'];
  volumeMl: string;
  volumeMlNumber: number;
  iu: number;
  dialClicks: number;
  valid: boolean;
}

const round = (value: number, digits = 3) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

export interface GenericDosingParams {
  vialAmount: number;
  vialUnit: 'mg' | 'mcg' | 'mL';
  bacWaterMl: number;
  doseAmount: number;
  doseUnit: 'mg' | 'mcg' | 'mL';
}

export interface GenericDosingResult {
  valid: boolean;
  errorMessage?: string;
  vialAmountInMg: number;
  doseInMg: number;
  concentrationMgPerMl: number;
  concentrationMcgPerMl: number;
  volumeMl: number;
  volumeMlStr: string;
  iu: number;
  dialClicks: number;
  dosesPerVial: number;
}

export function calculateGenericDosing(params: GenericDosingParams): GenericDosingResult {
  const { vialAmount, vialUnit, bacWaterMl, doseAmount, doseUnit } = params;

  if (vialAmount <= 0 || doseAmount <= 0) {
    return {
      valid: false,
      errorMessage: 'Invalid amount',
      vialAmountInMg: 0,
      doseInMg: 0,
      concentrationMgPerMl: 0,
      concentrationMcgPerMl: 0,
      volumeMl: 0,
      volumeMlStr: '0.000',
      iu: 0,
      dialClicks: 0,
      dosesPerVial: 0,
    };
  }

  // Handle pure liquid mL
  if (vialUnit === 'mL' || doseUnit === 'mL') {
    const vol = doseAmount;
    const iu = Math.round(vol * 100);
    return {
      valid: true,
      vialAmountInMg: 0,
      doseInMg: 0,
      concentrationMgPerMl: 0,
      concentrationMcgPerMl: 0,
      volumeMl: vol,
      volumeMlStr: vol.toFixed(3),
      iu,
      dialClicks: iu,
      dosesPerVial: vol > 0 ? Math.floor(vialAmount / vol) : 0,
    };
  }

  if (bacWaterMl <= 0) {
    return {
      valid: false,
      errorMessage: 'BAC water must be > 0',
      vialAmountInMg: 0,
      doseInMg: 0,
      concentrationMgPerMl: 0,
      concentrationMcgPerMl: 0,
      volumeMl: 0,
      volumeMlStr: '0.000',
      iu: 0,
      dialClicks: 0,
      dosesPerVial: 0,
    };
  }

  const vialAmountInMg = vialUnit === 'mg' ? vialAmount : vialAmount / 1000;
  const doseInMg = doseUnit === 'mg' ? doseAmount : doseAmount / 1000;

  const concentrationMgPerMl = vialAmountInMg / bacWaterMl;
  const concentrationMcgPerMl = concentrationMgPerMl * 1000;

  const volume = doseInMg / concentrationMgPerMl;
  const iu = Math.round(volume * 100);
  const dosesPerVial = doseInMg > 0 ? Math.floor(vialAmountInMg / doseInMg) : 0;

  return {
    valid: Number.isFinite(volume) && volume > 0,
    vialAmountInMg,
    doseInMg,
    concentrationMgPerMl: round(concentrationMgPerMl, 4),
    concentrationMcgPerMl: round(concentrationMcgPerMl, 1),
    volumeMl: volume,
    volumeMlStr: volume.toFixed(3),
    iu,
    dialClicks: iu,
    dosesPerVial,
  };
}

/**
 * Normalizes decimal input string by replacing commas with dots.
 */
export function normalizeDecimalInput(text: string): string {
  return (text || '').replace(',', '.');
}

/**
 * Safely parses any number or string (including comma-decimal strings like "7,5") into a valid finite number.
 */
export function parseDecimal(val: string | number | undefined | null): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  const normalized = String(val).trim().replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Calculates tracker-only volume/marking metrics from values already stored by the user.
 * It does not recommend or select a dose.
 */
export function calculateInjectionMetrics(
  item: InventoryItem,
  overrideDose?: string,
  overrideBac?: string,
  overrideDoseUnit?: InventoryItem['doseUnit'],
): InjectionMetrics {
  const dose = overrideDose !== undefined
    ? parseDecimal(overrideDose)
    : parseDecimal(item.targetDose);
  const bac = overrideBac !== undefined
    ? parseDecimal(overrideBac)
    : parseDecimal(item.bacWater);
  const effectiveDoseUnit = overrideDoseUnit || item.doseUnit || item.unit;

  if (dose <= 0) {
    return {
      dose,
      doseUnit: effectiveDoseUnit,
      concentration: 0,
      concentrationUnit: item.unit,
      volumeMl: '0.000',
      volumeMlNumber: 0,
      iu: 0,
      dialClicks: 0,
      valid: false,
    };
  }

  if (item.unit === 'mL') {
    const valid = effectiveDoseUnit === 'mL';
    const volume = valid ? dose : 0;
    const iu = Math.round(volume * 100);
    return {
      dose,
      doseUnit: effectiveDoseUnit,
      concentration: valid ? 1 : 0,
      concentrationUnit: 'mL',
      volumeMl: volume.toFixed(3),
      volumeMlNumber: volume,
      iu,
      dialClicks: iu,
      valid,
    };
  }

  if ((item.unit !== 'mg' && item.unit !== 'mcg') || (effectiveDoseUnit !== 'mg' && effectiveDoseUnit !== 'mcg')) {
    return {
      dose,
      doseUnit: effectiveDoseUnit,
      concentration: 0,
      concentrationUnit: item.unit,
      volumeMl: '0.000',
      volumeMlNumber: 0,
      iu: 0,
      dialClicks: 0,
      valid: false,
    };
  }

  if (bac <= 0 || item.vialSize <= 0) {
    return {
      dose,
      doseUnit: effectiveDoseUnit,
      concentration: 0,
      concentrationUnit: item.unit,
      volumeMl: '0.000',
      volumeMlNumber: 0,
      iu: 0,
      dialClicks: 0,
      valid: false,
    };
  }

  const vialAmountInMg = item.unit === 'mg' ? item.vialSize : item.vialSize / 1000;
  const doseInMg = effectiveDoseUnit === 'mg' ? dose : dose / 1000;
  const concentrationMgPerMl = vialAmountInMg / bac;
  const volume = doseInMg / concentrationMgPerMl;
  const iu = Math.round(volume * 100);

  return {
    dose,
    doseUnit: effectiveDoseUnit,
    concentration: round(concentrationMgPerMl, 6),
    concentrationUnit: item.unit,
    volumeMl: volume.toFixed(3),
    volumeMlNumber: volume,
    iu,
    dialClicks: iu,
    valid: Number.isFinite(volume) && volume >= 0,
  };
}

export function getLiquidStatus(item: InventoryItem) {
  const initialVolume = item.initialVolumeMl !== undefined
    ? Math.max(0, Number(item.initialVolumeMl) || 0)
    : item.unit === 'mL'
      ? Math.max(0, item.vialSize)
      : Math.max(0, item.bacWater || 0);
  const currentVolume = Math.max(
    0,
    Math.min(
      initialVolume,
      item.currentVolumeMl !== undefined ? item.currentVolumeMl : initialVolume,
    ),
  );
  const progressPercent = initialVolume > 0
    ? Math.max(0, Math.min(100, (currentVolume / initialVolume) * 100))
    : 0;

  const metrics = calculateInjectionMetrics(item);
  const dosesLeft = metrics.volumeMlNumber > 0
    ? Math.floor(currentVolume / metrics.volumeMlNumber)
    : 0;

  let daysMultiplier = 7;
  if (item.frequency === 'daily') daysMultiplier = 1;
  else if (item.frequency === '2x_week') daysMultiplier = 3.5;
  else if (item.frequency === '3x_week') daysMultiplier = 2.33;

  return {
    currentVol: currentVolume,
    initialVol: initialVolume,
    progressPercent,
    dosesLeft,
    daysLeft: Math.max(0, Math.round(dosesLeft * daysMultiplier)),
  };
}
