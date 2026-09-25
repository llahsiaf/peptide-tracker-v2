import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { FreezerItem, InjectionLog, InventoryItem } from '../types';

export interface BioStackSettings {
  allowAiNetwork: boolean;
  aiProvider: 'gemini' | 'openai';
  updatedAt?: string;
}

export interface BioStackBackupPayload {
  format: 'biostack-pro-backup';
  formatVersion: 1;
  appVersion: string;
  schemaVersion: number;
  exportedAt: string;
  data: {
    inventory: InventoryItem[];
    freezerStock: FreezerItem[];
    injectionHistory: InjectionLog[];
    currentSite: string;
    settings: BioStackSettings;
  };
}
export type { FreezerItem, InjectionLog, InventoryItem } from '../types';

const INITIAL_FREEZER_PEPTIDES: FreezerItem[] = [
  {
    id: 'pep-reta-1', name: 'Retatrutide', category: 'GLP-1 / GIP / GCG Tri-Agonist',
    vialSize: 10, unit: 'mg', quantity: 10, defaultBacWater: 2.0, targetDose: 2.0,
    frequency: 'weekly', frequencyLabel: 'Mingguan (Weekly)', halfLifeDays: 6.0,
    maxFridgeDays: 56, activeDays: ['Sen'], injectionTime: '08:00',
  },
  {
    id: 'pep-tirz-1', name: 'Tirzepatide', category: 'GLP-1 / GIP Dual Agonist',
    vialSize: 10, unit: 'mg', quantity: 10, defaultBacWater: 2.0, targetDose: 2.5,
    frequency: 'weekly', frequencyLabel: 'Mingguan (Weekly)', halfLifeDays: 5.0,
    maxFridgeDays: 56, activeDays: ['Sen'], injectionTime: '08:00',
  },
  {
    id: 'pep-sema-1', name: 'Semaglutide', category: 'GLP-1 Receptor Agonist',
    vialSize: 5, unit: 'mg', quantity: 8, defaultBacWater: 2.0, targetDose: 0.5,
    frequency: 'weekly', frequencyLabel: 'Mingguan (Weekly)', halfLifeDays: 7.0,
    maxFridgeDays: 56, activeDays: ['Sen'], injectionTime: '08:00',
  },
  {
    id: 'pep-cagri-1', name: 'Cagrilintide', category: 'Amylin Analogue / Satiety',
    vialSize: 5, unit: 'mg', quantity: 8, defaultBacWater: 2.0, targetDose: 0.3,
    frequency: 'weekly', frequencyLabel: 'Mingguan (Weekly)', halfLifeDays: 7.0,
    maxFridgeDays: 56, activeDays: ['Sen'], injectionTime: '08:00',
  },
  {
    id: 'pep-ghk-1', name: 'GHK-Cu', category: 'Tissue Repair & Collagen',
    vialSize: 50, unit: 'mg', quantity: 10, defaultBacWater: 3.0, targetDose: 2.0,
    frequency: 'daily', frequencyLabel: 'Harian (Daily)', halfLifeDays: 0.5,
    maxFridgeDays: 28, activeDays: ['Sen','Sel','Rab','Kam','Jum','Sab','Min'], injectionTime: '08:00',
  },
  {
    id: 'pep-motsc-1', name: 'MOTS-c', category: 'Mitochondrial Energy',
    vialSize: 20, unit: 'mg', quantity: 10, defaultBacWater: 2.0, targetDose: 5.0,
    frequency: '3x_week', frequencyLabel: '3x Seminggu', halfLifeDays: 1.0,
    maxFridgeDays: 28, activeDays: ['Sen','Rab','Jum'], injectionTime: '08:00',
  },
  {
    id: 'pep-lc526-1', name: 'LC526', category: 'Fat Metabolism & Liver',
    vialSize: 10, unit: 'mL', quantity: 10, defaultBacWater: 0, targetDose: 0.2,
    frequency: 'daily', frequencyLabel: 'Harian (Daily)', halfLifeDays: 1.0,
    maxFridgeDays: 60, activeDays: ['Sen','Sel','Rab','Kam','Jum','Sab','Min'], injectionTime: '08:00',
  },
  {
    id: 'pep-kiss-1', name: 'Kisspeptin', category: 'Hormonal Axis Support',
    vialSize: 10, unit: 'mg', quantity: 10, defaultBacWater: 2.0, targetDose: 0.2,
    frequency: '3x_week', frequencyLabel: '3x Seminggu', halfLifeDays: 1.0,
    maxFridgeDays: 28, activeDays: ['Sen','Rab','Jum'], injectionTime: '17:15',
  },
];

