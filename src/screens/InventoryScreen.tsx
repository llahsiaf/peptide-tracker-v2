import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import Svg, {
  Rect,
  Line,
  Text as SvgText,
  G,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import {
  FlaskConical,
  Plus,
  Trash2,
  Syringe,
  Calendar,
  Clock,
  Droplets,
  CheckCircle2,
  X,
  Snowflake,
  Activity,
  PauseCircle,
  PlayCircle,
} from 'lucide-react-native';
import {
  useBioStackStore,
  InventoryItem,
  FreezerItem,
} from '../store/useBioStackStore';
import { exportToAppleCalendar } from '../utils/calendarHelper';
import {
  calculateInjectionMetrics,
  getLiquidStatus,
  normalizeDecimalInput,
  parseDecimal,
} from '../utils/injectionCalculations';
import {
  getOccurrenceForDate,
  getNextScheduledOccurrence,
  getScheduleSummary,
} from '../utils/scheduleUtils';
import { getTrackerSuggestedSite, getSiteCode } from '../utils/rotationUtils';
import { cancelNotificationIds } from '../utils/notificationUtils';
import { SyringeVisualizer } from '../components/SyringeVisualizer';
import { useLanguage } from '../i18n/LanguageContext';

const DAYS_OF_WEEK = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const DAY_TRANSLATIONS: Record<string, string> = {
  Sen: 'Mon',
  Sel: 'Tue',
  Rab: 'Wed',
  Kam: 'Thu',
  Jum: 'Fri',
  Sab: 'Sat',
  Min: 'Sun',
};
const formatDayChip = (d: string, lang?: string) => lang === 'en' ? (DAY_TRANSLATIONS[d] || d) : d;

const getFrequencyPresets = (lang?: string) => [
  {
    id: 'daily',
    label: lang === 'en' ? 'Daily' : 'Harian (Daily)',
    sub: lang === 'en' ? 'Every Day' : 'Setiap Hari',
    days: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
  },
  {
    id: '2x_week',
    label: lang === 'en' ? '2x / Week' : '2x Seminggu',
    sub: lang === 'en' ? 'Mon, Thu' : 'Sen, Kam',
    days: ['Sen', 'Kam'],
  },
  {
    id: '3x_week',
    label: lang === 'en' ? '3x / Week' : '3x Seminggu',
    sub: lang === 'en' ? 'Mon, Wed, Fri' : 'Sen, Rab, Jum',
    days: ['Sen', 'Rab', 'Jum'],
  },
  {
    id: 'weekly',
    label: lang === 'en' ? 'Weekly' : 'Mingguan (Weekly)',
    sub: lang === 'en' ? 'Mon' : 'Sen',
    days: ['Sen'],
  },
];

const getFrequencyDisplayLabel = (presetId?: string, currentLabel?: string, lang?: string) => {
  const match = getFrequencyPresets(lang).find((p) => p.id === presetId);
  if (match) return match.label;
  if (!currentLabel) return lang === 'en' ? 'Weekly' : 'Mingguan (Weekly)';
  if (currentLabel.includes('Harian') || currentLabel.includes('Daily')) return lang === 'en' ? 'Daily' : 'Harian (Daily)';
  if (currentLabel.includes('2x')) return lang === 'en' ? '2x / Week' : '2x Seminggu';
  if (currentLabel.includes('3x')) return lang === 'en' ? '3x / Week' : '3x Seminggu';
  if (currentLabel.includes('Mingguan') || currentLabel.includes('Weekly')) return lang === 'en' ? 'Weekly' : 'Mingguan (Weekly)';
  return currentLabel;
};

// V5 INVENTORY FINAL: compact card hierarchy + slim dose metrics.
// Schedule & Pengaturan Suntik logic/UI is intentionally preserved.
export const InventoryScreen: React.FC = () => {
  const { language, t } = useLanguage();
  const {
    inventory,
    freezerStock,
    currentSite,
    recordInjection,
    removeInventoryItem,
    updateInventoryItem,
    reconstituteToFridge,
    transferLiquidToFridge,
    setSchedulePaused,
  } = useBioStackStore();

  const injectionHistory = useBioStackStore(
    (state) => state.injectionHistory || [],
  );

  const [isTakeFreezerModalOpen, setIsTakeFreezerModalOpen] =
    useState(false);
  const [selectedFreezerItem, setSelectedFreezerItem] =
    useState<FreezerItem | null>(null);
  const [freezerBacInput, setFreezerBacInput] = useState('2.0');

  const [isEditDoseModalOpen, setIsEditDoseModalOpen] = useState(false);
  const [editingItem, setEditingItem] =
    useState<InventoryItem | null>(null);
  const [editTargetDose, setEditTargetDose] = useState('');
  const [editBacWater, setEditBacWater] = useState('');
  const [editDoseUnit, setEditDoseUnit] = useState<'mg' | 'mcg' | 'mL'>('mg');

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [lifecycleFilter, setLifecycleFilter] =
    useState<'active' | 'empty'>('active');
  const [scheduleItem, setScheduleItem] =
    useState<InventoryItem | null>(null);
  const [activeDays, setActiveDays] = useState<string[]>([]);
  const [injectionTime, setInjectionTime] = useState('08:00');
  const [frequencyKey, setFrequencyKey] = useState('weekly');
  const [frequencyLabel, setFrequencyLabel] =
    useState('Mingguan (Weekly)');
  const [isCycleActive, setIsCycleActive] = useState(false);
  const [isReminderActive, setIsReminderActive] = useState(true);

  const allInventory = inventory || [];

  const getVisibleLifecycle = (
    item: InventoryItem,
  ): 'active' | 'empty' =>
    item.lifecycleStatus === 'empty' ||
    (item.currentVolumeMl !== undefined &&
      item.currentVolumeMl <= 0)
      ? 'empty'
      : 'active';

  const activeInventoryCount = allInventory.filter(
    (item) => getVisibleLifecycle(item) === 'active',
  ).length;

  const emptyInventoryCount = allInventory.filter(
    (item) => getVisibleLifecycle(item) === 'empty',
  ).length;

  const inventoryList = allInventory.filter(
    (item) => getVisibleLifecycle(item) === lifecycleFilter,
  );

  const freezerList = freezerStock || [];

  const totalFreezerVials = freezerList.reduce(
    (acc, curr) => acc + (curr.quantity || 0),
    0,
  );

  // Ringkasan jadwal selalu merepresentasikan seluruh inventory,
  // bukan hanya filter Aktif/Kosong yang sedang dipilih.
  const scheduleSummary = getScheduleSummary(
    allInventory,
    injectionHistory,
    new Date(),
  );

  const isInjectToday = (itemDays: string[]) => {
    const todayIndex = new Date().getDay();

    const dayMap = [
      'Min',
      'Sen',
      'Sel',
      'Rab',
      'Kam',
      'Jum',
      'Sab',
    ];

    return itemDays?.includes(dayMap[todayIndex]);
  };

  const handleDirectSyncCalendar = async (
    item: InventoryItem,
  ) => {
    const metrics = calculateInjectionMetrics(item);

    await exportToAppleCalendar({
      peptideName: item.name,
      targetDose: item.targetDose,
      unit: item.doseUnit,
      activeDays: item.activeDays || ['Sen'],
      injectionTime: item.injectionTime || '08:00',
      frequencyLabel:
        item.frequencyLabel || 'Mingguan (Weekly)',
      volumeMl: metrics.volumeMl,
      dialClicks: metrics.dialClicks,
    });
  };

  const handleInjectNow = (item: InventoryItem) => {
    const metrics = calculateInjectionMetrics(item);
    const injectVol = metrics.volumeMlNumber;
    const liquid = getLiquidStatus(item);

    if (!metrics.valid || injectVol <= 0) {
      Alert.alert(
        language === 'en' ? 'Invalid Calculation' : 'Kalkulasi Tidak Valid',
        language === 'en'
          ? 'Check dose unit, vial size, and diluent volume on this item.'
          : 'Periksa satuan dosis, ukuran vial, dan volume pelarut pada item ini.',
      );
      return;
    }

    if (liquid.currentVol < injectVol) {
      Alert.alert(
        language === 'en' ? 'Insufficient Liquid' : 'Cairan Tidak Cukup',
        language === 'en'
          ? `Remaining liquid (${liquid.currentVol.toFixed(2)} mL) is less than the dose drawn (${injectVol} mL). Prepare a new vial.`
          : `Sisa cairan (${liquid.currentVol.toFixed(
              2,
            )} mL) kurang dari dosis yang ditarik (${injectVol} mL). Siapkan vial baru.`,
      );
      return;
    }

    const now = new Date();

    const trackerSite =
      getTrackerSuggestedSite(
        injectionHistory,
        item.id,
      ) || currentSite;

    const recorded = recordInjection(
      item.id,
      {
        id: `log-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 7)}`,
        peptideName: item.name,
        dose: item.targetDose,
        unit: item.doseUnit,
        volumeMl: metrics.volumeMl,
        siteId: trackerSite,
        timestamp: now.toISOString(),
        recordedAtLocal: now.toLocaleString(language === 'en' ? 'en-US' : 'id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
      injectVol,
    );

    if (!recorded) {
      Alert.alert(
        language === 'en' ? 'Failed to Record' : 'Gagal Mencatat',
        language === 'en'
          ? 'Inventory data changed before recording finished. Try again.'
          : 'Data inventaris berubah sebelum pencatatan selesai. Coba lagi.',
      );
      return;
    }

    Alert.alert(
      language === 'en' ? 'Injection Recorded' : 'Injeksi Berhasil',
      language === 'en'
        ? `${item.name} has been logged. Remaining volume updated automatically.`
        : `${item.name} telah dicatat. Sisa cairan diperbarui otomatis.`,
    );
  };

  const openEditDoseModal = (item: InventoryItem) => {
    setEditingItem(item);
    setEditTargetDose((item.targetDose || 0).toString());
    setEditBacWater((item.bacWater || 0).toString());
    setEditDoseUnit((item.doseUnit || item.unit || 'mg') as 'mg' | 'mcg' | 'mL');
    setIsEditDoseModalOpen(true);
  };

  const handleApplyPreset = (multiplier: number) => {
    if (!editingItem) return;

    const standardDose = editingItem.targetDose || 1;

    setEditTargetDose(
      (standardDose * multiplier).toString(),
    );
  };

  const handleSaveDose = () => {
    if (!editingItem) return;

    const newTarget = parseDecimal(editTargetDose) || editingItem.targetDose;
    const newBac = parseDecimal(editBacWater) || editingItem.bacWater;

    updateInventoryItem(editingItem.id, {
      targetDose: newTarget,
      doseUnit: editDoseUnit,
      bacWater: editingItem.unit === 'mL' ? 0 : newBac,
    });

    setIsEditDoseModalOpen(false);
  };

  const openScheduleModal = (item: InventoryItem) => {
    setScheduleItem(item);
    setActiveDays(item.activeDays || ['Sen']);
    setInjectionTime(
      item.injectionTime || '08:00',
    );
    const key = item.frequency || 'weekly';
    setFrequencyKey(key);
    setFrequencyLabel(
      getFrequencyDisplayLabel(key, item.frequencyLabel, language),
    );
    setIsCycleActive(
      Boolean(item.isCycleActive),
    );
    setIsReminderActive(
      item.isReminderActive !== false,
    );
    setIsScheduleModalOpen(true);
  };

  const handleSaveSchedule = () => {
    if (!scheduleItem) return;

    updateInventoryItem(scheduleItem.id, {
      frequency: frequencyKey,
      frequencyLabel: getFrequencyDisplayLabel(frequencyKey, frequencyLabel, language),
      activeDays,
      injectionTime,
      isCycleActive,
      isReminderActive,
    });

    setIsScheduleModalOpen(false);
  };

  return (
    <View style={styles.container}>
      {/* TOP STATUS */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Droplets
            size={18}
            color="#10b981"
          />

          <View>
            <Text style={styles.statLabel}>{language === 'en' ? 'Active in Fridge' : 'Aktif di Kulkas'}</Text>

            <Text style={styles.statValue}>
              {activeInventoryCount}{' '}
              <Text style={styles.statSub}>{language === 'en' ? 'Active Vials' : 'Vial Aktif'}</Text>
            </Text>

            <Text style={styles.statMini}>
              {emptyInventoryCount} {language === 'en' ? 'empty' : 'kosong'}
            </Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <Snowflake
            size={18}
            color="#38bdf8"
          />

          <View>
            <Text style={styles.statLabel}>{language === 'en' ? 'Freezer Stock' : 'Stok Freezer'}</Text>

            <Text style={styles.statValue}>
              {totalFreezerVials}{' '}
              <Text style={styles.statSub}>{language === 'en' ? 'Frozen Vials' : 'Vial Beku'}</Text>
            </Text>
          </View>
        </View>

        <View style={styles.scheduleStatCard}>
          <Clock
            size={18}
            color="#f59e0b"
          />

          <View style={styles.scheduleStatContent}>
            <Text style={styles.statLabel}>{language === 'en' ? "Today's Schedule" : 'Jadwal Hari Ini'}</Text>

            <Text style={styles.statValue}>
              {scheduleSummary.completed}/
              {scheduleSummary.total}
            </Text>

            <Text
              style={styles.statMini}
              numberOfLines={2}
            >
              {language === 'en'
                ? `${scheduleSummary.missed} missed • ${scheduleSummary.due} due to record`
                : `${scheduleSummary.missed} terlewat • ${scheduleSummary.due} perlu dicatat`}
            </Text>
          </View>
        </View>
      </View>

      {/* LIFECYCLE FILTER */}
      <View style={styles.lifecycleFilterRow}>
        {(['active', 'empty'] as const).map(
          (filter) => {
            const label =
              filter === 'active'
                ? (language === 'en' ? `Active (${activeInventoryCount})` : `Aktif (${activeInventoryCount})`)
                : (language === 'en' ? `Empty (${emptyInventoryCount})` : `Kosong (${emptyInventoryCount})`);

            return (
              <TouchableOpacity
                key={filter}
                onPress={() =>
                  setLifecycleFilter(filter)
                }
                style={[
                  styles.lifecycleFilterChip,
                  lifecycleFilter === filter &&
                    styles.lifecycleFilterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.lifecycleFilterText,
                    lifecycleFilter === filter &&
                      styles.lifecycleFilterTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          },
        )}
      </View>

      {/* SECTION HEADER */}
      <View style={styles.sectionHeaderRow}>
        <View>
          <View style={styles.sectionTitleWithIcon}>
            <Droplets
              size={14}
              color="#10b981"
            />

            <Text style={styles.sectionTitle}>{language === 'en' ? 'Active Fridge Inventory' : 'Inventory Kulkas Aktif'}</Text>
          </View>

          <Text style={styles.sectionSub}>{language === 'en' ? 'Active peptides stored in the fridge' : 'Peptida aktif yang tersimpan di kulkas'}</Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            setSelectedFreezerItem(null);
            setIsTakeFreezerModalOpen(true);
          }}
          style={styles.takeFreezerBtn}
        >
          <Plus
            size={12}
            color="#022c22"
          />

          <Text style={styles.takeFreezerBtnText}>{language === 'en' ? 'Take Vial' : 'Ambil Vial'}</Text>
        </TouchableOpacity>
      </View>

      {/* INVENTORY LIST */}
      <FlatList
        data={inventoryList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <FlaskConical
              size={32}
              color="#64748b"
            />

            <Text style={styles.emptyTitle}>
              {lifecycleFilter === 'empty'
                ? (language === 'en' ? 'No Empty Vials Yet' : 'Belum Ada Vial Kosong')
                : (language === 'en' ? 'No Active Vials Yet' : 'Belum Ada Vial Aktif')}
            </Text>

            <Text style={styles.emptySub}>
              {lifecycleFilter === 'empty'
                ? (language === 'en' ? 'All vials in fridge still have liquid.' : 'Semua vial di kulkas masih memiliki cairan.')
                : (language === 'en' ? 'Tap Take Vial above to add vials.' : 'Tekan tombol Ambil Vial di atas untuk menambahkan vial.')}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isToday = isInjectToday(
            item.activeDays,
          );

          const metrics =
            calculateInjectionMetrics(item);

          const liquid =
            getLiquidStatus(item);

          const now = new Date();

          const todayOccurrence =
            getOccurrenceForDate(
              item,
              now,
              now,
              injectionHistory,
            );

          const occurrence =
            todayOccurrence ||
            getNextScheduledOccurrence(
              item,
              now,
              injectionHistory,
              30,
            );

          const lifecycleStatus =
            item.lifecycleStatus ||
            (liquid.currentVol <= 0
              ? 'empty'
              : 'active');

          const lifecycleLabel =
            lifecycleStatus === 'empty'
              ? (language === 'en' ? 'Empty Vial' : 'Vial Kosong')
              : (language === 'en' ? 'Active Vial' : 'Vial Aktif');

          return (
            <View style={styles.peptideCard}>
              {/* CARD HEADER */}
              <View style={styles.cardHeader}>
                <TouchableOpacity
                  style={styles.cardTitleBlock}
                  onPress={() =>
                    openEditDoseModal(item)
                  }
                >
                  <View style={styles.titleLine}>
                    <Text
                      style={styles.peptideName}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>

                    <View
                      style={styles.vialBadge}
                    >
                      <Text
                        style={
                          styles.vialBadgeText
                        }
                      >
                        {item.vialSize}
                        {item.unit} Vial
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={styles.categorySubText}
                    numberOfLines={1}
                  >
                    {item.category}
                  </Text>
                </TouchableOpacity>

                {/* HEADER ACTIONS */}
                <View
                  style={styles.headerActionRow}
                >
                  <TouchableOpacity
                    onPress={() =>
                      handleDirectSyncCalendar(
                        item,
                      )
                    }
                    style={styles.iconBtn}
                    accessibilityLabel="Tambah ke kalender"
                  >
                    <Calendar
                      size={15}
                      color="#94a3b8"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      openScheduleModal(item)
                    }
                    style={styles.iconBtn}
                    accessibilityLabel="Atur jadwal"
                  >
                    <Clock
                      size={15}
                      color="#94a3b8"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      if (
                        lifecycleStatus ===
                        'empty'
                      ) {
                        return;
                      }

                      const paused = Boolean(
                        item.schedulePaused,
                      );

                      const title = paused
                        ? (language === 'en' ? 'Resume Schedule' : 'Lanjutkan Jadwal')
                        : (language === 'en' ? 'Pause Schedule' : 'Jeda Jadwal');
                      const msg = paused
                        ? (language === 'en' ? `Resume schedule for ${item.name}?` : `Lanjutkan jadwal ${item.name}?`)
                        : (language === 'en' ? `Temporarily pause schedule for ${item.name}?` : `Jeda sementara jadwal ${item.name}?`);

                      if (Platform.OS === 'web') {
                        // eslint-disable-next-line no-alert
                        if (window.confirm(`${title}\n\n${msg}`)) {
                          setSchedulePaused(
                            item.id,
                            !paused,
                          );
                        }
                        return;
                      }

                      Alert.alert(
                        title,
                        msg,
                        [
                          {
                            text: language === 'en' ? 'Cancel' : 'Batal',
                            style: 'cancel',
                          },
                          {
                            text: paused
                              ? (language === 'en' ? 'Resume' : 'Lanjutkan')
                              : (language === 'en' ? 'Pause' : 'Jeda'),
                            onPress: () =>
                              setSchedulePaused(
                                item.id,
                                !paused,
                              ),
                          },
                        ],
                      );
                    }}
                    style={[
                      styles.iconBtn,
                      lifecycleStatus ===
                        'empty' &&
                        styles.iconBtnDisabled,
                    ]}
                    disabled={
                      lifecycleStatus ===
                      'empty'
                    }
                    accessibilityLabel={
                      item.schedulePaused
                        ? (language === 'en' ? 'Resume schedule' : 'Lanjutkan jadwal')
                        : (language === 'en' ? 'Pause schedule' : 'Jeda jadwal')
                    }
                  >
                    {item.schedulePaused ? (
                      <PlayCircle
                        size={15}
                        color="#38bdf8"
                      />
                    ) : (
                      <PauseCircle
                        size={15}
                        color="#f59e0b"
                      />
                    )}
                  </TouchableOpacity>

                  {/* HAPUS VIAL */}
                  <TouchableOpacity
                    onPress={() => {
                      const title = language === 'en' ? 'Delete Vial' : 'Hapus Vial';
                      const msg = language === 'en'
                        ? `Delete ${item.name} from Inventory? History logs will be preserved.`
                        : `Hapus ${item.name} dari Inventory? Riwayat pencatatan tetap disimpan.`;

                      const executeDelete = async () => {
                        // Hapus juga reminder lokal yang masih terkait
                        // dengan vial agar tidak muncul setelah vial dihapus.
                        if (item.notificationIds?.length) {
                          await cancelNotificationIds(
                            item.notificationIds,
                          );
                        }

                        removeInventoryItem(item.id);
                      };

                      if (Platform.OS === 'web') {
                        // eslint-disable-next-line no-alert
                        if (window.confirm(`${title}\n\n${msg}`)) {
                          void executeDelete();
                        }
                        return;
                      }

                      Alert.alert(
                        title,
                        msg,
                        [
                          {
                            text: language === 'en' ? 'Cancel' : 'Batal',
                            style: 'cancel',
                          },
                          {
                            text: language === 'en' ? 'Delete' : 'Hapus',
                            style: 'destructive',
                            onPress: () => {
                              void executeDelete();
                            },
                          },
                        ],
                      );
                    }}
                    style={styles.iconBtn}
                    accessibilityLabel={language === 'en' ? 'Delete vial' : 'Hapus vial'}
                  >
                    <Trash2
                      size={16}
                      color="#ef4444"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* STATUS */}
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.lifecycleBadge,
                    lifecycleStatus ===
                      'empty' &&
                      styles.lifecycleBadgeEmpty,
                  ]}
                >
                  <Text
                    style={[
                      styles.lifecycleBadgeText,
                      lifecycleStatus ===
                        'empty' &&
                        styles.lifecycleBadgeTextEmpty,
                    ]}
                  >
                    {lifecycleLabel}
                  </Text>
                </View>

                {isToday ? (
                  <View
                    style={styles.badgeToday}
                  >
                    <Text
                      style={
                        styles.badgeTodayText
                      }
                    >
                      {language === 'en' ? 'Injection Today' : 'Injeksi Hari Ini'}
                    </Text>
                  </View>
                ) : (
                  <View
                    style={styles.badgeRest}
                  >
                    <Text
                      style={
                        styles.badgeRestText
                      }
                    >
                      {language === 'en' ? 'Rest Day' : 'Hari Rest'}
                    </Text>
                  </View>
                )}

                {item.schedulePaused &&
                  lifecycleStatus !==
                    'empty' && (
                    <View
                      style={
                        styles.badgePaused
                      }
                    >
                      <Text
                        style={
                          styles.badgePausedText
                        }
                      >
                        {language === 'en' ? 'Schedule Paused' : 'Jadwal Dijeda'}
                      </Text>
                    </View>
                  )}
              </View>

              {/* DOSE + SCHEDULE + LIQUID */}
              <TouchableOpacity
                onPress={() =>
                  openEditDoseModal(item)
                }
              >
                <View
                  style={
                    styles.doseMetricsGrid
                  }
                >
                  <View
                    style={
                      styles.metricChipDose
                    }
                  >
                    <Text
                      style={
                        styles.metricChipDoseText
                      }
                      numberOfLines={1}
                    >
                      {t('inventory.dose') || 'Dosis'}: {item.targetDose} {item.doseUnit || item.unit}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.metricChipSpuit
                    }
                  >
                    <Text
                      style={
                        styles.metricChipSpuitText
                      }
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {t('inventory.syringe') || 'Spuit'}: {metrics.iu} IU ({metrics.volumeMl} mL)
                    </Text>
                  </View>

                  <View
                    style={
                      styles.metricChipDial
                    }
                  >
                    <Text
                      style={
                        styles.metricChipDialText
                      }
                      numberOfLines={1}
                    >
                      Dial: {metrics.dialClicks} {language === 'en' ? 'Clicks' : 'Klik'}
                    </Text>
                  </View>
                </View>

                <View
                  style={
                    styles.daysRowContainer
                  }
                >
                  <Text
                    style={styles.daysRowLabel}
                  >
                    {language === 'en' ? 'Days:' : 'Hari:'}
                  </Text>

                  <View
                    style={
                      styles.daysChipsList
                    }
                  >
                    {DAYS_OF_WEEK.map(
                      (day) => {
                        const isActive =
                          item.activeDays?.includes(
                            day,
                          );

                        return (
                          <View
                            key={day}
                            style={[
                              styles.dayDot,
                              isActive &&
                                styles.dayDotActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.dayDotText,
                                isActive &&
                                  styles.dayDotTextActive,
                              ]}
                            >
                              {formatDayChip(day, language)}
                            </Text>
                          </View>
                        );
                      },
                    )}
                  </View>

                  <View
                    style={styles.timeTag}
                  >
                    <Clock
                      size={10}
                      color="#38bdf8"
                    />

                    <Text
                      style={
                        styles.timeTagText
                      }
                    >
                      {item.injectionTime ||
                        '08:00'}
                    </Text>
                  </View>
                </View>

                {occurrence && (
                  <View
                    style={
                      styles.scheduleStatusRow
                    }
                  >
                    <Clock
                      size={11}
                      color={
                        occurrence.status ===
                        'missed'
                          ? '#ef4444'
                          : occurrence.status ===
                            'completed'
                          ? '#10b981'
                          : '#f59e0b'
                      }
                    />

                    <Text
                      style={[
                        styles.scheduleStatusText,
                        occurrence.status ===
                          'missed' &&
                          styles.scheduleStatusMissed,
                      ]}
                    >
                      {occurrence.status === 'completed'
                        ? (language === 'en' ? `Completed today • ${occurrence.time}` : `Hari ini selesai • ${occurrence.time}`)
                        : occurrence.status === 'missed'
                        ? (language === 'en' ? `Missed • scheduled ${occurrence.time}` : `Terlewat • jadwal ${occurrence.time}`)
                        : (language === 'en' ? `Next schedule • ${occurrence.date} ${occurrence.time}` : `Jadwal berikutnya • ${occurrence.date} ${occurrence.time}`)}
                    </Text>
                  </View>
                )}

                <View
                  style={
                    styles.progressContainer
                  }
                >
                  <View
                    style={
                      styles.progressTextRow
                    }
                  >
                    <View
                      style={
                        styles.progressTitleRow
                      }
                    >
                      <Droplets
                        size={11}
                        color="#38bdf8"
                      />

                      <Text
                        style={
                          styles.progressTitle
                        }
                      >
                        {language === 'en'
                          ? `Remaining Liquid (~${liquid.daysLeft} Days Left)`
                          : `Sisa Cairan (~${liquid.daysLeft} Hari Lagi)`}
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.progressPercentText
                      }
                    >
                      {language === 'en' ? 'Safe Capacity' : 'Kapasitas Aman'} (
                      {Math.round(
                        liquid.progressPercent,
                      )}
                      %)
                    </Text>
                  </View>

                  <View
                    style={
                      styles.progressBarBg
                    }
                  >
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${liquid.progressPercent}%`,
                        },
                      ]}
                    />
                  </View>

                  <View
                    style={
                      styles.progressFooterRow
                    }
                  >
                    <Text
                      style={
                        styles.progressFooterText
                      }
                    >
                      {language === 'en' ? 'Reconstituted: ' : 'Dilarutkan: '}
                      {item.reconstitutedDate ||
                        '-'}
                    </Text>

                    <Text
                      style={
                        styles.progressFooterText
                      }
                    >
                      {language === 'en' ? 'Fridge Exp: ' : 'Exp Kulkas: '}
                      {item.maxFridgeDays ||
                        28}{' '}
                      {language === 'en' ? 'Days' : 'Hari'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* INJECT BUTTON */}
              <TouchableOpacity
                onPress={() =>
                  handleInjectNow(item)
                }
                disabled={
                  lifecycleStatus !==
                    'active' ||
                  Boolean(
                    item.schedulePaused,
                  )
                }
                style={[
                  styles.injectMainBtn,
                  (lifecycleStatus !==
                    'active' ||
                    item.schedulePaused) &&
                    styles.injectMainBtnDisabled,
                ]}
              >
                <Syringe
                  size={15}
                  color={
                    lifecycleStatus ===
                      'empty' ||
                    item.schedulePaused
                      ? '#64748b'
                      : '#022c22'
                  }
                />

                <Text
                  style={[
                    styles.injectMainBtnText,
                    (lifecycleStatus !==
                      'active' ||
                      item.schedulePaused) &&
                      styles.injectMainBtnTextDisabled,
                  ]}
                >
                  {lifecycleStatus === 'empty'
                    ? (language === 'en' ? 'Empty Vial' : 'Vial Kosong')
                    : item.schedulePaused
                    ? (language === 'en' ? 'Schedule Paused' : 'Jadwal Dijeda')
                    : (language === 'en' ? `Inject Now (${getSiteCode(currentSite, 'en')})` : `Suntik Sekarang (${currentSite})`)}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />

      {/* ====================================================== */}
      {/* MODAL 1 - KALKULATOR DOSIS */}
      {/* ====================================================== */}

      <Modal
        visible={isEditDoseModalOpen}
        animationType="slide"
        transparent
      >
        <KeyboardAvoidingView
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
          style={styles.doseModalOverlay}
        >
          <View
            style={styles.doseModalBox}
          >
            {editingItem &&
              (() => {
                const liveMetrics = calculateInjectionMetrics(editingItem, editTargetDose, editBacWater, editDoseUnit);

                const iuPercent = Math.min(
                  100,
                  Math.max(
                    0,
                    liveMetrics.iu,
                  ),
                );

                const svgWidth = 280;

                const fillWidth =
                  (iuPercent / 100) *
                  180;

                return (
                  <ScrollView
                    contentContainerStyle={
                      styles.doseModalScroll
                    }
                    showsVerticalScrollIndicator={
                      false
                    }
                    keyboardShouldPersistTaps="handled"
                  >
                    <View
                      style={
                        styles.doseModalHeader
                      }
                    >
                      <View>
                        <Text
                          style={
                            styles.doseModalTitle
                          }
                        >
                          {editingItem.name}
                        </Text>

                        <Text
                          style={
                            styles.doseModalSub
                          }
                        >
                          {editingItem.vialSize}{' '}
                          {editingItem.unit} Vial
                          {' • '}
                          {editingItem.category}
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={() =>
                          setIsEditDoseModalOpen(
                            false,
                          )
                        }
                        style={
                          styles.closeIconCircle
                        }
                      >
                        <X
                          size={18}
                          color="#94a3b8"
                        />
                      </TouchableOpacity>
                    </View>

                    <Text
                      style={
                        styles.sectionHeadingMini
                      }
                    >
                      {language === 'en' ? 'QUICK DOSE PRESETS' : 'PRESET DOSIS CEPAT'}
                    </Text>

                    <View
                      style={
                        styles.presetDoseRow
                      }
                    >
                      <TouchableOpacity
                        onPress={() =>
                          handleApplyPreset(
                            0.5,
                          )
                        }
                        style={
                          styles.presetDoseBtn
                        }
                      >
                        <Text
                          style={
                            styles.presetDoseBtnLabel
                          }
                        >
                          LOW
                        </Text>

                        <Text
                          style={
                            styles.presetDoseBtnVal
                          }
                        >
                          {(
                            editingItem.targetDose *
                            0.5
                          ).toFixed(1)}{' '}
                          {editingItem.unit}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() =>
                          handleApplyPreset(
                            1,
                          )
                        }
                        style={[
                          styles.presetDoseBtn,
                          styles.presetDoseBtnActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.presetDoseBtnLabel,
                            styles.presetTextActive,
                          ]}
                        >
                          STANDARD
                        </Text>

                        <Text
                          style={[
                            styles.presetDoseBtnVal,
                            styles.presetTextActive,
                          ]}
                        >
                          {editingItem.targetDose}{' '}
                          {editingItem.unit}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() =>
                          handleApplyPreset(
                            2,
                          )
                        }
                        style={
                          styles.presetDoseBtn
                        }
                      >
                        <Text
                          style={
                            styles.presetDoseBtnLabel
                          }
                        >
                          HIGH
                        </Text>

                        <Text
                          style={
                            styles.presetDoseBtnVal
                          }
                        >
                          {(
                            editingItem.targetDose *
                            2
                          ).toFixed(1)}{' '}
                          {editingItem.unit}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.fancyInputContainer}>
                      <View style={styles.fancyInputHeader}>
                        <Text style={styles.fancyInputTitle}>
                          {t('inventory.injectionDose') || 'Target Dosis Injeksi'}
                        </Text>

                        {editingItem.unit !== 'mL' ? (
                          <View style={styles.unitToggleGroupModal}>
                            {(['mg', 'mcg'] as const).map((u) => (
                              <TouchableOpacity
                                key={u}
                                onPress={() => {
                                  if (u !== editDoseUnit) {
                                    const cur = parseDecimal(editTargetDose) || 0;
                                    if (u === 'mcg' && editDoseUnit === 'mg') {
                                      setEditTargetDose((cur * 1000).toString());
                                    } else if (u === 'mg' && editDoseUnit === 'mcg') {
                                      setEditTargetDose((cur / 1000).toString());
                                    }
                                    setEditDoseUnit(u);
                                  }
                                }}
                                style={[
                                  styles.unitToggleBtnModal,
                                  editDoseUnit === u && styles.unitToggleBtnModalActive,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.unitToggleTextModal,
                                    editDoseUnit === u && styles.unitToggleTextModalActive,
                                  ]}
                                >
                                  {u}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        ) : (
                          <Text style={styles.fancyInputTitleVal}>
                            {editTargetDose || 0} mL
                          </Text>
                        )}
                      </View>

                      <TextInput
                        style={styles.fancyTextInput}
                        keyboardType="decimal-pad"
                        inputMode="decimal"
                        value={editTargetDose}
                        onChangeText={(v) => setEditTargetDose(normalizeDecimalInput(v))}
                        textAlign="center"
                      />
                    </View>

                    {editingItem.unit !==
                      'mL' && (
                      <View
                        style={
                          styles.fancyInputContainer
                        }
                      >
                        <View
                          style={
                            styles.fancyInputHeader
                          }
                        >
                          <Text
                            style={
                              styles.fancyInputTitle
                            }
                          >
                            {language === 'en' ? 'Diluent Volume (BAC Water)' : 'Volume Pelarut (BAC Water)'}
                          </Text>

                          <Text
                            style={
                              styles.fancyInputTitleValBlue
                            }
                          >
                            {editBacWater || 0}{' '}
                            mL
                          </Text>
                        </View>

                        <TextInput
                          style={
                            styles.fancyTextInputBlue
                          }
                          keyboardType="decimal-pad"
                          inputMode="decimal"
                          value={editBacWater}
                          onChangeText={(v) =>
                            setEditBacWater(normalizeDecimalInput(v))
                          }
                          textAlign="center"
                        />
                      </View>
                    )}

                    <SyringeVisualizer
                      u100Units={liveMetrics.iu}
                      volMl={liveMetrics.volumeMlNumber}
                      showHeader={true}
                    />

                    <View
                      style={
                        styles.calcPanel
                      }
                    >
                      <View
                        style={
                          styles.calcHeader
                        }
                      >
                        <Activity
                          size={14}
                          color="#10b981"
                        />

                        <Text
                          style={
                            styles.calcHeaderTitle
                          }
                        >
                          {language === 'en' ? 'PRECISION CALCULATION' : 'HASIL KALKULASI PRESISI'}
                        </Text>
                      </View>

                      <View
                        style={
                          styles.calcGrid
                        }
                      >
                        <View
                          style={
                            styles.calcBoxBlue
                          }
                        >
                          <Text
                            style={
                              styles.calcBoxLabel
                            }
                          >
                            Volume
                          </Text>

                          <Text
                            style={
                              styles.calcBoxVal
                            }
                          >
                            {
                              liveMetrics.volumeMl
                            }
                          </Text>

                          <Text
                            style={
                              styles.calcBoxSub
                            }
                          >
                            mL
                          </Text>
                        </View>

                        <View
                          style={
                            styles.calcBoxGreen
                          }
                        >
                          <Text
                            style={
                              styles.calcBoxLabelGreen
                            }
                          >
                            {language === 'en' ? 'U-100 Syringe' : 'Spuit U-100'}
                          </Text>

                          <Text
                            style={
                              styles.calcBoxValGreen
                            }
                          >
                            {liveMetrics.iu}
                          </Text>

                          <Text
                            style={
                              styles.calcBoxSubGreen
                            }
                          >
                            IU
                          </Text>
                        </View>

                        <View
                          style={
                            styles.calcBoxBlue
                          }
                        >
                          <Text
                            style={
                              styles.calcBoxLabel
                            }
                          >
                            Dial Pen
                          </Text>

                          <Text
                            style={
                              styles.calcBoxVal
                            }
                          >
                            {
                              liveMetrics.dialClicks
                            }
                          </Text>

                          <Text
                            style={
                              styles.calcBoxSub
                            }
                          >
                            {language === 'en' ? 'Clicks' : 'Klik'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={
                        handleSaveDose
                      }
                      style={
                        styles.applyBtn
                      }
                    >
                      <CheckCircle2
                        size={16}
                        color="#022c22"
                      />

                      <Text
                        style={
                          styles.applyBtnText
                        }
                      >
                        {language === 'en' ? 'Apply & Save Dose' : 'Terapkan & Simpan Dosis'}
                      </Text>
                    </TouchableOpacity>
                  </ScrollView>
                );
              })()}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ====================================================== */}
      {/* MODAL 2 - JADWAL */}
      {/* ====================================================== */}

      <Modal
        visible={isScheduleModalOpen}
        animationType="slide"
        transparent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.scheduleModalOverlay}
        >
          <View style={styles.scheduleModalBox}>
            <View style={styles.scheduleModalHeader}>
              <View style={styles.scheduleModalTitleArea}>
                <View style={styles.scheduleModalIcon}>
                  <Clock size={17} color="#10b981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.scheduleModalTitle}>{language === 'en' ? 'Schedule & Settings' : 'Jadwal & Pengaturan'}</Text>
                  <Text style={styles.scheduleModalSubtitle}>{language === 'en' ? 'Configure days, time, cycle, and reminders' : 'Atur hari, waktu, siklus, dan pengingat'}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setIsScheduleModalOpen(false)}
                style={styles.scheduleCloseButton}
                accessibilityLabel={language === 'en' ? 'Close schedule settings' : 'Tutup pengaturan jadwal'}
              >
                <X size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {scheduleItem && (
              <ScrollView
                contentContainerStyle={styles.scheduleModalScroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.scheduleItemHero}>
                  <View style={styles.scheduleHeroPeptideRow}>
                    <View style={styles.scheduleHeroDot} />
                    <Text style={styles.scheduleHeroName} numberOfLines={1}>
                      {scheduleItem.name}
                    </Text>
                  </View>
                  <Text style={styles.scheduleHeroMeta}>
                    {scheduleItem.vialSize} {scheduleItem.unit} Vial • {scheduleItem.targetDose} {scheduleItem.doseUnit} {language === 'en' ? 'per action' : 'per tindakan'}
                  </Text>
                </View>

                <View style={styles.scheduleSection}>
                  <View style={styles.scheduleSectionHeader}>
                    <Text style={styles.scheduleSectionTitle}>{language === 'en' ? 'FREQUENCY' : 'FREKUENSI'}</Text>
                    <Text style={styles.scheduleSectionHint}>{getFrequencyDisplayLabel(frequencyKey, frequencyLabel, language)}</Text>
                  </View>
                  <View style={styles.presetGridCompact}>
                    {getFrequencyPresets(language).map((p) => (
                      <TouchableOpacity
                        key={p.id}
                        onPress={() => {
                          setFrequencyKey(p.id);
                          setFrequencyLabel(p.label);
                          setActiveDays(p.days);
                        }}
                        style={[
                          styles.freqCardCompact,
                          frequencyKey === p.id && styles.freqCardCompactActive,
                        ]}
                      >
                        <View style={styles.freqCardTopRow}>
                          <Text
                            style={[
                              styles.freqTitleCompact,
                              frequencyKey === p.id && styles.freqTitleCompactActive,
                            ]}
                            numberOfLines={1}
                          >
                            {p.label}
                          </Text>
                          {frequencyKey === p.id && <CheckCircle2 size={14} color="#10b981" />}
                        </View>
                        <Text style={styles.freqSubCompact}>{p.sub}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.scheduleSection}>
                  <View style={styles.scheduleSectionHeader}>
                    <Text style={styles.scheduleSectionTitle}>{language === 'en' ? 'ACTIVE DAYS' : 'HARI AKTIF'}</Text>
                    <Text style={styles.scheduleSectionHint}>
                      {activeDays.length === 1
                        ? (language === 'en' ? '1 day selected' : '1 hari dipilih')
                        : `${activeDays.length} ${language === 'en' ? 'days selected' : 'hari dipilih'}`}
                    </Text>
                  </View>
                  <View style={styles.daysSelectorModern}>
                    {DAYS_OF_WEEK.map((d) => {
                      const isSel = activeDays.includes(d);
                      return (
                        <TouchableOpacity
                          key={d}
                          onPress={() => {
                            if (isSel && activeDays.length > 1) {
                              setActiveDays(activeDays.filter((x) => x !== d));
                            } else if (!isSel) {
                              setActiveDays([...activeDays, d]);
                            }
                          }}
                          style={[styles.dayToggleModern, isSel && styles.dayToggleModernActive]}
                        >
                          <Text style={[styles.dayToggleModernText, isSel && styles.dayToggleModernTextActive]}>
                            {formatDayChip(d, language)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.scheduleSection}>
                  <View style={styles.scheduleSectionHeader}>
                    <Text style={styles.scheduleSectionTitle}>{language === 'en' ? 'INJECTION TIME' : 'WAKTU PENYUNTIKAN'}</Text>
                    <Text style={styles.scheduleSectionHint}>{language === 'en' ? '24-hour format' : 'Format 24 jam'}</Text>
                  </View>
                  <View style={styles.timePickerCard}>
                    <View style={styles.timePickerIcon}>
                      <Clock size={17} color="#38bdf8" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.timePickerLabel}>{language === 'en' ? 'Action time' : 'Jam tindakan'}</Text>
                      <Text style={styles.timePickerHint}>{language === 'en' ? 'Reminder follows this time' : 'Pengingat mengikuti waktu ini'}</Text>
                    </View>
                    <TextInput
                      style={styles.timePickerInput}
                      value={injectionTime}
                      onChangeText={setInjectionTime}
                      keyboardType="numbers-and-punctuation"
                      maxLength={5}
                      placeholder="08:00"
                      placeholderTextColor="#64748b"
                    />
                  </View>
                </View>

                <View style={styles.scheduleOptionsCard}>
                  <View style={styles.scheduleOptionRow}>
                    <View style={styles.scheduleOptionIconGreen}>
                      <Activity size={15} color="#10b981" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.scheduleOptionTitle}>{language === 'en' ? 'Cycle / Periodization' : 'Siklus / Periodisasi'}</Text>
                      <Text style={styles.scheduleOptionSub}>{language === 'en' ? 'Enable cycle settings for periodic schedules' : 'Aktifkan pengaturan cycle untuk jadwal berkala'}</Text>
                    </View>
                    <Switch
                      value={isCycleActive}
                      onValueChange={setIsCycleActive}
                      trackColor={{ false: '#1e293b', true: '#10b981' }}
                      thumbColor="#ffffff"
                    />
                  </View>
                  <View style={styles.scheduleOptionDivider} />
                  <View style={styles.scheduleOptionRow}>
                    <View style={styles.scheduleOptionIconBlue}>
                      <Clock size={15} color="#38bdf8" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.scheduleOptionTitle}>{language === 'en' ? 'Notification reminder' : 'Pengingat notifikasi'}</Text>
                      <Text style={styles.scheduleOptionSub}>{language === 'en' ? 'Get reminded when schedule arrives' : 'Beri pengingat ketika jadwal sudah tiba'}</Text>
                    </View>
                    <Switch
                      value={isReminderActive}
                      onValueChange={setIsReminderActive}
                      trackColor={{ false: '#1e293b', true: '#10b981' }}
                      thumbColor="#ffffff"
                    />
                  </View>
                </View>

                <View style={styles.scheduleActionsModern}>
                  <TouchableOpacity
                    onPress={() => setIsScheduleModalOpen(false)}
                    style={styles.scheduleCancelModern}
                  >
                    <Text style={styles.scheduleCancelModernText}>{language === 'en' ? 'Cancel' : 'Batal'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSaveSchedule} style={styles.scheduleSaveModern}>
                    <CheckCircle2 size={16} color="#022c22" />
                    <Text style={styles.scheduleSaveModernText}>{language === 'en' ? 'Save Schedule' : 'Simpan Jadwal'}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ====================================================== */}
      {/* MODAL 3 - AMBIL FREEZER */}
      {/* ====================================================== */}

      <Modal
        visible={isTakeFreezerModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => {
          setIsTakeFreezerModalOpen(false);
          setSelectedFreezerItem(null);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.freezerModalOverlayV1}
        >
          <View style={styles.freezerModalBoxV1}>
            <View style={styles.freezerModalHeaderV1}>
              <View style={styles.freezerModalHeaderLeftV1}>
                <View style={styles.freezerModalIconBoxV1}>
                  <Snowflake size={17} color="#38bdf8" />
                </View>

                <View style={styles.freezerModalHeaderTextV1}>
                  <Text style={styles.freezerModalTitleV1} numberOfLines={1}>
                    {language === 'en' ? 'Take Stock from Freezer' : 'Ambil Stok dari Freezer'}
                  </Text>
                  <Text style={styles.freezerModalSubtitleV1} numberOfLines={1}>
                    {language === 'en' ? 'Select vial to move to fridge' : 'Pilih vial untuk dipindahkan ke kulkas'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => {
                  setIsTakeFreezerModalOpen(false);
                  setSelectedFreezerItem(null);
                }}
                style={styles.freezerModalCloseV1}
                accessibilityLabel={language === 'en' ? 'Close take stock from freezer' : 'Tutup ambil stok dari freezer'}
              >
                <X size={17} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.freezerModalScrollV1}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {!selectedFreezerItem ? (
                <>
                  <Text style={styles.freezerModalInstructionV1}>
                    {language === 'en' ? 'Select peptide to move to fridge' : 'Pilih peptida yang ingin dipindahkan ke kulkas'}
                  </Text>

                  <View style={styles.freezerItemsListV1}>
                    {freezerList.map((f) => {
                      const isEmpty = f.quantity <= 0;

                      return (
                        <TouchableOpacity
                          key={f.id}
                          activeOpacity={isEmpty ? 1 : 0.75}
                          disabled={isEmpty}
                          onPress={() => {
                            if (isEmpty) return;

                            if (f.unit === 'mL') {
                              transferLiquidToFridge(f.id);
                              setIsTakeFreezerModalOpen(false);
                              setSelectedFreezerItem(null);
                            } else {
                              setSelectedFreezerItem(f);
                              setFreezerBacInput(
                                (f.defaultBacWater || 2).toString(),
                              );
                            }
                          }}
                          style={[
                            styles.freezerSelectCardV1,
                            isEmpty && styles.freezerSelectCardEmptyV1,
                          ]}
                        >
                          <View style={styles.freezerSelectIconV1}>
                            <FlaskConical
                              size={16}
                              color={isEmpty ? '#475569' : '#10b981'}
                            />
                          </View>

                          <View style={styles.freezerSelectContentV1}>
                            <View style={styles.freezerSelectTitleRowV1}>
                              <Text
                                style={[
                                  styles.freezerSelectTitleV1,
                                  isEmpty &&
                                    styles.freezerSelectTitleEmptyV1,
                                ]}
                                numberOfLines={1}
                              >
                                {f.name}
                              </Text>

                              <Text
                                style={[
                                  styles.freezerSelectQuantityV1,
                                  isEmpty &&
                                    styles.freezerSelectQuantityEmptyV1,
                                ]}
                              >
                                {f.quantity} Vial
                              </Text>
                            </View>

                            <Text
                              style={[
                                styles.freezerSelectMetaV1,
                                isEmpty && styles.freezerSelectMetaEmptyV1,
                              ]}
                              numberOfLines={1}
                            >
                              {f.category} • {f.vialSize} {f.unit}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              ) : (
                <View style={styles.reconContainerV1}>
                  <View style={styles.reconHeroV1}>
                    <View style={styles.reconHeroIconV1}>
                      <FlaskConical size={18} color="#10b981" />
                    </View>

                    <View style={styles.reconHeroTextV1}>
                      <Text style={styles.reconHeroTitleV1} numberOfLines={1}>
                        {selectedFreezerItem.name}
                      </Text>
                      <Text style={styles.reconHeroMetaV1}>
                        {selectedFreezerItem.vialSize}{' '}
                        {selectedFreezerItem.unit} Vial •{' '}
                        {selectedFreezerItem.category}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.reconInfoV1}>
                    <Text style={styles.reconInfoTitleV1}>{language === 'en' ? 'Reconstitution' : 'Pelarutan'}</Text>
                    <Text style={styles.reconInfoTextV1}>
                      {language === 'en' ? 'Enter BAC Water volume to reconstitute this peptide into active fridge.' : 'Masukkan volume BAC Water untuk melarutkan peptida ini ke kulkas aktif.'}
                    </Text>
                  </View>

                  <View style={styles.reconInputCardV1}>
                    <View style={styles.reconInputHeaderV1}>
                      <Text style={styles.reconInputLabelV1}>
                        {language === 'en' ? 'BAC Water Volume' : 'Volume BAC Water'}
                      </Text>
                      <Text style={styles.reconInputUnitV1}>mL</Text>
                    </View>

                    <TextInput
                      style={styles.reconInputV1}
                      keyboardType="decimal-pad"
                      inputMode="decimal"
                      value={freezerBacInput}
                      onChangeText={(v) => setFreezerBacInput(normalizeDecimalInput(v))}
                      placeholder="2.0"
                      placeholderTextColor="#475569"
                    />
                  </View>

                  <View style={styles.reconActionRowV1}>
                    <TouchableOpacity
                      onPress={() => setSelectedFreezerItem(null)}
                      style={styles.reconBtnBackV1}
                    >
                      <Text style={styles.reconBtnBackTextV1}>
                        {language === 'en' ? 'Back' : 'Kembali'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        reconstituteToFridge(
                          selectedFreezerItem.id,
                          parseDecimal(freezerBacInput) || 2.0,
                        );
                        setIsTakeFreezerModalOpen(false);
                        setSelectedFreezerItem(null);
                      }}
                      style={styles.reconBtnSubmitV1}
                    >
                      <FlaskConical size={15} color="#022c22" />
                      <Text style={styles.reconBtnSubmitTextV1}>
                        {language === 'en' ? 'Reconstitute Now' : 'Larutkan Sekarang'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
    paddingHorizontal: 14,
    paddingTop: 6,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },

  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 9,
    gap: 8,
  },

  statLabel: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '700',
  },

  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },

  statSub: {
    fontSize: 10,
    fontWeight: '400',
    color: '#94a3b8',
  },

  statMini: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
  },

  scheduleStatContent: {
    flex: 1,
    minWidth: 0,
  },

  scheduleStatCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 9,
    gap: 8,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
  },

  sectionTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },

  sectionSub: {
    fontSize: 8,
    color: '#64748b',
  },

  lifecycleFilterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },

  lifecycleFilterChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
  },

  lifecycleFilterChipActive: {
    backgroundColor:
      'rgba(16, 185, 129, 0.12)',
    borderColor: '#10b981',
  },

  lifecycleFilterText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
  },

  lifecycleFilterTextActive: {
    color: '#10b981',
  },

  takeFreezerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },

  takeFreezerBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#022c22',
  },

  listContainer: {
    paddingBottom: 96,
    gap: 6,
  },

  emptyCard: {
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },

  emptyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },

  emptySub: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
  },

  peptideCard: {
    backgroundColor: '#090d16',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 9,
    gap: 4,
    marginBottom: 5,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  cardTitleBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    paddingTop: 1,
  },

  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 1,
  },

  badgePaused: {
    backgroundColor:
      'rgba(56, 189, 248, 0.10)',
    borderWidth: 1,
    borderColor:
      'rgba(56, 189, 248, 0.35)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },

  badgePausedText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#38bdf8',
  },

  iconBtnDisabled: {
    opacity: 0.35,
  },

  peptideName: {
    fontSize: 15,
    lineHeight: 17,
    fontWeight: '900',
    color: '#ffffff',
  },

  vialBadge: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#26364e',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 7,
    flexShrink: 0,
  },

  vialBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
  },

  lifecycleBadge: {
    backgroundColor:
      'rgba(16, 185, 129, 0.10)',
    borderWidth: 1,
    borderColor:
      'rgba(16, 185, 129, 0.35)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },

  lifecycleBadgeEmpty: {
    backgroundColor:
      'rgba(100, 116, 139, 0.12)',
    borderColor: '#334155',
  },

  lifecycleBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#10b981',
  },

  lifecycleBadgeTextEmpty: {
    color: '#94a3b8',
  },

  headerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 4,
  },

  badgeToday: {
    backgroundColor:
      'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },

  badgeTodayText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10b981',
  },

  badgeRest: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },

  badgeRestText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
  },

  iconBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#1e293b',
  },

  categorySubText: {
    fontSize: 10,
    color: '#64748b',
  },

  doseMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
    alignItems: 'center',
  },

  metricChipDose: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },

  metricChipDoseText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#f59e0b',
  },

  metricChipSpuit: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },

  metricChipSpuitText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#06b6d4',
  },

  metricChipDial: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },

  metricChipDialText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#38bdf8',
  },

  daysRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginVertical: 0,
  },

  daysRowLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
  },

  daysChipsList: {
    flexDirection: 'row',
    gap: 3,
    flex: 1,
    minWidth: 0,
  },

  dayDot: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingHorizontal: 2,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1e293b',
  },

  dayDotActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },

  dayDotText: {
    fontSize: 8,
    color: '#64748b',
    fontWeight: '700',
  },

  dayDotTextActive: {
    color: '#022c22',
  },

  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    minWidth: 54,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#1e293b',
  },

  timeTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
  },

  scheduleStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#030712',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  scheduleStatusText: {
    fontSize: 9,
    color: '#f59e0b',
    fontWeight: '700',
  },

  scheduleStatusMissed: {
    color: '#ef4444',
  },

  progressContainer: {
    backgroundColor: '#030712',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 5,
    gap: 3,
    marginVertical: 0,
  },

  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  progressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  progressTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38bdf8',
  },

  progressPercentText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#38bdf8',
  },

  progressBarBg: {
    height: 4,
    backgroundColor: '#1e293b',
    borderRadius: 2,
    overflow: 'hidden',
  },

  progressBarFill: {
    height: '100%',
    backgroundColor: '#38bdf8',
    borderRadius: 2,
  },

  progressFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },

  progressFooterText: {
    fontSize: 8,
    color: '#64748b',
  },

  injectMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingVertical: 7,
    borderRadius: 9,
    marginTop: 1,
  },

  injectMainBtnDisabled: {
    backgroundColor: '#111827',
    borderColor: '#334155',
  },

  injectMainBtnTextDisabled: {
    color: '#64748b',
  },

  injectMainBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#022c22',
  },

  /* ====================================================== */
  /* MODAL DOSIS */
  /* ====================================================== */

  doseModalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },

  doseModalBox: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    height: '85%',
  },

  doseModalScroll: {
    paddingBottom: 104,
    gap: 14,
  },

  doseModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  doseModalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
  },

  doseModalSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },

  closeIconCircle: {
    backgroundColor: '#1e293b',
    padding: 6,
    borderRadius: 12,
  },

  sectionHeadingMini: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginTop: 4,
  },

  presetDoseRow: {
    flexDirection: 'row',
    gap: 8,
  },

  presetDoseBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },

  presetDoseBtnActive: {
    backgroundColor: '#10b981',
  },

  presetDoseBtnLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
  },

  presetDoseBtnVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },

  presetTextActive: {
    color: '#022c22',
  },

  fancyInputContainer: {
    backgroundColor: '#090d16',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
    gap: 8,
  },

  fancyInputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  fancyInputTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
  },

  fancyInputTitleVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10b981',
  },

  fancyInputTitleValBlue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38bdf8',
  },

  fancyTextInput: {
    backgroundColor: '#030712',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b981',
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    paddingVertical: 10,
  },

  fancyTextInputBlue: {
    backgroundColor: '#030712',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#38bdf8',
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    paddingVertical: 10,
  },

  svgCardBox: {
    backgroundColor: '#090d16',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
    gap: 10,
  },

  svgCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  svgCardTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },

  svgCardVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10b981',
  },

  svgWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },

  calcPanel: {
    backgroundColor: '#090d16',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10b981',
    padding: 12,
    gap: 12,
  },

  calcHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  calcHeaderTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10b981',
  },

  calcGrid: {
    flexDirection: 'row',
    gap: 8,
  },

  calcBoxBlue: {
    flex: 1,
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    gap: 2,
  },

  calcBoxGreen: {
    flex: 1,
    backgroundColor:
      'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    gap: 2,
  },

  calcBoxLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
  },

  calcBoxVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },

  calcBoxSub: {
    fontSize: 9,
    color: '#64748b',
  },

  calcBoxLabelGreen: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10b981',
  },

  calcBoxValGreen: {
    fontSize: 16,
    fontWeight: '900',
    color: '#10b981',
  },

  calcBoxSubGreen: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10b981',
  },

  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10,
  },

  applyBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#022c22',
  },

  /* ====================================================== */
  /* MODAL JADWAL — COMPACT REDESIGN */
  /* ====================================================== */

  scheduleModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'flex-end',
  },

  scheduleModalBox: {
    backgroundColor: '#0b1220',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 15,
    paddingTop: 11,
    maxHeight: '90%',
  },

  scheduleModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 11,
    borderBottomWidth: 1,
    borderColor: '#1e293b',
  },

  scheduleModalTitleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    flex: 1,
  },

  scheduleModalIcon: {
    width: 35,
    height: 35,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },

  scheduleModalTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff',
  },

  scheduleModalSubtitle: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
  },

  scheduleCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1e293b',
  },

  scheduleModalScroll: {
    paddingTop: 11,
    paddingBottom: 22,
    gap: 9,
  },

  scheduleItemHero: {
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 10,
  },

  scheduleHeroPeptideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  scheduleHeroDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },

  scheduleHeroName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
  },

  scheduleHeroMeta: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 4,
    marginLeft: 14,
  },

  scheduleSection: {
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },

  scheduleSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  scheduleSectionTitle: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    color: '#94a3b8',
  },

  scheduleSectionHint: {
    fontSize: 8,
    fontWeight: '700',
    color: '#10b981',
  },

  presetGridCompact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },

  freqCardCompact: {
    width: '48.5%',
    minHeight: 46,
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 7,
    justifyContent: 'center',
  },

  freqCardCompactActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: '#10b981',
  },

  freqCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },

  freqTitleCompact: {
    flex: 1,
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
  },

  freqTitleCompactActive: {
    color: '#10b981',
  },

  freqSubCompact: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
  },

  daysSelectorModern: {
    flexDirection: 'row',
    gap: 4,
  },

  dayToggleModern: {
    flex: 1,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 7,
  },

  dayToggleModernActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },

  dayToggleModernText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
  },

  dayToggleModernTextActive: {
    color: '#022c22',
  },

  timePickerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 9,
    padding: 7,
  },

  timePickerIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },

  timePickerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },

  timePickerHint: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
  },

  timePickerInput: {
    width: 68,
    height: 38,
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#38bdf8',
    borderRadius: 8,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
    paddingHorizontal: 3,
  },

  scheduleOptionsCard: {
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 10,
  },

  scheduleOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 9,
  },

  scheduleOptionIconGreen: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },

  scheduleOptionIconBlue: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },

  scheduleOptionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },

  scheduleOptionSub: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
  },

  scheduleOptionDivider: {
    height: 1,
    backgroundColor: '#1e293b',
  },

  scheduleActionsModern: {
    flexDirection: 'row',
    gap: 7,
  },

  scheduleCancelModern: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
  },

  scheduleCancelModernText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
  },

  scheduleSaveModern: {
    flex: 2,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    borderRadius: 10,
  },

  scheduleSaveModernText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#022c22',
  },

  /* ====================================================== */
  /* MODAL FREEZER - PRIORITAS 1 */
  /* ====================================================== */

  freezerModalOverlayV1: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },

  freezerModalBoxV1: {
    width: '100%',
    maxHeight: '78%',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 18,
    overflow: 'hidden',
  },

  freezerModalHeaderV1: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },

  freezerModalHeaderLeftV1: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },

  freezerModalIconBoxV1: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.18)',
  },

  freezerModalHeaderTextV1: {
    flex: 1,
    minWidth: 0,
  },

  freezerModalTitleV1: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },

  freezerModalSubtitleV1: {
    marginTop: 2,
    fontSize: 9,
    color: '#64748b',
  },

  freezerModalCloseV1: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1e293b',
    marginLeft: 8,
  },

  freezerModalScrollV1: {
    padding: 13,
    paddingBottom: 18,
  },

  freezerModalInstructionV1: {
    marginBottom: 9,
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
  },

  freezerItemsListV1: {
    gap: 7,
  },

  freezerSelectCardV1: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 58,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 11,
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 9,
  },

  freezerSelectCardEmptyV1: {
    opacity: 0.5,
  },

  freezerSelectIconV1: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#1e293b',
  },

  freezerSelectContentV1: {
    flex: 1,
    minWidth: 0,
  },

  freezerSelectTitleRowV1: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },

  freezerSelectTitleV1: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
  },

  freezerSelectTitleEmptyV1: {
    color: '#64748b',
  },

  freezerSelectQuantityV1: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10b981',
  },

  freezerSelectQuantityEmptyV1: {
    color: '#64748b',
  },

  freezerSelectMetaV1: {
    marginTop: 3,
    fontSize: 9,
    color: '#64748b',
  },

  freezerSelectMetaEmptyV1: {
    color: '#475569',
  },

  reconContainerV1: {
    gap: 10,
  },

  reconHeroV1: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 11,
    borderRadius: 11,
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1e293b',
  },

  reconHeroIconV1: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.18)',
  },

  reconHeroTextV1: {
    flex: 1,
    minWidth: 0,
  },

  reconHeroTitleV1: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
  },

  reconHeroMetaV1: {
    marginTop: 3,
    fontSize: 9,
    color: '#64748b',
  },

  reconInfoV1: {
    paddingHorizontal: 2,
  },

  reconInfoTitleV1: {
    fontSize: 11,
    fontWeight: '900',
    color: '#10b981',
  },

  reconInfoTextV1: {
    marginTop: 3,
    fontSize: 9,
    lineHeight: 14,
    color: '#64748b',
  },

  reconInputCardV1: {
    padding: 11,
    borderRadius: 11,
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 7,
  },

  reconInputHeaderV1: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  reconInputLabelV1: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
  },

  reconInputUnitV1: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38bdf8',
  },

  reconInputV1: {
    minHeight: 42,
    borderRadius: 9,
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#38bdf8',
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    paddingHorizontal: 11,
    paddingVertical: 8,
    textAlign: 'center',
  },

  reconActionRowV1: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },

  reconBtnBackV1: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1e293b',
  },

  reconBtnBackTextV1: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
  },

  reconBtnSubmitV1: {
    flex: 1.7,
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 9,
    backgroundColor: '#10b981',
  },

  unitToggleGroupModal: {
    flexDirection: 'row',
    backgroundColor: '#030712',
    borderRadius: 8,
    padding: 2,
    gap: 2,
    borderWidth: 1,
    borderColor: '#334155',
  },
  unitToggleBtnModal: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  unitToggleBtnModalActive: {
    backgroundColor: '#10b981',
  },
  unitToggleTextModal: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
  },
  unitToggleTextModalActive: {
    color: '#022c22',
  },
  reconBtnSubmitTextV1: {
    fontSize: 10,
    fontWeight: '900',
    color: '#022c22',
  },

});
