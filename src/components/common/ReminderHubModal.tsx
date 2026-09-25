import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Bell,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Smartphone,
  ShieldCheck,
  X,
  Sparkles,
  Send,
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../theme';
import { useLanguage } from '../../i18n/LanguageContext';
import { useBioStackStore } from '../../store/useBioStackStore';
import { exportAllToAppleCalendar } from '../../utils/calendarHelper';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendQuickTestNotification,
  rebuildScheduleReminders,
  getScheduledNotificationCount,
} from '../../utils/notificationUtils';

export interface ReminderHubModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ReminderHubModal: React.FC<ReminderHubModalProps> = ({
  visible,
  onClose,
}) => {
  const { language } = useLanguage();
  const inventory = useBioStackStore((state) => state.inventory || []);
  const injectionHistory = useBioStackStore((state) => state.injectionHistory || []);

  const [permStatus, setPermStatus] = useState<string>('checking');
  const [scheduledCount, setScheduledCount] = useState<number>(0);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExportingCal, setIsExportingCal] = useState(false);
  const [testSent, setTestSent] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const perm = await getNotificationPermission();
      setPermStatus(perm.status);
      const count = await getScheduledNotificationCount();
      setScheduledCount(count);
    } catch {
      setPermStatus('unavailable');
    }
  }, []);

  useEffect(() => {
    if (visible) {
      setTestSent(false);
      void loadStatus();
    }
  }, [visible, loadStatus]);

  const handleTogglePermission = async () => {
    try {
      const result = await requestNotificationPermission();
      setPermStatus(result.status);
      if (result.status === 'granted') {
        setIsSyncing(true);
        const idsMap = await rebuildScheduleReminders(inventory, 30, injectionHistory);
        for (const [inventoryId, ids] of idsMap.entries()) {
          useBioStackStore.getState().setNotificationIds(inventoryId, ids);
        }
        await loadStatus();
        setIsSyncing(false);
      } else {
        Alert.alert(
          language === 'en' ? 'Permission Required' : 'Izin Diperlukan',
          language === 'en'
            ? 'Notifications are blocked. Please enable them in iPhone Settings > BioStack > Notifications.'
            : 'Izin notifikasi dibatasi oleh iOS. Buka Pengaturan iPhone > BioStack > Notifikasi untuk mengaktifkannya.'
        );
      }
    } catch {
      setIsSyncing(false);
    }
  };

  const handleTestNotification = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Web Preview', 'Fitur notifikasi lokal berjalan di aplikasi iPhone/iPad (iOS).');
      return;
    }

    if (permStatus !== 'granted') {
      await handleTogglePermission();
      return;
    }

    setIsTesting(true);
    try {
      await sendQuickTestNotification(5);
      setTestSent(true);
      Alert.alert(
        language === 'en' ? 'Test Notification Sent! 🔔' : 'Notifikasi Tes Dikirim! 🔔',
        language === 'en'
          ? 'Lock your iPhone or switch apps now — your test injection reminder will ring in 5 seconds.'
          : 'Kunci iPhone atau minimalkan aplikasi sekarang — notifikasi injeksi tes akan berbunyi dalam 5 detik.'
      );
    } catch {
      Alert.alert(
        language === 'en' ? 'Failed' : 'Gagal',
        language === 'en' ? 'Could not trigger test notification.' : 'Gagal mengirimkan notifikasi tes.'
      );
    } finally {
      setIsTesting(false);
    }
  };

  const handleResyncLocal = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Web Preview', 'Pengingat lokal aktif otomatis saat aplikasi berjalan di iOS.');
      return;
    }

    setIsSyncing(true);
    try {
      const idsMap = await rebuildScheduleReminders(inventory, 30, injectionHistory);
      for (const [inventoryId, ids] of idsMap.entries()) {
        useBioStackStore.getState().setNotificationIds(inventoryId, ids);
      }
      await loadStatus();
      const count = await getScheduledNotificationCount();
      Alert.alert(
        language === 'en' ? 'Reminders Synchronized' : 'Notifikasi Berhasil Disinkronkan',
        language === 'en'
          ? `${count} injection reminders scheduled on device for the next 30 days.`
          : `${count} alarm pengingat injeksi telah dijadwalkan di jam sistem HP untuk 30 hari ke depan.`
      );
    } catch {
      Alert.alert(
        language === 'en' ? 'Sync Failed' : 'Gagal Sinkronisasi',
        language === 'en' ? 'Error scheduling reminders.' : 'Terjadi kendala saat menjadwalkan notifikasi.'
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportAppleCalendar = async () => {
    setIsExportingCal(true);
    try {
      const res = await exportAllToAppleCalendar(inventory);
      if (res.success) {
        // Shared successfully
      }
    } finally {
      setIsExportingCal(false);
    }
  };

  const isGranted = permStatus === 'granted';
  const activeCount = inventory.filter(
    (item) => item.lifecycleStatus !== 'archived' && item.lifecycleStatus !== 'empty'
  ).length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconWrapper}>
                <Bell size={18} color="#DF8A3A" />
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.headerTitle}>
                  {language === 'en' ? 'Reminder & Calendar Hub' : 'Pusat Pengingat & Kalender'}
                </Text>
                <Text style={styles.headerSubtitle}>
                  {language === 'en'
                    ? 'Dual-sync for local alerts & Apple Calendar'
                    : 'Sinkronisasi notifikasi lokal & Apple Calendar'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color="#9c8985" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Status Summary Banner */}
            <View style={styles.statusBanner}>
              <View style={styles.statusCol}>
                <View style={styles.statusItemRow}>
                  <Smartphone size={14} color="#9c8985" />
                  <Text style={styles.statusItemLabel}>
                    {language === 'en' ? 'Local Alerts' : 'Notifikasi HP'}
                  </Text>
                </View>
                <View style={styles.statusBadgeRow}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: isGranted ? '#c2d3b6' : '#f87171' },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusBadgeText,
                      { color: isGranted ? '#c2d3b6' : '#f87171' },
                    ]}
                  >
                    {isGranted
                      ? language === 'en' ? 'Active' : 'Aktif'
                      : language === 'en' ? 'Disabled' : 'Nonaktif'}
                  </Text>
                </View>
              </View>

              <View style={styles.statusDivider} />

              <View style={styles.statusCol}>
                <View style={styles.statusItemRow}>
                  <Clock size={14} color="#9c8985" />
                  <Text style={styles.statusItemLabel}>
                    {language === 'en' ? 'Scheduled' : 'Tersimpan'}
                  </Text>
                </View>
                <Text style={styles.statusCountText}>
                  {scheduledCount} {language === 'en' ? 'Alerts' : 'Alarm'}
                </Text>
              </View>

              <View style={styles.statusDivider} />

              <View style={styles.statusCol}>
                <View style={styles.statusItemRow}>
                  <Sparkles size={14} color="#9c8985" />
                  <Text style={styles.statusItemLabel}>
                    {language === 'en' ? 'Protocols' : 'Protokol'}
                  </Text>
                </View>
                <Text style={styles.statusCountText}>
                  {activeCount} {language === 'en' ? 'Active' : 'Aktif'}
                </Text>
              </View>
            </View>

            {/* Sideloadly & Privacy Safe Guarantee Pill */}
            <View style={styles.guaranteeBox}>
              <ShieldCheck size={16} color="#DF8A3A" style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.guaranteeTitle}>
                  {language === 'en' ? '100% Sideloadly Compatible' : '100% Kompatibel Sideloadly'}
                </Text>
                <Text style={styles.guaranteeText}>
                  {language === 'en'
                    ? 'Uses offline local iOS notifications (UNUserNotificationCenter) and native iCalendar alarms. No paid Apple Developer account or push server required.'
                    : 'Menggunakan pengingat jam lokal iOS dan file iCalendar dengan alarm 15 menit. Berjalan offline tanpa server APNs atau akun developer berbayar.'}
                </Text>
              </View>
            </View>

            {/* ACTION 1: Quick Test Notification */}
            <View style={styles.actionCard}>
              <View style={styles.actionCardHeader}>
                <View style={styles.actionIconBox}>
                  <Send size={15} color="#DF8A3A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionTitle}>
                    {language === 'en' ? 'Test Local Notification' : 'Tes Notifikasi Lokal (5 Detik)'}
                  </Text>
                  <Text style={styles.actionSubtitle}>
                    {language === 'en'
                      ? 'Fires a test reminder in 5 seconds to verify sound and lock-screen alerts.'
                      : 'Uji apakah alarm notifikasi berbunyi di lock screen iOS setelah aplikasi ditutup.'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleTestNotification}
                disabled={isTesting}
                style={[styles.actionBtn, styles.testBtn]}
              >
                {isTesting ? (
                  <ActivityIndicator size="small" color="#DF8A3A" />
                ) : (
                  <>
                    <Bell size={14} color="#DF8A3A" />
                    <Text style={styles.testBtnText}>
                      {testSent
                        ? language === 'en' ? 'Send Test Again (5s)' : 'Kirim Tes Lagi (5s)'
                        : language === 'en' ? 'Send 5s Test Notification' : 'Kirim Notifikasi Tes (5s)'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* ACTION 2: Resync Device Notifications */}
            <View style={styles.actionCard}>
              <View style={styles.actionCardHeader}>
                <View style={styles.actionIconBox}>
                  <RefreshCw size={15} color="#c2d3b6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionTitle}>
                    {language === 'en' ? 'Rebuild Device Reminders' : 'Sinkronkan Ulang Notifikasi HP'}
                  </Text>
                  <Text style={styles.actionSubtitle}>
                    {language === 'en'
                      ? 'Refreshes all 30-day injection alarms with dosage, volume & units.'
                      : 'Perbarui seluruh jadwal injeksi 30 hari ke depan lengkap dengan info dosis & units.'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleResyncLocal}
                disabled={isSyncing}
                style={[styles.actionBtn, styles.syncBtn]}
              >
                {isSyncing ? (
                  <ActivityIndicator size="small" color="#231716" />
                ) : (
                  <>
                    <RefreshCw size={14} color="#231716" />
                    <Text style={styles.syncBtnText}>
                      {language === 'en' ? 'Sync Reminders Now' : 'Sinkronkan Jadwal Sekarang'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* ACTION 3: Export All to Apple Calendar */}
            <View style={styles.actionCard}>
              <View style={styles.actionCardHeader}>
                <View style={styles.actionIconBox}>
                  <Calendar size={15} color="#DF8A3A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionTitle}>
                    {language === 'en' ? 'Sync to Apple Calendar' : 'Sinkronkan ke Apple Calendar'}
                  </Text>
                  <Text style={styles.actionSubtitle}>
                    {language === 'en'
                      ? 'Exports all active peptide protocols to Apple Calendar (.ics) with 15-minute sound alarms. Syncs automatically to Apple Watch!'
                      : 'Ekspor seluruh protokol aktif ke Apple Calendar (.ics) dengan alarm 15 menit sebelum injeksi. Terhubung otomatis ke Apple Watch!'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleExportAppleCalendar}
                disabled={isExportingCal}
                style={[styles.actionBtn, styles.calBtn]}
              >
                {isExportingCal ? (
                  <ActivityIndicator size="small" color="#231716" />
                ) : (
                  <>
                    <Calendar size={14} color="#231716" />
                    <Text style={styles.calBtnText}>
                      {language === 'en' ? 'Add All to Apple Calendar' : 'Masukkan Semua ke Apple Calendar'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* How-to Guide Card */}
            <View style={styles.guideCard}>
              <Text style={styles.guideTitle}>
                {language === 'en' ? 'Tips for Best Experience:' : 'Tips Penggunaan Optimal:'}
              </Text>
              <View style={styles.guideRow}>
                <CheckCircle2 size={13} color="#c2d3b6" style={{ marginTop: 2 }} />
                <Text style={styles.guideText}>
                  {language === 'en'
                    ? 'Apple Calendar sync adds recurring events with 15-min pre-alerts that seamlessly ring on your Apple Watch.'
                    : 'Sinkronisasi Apple Calendar menyalakan alarm 15 menit sebelum injeksi dan bergetar otomatis di Apple Watch.'}
                </Text>
              </View>
              <View style={styles.guideRow}>
                <CheckCircle2 size={13} color="#c2d3b6" style={{ marginTop: 2 }} />
                <Text style={styles.guideText}>
                  {language === 'en'
                    ? 'Device notifications will automatically display the exact dose and syringe units (e.g. 500 mcg (5 Units)).'
                    : 'Notifikasi HP otomatis menyertakan dosis dan units spuit (misal: 500 mcg (5 Units)) agar siap suntik tanpa perlu buka aplikasi.'}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1a100f',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(223, 138, 58, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(223, 138, 58, 0.25)',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f8fafc',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#9c8985',
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  statusBanner: {
    flexDirection: 'row',
    backgroundColor: '#231716',
    borderRadius: RADIUS.lg,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 12,
  },
  statusCol: {
    flex: 1,
    alignItems: 'center',
  },
  statusDivider: {
    width: 1,
    height: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignSelf: 'center',
  },
  statusItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  statusItemLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9c8985',
    textTransform: 'uppercase',
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  statusCountText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#f8fafc',
  },
  guaranteeBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(223, 138, 58, 0.08)',
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(223, 138, 58, 0.22)',
    marginBottom: 14,
  },
  guaranteeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DF8A3A',
    marginBottom: 2,
  },
  guaranteeText: {
    fontSize: 11,
    color: '#d4c7c5',
    lineHeight: 16,
  },
  actionCard: {
    backgroundColor: '#231716',
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 12,
  },
  actionCardHeader: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  actionIconBox: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f8fafc',
  },
  actionSubtitle: {
    fontSize: 11,
    color: '#9c8985',
    lineHeight: 16,
    marginTop: 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: RADIUS.md,
  },
  testBtn: {
    backgroundColor: 'rgba(223, 138, 58, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(223, 138, 58, 0.3)',
  },
  testBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DF8A3A',
  },
  syncBtn: {
    backgroundColor: '#c2d3b6',
  },
  syncBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#231716',
  },
  calBtn: {
    backgroundColor: '#DF8A3A',
    ...SHADOWS.cardGlow,
  },
  calBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#231716',
  },
  guideCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    marginTop: 4,
    marginBottom: 30,
  },
  guideTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9c8985',
    marginBottom: 8,
  },
  guideRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  guideText: {
    fontSize: 11,
    color: '#9c8985',
    lineHeight: 16,
    flex: 1,
  },
});
