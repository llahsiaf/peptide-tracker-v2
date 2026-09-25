export type PeptideUnit = 'mg' | 'mcg' | 'mL';
export type DoseUnit = 'mg' | 'mcg' | 'mL';
export type FrequencyKey = 'daily' | 'weekly' | '2x_week' | '3x_week' | string;
export type VialLifecycleStatus = 'active' | 'empty' | 'archived';

export interface DosePresets {
  low: number;
  standard: number;
  high: number;
}

export interface PeptideDefinition {
  id: string;
  name: string;
  category: string;
  vialSizeMg: number;
  unit: PeptideUnit;
  defaultBacWaterMl: number;
  doseRange: { min: number; max: number; step: number };
  presetDoses: DosePresets;
  halfLifeHours: number;
  defaultSchedule: string;
  defaultDays: string[];
  timingTip: string;
  reconInstructions: string;
}

export interface ActiveInventoryItem {
  id: string;
  freezerId: string;
  name: string;
  vialSizeMg: number;
  unit: PeptideUnit;
  category: string;
  schedule: string;
  injectionDays: string[];
  bacWaterMl: number;
  selectedDose: number;
  presetDoses: DosePresets;
  penClicksPerMl: number;
  reconstitutedAt: string;
  maxShelfLifeDays: number;
  estEmptyDays: number;
  injectionTime: string;
  reminderEnabled: boolean;
  hasCycle: boolean;
  cycleOnWeeks: number;
  cycleOffWeeks: number;
  cycleStartDate: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  vialSize: number;
  unit: PeptideUnit;
  bacWater: number;
  targetDose: number;
  doseUnit: DoseUnit;
  volumeMl?: string;
  frequency: FrequencyKey;
  frequencyLabel: string;
  halfLifeDays: number;
  maxFridgeDays: number;
  activeDays: string[];
  injectionTime: string;
  reconstitutedDate?: string;
  estimatedDaysLeft?: number;
  isCycleActive?: boolean;
  isReminderActive?: boolean;
  currentVolumeMl?: number;
  initialVolumeMl?: number;
  notificationIds?: string[];
  freezerId?: string;
  createdAt?: string;
  lifecycleStatus?: VialLifecycleStatus;
  activatedAt?: string;
  emptiedAt?: string;
  archivedAt?: string;
  lastInjectedAt?: string;
  scheduleStartDate?: string;
  scheduleEndDate?: string;
  schedulePaused?: boolean;
}

export interface FreezerItem {
  id: string;
  name: string;
  category: string;
  description?: string;
  vialSize: number;
  unit: PeptideUnit;
  quantity: number;
  defaultBacWater: number;
  targetDose: number;
  frequency: FrequencyKey;
  frequencyLabel: string;
  halfLifeDays: number;
  maxFridgeDays: number;
  activeDays: string[];
  injectionTime: string;
  createdAt?: string;
}

export interface FreezerStockItem {
  id: string;
  name: string;
  vialSizeMg: number;
  unit: PeptideUnit;
  category: string;
  freezerStock: number;
  bacWaterMl: number;
  defaultDose: number;
  presetDoses: DosePresets;
  schedule: string;
  injectionDays: string[];
  penClicksPerMl: number;
  halfLifeHours: number;
}

export interface InjectionLog {
  id: string;
  peptideName: string;
  dose: number;
  unit: string;
  volumeMl: string;
  siteId: string;
  timestamp: string;
  inventoryId?: string;
  peptideId?: string;
  u100Units?: number;
  clicks?: number;
  locationName?: string;
  dateStr?: string;
  timeStr?: string;
  recordedAtLocal?: string;
  notes?: string;
}

export interface InjectionSite {
  id: string;
  code: string;
  name: string;
  desc: string;
  side: string;
  cx: number;
  cy: number;
}