export const ROTATION_SITES = [
  'KA', 'KiA', 'KB', 'KiB', 'PKi', 'PKn', 'LKi', 'LKn', 'BKi', 'BKn',
];

const getLocalDateLabel = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const createStableId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const sanitizePositiveNumber = (value: number, fallback = 0) =>
  Number.isFinite(value) && value >= 0 ? value : fallback;

const getInitialLiquidVolume = (item: InventoryItem) =>
  item.initialVolumeMl !== undefined
    ? sanitizePositiveNumber(Number(item.initialVolumeMl))
    : item.unit === 'mL'
      ? sanitizePositiveNumber(item.vialSize)
      : sanitizePositiveNumber(item.bacWater);

const normalizeInventoryItem = (item: InventoryItem): InventoryItem => ({
  ...item,
  name: String(item.name || 'Unnamed Peptide'),
  category: String(item.category || 'General'),
  vialSize: sanitizePositiveNumber(Number(item.vialSize)),
  bacWater: sanitizePositiveNumber(Number(item.bacWater)),
  targetDose: sanitizePositiveNumber(Number(item.targetDose)),
  activeDays: Array.isArray(item.activeDays) && item.activeDays.length > 0 ? item.activeDays : ['Sen'],
  injectionTime: /^([01]\d|2[0-3]):[0-5]\d$/.test(String(item.injectionTime || '')) ? item.injectionTime : '08:00',
  currentVolumeMl: item.currentVolumeMl === undefined ? undefined : sanitizePositiveNumber(Number(item.currentVolumeMl)),
  initialVolumeMl: item.initialVolumeMl === undefined ? undefined : sanitizePositiveNumber(Number(item.initialVolumeMl)),
  notificationIds: Array.isArray(item.notificationIds) ? item.notificationIds : [],
  lifecycleStatus:
    item.currentVolumeMl !== undefined && item.currentVolumeMl <= 0
      ? 'empty'
      : item.lifecycleStatus === 'empty'
        ? 'empty'
        : 'active',
  // Archive is no longer a user-facing lifecycle. Legacy archived items
  // are normalized back to active (or empty when their liquid is depleted).
  archivedAt: undefined,
  activatedAt: item.activatedAt || (item.reconstitutedDate ? `${item.reconstitutedDate}T00:00:00` : undefined),
  schedulePaused: Boolean(item.schedulePaused),
});

const normalizeInjectionLog = (log: InjectionLog): InjectionLog => ({
  ...log,
  id: String(log.id),
  peptideName: String(log.peptideName || 'Unknown'),
  dose: sanitizePositiveNumber(Number(log.dose)),
  volumeMl: String(log.volumeMl ?? '0'),
  siteId: String(log.siteId || 'KA'),
  timestamp: String(log.timestamp || new Date().toISOString()),
  notes: typeof log.notes === 'string' ? log.notes : undefined,
});

interface BioStackState {
  inventory: InventoryItem[];
  freezerStock: FreezerItem[];
  injectionHistory: InjectionLog[];
  currentSite: string;
  settings: BioStackSettings;

  setSite: (siteId: string) => void;
  rotateToNextSite: () => void;
  logInjection: (log: InjectionLog) => void;
  recordInjection: (inventoryId: string, log: InjectionLog, volumeMl: number) => boolean;
  deleteInjectionLog: (id: string) => void;
  clearHistory: () => void;

  addFreezerItem: (item: FreezerItem) => void;
  removeFreezerItem: (id: string) => void;
  updateFreezerQuantity: (id: string, quantity: number) => void;

  reconstituteToFridge: (freezerItemId: string, bacWater: number) => void;
  transferLiquidToFridge: (freezerItemId: string) => void;
  removeInventoryItem: (id: string) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  setSchedulePaused: (id: string, paused: boolean) => void;
  updateSettings: (updates: Partial<BioStackSettings>) => void;
  replaceData: (data: BioStackBackupPayload['data']) => void;
  setNotificationIds: (inventoryId: string, notificationIds: string[]) => void;
}

