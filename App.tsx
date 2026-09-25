import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Image,
  Alert,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import {
  Activity,
  FlaskConical,
  RotateCw,
  History,
  Snowflake,
  TrendingUp,
  Bell,
  Settings,
  ShieldCheck,
  Calculator,
} from 'lucide-react-native';

import { InventoryScreen } from './src/screens/InventoryScreen';
import { RotationScreen } from './src/screens/RotationScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { FreezerScreen } from './src/screens/FreezerScreen';
import { FloatingAIChat } from './src/components/FloatingAIChat';
import { TodayScreen } from './src/screens/TodayScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { GenericDosingCalculatorModal } from './src/components/GenericDosingCalculatorModal';
import { COLORS, RADIUS, SHADOWS } from './src/theme';
import { useBioStackStore } from './src/store/useBioStackStore';
import { getNotificationPermission, rebuildScheduleReminders } from './src/utils/notificationUtils';
import { LanguageProvider, useLanguage } from './src/i18n/LanguageContext';

// Konfigurasi handler notifikasi lokal internal — hanya pada native (iOS/Android)
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

function BioStackApp() {
  const { language, t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'today' | 'inventory' | 'rotation' | 'history' | 'freezer' | 'analytics' | 'settings'>('today');
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [notificationTarget, setNotificationTarget] = useState<{ inventoryId?: string; date?: string } | null>(null);
  const injectionHistory = useBioStackStore((state) => state.injectionHistory || []);
  const inventory = useBioStackStore((state) => state.inventory || []);
  const notificationInventoryKey = inventory
    .map(({ notificationIds, ...item }) => JSON.stringify(item))
    .join('|');
  const notificationLogKey = injectionHistory
    .map((log) => `${log.id}:${log.timestamp}`)
    .join('|');

  // Mendaftarkan Izin Notifikasi ke Sistem iOS secara otomatis saat startup
  useEffect(() => {
    if (Platform.OS === 'web') return; // Notifikasi tidak tersedia di web
    async function initializeLocalNotifications() {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let status = existingStatus;

        if (existingStatus !== 'granted') {
          const requested = await Notifications.requestPermissionsAsync({
            ios: {
              allowAlert: true,
              allowBadge: true,
              allowSound: true,
              provideAppNotificationSettings: true,
            },
          });
          status = requested.status;
        }

        if (status === 'granted') {
          const currentState = useBioStackStore.getState();
          const currentInventory = currentState.inventory || [];
          const currentLogs = currentState.injectionHistory || [];
          const idsByInventory = await rebuildScheduleReminders(currentInventory, 30, currentLogs);
          for (const [inventoryId, ids] of idsByInventory.entries()) {
            useBioStackStore.getState().setNotificationIds(inventoryId, ids);
          }
        }
      } catch (error) {
        // Notification is an optional convenience; tracker remains fully usable without it.
      }
    }

    void initializeLocalNotifications();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return; // Notifikasi tidak tersedia di web
    const handleResponse = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as
        | { kind?: string; inventoryId?: string; date?: string }
        | undefined;

      if (data?.kind === 'schedule') {
        setNotificationTarget({
          inventoryId: data.inventoryId,
          date: data.date,
        });
      } else {
        setNotificationTarget(null);
      }

      setActiveTab('today');
    };

    const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleResponse(response);
    });

    return () => subscription.remove();
  }, []);

  /**
   * Sinkronisasi reminder setelah log atau konfigurasi inventory berubah.
   * Ini memastikan reminder 5 menit sebelumnya tidak tetap tersisa
   * setelah aktivitas sudah dicatat.
   */
  useEffect(() => {
    let cancelled = false;

    const syncReminders = async () => {
      try {
        const permission = await getNotificationPermission();
        if (permission.status !== 'granted') return;

        const idsByInventory = await rebuildScheduleReminders(
          inventory,
          30,
          injectionHistory,
        );

        if (cancelled) return;

        for (const [inventoryId, ids] of idsByInventory.entries()) {
          useBioStackStore.getState().setNotificationIds(inventoryId, ids);
        }
      } catch (error) {
        // Reminder adalah fitur opsional; jangan mengganggu tracker jika gagal.
      }
    };

    void syncReminders();

    return () => {
      cancelled = true;
    };
  }, [notificationInventoryKey, notificationLogKey]);

  // Fungsi Pemicu Izin Manual (Tombol Lonceng)
  const handleManualNotificationRequest = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        finalStatus = status;
      }

      if (finalStatus === 'granted') {
        Alert.alert(
          language === 'en' ? 'Notification Status' : 'Status Notifikasi',
          language === 'en'
            ? 'Notification permissions are ACTIVE. BioStack will send reminders for your injection schedule.'
            : 'Izin notifikasi sudah AKTIF. BioStack akan mengirimkan pengingat jadwal injeksi Anda.'
        );
      } else {
        Alert.alert(
          language === 'en' ? 'Permission Denied' : 'Izin Ditolak',
          language === 'en'
            ? 'Notifications are blocked by iOS. Please open Settings > BioStack > allow Notifications manually.'
            : 'Notifikasi terblokir oleh iOS. Silakan buka Pengaturan > BioStack > izinkan Notifikasi secara manual.'
        );
      }
    } catch (error) {
      Alert.alert(
        language === 'en' ? 'Failed' : 'Gagal',
        language === 'en'
          ? 'System could not process permission request at this time.'
          : 'Sistem tidak dapat memproses permintaan izin saat ini.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Header Utama BioStack PRO */}
      <View style={styles.topHeader}>
        <View style={styles.headerContent}>
          <View style={styles.brandingRow}>
            {/* Memanggil icon.png dari direktori root */}
            <View style={styles.brandIconBox}>
              <Image
                source={require('./icon.png')}
                style={styles.brandIconImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.titleContainer}>
              <View style={styles.titleWithBadge}>
                <Text style={styles.appTitle}>BioStack</Text>
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              </View>
              <View style={styles.subtitleRow}>
                <Text style={styles.appSubtitle}>Personal Tracker</Text>
                <View style={styles.headerStatus}>
                  <ShieldCheck size={10} color={COLORS.sage} />
                  <Text style={styles.headerStatusText}>LOCAL</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Tombol Pemicu Izin Notifikasi Manual */}
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={() => setIsCalculatorOpen(true)} 
              style={styles.notificationBtn}
              accessibilityLabel={language === 'en' ? 'Dose calculator' : 'Kalkulator dosis'}
            >
              <Calculator size={18} color={isCalculatorOpen ? COLORS.accent : COLORS.accent} />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleManualNotificationRequest} 
              style={styles.notificationBtn}
              accessibilityLabel={language === 'en' ? 'Notification status' : 'Status notifikasi'}
            >
              <Bell size={18} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('analytics')}
              style={styles.notificationBtn}
              accessibilityLabel={language === 'en' ? 'Open analytics' : 'Buka analytics'}
              /* Buka analytics */
            >
              <TrendingUp size={18} color={activeTab === 'analytics' ? COLORS.accent : '#94a3b8'} />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setActiveTab('settings')} 
              style={styles.notificationBtn}
              accessibilityLabel={language === 'en' ? 'Open settings' : 'Buka pengaturan'}
            >
              <Settings size={18} color={activeTab === 'settings' ? COLORS.accent : '#94a3b8'} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Tampilan Konten Layar Aktif */}
      <View style={styles.mainContent}>
        {activeTab === 'today' && (
          <TodayScreen
            onOpenInventory={() => setActiveTab('inventory')}
            onNavigateTab={(tab) => setActiveTab(tab as any)}
            notificationTarget={notificationTarget}
          />
        )}
        {activeTab === 'inventory' && <InventoryScreen />}
        {activeTab === 'rotation' && <RotationScreen />}
        {activeTab === 'history' && <HistoryScreen />}
        {activeTab === 'analytics' && <AnalyticsScreen />}
        {activeTab === 'freezer' && <FreezerScreen />}
        {activeTab === 'settings' && <SettingsScreen onDone={() => setActiveTab('today')} />}
      </View>

      {/* Navigasi Utama — bottom tab bar */}
      <View style={styles.navBar}>
        {([
          ['today', t('navigation.today'), Activity],
          ['inventory', t('navigation.inventory'), FlaskConical],
          ['rotation', t('navigation.rotation'), RotateCw],
          ['history', t('navigation.history'), History],
          ['freezer', t('navigation.freezer'), Snowflake],
        ] as const).map(([tab, label, Icon]) => {
          const active = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={styles.navTab}
              onPress={() => setActiveTab(tab)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={label}
            >
              <View style={[styles.navIconWrap, active && styles.navIconWrapActive]}>
                <Icon size={16} color={active ? COLORS.accent : COLORS.muted} />
              </View>
              <Text style={[styles.navTabText, active && styles.navTabTextActive]}>{label}</Text>
              {active && <View style={styles.navActiveDot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Modal Kalkulator Dosis Presisi Generik Standalone */}
      <GenericDosingCalculatorModal
        visible={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />

      {/* Tombol AI Chat Assistant Melayang */}
      <FloatingAIChat />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <BioStackApp />
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  topHeader: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 6,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: COLORS.bg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  brandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  brandIconBox: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: 'rgba(52, 211, 153, 0.4)',
    backgroundColor: COLORS.cardElevated,
    overflow: 'hidden',
  },
  brandIconImage: {
    width: '100%',
    height: '100%',
  },
  titleContainer: {
    justifyContent: 'center',
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  proBadge: {
    backgroundColor: 'rgba(194, 211, 182, 0.16)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(194, 211, 182, 0.35)',
  },
  proBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: COLORS.sage,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  appSubtitle: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  headerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    backgroundColor: 'rgba(194, 211, 182, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(194, 211, 182, 0.28)',
  },
  headerStatusText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: COLORS.sage,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notificationBtn: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  navBar: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingTop: 7,
    paddingBottom: 8,
    gap: 4,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    elevation: 16,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -8 },
    zIndex: 20,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 3,
    borderRadius: RADIUS.md,
    minHeight: 52,
    position: 'relative',
  },
  navIconWrap: {
    width: 30,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconWrapActive: {
    backgroundColor: 'rgba(188, 169, 239, 0.16)',
  },
  navTabText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.muted,
  },
  navTabTextActive: {
    color: COLORS.accent,
  },
  navActiveDot: {
    position: 'absolute',
    bottom: 0,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
  },
  mainContent: {
    flex: 1,
  },
});
