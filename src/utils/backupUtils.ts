import { Platform } from 'react-native';
import type { BioStackBackupPayload } from '../store/useBioStackStore';

const BACKUP_FORMAT = 'biostack-pro-backup' as const;
const BACKUP_VERSION = 1;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export function buildBackupPayload(
  data: BioStackBackupPayload['data'],
  appVersion = '1.0.0'
): BioStackBackupPayload {
  return {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_VERSION,
    appVersion,
    schemaVersion: 5,
    exportedAt: new Date().toISOString(),
    data: {
      inventory: data.inventory,
      freezerStock: data.freezerStock,
      injectionHistory: data.injectionHistory,
      currentSite: data.currentSite,
      settings: {
        allowAiNetwork: Boolean(data.settings?.allowAiNetwork),
        aiProvider: data.settings?.aiProvider === 'openai' ? 'openai' : 'gemini',
      },
    },
  };
}

export function validateBackupPayload(value: unknown): {
  valid: boolean;
  payload?: BioStackBackupPayload;
  error?: string;
} {
  if (!isObject(value) || value.format !== BACKUP_FORMAT) {
    return { valid: false, error: 'Format backup tidak dikenali.' };
  }
  if (value.formatVersion !== BACKUP_VERSION) {
    return { valid: false, error: `Versi backup ${String(value.formatVersion)} tidak didukung.` };
  }
  if (!isObject(value.data)) {
    return { valid: false, error: 'Bagian data backup tidak ditemukan.' };
  }

  const data = value.data;
  if (!Array.isArray(data.inventory) || !Array.isArray(data.freezerStock) || !Array.isArray(data.injectionHistory)) {
    return { valid: false, error: 'Data inventory/freezer/history tidak valid.' };
  }
  if (typeof data.currentSite !== 'string') {
    return { valid: false, error: 'Titik rotasi saat ini tidak valid.' };
  }

  return { valid: true, payload: value as unknown as BioStackBackupPayload };
}

// ---------------------------------------------------------------------------
// Web helper: trigger a file download in the browser via a Blob + anchor tag.
// ---------------------------------------------------------------------------
function downloadBlobWeb(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Web helper: read a File object as text (used after <input type="file">).
// ---------------------------------------------------------------------------
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) ?? '');
    reader.onerror = () => reject(new Error('Gagal membaca file.'));
    reader.readAsText(file, 'utf-8');
  });
}

export async function exportBackupFile(payload: BioStackBackupPayload): Promise<string> {
  const jsonStr = JSON.stringify(payload, null, 2);
  const stamp = payload.exportedAt.replace(/[:.]/g, '-');
  const filename = `BioStack_PRO_Backup_${stamp}.json`;

  if (Platform.OS === 'web') {
    downloadBlobWeb(jsonStr, filename, 'application/json');
    return filename;
  }

  // Native path — lazy import expo-file-system & expo-sharing
  const [FileSystem, Sharing] = await Promise.all([
    import('expo-file-system'),
    import('expo-sharing'),
  ]);

  if (!FileSystem.documentDirectory) throw new Error('Direktori dokumen tidak tersedia.');

  const uri = `${FileSystem.documentDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, jsonStr, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const sharingAvailable = await Sharing.isAvailableAsync();
  if (!sharingAvailable) return uri;

  await Sharing.shareAsync(uri, {
    mimeType: 'application/json',
    dialogTitle: Platform.OS === 'ios' ? 'Simpan / Bagikan Backup BioStack' : 'Ekspor Backup BioStack',
    UTI: 'public.json',
  });

  return uri;
}

/**
 * On web: pass a File object from <input type="file">.
 * On native: pass a uri string from expo-document-picker.
 */
export async function readBackupFile(uriOrFile: string | File): Promise<{
  valid: boolean;
  payload?: BioStackBackupPayload;
  error?: string;
}> {
  try {
    let raw: string;

    if (Platform.OS === 'web') {
      if (typeof uriOrFile === 'string') {
        return { valid: false, error: 'Pada web, gunakan objek File dari input file.' };
      }
      raw = await readFileAsText(uriOrFile as File);
    } else {
      const FileSystem = await import('expo-file-system');
      raw = await FileSystem.readAsStringAsync(uriOrFile as string, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    }

    return validateBackupPayload(JSON.parse(raw));
  } catch {
    return { valid: false, error: 'File backup tidak dapat dibaca atau JSON rusak.' };
  }
}