export const useBioStackStore = create<BioStackState>()(
  persist(
    (set, get) => ({
      inventory: [] as InventoryItem[],
      freezerStock: [] as FreezerItem[],
      injectionHistory: [] as InjectionLog[],
      currentSite: 'KA',
      settings: {
        allowAiNetwork: false,
        aiProvider: 'gemini',
      },

      setSite: (siteId) => {
        if (ROTATION_SITES.includes(siteId)) {
          set({ currentSite: siteId });
        }
      },

      rotateToNextSite: () => {
        const current = get().currentSite;
        const idx = ROTATION_SITES.indexOf(current);
        const nextIdx = idx >= 0 ? (idx + 1) % ROTATION_SITES.length : 0;
        set({ currentSite: ROTATION_SITES[nextIdx] });
      },

      logInjection: (log) =>
        set((state) => {
          const current = state.currentSite;
          const idx = ROTATION_SITES.indexOf(current);
          const nextIdx = idx >= 0 ? (idx + 1) % ROTATION_SITES.length : 0;
          return {
            injectionHistory: [log, ...(state.injectionHistory || [])],
            currentSite: ROTATION_SITES[nextIdx],
          };
        }),

      recordInjection: (inventoryId, log, volumeMl) => {
        if (!Number.isFinite(volumeMl) || volumeMl <= 0) return false;

        let recorded = false;
        set((state) => {
          const inventory = Array.isArray(state.inventory) ? state.inventory : [];
          const item = inventory.find((entry) => entry.id === inventoryId);
          if (!item) return state;

          const initialVolume = getInitialLiquidVolume(item);
          const currentVolume = item.currentVolumeMl !== undefined
            ? Math.max(0, item.currentVolumeMl)
            : initialVolume;
          if (currentVolume < volumeMl) return state;

          const current = state.currentSite;
          const idx = ROTATION_SITES.indexOf(current);
          const nextIdx = idx >= 0 ? (idx + 1) % ROTATION_SITES.length : 0;
          recorded = true;
          const nextVolume = Math.max(0, currentVolume - volumeMl);
          const nowIso = new Date().toISOString();

          return {
            injectionHistory: [
              { ...log, inventoryId: log.inventoryId || inventoryId },
              ...(state.injectionHistory || []),
            ],
            inventory: inventory.map((entry) =>
              entry.id === inventoryId
                ? {
                    ...entry,
                    currentVolumeMl: nextVolume,
                    lifecycleStatus: nextVolume <= 0 ? 'empty' : 'active',
                    emptiedAt: nextVolume <= 0 ? nowIso : entry.emptiedAt,
                    lastInjectedAt: nowIso,
                  }
                : entry
            ),
            currentSite: ROTATION_SITES[nextIdx],
          };
        });
        return recorded;
      },

      deleteInjectionLog: (id) =>
        set((state) => {
          const history = Array.isArray(state.injectionHistory) ? state.injectionHistory : [];
          const log = history.find((entry) => entry?.id === id);
          if (!log) return state;

          const volume = Number.parseFloat(String(log.volumeMl ?? '0'));
          const inventoryId = log.inventoryId;
          const canRestore = Boolean(inventoryId) && Number.isFinite(volume) && volume > 0;

          return {
            injectionHistory: history.filter((entry) => entry?.id !== id),
            inventory: canRestore
              ? (state.inventory || []).map((item) =>
                  item.id === inventoryId
                    ? {
                        ...item,
                        currentVolumeMl: Math.min(
                          getInitialLiquidVolume(item),
                          Math.max(0, (item.currentVolumeMl ?? getInitialLiquidVolume(item)) + volume)
                        ),
                        lifecycleStatus: 'active',
                        emptiedAt: undefined,
                      }
                    : item
                )
              : state.inventory,
          };
        }),

      clearHistory: () =>
        set((state) => {
          const history = Array.isArray(state.injectionHistory) ? state.injectionHistory : [];
          const restoredByInventory = new Map<string, number>();

          history.forEach((log) => {
            if (!log.inventoryId) return;
            const volume = Number.parseFloat(String(log.volumeMl ?? '0'));
            if (!Number.isFinite(volume) || volume <= 0) return;
            restoredByInventory.set(log.inventoryId, (restoredByInventory.get(log.inventoryId) || 0) + volume);
          });

          return {
            injectionHistory: [],
            inventory: (state.inventory || []).map((item) => {
              const restoreAmount = restoredByInventory.get(item.id) || 0;
              if (restoreAmount <= 0) return item;

              const initial = getInitialLiquidVolume(item);
              const restored = Math.min(initial, Math.max(0, (item.currentVolumeMl ?? initial) + restoreAmount));
              return {
                ...item,
                currentVolumeMl: restored,
                lifecycleStatus: restored > 0 ? 'active' : item.lifecycleStatus,
                emptiedAt: restored > 0 ? undefined : item.emptiedAt,
                lastInjectedAt: undefined,
              };
            }),
            currentSite: ROTATION_SITES[0],
          };
        }),

      addFreezerItem: (item) => {
        const safeItem: FreezerItem = {
          ...item,
          quantity: Math.floor(sanitizePositiveNumber(item.quantity)),
          activeDays: item.activeDays || ['Sen'],
          injectionTime: item.injectionTime || '08:00',
        };
        set((state) => ({
          freezerStock: [safeItem, ...(state.freezerStock || [])],
        }));
      },

      removeFreezerItem: (id) =>
        set((state) => ({
          freezerStock: (state.freezerStock || []).filter((f) => f.id !== id),
        })),

      updateFreezerQuantity: (id, quantity) =>
        set((state) => ({
          freezerStock: (state.freezerStock || []).map((f) =>
            f.id === id ? { ...f, quantity: Math.floor(sanitizePositiveNumber(quantity)) } : f
          ),
        })),

      reconstituteToFridge: (freezerItemId, bacWater) => {
        const item = (get().freezerStock || []).find((f) => f.id === freezerItemId);
        if (!item || item.quantity <= 0) return;
        const safeBacWater = sanitizePositiveNumber(bacWater);
        if (item.unit !== 'mL' && safeBacWater <= 0) return;

        const newInv: InventoryItem = {
          id: createStableId('inv'),
          name: item.name,
          category: item.category,
          vialSize: item.vialSize,
          unit: item.unit,
          bacWater: item.unit === 'mL' ? 0 : safeBacWater,
          targetDose: item.targetDose,
          doseUnit: item.unit,
          frequency: item.frequency,
          frequencyLabel: item.frequencyLabel,
          halfLifeDays: item.halfLifeDays,
          maxFridgeDays: item.maxFridgeDays,
          activeDays: item.activeDays || ['Sen'],
          injectionTime: item.injectionTime || '08:00',
          reconstitutedDate: getLocalDateLabel(), createdAt: new Date().toISOString(), freezerId: item.id,
          estimatedDaysLeft: item.maxFridgeDays,
          isCycleActive: false,
          isReminderActive: true,
          currentVolumeMl: item.unit === 'mL' ? item.vialSize : safeBacWater,
          initialVolumeMl: item.unit === 'mL' ? item.vialSize : safeBacWater,
          lifecycleStatus: 'active',
          activatedAt: new Date().toISOString(),
          notificationIds: [],
        };

        set((state) => ({
          freezerStock: (state.freezerStock || []).map((f) =>
            f.id === freezerItemId ? { ...f, quantity: f.quantity - 1 } : f
          ),
          inventory: [newInv, ...(state.inventory || [])],
        }));
      },

      transferLiquidToFridge: (freezerItemId) => {
        const item = (get().freezerStock || []).find((f) => f.id === freezerItemId);
        if (!item || item.quantity <= 0) return;

        const newInv: InventoryItem = {
          id: createStableId('inv'),
          name: item.name,
          category: item.category,
          vialSize: item.vialSize,
          unit: item.unit,
          bacWater: 0,
          targetDose: item.targetDose,
          doseUnit: item.unit,
          frequency: item.frequency,
          frequencyLabel: item.frequencyLabel,
          halfLifeDays: item.halfLifeDays,
          maxFridgeDays: item.maxFridgeDays,
          activeDays: item.activeDays || ['Sen'],
          injectionTime: item.injectionTime || '08:00',
          reconstitutedDate: getLocalDateLabel(), createdAt: new Date().toISOString(), freezerId: item.id,
          estimatedDaysLeft: item.maxFridgeDays,
          isCycleActive: false,
          isReminderActive: true,
          currentVolumeMl: item.vialSize,
          initialVolumeMl: item.vialSize,
          lifecycleStatus: 'active',
          activatedAt: new Date().toISOString(),
          notificationIds: [],
        };

        set((state) => ({
          freezerStock: (state.freezerStock || []).map((f) =>
            f.id === freezerItemId ? { ...f, quantity: f.quantity - 1 } : f
          ),
          inventory: [newInv, ...(state.inventory || [])],
        }));
      },

      removeInventoryItem: (id) =>
        set((state) => ({
          inventory: (state.inventory || []).filter((inv) => inv.id !== id),
        })),

      updateInventoryItem: (id, updates) =>
        set((state) => ({
          inventory: (state.inventory || []).map((inv) =>
            inv.id === id
              ? { ...inv, ...updates, lifecycleStatus: updates.currentVolumeMl !== undefined && updates.currentVolumeMl <= 0 ? 'empty' : (updates.lifecycleStatus || inv.lifecycleStatus || 'active') }
              : inv
          ),
        })),

      setSchedulePaused: (id, paused) =>
        set((state) => ({
          inventory: (state.inventory || []).map((inv) =>
            inv.id === id ? { ...inv, schedulePaused: paused } : inv
          ),
        })),

      updateSettings: (updates) =>
        set((state) => ({
          settings: {
            ...(state.settings || { allowAiNetwork: false, aiProvider: 'gemini' }),
            ...updates,
            updatedAt: new Date().toISOString(),
          },
        })),

      setNotificationIds: (inventoryId, notificationIds) =>
        set((state) => ({
          inventory: (state.inventory || []).map((item) =>
            item.id === inventoryId ? { ...item, notificationIds: [...notificationIds] } : item
          ),
        })),

      replaceData: (data) =>
        set(() => ({
          inventory: Array.isArray(data.inventory) ? data.inventory.map((item) => normalizeInventoryItem(item)) : [],
          freezerStock: Array.isArray(data.freezerStock)
            ? data.freezerStock.map((item) => ({
                ...item,
                quantity: Math.floor(sanitizePositiveNumber(item.quantity)),
                activeDays: item.activeDays || ['Sen'],
                injectionTime: item.injectionTime || '08:00',
              }))
            : [],
          injectionHistory: Array.isArray(data.injectionHistory) ? data.injectionHistory.map(normalizeInjectionLog) : [],
          currentSite: typeof data.currentSite === 'string' && ROTATION_SITES.includes(data.currentSite)
            ? data.currentSite
            : 'KA',
          settings: {
            allowAiNetwork: Boolean(data.settings?.allowAiNetwork),
            aiProvider: data.settings?.aiProvider === 'openai' ? 'openai' : 'gemini',
            updatedAt: new Date().toISOString(),
          },
        })),
    }),
    {
      name: 'biostack-pro-store',
      storage: createJSONStorage(() => AsyncStorage),
      version: 6,
      migrate: (persistedState: unknown) => {
        const state = (persistedState && typeof persistedState === 'object')
          ? (persistedState as Partial<BioStackState>)
          : {};

        return {
          ...state,
          inventory: Array.isArray(state.inventory) ? state.inventory.map((item) => {
            const normalized = normalizeInventoryItem(item);
            return normalized.initialVolumeMl !== undefined
              ? normalized
              : { ...normalized, initialVolumeMl: getInitialLiquidVolume(normalized) };
          }) : [],
          freezerStock: Array.isArray(state.freezerStock)
            ? state.freezerStock.map((item) => ({
                ...item,
                quantity: Math.floor(sanitizePositiveNumber(item.quantity)),
                activeDays: item.activeDays || ['Sen'],
                injectionTime: item.injectionTime || '08:00',
              }))
            : [],
          injectionHistory: Array.isArray(state.injectionHistory) ? state.injectionHistory.map(normalizeInjectionLog) : [],
          currentSite: typeof state.currentSite === 'string' && ROTATION_SITES.includes(state.currentSite)
            ? state.currentSite
            : 'KA',
          settings: {
            allowAiNetwork: Boolean((state as any).settings?.allowAiNetwork),
            aiProvider: (state as any).settings?.aiProvider === 'openai' ? 'openai' : 'gemini',
            updatedAt: (state as any).settings?.updatedAt,
          },
        };
      },
    }
  )
);
