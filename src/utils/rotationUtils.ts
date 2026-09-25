import type { InjectionLog } from '../types';
import { t } from '../i18n/translations';

export const ROTATION_SITE_ORDER = [
  'KA', 'KiA', 'KB', 'KiB', 'PKi', 'PKn', 'LKi', 'LKn', 'BKi', 'BKn',
] as const;

export const SITE_CODE_EN: Record<string, string> = {
  KA: 'RU',
  KiA: 'LU',
  KB: 'RL',
  KiB: 'LL',
  PKi: 'LT',
  PKn: 'RT',
  LKi: 'LA',
  LKn: 'RA',
  BKi: 'LG',
  BKn: 'RG',
};

export function getSiteCode(siteId: string, language?: string) {
  if (language === 'en') {
    return SITE_CODE_EN[siteId] || siteId;
  }
  return siteId;
}

export function getSiteLabel(siteId: string) {
  const key = `rotationSites.${siteId}`;
  const translated = t(key);
  if (translated && translated !== key) return translated;

  const labels: Record<string, string> = {
    KA: 'Perut kanan atas',
    KiA: 'Perut kiri atas',
    KB: 'Perut kanan bawah',
    KiB: 'Perut kiri bawah',
    PKi: 'Paha kiri luar',
    PKn: 'Paha kanan luar',
    LKi: 'Lengan kiri',
    LKn: 'Lengan kanan',
    BKi: 'Bokong kiri',
    BKn: 'Bokong kanan',
  };
  return labels[siteId] || siteId;
}

/**
 * Tracker helper only: chooses the site that has been used least recently
 * for the selected vial. It does not provide medical guidance.
 */
export function getTrackerSuggestedSite(
  injectionHistory: InjectionLog[],
  inventoryId: string,
) {
  const logs = (injectionHistory || [])
    .filter((log) => log.inventoryId === inventoryId && ROTATION_SITE_ORDER.includes(log.siteId as any))
    .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));

  const lastUsed = new Map<string, number>();
  logs.forEach((log, index) => {
    if (!lastUsed.has(log.siteId)) lastUsed.set(log.siteId, index);
  });

  return [...ROTATION_SITE_ORDER]
    .sort((a, b) => (lastUsed.get(b) ?? Number.POSITIVE_INFINITY) - (lastUsed.get(a) ?? Number.POSITIVE_INFINITY))[0];
}
