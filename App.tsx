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
  History,
  Snowflake,
  TrendingUp,
  Bell,
  Settings,
  ShieldCheck,
  Calculator,
} from 'lucide-react-native';

import { InventoryScreen } from './src/screens/InventoryScreen';
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

  const [activeTab, setActiveTab] = useState<'today' | 'inventory' | 'history' | 'freezer' | 'analytics' | 'settings'>('today');
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

      {/* Header Utama BioStack PRO — Command Center Pods */}
      <View style={styles.topHeader}>
        <View style={styles.headerContent}>
          {/* Identity Pod (Kiri) */}
          <View style={styles.identityPod}>
            <View style={styles.brandIconBox}>
              <Image
                source={require('./icon.png')}
                style={styles.brandIconImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.identityMeta}>
              <View style={styles.brandTitleRow}>
                <Text style={styles.appTitle}>BioStack</Text>
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              </View>
              <View style={styles.statusPill}>
                <View style={styles.statusDot} />
                <Text style={styles.statusPillText}>LOCAL SECURE</Text>
              </View>
            </View>
          </View>

          {/* Control Dock (Kanan) */}
          <View style={styles.controlDock}>
            {/* Quick Dosing Calc Button */}
            <TouchableOpacity 
              onPress={() => setIsCalculatorOpen(true)} 
              style={[styles.calcLauncherBtn, isCalculatorOpen && styles.calcLauncherBtnActive]}
              accessibilityLabel={language === 'en' ? 'Dose calculator' : 'Kalkulator dosis'}
            >
              <Calculator size={13} color="#231716" />
              <Text style={styles.calcLauncherText}>
                {language === 'en' ? 'Calc' : 'Kalk'}
              </Text>
            </TouchableOpacity>

            {/* Toolbar Capsule (Bell | Analytics | Settings) */}
            <View style={styles.toolbarCapsule}>
              <TouchableOpacity 
                onPress={handleManualNotificationRequest} 
                style={styles.toolbarItem}
                accessibilityLabel={language === 'en' ? 'Notification status' : 'Status notifikasi'}
              >
                <Bell size={15} color="#9c8985" />
              </TouchableOpacity>

              <View style={styles.toolbarDivider} />

              <TouchableOpacity
                onPress={() => setActiveTab('analytics')}
                style={[styles.toolbarItem, activeTab === 'analytics' && styles.toolbarItemActive]}
                accessibilityLabel={language === 'en' ? 'Open analytics' : 'Buka analytics'}
              >
                <TrendingUp size={15} color={activeTab === 'analytics' ? COLORS.accent : '#9c8985'} />
              </TouchableOpacity>

              <View style={styles.toolbarDivider} />

              <TouchableOpacity 
                onPress={() => setActiveTab('settings')} 
                style={[styles.toolbarItem, activeTab === 'settings' && styles.toolbarItemActive]}
                accessibilityLabel={language === 'en' ? 'Open settings' : 'Buka pengaturan'}
              >
                <Settings size={15} color={activeTab === 'settings' ? COLORS.accent : '#9c8985'} />
              </TouchableOpacity>
            </View>
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
        {activeTab === 'history' && <HistoryScreen />}
        {activeTab === 'analytics' && <AnalyticsScreen />}
        {activeTab === 'freezer' && <FreezerScreen />}
        {activeTab === 'settings' && <SettingsScreen onDone={() => setActiveTab('today')} />}
      </View>

      {/* Navigasi Utama — Floating Island Dock (4 Tab Utama) */}
      <View style={styles.navBarContainer}>
        <View style={styles.navBar}>
          {([
            ['today', t('navigation.today'), Activity],
            ['inventory', t('navigation.inventory'), FlaskConical],
            ['history', t('navigation.history'), History],
            ['freezer', t('navigation.freezer'), Snowflake],
          ] as const).map(([tab, label, Icon]) => {
            const active = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.navTab, active && styles.navTabActive]}
                onPress={() => setActiveTab(tab)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={label}
              >
                <View style={[styles.navIconWrap, active && styles.navIconWrapActive]}>
                  <Icon size={16} color={active ? '#231716' : COLORS.muted} />
                </View>
                <Text style={[styles.navTabText, active && styles.navTabTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
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
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'android' ? 10 : 6,
    paddingBottom: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(223, 138, 58, 0.25)',
    backgroundColor: COLORS.bg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  identityPod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: COLORS.cardElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(223, 138, 58, 0.25)',
  },
  brandIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(223, 138, 58, 0.40)',
    backgroundColor: COLORS.bg,
    overflow: 'hidden',
  },
  brandIconImage: {
    width: '100%',
    height: '100%',
  },
  identityMeta: {
    justifyContent: 'center',
    gap: 1.5,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  appTitle: {
    fontSize: 14.5,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  proBadge: {
    backgroundColor: 'rgba(223, 138, 58, 0.20)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(223, 138, 58, 0.45)',
  },
  proBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: COLORS.accent,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.sage,
  },
  statusPillText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: COLORS.sage,
  },
  controlDock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calcLauncherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    borderWidth: 1,
    borderColor: '#c97528',
  },
  calcLauncherBtnActive: {
    backgroundColor: '#b45309',
  },
  calcLauncherText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#231716',
  },
  toolbarCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 3,
    paddingVertical: 3,
  },
  toolbarItem: {
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 8,
  },
  toolbarItemActive: {
    backgroundColor: 'rgba(223, 138, 58, 0.15)',
  },
  toolbarDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 1,
  },
  navBarContainer: {
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === 'ios' ? 14 : 12,
    paddingTop: 4,
    backgroundColor: COLORS.bg,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(38, 25, 24, 0.97)',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(223, 138, 58, 0.28)',
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 2,
    elevation: 16,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 5,
    borderRadius: 16,
    minHeight: 48,
  },
  navTabActive: {
    backgroundColor: 'rgba(223, 138, 58, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(223, 138, 58, 0.35)',
  },
  navIconWrap: {
    width: 26,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconWrapActive: {
    backgroundColor: COLORS.accent,
    borderRadius: 7,
  },
  navTabText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.muted,
  },
  navTabTextActive: {
    color: COLORS.accent,
    fontWeight: '900',
  },
  mainContent: {
    flex: 1,
  },
});
