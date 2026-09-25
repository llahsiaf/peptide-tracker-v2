import { Alert, Platform } from 'react-native';
import type { InventoryItem } from '../types';
import { calculateInjectionMetrics } from './injectionCalculations';

export interface CalendarSyncParams {
  peptideName: string;
  targetDose: number;
  unit: string;
  activeDays: string[];
  injectionTime: string;
  frequencyLabel: string;
  volumeMl?: string;
  dialClicks?: number;
}

const DAY_CODE_MAP: Record<string, string> = {
  Sen: 'MO',
  Sel: 'TU',
  Rab: 'WE',
  Kam: 'TH',
  Jum: 'FR',
  Sab: 'SA',
  Min: 'SU',
};

function buildEventBlock(params: CalendarSyncParams): string {
  const {
    peptideName,
    targetDose,
    unit,
    activeDays,
    injectionTime,
    frequencyLabel,
    volumeMl,
    dialClicks,
  } = params;

  const timeParts = (injectionTime || '08:00').split(/[:.]/);
  const hours = timeParts[0] ? timeParts[0].padStart(2, '0') : '08';
  const minutes = timeParts[1] ? timeParts[1].padStart(2, '0') : '00';

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dtStart = `${year}${month}${day}T${hours}${minutes}00`;

  const utcNow = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
  const utcYear = utcNow.getFullYear();
  const utcMonth = String(utcNow.getMonth() + 1).padStart(2, '0');
  const utcDay = String(utcNow.getDate()).padStart(2, '0');
  const utcHours = String(utcNow.getHours()).padStart(2, '0');
  const utcMinutes = String(utcNow.getMinutes()).padStart(2, '0');
  const dtStamp = `${utcYear}${utcMonth}${utcDay}T${utcHours}${utcMinutes}00Z`;

  const mappedDays = (activeDays || ['Sen']).map((d) => DAY_CODE_MAP[d]).filter(Boolean);
  let rruleString = 'FREQ=WEEKLY';
  if (mappedDays.length > 0) {
    rruleString = `FREQ=WEEKLY;BYDAY=${mappedDays.join(',')}`;
  }

  const cleanId = peptideName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const eventUid = `biostack-${cleanId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}@biostack.pro`;
  const summary = `BioStack: Injeksi ${peptideName} (${targetDose} ${unit})`;
  const description = `Protokol Injeksi Peptida BioStack PRO\\nSenyawa: ${peptideName}\\nTarget Dosis: ${targetDose} ${unit}\\nVolume Spuit: ${volumeMl || '0.200'} mL\\nDial Pen: ${dialClicks || 20} Klik\\nFrekuensi: ${frequencyLabel}\\n\\nRotasikan lokasi subkutan minimal 2.5 cm dari titik sebelumnya.`;

  return [
    'BEGIN:VEVENT',
    `UID:${eventUid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART;TZID=Asia/Jakarta:${dtStart}`,
    `RRULE:${rruleString}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:Waktunya Injeksi ${peptideName}`,
    'TRIGGER:-PT15M',
    'END:VALARM',
    'END:VEVENT',
  ].join('\r\n');
}

async function shareIcsFile(content: string, filename: string, dialogTitle: string): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      return true;
    }

    const [FileSystem, Sharing] = await Promise.all([
      import('expo-file-system'),
      import('expo-sharing'),
    ]);

    const fileUri = `${FileSystem.documentDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/calendar',
        dialogTitle,
        UTI: 'com.apple.ical.ics',
      });
      return true;
    } else {
      Alert.alert('Gagal', 'Fitur berbagi sistem tidak tersedia pada perangkat ini.');
      return false;
    }
  } catch {
    Alert.alert('Gagal mengekspor jadwal', 'Pastikan izin akses file / kalender sistem Anda tidak dibatasi.');
    return false;
  }
}

export async function exportToAppleCalendar(params: CalendarSyncParams): Promise<boolean> {
  const eventBlock = buildEventBlock(params);
  const content = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BioStack PRO//Peptide Protocol//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    eventBlock,
    'END:VCALENDAR',
  ].join('\r\n');

  const cleanFileName = params.peptideName.replace(/[^a-zA-Z0-9]/g, '_');
  return shareIcsFile(content, `${cleanFileName}_Protocol.ics`, `Tambahkan ${params.peptideName} ke Kalender`);
}

export async function exportAllToAppleCalendar(inventory: InventoryItem[]): Promise<{ success: boolean; count: number }> {
  const activeItems = inventory.filter(
    (item) =>
      item.lifecycleStatus !== 'archived' &&
      item.lifecycleStatus !== 'empty' &&
      Array.isArray(item.activeDays) &&
      item.activeDays.length > 0
  );

  if (activeItems.length === 0) {
    Alert.alert(
      'Tidak Ada Protokol Aktif',
      'Tidak ditemukan botol aktif dengan jadwal hari injeksi di inventaris Anda.'
    );
    return { success: false, count: 0 };
  }

  const eventBlocks = activeItems.map((item) => {
    const metrics = calculateInjectionMetrics(item);
    return buildEventBlock({
      peptideName: item.name,
      targetDose: item.targetDose,
      unit: item.doseUnit || item.unit || 'mg',
      activeDays: item.activeDays,
      injectionTime: item.injectionTime || '08:00',
      frequencyLabel: item.frequencyLabel || 'Jadwal Rutin',
      volumeMl: metrics.volumeMl != null ? String(metrics.volumeMl) : undefined,
      dialClicks: metrics.dialClicks,
    });
  });

  const content = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BioStack PRO//All Peptide Protocols//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...eventBlocks,
    'END:VCALENDAR',
  ].join('\r\n');

  const success = await shareIcsFile(
    content,
    'BioStack_All_Protocols.ics',
    `Sinkronkan ${activeItems.length} Protokol Peptida ke Apple Calendar`
  );

  return { success, count: activeItems.length };
}
