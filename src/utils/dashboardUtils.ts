import type { InjectionLog, InventoryItem } from '../types';
import {
  formatLocalDate,
  getScheduledOccurrences,
  getScheduleSummary,
  type ScheduledOccurrence,
} from './scheduleUtils';

export interface DashboardAnalytics {
  activeVials: number;
  emptyVials: number;
  archivedVials: number;
  freezerVials: number;
  totalLogs: number;
  last30DaysLogs: number;
  scheduledLast30Days: number;
  completedScheduledLast30Days: number;
  missedScheduledToday: number;
  todayCompletionPercent: number;
  schedule7DayTotal: number;
  schedule7DayCompleted: number;
  topPeptides: Array<{ name: string; count: number }>;
}

export const getLogsForLocalDate = (logs: InjectionLog[], date: Date): InjectionLog[] => {
  const key = formatLocalDate(date);
  return (Array.isArray(logs) ? logs : []).filter((log) => {
    if (!log?.timestamp) return false;
    const parsed = new Date(log.timestamp);
    return !Number.isNaN(parsed.getTime()) && formatLocalDate(parsed) === key;
  });
};

export const getDashboardAnalytics = (
  inventory: InventoryItem[],
  freezerVials: number,
  logs: InjectionLog[],
  now = new Date(),
): DashboardAnalytics => {
  const safeInventory = Array.isArray(inventory) ? inventory : [];
  const safeLogs = Array.isArray(logs) ? logs.filter(Boolean) : [];
  const activeVials = safeInventory.filter((item) => item?.lifecycleStatus !== 'empty' && item?.lifecycleStatus !== 'archived').length;
  const emptyVials = safeInventory.filter((item) => item?.lifecycleStatus === 'empty').length;
  const archivedVials = safeInventory.filter((item) => item?.lifecycleStatus === 'archived').length;

  const last30Start = new Date(now);
  last30Start.setHours(0, 0, 0, 0);
  last30Start.setDate(last30Start.getDate() - 29);

  const last30DaysLogs = safeLogs.filter((log) => {
    const parsed = new Date(log.timestamp);
    return !Number.isNaN(parsed.getTime()) && parsed >= last30Start && parsed <= now;
  }).length;

  const scheduledLast30 = getScheduledOccurrences(safeInventory, last30Start, 30, safeLogs);
  const scheduled7 = getScheduledOccurrences(safeInventory, now, 7, safeLogs);
  const today = getScheduleSummary(safeInventory, safeLogs, now);

  const counts = new Map<string, number>();
  safeLogs.forEach((log) => counts.set(log.peptideName || 'Tidak diketahui', (counts.get(log.peptideName || 'Tidak diketahui') || 0) + 1));
  const topPeptides = Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 4);

  return {
    activeVials,
    emptyVials,
    archivedVials,
    freezerVials: Math.max(0, Number(freezerVials) || 0),
    totalLogs: safeLogs.length,
    last30DaysLogs,
    scheduledLast30Days: scheduledLast30.length,
    completedScheduledLast30Days: scheduledLast30.filter((item) => item.status === 'completed').length,
    missedScheduledToday: today.missed,
    todayCompletionPercent: today.total > 0 ? Math.round((today.completed / today.total) * 100) : 0,
    schedule7DayTotal: scheduled7.length,
    schedule7DayCompleted: scheduled7.filter((item) => item.status === 'completed').length,
    topPeptides,
  };
};

export const getOccurrenceStatusLabel = (occurrence: ScheduledOccurrence, lang?: string): string => {
  const isEn = lang === 'en';
  switch (occurrence.status) {
    case 'completed': return isEn ? 'Completed' : 'Selesai';
    case 'missed': return isEn ? 'Missed' : 'Terlewat';
    case 'due': return isEn ? 'Due' : 'Jatuh tempo';
    case 'upcoming': return isEn ? 'Upcoming' : 'Mendatang';
    default: return isEn ? 'Inactive' : 'Tidak aktif';
  }
};
