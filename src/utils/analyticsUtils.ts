import type { InjectionLog, InventoryItem } from '../types';
import { formatLocalDate, getNextScheduledOccurrence } from './scheduleUtils';

export interface DailyActivityPoint {
  date: string;
  label: string;
  logs: number;
  scheduled: number;
  completed: number;
}

export interface VialJourney {
  id: string;
  name: string;
  lifecycleStatus: string;
  initialVolumeMl: number;
  currentVolumeMl: number;
  usedVolumeMl: number;
  usagePercent: number;
  injectionCount: number;
  lastInjectedAt?: string;
  nextScheduledDate?: string;
  nextScheduledTime?: string;
  notesCount: number;
}

const safeNumber = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const getVialJourneys = (
  inventory: InventoryItem[],
  logs: InjectionLog[],
  now = new Date(),
): VialJourney[] => {
  const safeInventory = Array.isArray(inventory) ? inventory : [];
  const safeLogs = Array.isArray(logs) ? logs.filter(Boolean) : [];

  return safeInventory.map((vial) => {
    const initial = Math.max(0, safeNumber(vial.initialVolumeMl ?? vial.bacWater, 0));
    const current = Math.max(0, safeNumber(vial.currentVolumeMl, initial));
    const used = Math.max(0, initial - current);
    const related = safeLogs
      .filter((log) => log.inventoryId === vial.id)
      .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));

    const next = getNextScheduledOccurrence(vial, now, safeLogs, 60);

    return {
      id: vial.id,
      name: vial.name,
      lifecycleStatus: vial.lifecycleStatus || 'active',
      initialVolumeMl: initial,
      currentVolumeMl: current,
      usedVolumeMl: used,
      usagePercent: initial > 0 ? Math.min(100, Math.round((used / initial) * 100)) : 0,
      injectionCount: related.length,
      lastInjectedAt: related[0]?.timestamp,
      nextScheduledDate: next?.date,
      nextScheduledTime: next?.time,
      notesCount: related.filter((log) => Boolean(log.notes?.trim())).length,
    };
  });
};

const addDays = (date: Date, delta: number) => {
  const next = new Date(date);
  next.setHours(12, 0, 0, 0);
  next.setDate(next.getDate() + delta);
  return next;
};

export const getDailyActivity = (
  logs: InjectionLog[],
  scheduledDates: Array<{ date: string; completed: boolean }>,
  days = 30,
  endDate = new Date(),
): DailyActivityPoint[] => {
  const safeLogs = Array.isArray(logs) ? logs.filter(Boolean) : [];
  const count = Math.max(1, Math.floor(days));
  const result: DailyActivityPoint[] = [];

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = addDays(endDate, -offset);
    const key = formatLocalDate(date);
    const dayLogs = safeLogs.filter((log) => {
      const timestamp = new Date(log.timestamp);
      return !Number.isNaN(timestamp.getTime()) && formatLocalDate(timestamp) === key;
    });
    const scheduled = scheduledDates.filter((item) => item.date === key);

    result.push({
      date: key,
      label: new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: '2-digit' }).format(date),
      logs: dayLogs.length,
      scheduled: scheduled.length,
      completed: scheduled.filter((item) => item.completed).length,
    });
  }

  return result;
};

export const getPeptideUsageStats = (logs: InjectionLog[]) => {
  const counts = new Map<string, { count: number; totalVolumeMl: number; notes: number }>();
  (Array.isArray(logs) ? logs : []).forEach((log) => {
    const name = log.peptideName || 'Tidak diketahui';
    const existing = counts.get(name) || { count: 0, totalVolumeMl: 0, notes: 0 };
    existing.count += 1;
    existing.totalVolumeMl += Math.max(0, safeNumber(log.volumeMl, 0));
    if (log.notes?.trim()) existing.notes += 1;
    counts.set(name, existing);
  });

  return Array.from(counts.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.count - a.count || b.totalVolumeMl - a.totalVolumeMl);
};


export interface PeptideDailyPoint {
  date: string;
  label: string;
  count: number;
  logs: number;
  totalVolumeMl: number;
}

export const getPeptideDailyActivity = (
  logs: InjectionLog[],
  peptideName: string,
  days = 30,
  endDate = new Date(),
): PeptideDailyPoint[] => {
  const safeLogs = Array.isArray(logs) ? logs.filter(Boolean) : [];
  const count = Math.max(1, Math.floor(days));
  const result: PeptideDailyPoint[] = [];

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = addDays(endDate, -offset);
    const key = formatLocalDate(date);
    const dayLogs = safeLogs.filter((log) => {
      if (log.peptideName !== peptideName) return false;
      const timestamp = new Date(log.timestamp);
      return !Number.isNaN(timestamp.getTime()) && formatLocalDate(timestamp) === key;
    });
    result.push({
      date: key,
      label: new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' }).format(date),
      count: dayLogs.length,
      logs: dayLogs.length,
      totalVolumeMl: dayLogs.reduce((sum, log) => sum + Math.max(0, safeNumber(log.volumeMl, 0)), 0),
    });
  }

  return result;
};

export const getAnalyticsDateRange = (days = 30, endDate = new Date()) => {
  const safeDays = Math.max(1, Math.floor(days));
  const start = addDays(endDate, -(safeDays - 1));
  return {
    start: formatLocalDate(start),
    end: formatLocalDate(endDate),
    days: safeDays,
  };
};
