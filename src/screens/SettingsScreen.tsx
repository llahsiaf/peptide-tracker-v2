import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  ArchiveRestore,
  Bell,
  CheckCircle2,
  Download,
  FileJson,
  LockKeyhole,
  Languages,
  RotateCcw,
  Settings as SettingsIcon,
  ShieldCheck,
  Upload,
  WifiOff,
} from 'lucide-react-native';

import { useBioStackStore } from '../store/useBioStackStore';
import type { BioStackBackupPayload } from '../store/useBioStackStore';
import { useLanguage } from '../i18n/LanguageContext';
import {
  buildBackupPayload,
  exportBackupFile,
  readBackupFile,
} from '../utils/backupUtils';
import {
  getNotificationPermission,
  getScheduledNotificationCount,
  rebuildScheduleReminders,
  requestNotificationPermission,
  sendTestNotification,
} from '../utils/notificationUtils';
import { COLORS } from '../theme';

interface SettingsScreenProps {
  onDone?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onDone }) => {
  const { language, setLanguage, languages, t } = useLanguage();
  const {
    inventory,
    freezerStock,
    injectionHistory,
    currentSite,
    settings,
    updateSettings,
    replaceData,
  } = useBioStackStore();

  const [busy, setBusy] = useState(false);
  const [confirmImportVisible, setConfirmImportVisible] = useState(false);
  const [pendingImportUri, setPendingImportUri] = useState<string | null>(null);
  // Web only: hold selected File object for later confirmation
  const [pendingWebFile, setPendingWebFile] = useState<File | null>(null);
  // Web only: hidden <input type="file"> ref
  const webFileInputRef = useRef<HTMLInputElement | null>(null);

  const [notificationStatus, setNotificationStatus] =
    useState<string>(Platform.OS === 'web' ? 'unavailable' : 'checking');

  const [scheduledNotificationCount, setScheduledNotificationCount] =
    useState(0);

  const run = async (action: () => Promise<void>) => {
    if (busy) return;

    setBusy(true);

    try {
      await action();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Operasi tidak dapat diselesaikan.';

      Alert.alert('Gagal', message);
    } finally {
      setBusy(false);
    }
  };

  const refreshNotifications = async () => {
    try {
      const permission = await getNotificationPermission();

      setNotificationStatus(permission.status);

      const count = await getScheduledNotificationCount();

      setScheduledNotificationCount(count);
    } catch {
      setNotificationStatus('unavailable');
      setScheduledNotificationCount(0);
    }
  };

  const saveNotificationIds = (
    idsByInventory: Map<string, string[]>,
  ) => {
    const store = useBioStackStore.getState();

    for (const [inventoryId, ids] of idsByInventory.entries()) {
      store.setNotificationIds(inventoryId, ids);
    }
  };

  const handleEnableNotifications = () =>
    run(async () => {
      const permission = await requestNotificationPermission();

      setNotificationStatus(permission.status);

      if (permission.status !== 'granted') {
        Alert.alert(
          language === 'en' ? 'Notifications Disabled' : 'Notifikasi belum aktif',
          language === 'en'
            ? 'Permission was not granted. Please enable notifications in device settings and try again.'
            : 'iOS belum memberikan izin notifikasi. Aktifkan izin dari Settings iOS lalu coba lagi.',
        );
        return;
      }

      const idsByInventory = await rebuildScheduleReminders(
        inventory,
        30,
      );

      saveNotificationIds(idsByInventory);

      await refreshNotifications();

      Alert.alert(
        language === 'en' ? 'Notifications Active' : 'Notifikasi aktif',
        language === 'en'
          ? `Local reminders scheduled for ${idsByInventory.size} active vial(s).`
          : `Pengingat lokal dijadwalkan untuk ${idsByInventory.size} vial aktif.`,
      );
    });

  const handleTestNotification = () =>
    run(async () => {
      const permission = await requestNotificationPermission();

      setNotificationStatus(permission.status);

      if (permission.status !== 'granted') {
        Alert.alert(
          language === 'en' ? 'Permission Required' : 'Izin diperlukan',
          language === 'en'
            ? 'Please grant notification permissions in device settings before running the test.'
            : 'Izinkan notifikasi di iOS sebelum menjalankan test.',
        );
        return;
      }

      await sendTestNotification(10);

      await refreshNotifications();

      Alert.alert(
        language === 'en' ? 'Test Scheduled' : 'Test dijadwalkan',
        language === 'en'
          ? 'BioStack will attempt to show a local notification in about 10 seconds from now.'
          : 'BioStack akan mencoba menampilkan notifikasi lokal sekitar 10 detik dari sekarang.',
      );
    });

  const handleRebuildNotifications = () =>
    run(async () => {
      const permission = await getNotificationPermission();

      setNotificationStatus(permission.status);

      if (permission.status !== 'granted') {
        Alert.alert(
          language === 'en' ? 'Permission Required' : 'Izin diperlukan',
          language === 'en'
            ? 'Please enable notification permissions first.'
            : 'Aktifkan izin notifikasi terlebih dahulu.',
        );
        return;
      }

      const idsByInventory = await rebuildScheduleReminders(
        inventory,
        30,
      );

      saveNotificationIds(idsByInventory);

      await refreshNotifications();

      Alert.alert(
        language === 'en' ? 'Reminders Updated' : 'Reminder diperbarui',
        language === 'en'
          ? 'All BioStack local reminders have been rebuilt for the next 30 days.'
          : 'Semua local reminder BioStack dibangun ulang untuk 30 hari ke depan.',
      );
    });

  useEffect(() => {
    void refreshNotifications();
  }, []);

  const handleExport = () =>
    run(async () => {
      const payload = buildBackupPayload({
        inventory,
        freezerStock,
        injectionHistory,
        currentSite,
        settings:
          settings || {
            allowAiNetwork: false,
            aiProvider: 'gemini',
          },
      });

      await exportBackupFile(payload);

      Alert.alert(
        language === 'en' ? 'Backup Ready' : 'Backup siap',
        language === 'en'
          ? 'BioStack backup file has been created. Store it in a safe place.'
          : 'File backup BioStack telah dibuat. Simpan di lokasi yang aman.',
      );
    });

  // Web only: called when the hidden <input type="file"> fires a change event
  const handleWebFileInputChange = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    // Reset value so the same file can be re-selected later
    input.value = '';

    const validation = await readBackupFile(file);
    if (!validation.valid || !validation.payload) {
      Alert.alert(
        language === 'en' ? 'Invalid Backup' : 'Backup tidak valid',
        validation.error || (language === 'en' ? 'File is not a valid BioStack backup.' : 'File bukan backup BioStack yang valid.'),
      );
      return;
    }
    setPendingWebFile(file);
    setConfirmImportVisible(true);
  };

  const handlePickImport = () =>
    run(async () => {
      if (Platform.OS === 'web') {
        // Create (or reuse) a hidden file input and click it
        if (!webFileInputRef.current) {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.json,application/json';
          input.style.display = 'none';
          input.addEventListener('change', (e) => { void handleWebFileInputChange(e); });
          document.body.appendChild(input);
          webFileInputRef.current = input;
        }
        webFileInputRef.current.click();
        return;
      }

      const DocumentPicker = await import('expo-document-picker');
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (
        result.canceled ||
        !result.assets ||
        !result.assets[0] ||
        !result.assets[0].uri
      ) {
        return;
      }

      const uri = result.assets[0].uri;

      const validation = await readBackupFile(uri);

      if (!validation.valid || !validation.payload) {
        Alert.alert(
          language === 'en' ? 'Invalid Backup' : 'Backup tidak valid',
          validation.error ||
            (language === 'en' ? 'File is not a valid BioStack backup.' : 'File bukan backup BioStack yang valid.'),
        );
        return;
      }

      setPendingImportUri(uri);
      setConfirmImportVisible(true);
    });

  const confirmImport = () => {
    const hasNative = !!pendingImportUri;
    const hasWeb = !!pendingWebFile;
    if ((!hasNative && !hasWeb) || busy) return;

    void run(async () => {
      let validation: { valid: boolean; payload?: BioStackBackupPayload; error?: string };

      if (Platform.OS === 'web' && pendingWebFile) {
        validation = await readBackupFile(pendingWebFile);
      } else {
        validation = await readBackupFile(pendingImportUri!);
      }

      if (!validation.valid || !validation.payload) {
        Alert.alert(
          language === 'en' ? 'Import Cancelled' : 'Import dibatalkan',
          validation.error || (language === 'en' ? 'Invalid backup.' : 'Backup tidak valid.'),
        );
        return;
      }

      replaceData(validation.payload.data);

      setPendingImportUri(null);
      setPendingWebFile(null);
      setConfirmImportVisible(false);

      Alert.alert(
        language === 'en' ? 'Restore Complete' : 'Restore selesai',
        language === 'en'
          ? 'Data from backup has been loaded. The app is now using the backup contents.'
          : 'Data dari backup sudah dimuat. Aplikasi sekarang menggunakan isi backup tersebut.',
      );
    });
  };

  const handleCancelImport = () => {
    if (busy) return;

    setConfirmImportVisible(false);
    setPendingImportUri(null);
    setPendingWebFile(null);
  };

  const handleReset = () => {
    if (busy) return;

    Alert.alert(
      language === 'en' ? 'Reset local data?' : 'Reset data lokal?',
      language === 'en'
        ? 'This will delete inventory, freezer, and history from this device. Exported backups will not be deleted.'
        : 'Ini akan menghapus inventory, freezer, dan history dari perangkat ini. Backup yang sudah diekspor tidak akan terhapus.',
      [
        {
          text: language === 'en' ? 'Cancel' : 'Batal',
          style: 'cancel',
        },
        {
          text: language === 'en' ? 'Reset' : 'Reset',
          style: 'destructive',
          onPress: () => {
            void run(async () => {
              replaceData({
                inventory: [],
                freezerStock: [],
                injectionHistory: [],
                currentSite: 'KA',
                settings: {
                  allowAiNetwork: false,
                  aiProvider: 'gemini',
                },
              });

              Alert.alert(
                language === 'en' ? 'Done' : 'Selesai',
                language === 'en' ? 'BioStack local data has been reset.' : 'Data lokal BioStack sudah di-reset.',
              );
            });
          },
        },
      ],
    );
  };

  const aiNetworkAllowed = Boolean(settings?.allowAiNetwork);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <SettingsIcon size={20} color={COLORS.accent} />
          </View>

          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>APP SETTINGS</Text>

            <Text style={styles.title}>{t('settings.title') || 'Pengaturan BioStack'}</Text>

            <Text style={styles.subtitle}>{t('settings.subtitle') || 'Backup, privacy, dan kontrol data lokal.'}</Text>
          </View>

          {onDone && (
            <TouchableOpacity
              onPress={onDone}
              disabled={busy}
              style={styles.doneBtn}
              accessibilityRole="button"
              accessibilityLabel="Tutup pengaturan"
            >
              <CheckCircle2
                size={16}
                color={busy ? '#475569' : COLORS.accent}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* LANGUAGE */}
        <SectionTitle
          icon={
            <Languages
              size={16}
              color={COLORS.accent}
            />
          }
          title={t('settings.language')}
        />

        <View style={styles.card}>
          <Text style={styles.rowTitle}>
            {t('settings.languageDescription')}
          </Text>

          <View style={styles.languageSelector}>
            {languages.map((option) => {
              const active = language === option.code;

              return (
                <TouchableOpacity
                  key={option.code}
                  onPress={() => setLanguage(option.code)}
                  style={[
                    styles.languageOption,
                    active && styles.languageOptionActive,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={option.label}
                >
                  <Text
                    style={[
                      styles.languageOptionCode,
                      active && styles.languageOptionCodeActive,
                    ]}
                  >
                    {option.shortLabel}
                  </Text>

                  <Text
                    style={[
                      styles.languageOptionLabel,
                      active && styles.languageOptionLabelActive,
                    ]}
                  >
                    {option.label}
                  </Text>

                  {active && (
                    <CheckCircle2
                      size={15}
                      color={COLORS.accent}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* BACKUP & RESTORE */}
        <SectionTitle
          icon={
            <ArchiveRestore
              size={16}
              color={COLORS.accent}
            />
          }
          title="Backup & Restore"
        />

        <View style={styles.card}>
          <Row
            icon={
              <Download
                size={18}
                color={COLORS.accent}
              />
            }
            title={t("settings.exportAllData") || "Ekspor seluruh data"}
            desc={t("settings.exportAllDataDesc") || "Membuat satu file JSON berisi inventory, freezer, history, rotasi, dan pengaturan tracker."}
            buttonLabel={
              busy ? (language === 'en' ? 'Processing…' : 'Memproses…') : (t('settings.exportBackup') || 'Ekspor Backup')
            }
            onPress={handleExport}
            disabled={busy}
          />

          <Divider />

          <Row
            icon={
              <Upload
                size={18}
                color={COLORS.accent}
              />
            }
            title={t("settings.restoreFromBackup") || "Restore dari backup"}
            desc={t("settings.restoreFromBackupDesc") || "Pilih file BioStack JSON untuk mengganti data lokal dengan checkpoint yang kamu simpan."}
            buttonLabel={
              busy ? (language === 'en' ? 'Processing…' : 'Memproses…') : (t('settings.pickFile') || 'Pilih File')
            }
            onPress={handlePickImport}
            disabled={busy}
          />

          <View style={styles.warningBox}>
            <FileJson
              size={15}
              color="#f59e0b"
            />

            <Text style={styles.warningText}>{t('settings.restoreWarning') || 'Restore akan mengganti data lokal saat ini. Ekspor backup terbaru sebelum melakukan restore.'}</Text>
          </View>
        </View>

        {/* LOCAL NOTIFICATIONS */}
        <SectionTitle
          icon={
            <Bell
              size={16}
              color="#f59e0b"
            />
          }
          title="Local Notifications"
        />

        <View style={styles.card}>
          {Platform.OS === 'web' ? (
            <View style={styles.warningBox}>
              <Bell size={15} color="#f59e0b" />
              <Text style={styles.warningText}>
                {language === 'en'
                  ? 'Push notifications are only available on the iOS / Android app. Install BioStack on your mobile device to receive injection reminders.'
                  : 'Notifikasi hanya tersedia di aplikasi iOS / Android. Install BioStack di perangkat mobile untuk menerima pengingat injeksi.'}
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.notificationStatusRow}>
                <View style={styles.statusCopy}>
                  <Text style={styles.rowTitle}>
                    Status
                  </Text>

                  <Text style={styles.rowDesc}>
                    {notificationStatus === 'granted'
                      ? (language === 'en' ? `Authorized • ${scheduledNotificationCount} reminder(s) scheduled` : `Authorized • ${scheduledNotificationCount} reminder terjadwal`)
                      : notificationStatus === 'denied'
                        ? (language === 'en' ? 'Denied / blocked by iOS' : 'Denied / blocked oleh iOS')
                        : notificationStatus === 'checking'
                          ? (language === 'en' ? 'Checking permission…' : 'Memeriksa izin…')
                          : notificationStatus === 'unavailable'
                            ? (language === 'en' ? 'Notification API is unavailable' : 'Notification API tidak tersedia')
                            : (language === 'en' ? 'Not enabled' : 'Belum diaktifkan')}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusPill,
                    notificationStatus === 'granted' &&
                      styles.statusPillOk,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      notificationStatus === 'granted' &&
                        styles.statusPillTextOk,
                    ]}
                  >
                    {notificationStatus === 'granted'
                      ? 'READY'
                      : 'OFF'}
                  </Text>
                </View>
              </View>

              <Text style={styles.notificationHint}>{t('settings.notificationHint') || (language === 'en' ? 'BioStack uses local notifications. No server or push notifications needed; reminders are generated from schedules stored on your device.' : 'BioStack memakai local notifications. Tidak membutuhkan server atau push notification; reminder dibuat dari schedule yang tersimpan di perangkat.')}</Text>

              <View style={styles.notificationActions}>
                <TouchableOpacity
                  onPress={handleEnableNotifications}
                  disabled={busy}
                  style={[
                    styles.notificationActionPrimary,
                    busy && styles.disabledControl,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={language === 'en' ? 'Enable notifications' : 'Aktifkan notifikasi'}
                >
                  <Bell
                    size={14}
                    color="#231716"
                  />

                  <Text
                    style={styles.notificationActionPrimaryText}
                  >
                    {language === 'en' ? 'Enable & Schedule' : 'Aktifkan & Jadwalkan'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleTestNotification}
                  disabled={busy}
                  style={[
                    styles.notificationActionSecondary,
                    busy && styles.disabledControl,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={language === 'en' ? 'Test notification' : 'Test notifikasi'}
                >
                  <Text
                    style={styles.notificationActionSecondaryText}
                  >
                    {language === 'en' ? 'Test 10s' : 'Test 10 dtk' /* Test 10 dtk */}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleRebuildNotifications}
                disabled={busy}
                style={[
                  styles.rebuildBtn,
                  busy && styles.disabledControl,
                ]}
                accessibilityRole="button"
                accessibilityLabel={language === 'en' ? 'Rebuild reminders' : 'Bangun ulang reminder'}
              >
                <RotateCcw
                  size={14}
                  color="#f59e0b"
                />

                <Text style={styles.rebuildText}>
                  {language === 'en' ? 'Rebuild 30-Day Reminders' : 'Rebuild Reminder 30 Hari' /* Rebuild Reminder 30 Hari */}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* PRIVACY */}
        <SectionTitle
          icon={
            <ShieldCheck
              size={16}
              color={COLORS.accent}
            />
          }
          title="Privacy"
        />

        <View style={styles.card}>
          <View style={styles.privacyRow}>
            <View style={styles.iconCircle}>
              <WifiOff
                size={17}
                color={
                  aiNetworkAllowed
                    ? '#64748b'
                    : COLORS.accent
                }
              />
            </View>

            <View style={styles.privacyCopy}>
              <Text style={styles.rowTitle}>
                {language === 'en' ? 'Allow online AI connection' : 'Izinkan koneksi AI online'}
              </Text>

              <Text style={styles.rowDesc}>
                {language === 'en'
                  ? 'Default OFF. When active, messages sent to AI can be routed to the selected provider in AI settings.'
                  : 'Default OFF. Saat aktif, pesan yang kamu kirim ke AI dapat dikirim ke provider yang dipilih di pengaturan AI.'}
              </Text>
            </View>

            <TouchableOpacity
              accessibilityRole="switch"
              accessibilityState={{
                checked: aiNetworkAllowed,
              }}
              accessibilityLabel={language === 'en' ? 'Allow online AI connection' : 'Izinkan koneksi AI online'}
              onPress={() =>
                updateSettings({
                  allowAiNetwork: !aiNetworkAllowed,
                })
              }
              style={[
                styles.switch,
                aiNetworkAllowed && styles.switchOn,
              ]}
            >
              <View
                style={[
                  styles.switchKnob,
                  aiNetworkAllowed &&
                    styles.switchKnobOn,
                ]}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.secureNote}>
            <LockKeyhole
              size={15}
              color="#94a3b8"
            />

            <Text style={styles.secureNoteText}>
              {language === 'en' ? 'AI API keys are not included in BioStack backup files.' : 'API key AI tidak ikut dimasukkan ke file backup BioStack.' /* API key AI tidak ikut */}
            </Text>
          </View>
        </View>

        {/* LOCAL DATA */}
        <SectionTitle
          icon={
            <RotateCcw
              size={16}
              color="#f59e0b"
            />
          }
          title={language === 'en' ? 'Local Data' : 'Data lokal'}
        />

        <View style={styles.card}>
          <View style={styles.statsGrid}>
            <Stat
              label={language === 'en' ? 'Active/archive vials' : 'Vial aktif/arsip'}
              value={String(inventory.length)}
            />

            <Stat
              label="Freezer records"
              value={String(freezerStock.length)}
            />

            <Stat
              label="Injection logs"
              value={String(injectionHistory.length)}
            />

            <Stat
              label={language === 'en' ? 'Backup format' : 'Format backup'}
              value="v1"
            />
          </View>

          <TouchableOpacity
            onPress={handleReset}
            disabled={busy}
            style={[
              styles.resetBtn,
              busy && styles.disabledControl,
            ]}
            accessibilityRole="button"
            accessibilityLabel={language === 'en' ? 'Reset local data' : 'Reset data lokal'}
          >
            <RotateCcw
              size={15}
              color="#fca5a5"
            />

            <Text style={styles.resetText}>
              {language === 'en' ? 'Reset Local Data' : 'Reset Data Lokal'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>
            {language === 'en'
              ? 'BioStack backup schema v5 • Tracker data stays on device unless online AI features are permitted.'
              : 'BioStack backup schema v5 • Data tracker tetap berada di perangkat kecuali fitur online AI diizinkan.'}
          </Text>
        </View>
      </ScrollView>

      {/* RESTORE CONFIRMATION */}
      <Modal
        visible={confirmImportVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelImport}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmCard}>
            <ArchiveRestore
              size={22}
              color="#f59e0b"
            />

            <Text style={styles.confirmTitle}>
              {language === 'en' ? 'Confirm Restore' : 'Konfirmasi Restore'}
            </Text>

            <Text style={styles.confirmText}>
              {language === 'en'
                ? 'Current local data will be replaced by backup contents. Ensure you have a recent backup.'
                : 'Data lokal sekarang akan digantikan oleh isi backup. Pastikan kamu sudah punya salinan data saat ini.'}
            </Text>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                onPress={handleCancelImport}
                disabled={busy}
                style={[
                  styles.secondaryBtn,
                  busy && styles.disabledControl,
                ]}
              >
                <Text style={styles.secondaryText}>
                  {language === 'en' ? 'Cancel' : 'Batal'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmImport}
                disabled={busy || (!pendingImportUri && !pendingWebFile)}
                style={[
                  styles.primaryBtn,
                  (busy || (!pendingImportUri && !pendingWebFile)) &&
                    styles.disabledControl,
                ]}
              >
                <Text style={styles.primaryText}>
                  Restore
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const SectionTitle = ({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) => (
  <View style={styles.sectionTitle}>
    <View style={styles.sectionIcon}>
      {icon}
    </View>

    <Text style={styles.sectionTitleText}>
      {title}
    </Text>
  </View>
);

const Row = ({
  icon,
  title,
  desc,
  buttonLabel,
  onPress,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  buttonLabel: string;
  onPress: () => void;
  disabled?: boolean;
}) => (
  <View style={styles.row}>
    <View style={styles.iconCircle}>
      {icon}
    </View>

    <View style={styles.rowCopy}>
      <Text style={styles.rowTitle}>
        {title}
      </Text>

      <Text style={styles.rowDesc}>
        {desc}
      </Text>
    </View>

    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.actionBtn,
        disabled && styles.disabledControl,
      ]}
    >
      <Text style={styles.actionText}>
        {buttonLabel}
      </Text>
    </TouchableOpacity>
  </View>
);

const Divider = () => (
  <View style={styles.divider} />
);

const Stat = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <View style={styles.stat}>
    <Text style={styles.statValue}>
      {value}
    </Text>

    <Text style={styles.statLabel}>
      {label}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },

  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(223, 138, 58, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroCopy: {
    flex: 1,
  },

  eyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: COLORS.muted,
  },

  title: {
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.text,
    marginTop: 3,
  },

  subtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  doneBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: COLORS.cardElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    marginTop: 6,
  },

  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionTitleText: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.text,
  },

  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rowCopy: {
    flex: 1,
  },

  rowTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
  },

  rowDesc: {
    fontSize: 10,
    color: COLORS.muted,
    lineHeight: 15,
    marginTop: 3,
  },

  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 9,
    backgroundColor: 'rgba(223, 138, 58, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(223, 138, 58, 0.35)',
  },

  actionText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.accent,
  },

  disabledControl: {
    opacity: 0.5,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },

  warningBox: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(245,158,11,.07)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,.18)',
  },

  warningText: {
    flex: 1,
    fontSize: 9,
    color: COLORS.textSecondary,
    lineHeight: 14,
  },

  notificationStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  statusCopy: {
    flex: 1,
  },

  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: COLORS.cardElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  statusPillOk: {
    backgroundColor: 'rgba(194, 211, 182, 0.12)',
    borderColor: 'rgba(194, 211, 182, 0.3)',
  },

  statusPillText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    color: COLORS.muted,
  },

  statusPillTextOk: {
    color: COLORS.sage,
  },

  notificationHint: {
    fontSize: 9,
    color: COLORS.muted,
    lineHeight: 14,
    marginTop: 10,
  },

  notificationActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },

  notificationActionPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.accent,
  },

  notificationActionPrimaryText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#231716',
  },

  notificationActionSecondary: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.cardElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
  },

  notificationActionSecondaryText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.textSecondary,
  },

  rebuildBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,.25)',
    backgroundColor: 'rgba(245,158,11,.06)',
  },

  rebuildText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#fbbf24',
  },

  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  privacyCopy: {
    flex: 1,
  },

  switch: {
    width: 42,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.cardElevated,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },

  switchOn: {
    backgroundColor: COLORS.accent,
  },

  switchKnob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.muted,
  },

  switchKnobOn: {
    alignSelf: 'flex-end',
    backgroundColor: '#231716',
  },

  secureNote: {
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    paddingTop: 12,
  },

  secureNoteText: {
    flex: 1,
    fontSize: 9,
    color: COLORS.muted,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  stat: {
    width: '48%',
    padding: 10,
    borderRadius: 12,
    backgroundColor: COLORS.cardElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  statValue: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
  },

  statLabel: {
    fontSize: 9,
    color: COLORS.muted,
    marginTop: 3,
  },

  resetBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,.3)',
    backgroundColor: 'rgba(239,68,68,.06)',
  },

  resetText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fca5a5',
  },

  versionText: {
    fontSize: 8,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 13,
  },

  languageSelector: {
    marginTop: 10,
    gap: 8,
  },

  languageOption: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 11,
    borderRadius: 10,
    backgroundColor: COLORS.bgDarker,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  languageOptionActive: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(223, 138, 58, 0.12)',
  },

  languageOptionCode: {
    width: 32,
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.muted,
  },

  languageOptionCodeActive: {
    color: COLORS.accent,
  },

  languageOptionLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },

  languageOptionLabelActive: {
    color: COLORS.text,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  confirmCard: {
    width: '100%',
    maxWidth: 390,
    borderRadius: 18,
    padding: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  confirmTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
    marginTop: 10,
  },

  confirmText: {
    fontSize: 11,
    color: COLORS.muted,
    lineHeight: 17,
    marginTop: 6,
  },

  confirmActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },

  secondaryBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: COLORS.cardElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  secondaryText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.muted,
  },

  primaryBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: COLORS.accent,
  },

  primaryText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#231716',
  },
});
