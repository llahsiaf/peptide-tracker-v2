import type { InjectionLog, InventoryItem } from '../types';
import { calculateInjectionMetrics } from './injectionCalculations';

export const WEEKDAY_LABELS = [
  'Min',
  'Sen',
  'Sel',
  'Rab',
  'Kam',
  'Jum',
  'Sab',
] as const;

export type WeekdayLabel =
  typeof WEEKDAY_LABELS[number];

export type OccurrenceStatus =
  | 'completed'
  | 'missed'
  | 'due'
  | 'upcoming'
  | 'inactive';

export interface ScheduledOccurrence {
  inventoryId: string;
  peptideName: string;
  date: string;
  time: string;
  completed: boolean;
  missed: boolean;
  status: OccurrenceStatus;
}

export const formatLocalDate = (
  date: Date,
): string => {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0');

  const day = String(
    date.getDate(),
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const weekdayLabelForDate = (
  date: Date,
): WeekdayLabel => {
  return WEEKDAY_LABELS[
    date.getDay()
  ];
};

const parseDateKey = (
  value?: string,
): Date | null => {
  if (
    !value ||
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
  ) {
    return null;
  }

  const [
    year,
    month,
    day,
  ] = value
    .split('-')
    .map(Number);

  const parsed = new Date(
    year,
    month - 1,
    day,
  );

  return Number.isNaN(
    parsed.getTime(),
  )
    ? null
    : parsed;
};

/**
 * Menentukan apakah jadwal peptide
 * aktif pada tanggal tertentu.
 */
export const isInventoryScheduleActiveOnDate = (
  item: Pick<
    InventoryItem,
    | 'activeDays'
    | 'scheduleStartDate'
    | 'scheduleEndDate'
    | 'schedulePaused'
    | 'lifecycleStatus'
  >,
  date: Date,
): boolean => {
  if (
    item.schedulePaused ||
    item.lifecycleStatus ===
      'archived' ||
    item.lifecycleStatus ===
      'empty'
  ) {
    return false;
  }

  const dateKey =
    formatLocalDate(date);

  if (
    item.scheduleStartDate &&
    dateKey <
      item.scheduleStartDate
  ) {
    return false;
  }

  if (
    item.scheduleEndDate &&
    dateKey >
      item.scheduleEndDate
  ) {
    return false;
  }

  const days =
    Array.isArray(
      item.activeDays,
    )
      ? item.activeDays
      : [];

  return days.includes(
    weekdayLabelForDate(date),
  );
};

/**
 * Backward-compatible alias.
 */
export const isInventoryScheduledOnDate = (
  item: Pick<
    InventoryItem,
    | 'activeDays'
    | 'scheduleStartDate'
    | 'scheduleEndDate'
    | 'schedulePaused'
    | 'lifecycleStatus'
  >,
  date: Date,
): boolean => {
  return isInventoryScheduleActiveOnDate(
    item,
    date,
  );
};

/**
 * Mengecek apakah peptide sudah
 * dicatat pada tanggal tertentu.
 */
export const hasCompletedOccurrence = (
  item: Pick<
    InventoryItem,
    'id'
  >,
  date: Date,
  logs: InjectionLog[],
): boolean => {
  const dateKey =
    formatLocalDate(date);

  return logs.some((log) => {
    if (
      log.inventoryId !==
      item.id
    ) {
      return false;
    }

    const timestamp =
      new Date(
        log.timestamp,
      );

    if (
      Number.isNaN(
        timestamp.getTime(),
      )
    ) {
      return false;
    }

    return (
      formatLocalDate(
        timestamp,
      ) === dateKey
    );
  });
};

/**
 * Mengubah HH:mm menjadi
 * total menit dalam satu hari.
 */
const scheduledMinutesFor = (
  time?: string,
): number => {
  const [
    hour,
    minute,
  ] = String(
    time || '08:00',
  )
    .split(':')
    .map(Number);

  const safeHour =
    Number.isFinite(hour)
      ? Math.min(
          23,
          Math.max(0, hour),
        )
      : 8;

  const safeMinute =
    Number.isFinite(minute)
      ? Math.min(
          59,
          Math.max(0, minute),
        )
      : 0;

  return (
    safeHour * 60 +
    safeMinute
  );
};

/**
 * Menentukan apakah Inventory
 * sudah memiliki konfigurasi minimum
 * untuk masuk ke Today.
 *
 * Wajib:
 * - injection time
 * - active days
 * - target dose
 * - volume valid
 * - dial valid
 */
export const isInventoryConfigured = (
  item: InventoryItem,
): boolean => {
  if (
    !item?.injectionTime
  ) {
    return false;
  }

  if (
    !Array.isArray(
      item.activeDays,
    ) ||
    item.activeDays.length === 0
  ) {
    return false;
  }

  const targetDose =
    Number(
      item.targetDose,
    );

  if (
    !Number.isFinite(
      targetDose,
    ) ||
    targetDose <= 0
  ) {
    return false;
  }

  const metrics =
    calculateInjectionMetrics(
      item,
    );

  return (
    metrics.valid &&
    metrics.volumeMlNumber > 0 &&
    metrics.dialClicks > 0
  );
};

/**
 * Menghasilkan satu occurrence
 * untuk satu peptide pada satu tanggal.
 *
 * RULE:
 *
 * Sebelum jam jadwal
 *      ↓
 * MENDATANG
 *
 * Saat jam jadwal sampai
 * kurang dari 3 jam
 *      ↓
 * JATUH TEMPO
 *
 * Tepat 3 jam setelah jadwal
 * atau lebih
 *      ↓
 * TERLEWAT
 *
 * Jika sudah ada log
 *      ↓
 * SELESAI
 */
export const getOccurrenceForDate = (
  item: InventoryItem,
  date: Date,
  now = new Date(),
  logs: InjectionLog[] = [],
): ScheduledOccurrence | null => {
  /**
   * Jangan masukkan Inventory
   * yang belum memiliki konfigurasi.
   */
  if (
    !isInventoryConfigured(
      item,
    )
  ) {
    return null;
  }

  /**
   * Jangan membuat occurrence
   * jika jadwal tidak aktif pada
   * tanggal tersebut.
   */
  if (
    !isInventoryScheduleActiveOnDate(
      item,
      date,
    )
  ) {
    return null;
  }

  const dateKey =
    formatLocalDate(date);

  const todayKey =
    formatLocalDate(now);

  const completed =
    hasCompletedOccurrence(
      item,
      date,
      logs,
    );

  const scheduledMinutes =
    scheduledMinutesFor(
      item.injectionTime,
    );

  const nowMinutes =
    now.getHours() * 60 +
    now.getMinutes();

  const isToday =
    dateKey === todayKey;

  /**
   * Jatuh tempo dimulai TEPAT
   * pada jam yang ditentukan.
   *
   * Contoh jadwal 11:00:
   *
   * 10:59 → belum jatuh tempo
   * 11:00 → jatuh tempo
   */
  const isDue =
    !completed &&
    isToday &&
    nowMinutes >=
      scheduledMinutes &&
    nowMinutes <
      scheduledMinutes + 180;

  /**
   * Terlewat baru aktif setelah
   * window 3 jam selesai.
   *
   * Contoh jadwal 11:00:
   *
   * 13:59 → masih jatuh tempo
   * 14:00 → terlewat
   */
  const isMissed =
    !completed &&
    isToday &&
    nowMinutes >=
      scheduledMinutes + 180;

  let status:
    OccurrenceStatus;

  if (completed) {
    status = 'completed';
  } else if (isMissed) {
    status = 'missed';
  } else if (isDue) {
    status = 'due';
  } else {
    status = 'upcoming';
  }

  return {
    inventoryId:
      item.id,

    peptideName:
      item.name,

    date:
      dateKey,

    time:
      item.injectionTime ||
      '08:00',

    completed,

    missed:
      isMissed,

    status,
  };
};

/**
 * Menghasilkan seluruh occurrence
 * untuk beberapa hari ke depan.
 */
export const getScheduledOccurrences = (
  items: InventoryItem[],
  from = new Date(),
  days = 7,
  logs: InjectionLog[] = [],
): ScheduledOccurrence[] => {
  const occurrences:
    ScheduledOccurrence[] =
    [];

  const count =
    Math.max(
      1,
      Math.floor(days),
    );

  for (
    let offset = 0;
    offset < count;
    offset += 1
  ) {
    const date =
      new Date(from);

    date.setHours(
      12,
      0,
      0,
      0,
    );

    date.setDate(
      from.getDate() +
        offset,
    );

    items.forEach(
      (item) => {
        const occurrence =
          getOccurrenceForDate(
            item,
            date,
            from,
            logs,
          );

        if (occurrence) {
          occurrences.push(
            occurrence,
          );
        }
      },
    );
  }

  /**
   * Selalu kronologis:
   * tanggal → jam.
   */
  return occurrences.sort(
    (a, b) =>
      `${a.date}T${a.time}`.localeCompare(
        `${b.date}T${b.time}`,
      ),
  );
};

/**
 * Menghasilkan occurrence
 * di antara dua tanggal.
 */
export const getScheduledOccurrencesBetween = (
  items: InventoryItem[],
  startDate: Date,
  endDate: Date,
  now = new Date(),
  logs: InjectionLog[] = [],
): ScheduledOccurrence[] => {
  const occurrences:
    ScheduledOccurrence[] =
    [];

  const cursor =
    new Date(startDate);

  cursor.setHours(
    12,
    0,
    0,
    0,
  );

  const end =
    new Date(endDate);

  end.setHours(
    12,
    0,
    0,
    0,
  );

  if (cursor > end) {
    return occurrences;
  }

  while (cursor <= end) {
    items.forEach(
      (item) => {
        const occurrence =
          getOccurrenceForDate(
            item,
            cursor,
            now,
            logs,
          );

        if (occurrence) {
          occurrences.push(
            occurrence,
          );
        }
      },
    );

    cursor.setDate(
      cursor.getDate() + 1,
    );
  }

  return occurrences.sort(
    (a, b) =>
      `${a.date}T${a.time}`.localeCompare(
        `${b.date}T${b.time}`,
      ),
  );
};

/**
 * Semua aktivitas hari ini.
 */
export const getTodayOccurrences = (
  items: InventoryItem[],
  now = new Date(),
  logs: InjectionLog[] = [],
): ScheduledOccurrence[] => {
  return getScheduledOccurrences(
    items,
    now,
    1,
    logs,
  );
};

/**
 * Mengambil jadwal terdekat
 * dari satu peptide.
 */
export const getNextScheduledOccurrence = (
  item: InventoryItem,
  from = new Date(),
  logs: InjectionLog[] = [],
  maxDays = 14,
): ScheduledOccurrence | null => {
  const occurrences =
    getScheduledOccurrences(
      [item],
      from,
      Math.max(
        1,
        maxDays + 1,
      ),
      logs,
    );

  const currentKey =
    formatLocalDate(
      from,
    );

  /**
   * Prioritaskan aktivitas hari ini
   * yang belum selesai.
   *
   * Termasuk:
   * - due
   * - missed
   */
  const today =
    occurrences.find(
      (occurrence) =>
        occurrence.date ===
          currentKey &&
        occurrence.status !==
          'completed',
    );

  if (today) {
    return today;
  }

  /**
   * Jika semua aktivitas hari ini
   * sudah selesai, cari jadwal
   * berikutnya.
   */
  return (
    occurrences.find(
      (occurrence) =>
        occurrence.status ===
        'upcoming',
    ) || null
  );
};

/**
 * Ringkasan aktivitas hari ini.
 */
export const getScheduleSummary = (
  items: InventoryItem[],
  logs: InjectionLog[],
  now = new Date(),
) => {
  const today =
    getTodayOccurrences(
      items,
      now,
      logs,
    );

  return {
    total:
      today.length,

    completed:
      today.filter(
        (item) =>
          item.status ===
          'completed',
      ).length,

    due:
      today.filter(
        (item) =>
          item.status ===
          'due',
      ).length,

    missed:
      today.filter(
        (item) =>
          item.status ===
          'missed',
      ).length,
  };
};

/**
 * Mengecek apakah tanggal
 * berada dalam window schedule.
 */
export const isDateWithinScheduleWindow = (
  item: InventoryItem,
  date: Date,
): boolean => {
  const start =
    parseDateKey(
      item.scheduleStartDate,
    );

  const end =
    parseDateKey(
      item.scheduleEndDate,
    );

  if (
    start &&
    date < start
  ) {
    return false;
  }

  if (end) {
    end.setHours(
      23,
      59,
      59,
      999,
    );

    if (date > end) {
      return false;
    }
  }

  return true;
};
