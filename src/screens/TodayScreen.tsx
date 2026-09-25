import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import {
  Activity,
  AlertTriangle,
  Archive,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Droplets,
  FlaskConical,
  History,
  PackageCheck,
  Snowflake,
  Syringe,
  Target,
  TrendingUp,
  XCircle,
  Sparkles,
} from 'lucide-react-native';
import { useBioStackStore } from '../store/useBioStackStore';
import {
  formatLocalDate,
  getNextScheduledOccurrence,
  getScheduledOccurrences,
  type ScheduledOccurrence,
  WEEKDAY_LABELS,
} from '../utils/scheduleUtils';
import { getDashboardAnalytics, getLogsForLocalDate, getOccurrenceStatusLabel } from '../utils/dashboardUtils';
import { calculateInjectionMetrics, getLiquidStatus, normalizeDecimalInput } from '../utils/injectionCalculations';
import { getSiteLabel, getSiteCode, getTrackerSuggestedSite, ROTATION_SITE_ORDER } from '../utils/rotationUtils';
import { CuteVialIllustration } from '../components/common/CuteVialIllustration';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme';
import type { InventoryItem } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

const addDays = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setHours(12, 0, 0, 0);
  next.setDate(next.getDate() + amount);
  return next;
};

const formatDateLong = (date: Date, lang: string = 'id') =>
  new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);

const WEEKDAY_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatDayNumber = (date: Date) => String(date.getDate()).padStart(2, '0');

const formatTime = (value: string) => value || '08:00';

export interface TodayScreenProps {
  onOpenInventory?: () => void;
  onNavigateTab?: (tab: string) => void;
  notificationTarget?: { inventoryId?: string; date?: string } | null;
}

export const TodayScreen: React.FC<TodayScreenProps> = ({
  onOpenInventory,
  onNavigateTab,
  notificationTarget,
}) => {
  const { language, t } = useLanguage();
  const { inventory, freezerStock, injectionHistory, currentSite, recordInjection } = useBioStackStore();
  const now = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(now);
  const [weekOffset, setWeekOffset] = useState(0);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [quickLogVialId, setQuickLogVialId] = useState<string>('');
  const [quickLogDose, setQuickLogDose] = useState('');
  const [quickLogSite, setQuickLogSite] = useState(currentSite);
  const [quickLogNotes, setQuickLogNotes] = useState('');
  const [highlightedInventoryId, setHighlightedInventoryId] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!notificationTarget?.inventoryId) return;

    setHighlightedInventoryId(notificationTarget.inventoryId);

    if (notificationTarget.date) {
      const [year, month, day] = notificationTarget.date.split('-').map(Number);
      if (year && month && day) {
        setSelectedDate(new Date(year, month - 1, day));
      }
    }

    const timer = setTimeout(() => {
      setHighlightedInventoryId(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [notificationTarget?.inventoryId, notificationTarget?.date]);

  const safeInventory = Array.isArray(inventory) ? inventory : [];
  const safeLogs = Array.isArray(injectionHistory) ? injectionHistory : [];
  const weekStart = useMemo(() => {
    const base = new Date(now);
    base.setHours(12, 0, 0, 0);
    base.setDate(base.getDate() - base.getDay() + (weekOffset * 7));
    return base;
  }, [weekOffset]);

  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
  const selectedOccurrences = useMemo(
    () => getScheduledOccurrences(safeInventory, selectedDate, 1, safeLogs),
    [safeInventory, safeLogs, selectedDate]
  );
  const selectedLogs = useMemo(() => getLogsForLocalDate(safeLogs, selectedDate), [safeLogs, selectedDate]);
  const upcoming = useMemo(() => getScheduledOccurrences(safeInventory, now, 7, safeLogs).slice(0, 6), [safeInventory, safeLogs, now]);
  const analytics = useMemo(
    () => getDashboardAnalytics(safeInventory, (freezerStock || []).reduce((sum, item) => sum + Math.max(0, item.quantity || 0), 0), safeLogs, now),
    [safeInventory, freezerStock, safeLogs, now]
  );

  const activeVials = safeInventory.filter((item) =>
    (item.lifecycleStatus || 'active') === 'active' &&
    !item.schedulePaused &&
    (item.currentVolumeMl === undefined || item.currentVolumeMl > 0)
  );

  const nextByVial = activeVials
    .map((item) => ({ item, next: getNextScheduledOccurrence(item, now, safeLogs, 30) }))
    .filter((entry) => entry.next)
    .sort((a, b) => `${a.next?.date}T${a.next?.time}`.localeCompare(`${b.next?.date}T${b.next?.time}`))[0];

  const selectedQuickVial = activeVials.find((item) => item.id === quickLogVialId) || activeVials[0];
  const quickLogMetrics = selectedQuickVial
    ? calculateInjectionMetrics(selectedQuickVial, quickLogDose)
    : null;

  const openQuickLog = () => {
    if (activeVials.length === 0) {
      Alert.alert(
        language === 'en' ? 'No active vials' : 'Tidak ada vial aktif',
        language === 'en'
          ? 'Please add or activate a vial in Inventory first.'
          : 'Tambahkan atau aktifkan vial di Inventory terlebih dahulu.'
      );
      return;
    }
    const vial = activeVials.find((item) => item.id === quickLogVialId) || activeVials[0];
    const suggestedSite = getTrackerSuggestedSite(safeLogs, vial.id) || currentSite;
    setQuickLogVialId(vial.id);
    setQuickLogDose(String(vial.targetDose ?? ''));
    setQuickLogSite(suggestedSite);
    setQuickLogNotes('');
    setIsQuickLogOpen(true);
  };

  const selectQuickVial = (vial: InventoryItem) => {
    setQuickLogVialId(vial.id);
    setQuickLogDose(String(vial.targetDose ?? ''));
    setQuickLogSite(getTrackerSuggestedSite(safeLogs, vial.id) || currentSite);
  };

  const saveQuickLog = () => {
    if (!selectedQuickVial) {
      Alert.alert(
        language === 'en' ? 'No vial selected' : 'Vial belum dipilih',
        language === 'en' ? 'Please choose an active vial.' : 'Pilih salah satu vial aktif.'
      );
      return;
    }

    if (!quickLogMetrics || !quickLogMetrics.valid || quickLogMetrics.volumeMlNumber <= 0) {
      Alert.alert(
        language === 'en' ? 'Invalid dose' : 'Dosis tidak valid',
        language === 'en'
          ? 'Check vial concentration or enter a valid number.'
          : 'Periksa konsentrasi vial atau masukkan angka dosis yang valid.'
      );
      return;
    }

    const currentVolume = selectedQuickVial.currentVolumeMl ?? quickLogMetrics.volumeMlNumber;
    if (currentVolume < quickLogMetrics.volumeMlNumber) {
      Alert.alert(
        language === 'en' ? 'Insufficient liquid' : 'Cairan tidak cukup',
        language === 'en'
          ? 'Remaining liquid in vial is insufficient for this entry.'
          : 'Sisa cairan pada vial tidak mencukupi untuk dosis ini.'
      );
      return;
    }

    const actual = new Date();
    const localDate = formatLocalDate(actual);
    const localTime = actual.toLocaleTimeString(language === 'en' ? 'en-US' : 'id-ID', { hour: '2-digit', minute: '2-digit' });

    const recorded = recordInjection(
      selectedQuickVial.id,
      {
        id: `quick-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        peptideName: selectedQuickVial.name,
        dose: Number(quickLogDose) || selectedQuickVial.targetDose,
        unit: selectedQuickVial.doseUnit,
        volumeMl: quickLogMetrics.volumeMl,
        siteId: quickLogSite,
        timestamp: actual.toISOString(),
        inventoryId: selectedQuickVial.id,
        recordedAtLocal: actual.toLocaleString(language === 'en' ? 'en-US' : 'id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        dateStr: localDate,
        timeStr: localTime,
        notes: quickLogNotes.trim() || undefined,
      },
      quickLogMetrics.volumeMlNumber,
    );

    if (!recorded) {
      Alert.alert(
        language === 'en' ? 'Failed to record' : 'Gagal mencatat',
        language === 'en'
          ? 'Vial data changed or volume is insufficient. Try again.'
          : 'Data vial berubah atau volume tidak mencukupi. Coba ulangi.'
      );
      return;
    }

    setIsQuickLogOpen(false);
  };

  const handleScheduledLog = (occurrence: ScheduledOccurrence) => {
    const item = safeInventory.find((entry) => entry.id === occurrence.inventoryId);

    if (!item) {
      Alert.alert(
        language === 'en' ? 'Peptide not found' : 'Peptide tidak ditemukan',
        language === 'en'
          ? 'This peptide data is no longer available in Inventory.'
          : 'Data peptide ini sudah tidak tersedia di Inventory.'
      );
      return;
    }

    const metrics = calculateInjectionMetrics(item);

    if (!metrics.valid || metrics.volumeMlNumber <= 0) {
      Alert.alert(
        language === 'en' ? 'Invalid data' : 'Data belum valid',
        language === 'en'
          ? 'Check dose and dial configuration in Inventory.'
          : 'Periksa konfigurasi dosis dan dial peptide di Inventory.'
      );
      return;
    }

    const currentVolume = item.currentVolumeMl ?? metrics.volumeMlNumber;

    if (currentVolume < metrics.volumeMlNumber) {
      Alert.alert(
        language === 'en' ? 'Insufficient liquid' : 'Cairan tidak cukup',
        language === 'en'
          ? 'Remaining liquid in vial is insufficient for this entry.'
          : 'Sisa cairan pada vial tidak mencukupi untuk pencatatan ini.'
      );
      return;
    }

    const suggestedSite = getTrackerSuggestedSite(safeLogs, item.id) || currentSite;

    const title = occurrence.status === 'missed'
      ? (language === 'en' ? 'Log missed activity' : 'Catat aktivitas terlewat')
      : (language === 'en' ? 'Confirm entry' : 'Konfirmasi pencatatan');
    const msg = `${item.name}\n${language === 'en' ? 'Schedule' : 'Jadwal'} ${occurrence.time}\n${metrics.doseUnit} ${item.targetDose} (${metrics.iu} IU)`;

    const executeRecord = () => {
      const actual = new Date();
      const recorded = recordInjection(
        item.id,
        {
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          peptideName: item.name,
          dose: item.targetDose,
          unit: item.doseUnit,
          volumeMl: metrics.volumeMl,
          siteId: suggestedSite,
          timestamp: actual.toISOString(),
          inventoryId: item.id,
          recordedAtLocal: actual.toLocaleString(language === 'en' ? 'en-US' : 'id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          dateStr: formatLocalDate(actual),
          timeStr: actual.toLocaleTimeString(language === 'en' ? 'en-US' : 'id-ID', { hour: '2-digit', minute: '2-digit' }),
        },
        metrics.volumeMlNumber,
      );

      if (!recorded) {
        Alert.alert(
          language === 'en' ? 'Failed to record' : 'Gagal mencatat',
          language === 'en'
            ? 'Vial data changed or volume is insufficient. Try again.'
            : 'Data vial berubah atau volume tidak mencukupi. Coba ulangi.'
        );
        return;
      }

      Alert.alert(
        language === 'en' ? 'Recorded' : 'Tercatat',
        language === 'en'
          ? `${item.name} successfully recorded.`
          : `${item.name} berhasil dicatat.`
      );
    };

    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (window.confirm(`${title}\n\n${msg}`)) {
        executeRecord();
      }
      return;
    }

    Alert.alert(
      title,
      msg,
      [
        { text: language === 'en' ? 'Cancel' : 'Batal', style: 'cancel' },
        {
          text: language === 'en' ? 'Confirm' : 'Konfirmasi',
          onPress: executeRecord,
        },
      ],
    );
  };

  const selectDate = (date: Date) => setSelectedDate(new Date(date));
  const isToday = formatLocalDate(selectedDate) === formatLocalDate(now);

  const dueOccurrences = selectedOccurrences.filter((item) => item.status === 'due' || item.status === 'missed');
  const completedOccurrences = selectedOccurrences.filter((item) => item.status === 'completed');

  // Format tanggal mendatang dengan nama hari
  const formatUpcomingDay = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return dateStr;
    const target = new Date(y, m - 1, d);
    const dayNamesId = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNamesId = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (language === 'en') {
      return `${dayNamesEn[target.getDay()]}, ${monthNamesEn[target.getMonth()]} ${d}`;
    }
    return `${dayNamesId[target.getDay()]}, ${d} ${monthNamesId[target.getMonth()]}`;
  };

  return (
    <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* ========================================================
          1. DYNAMIC DAILY FOCUS HERO
      ======================================================== */}
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroLeft}>
            <View style={styles.heroStatusBadge}>
              <View style={[styles.statusPulseDot, { backgroundColor: dueOccurrences.length > 0 ? COLORS.yellow : COLORS.mint }]} />
              <Text style={styles.heroStatusText}>
                {isToday
                  ? (dueOccurrences.length > 0
                      ? (language === 'en' ? `${dueOccurrences.length} INJECTION DUE TODAY` : `${dueOccurrences.length} JADWAL SUNTIK HARI INI`)
                      : (language === 'en' ? 'ALL CLEAR FOR TODAY' : 'SEMUA BERES HARI INI'))
                  : formatDateLong(selectedDate, language).toUpperCase()}
              </Text>
            </View>

            <Text style={styles.heroHeadline}>
              {isToday
                ? (dueOccurrences.length > 0
                    ? (language === 'en' ? 'Time for Your Dose' : 'Waktunya Injeksi')
                    : (language === 'en' ? 'Routine on Track' : 'Protokol Berjalan'))
                : (language === 'en' ? 'Daily Schedule' : 'Jadwal Harian')}
            </Text>

            <Text style={styles.heroSubtext}>
              {dueOccurrences.length > 0
                ? (language === 'en' ? 'Tap Quick Log when injection is finished' : 'Tekan Catat setelah suntik selesai')
                : (language === 'en' ? 'All scheduled injections recorded' : 'Semua injeksi terjadwal sudah dicatat')}
            </Text>
          </View>

          <TouchableOpacity style={styles.quickLogPillBtn} onPress={openQuickLog} activeOpacity={0.8}>
            <Syringe size={14} color="#231716" />
            <Text style={styles.quickLogPillText}>{language === 'en' ? 'Quick Log' : 'Catat'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ========================================================
          2. SLIM HORIZONTAL DATE STRIP
      ======================================================== */}
      <View style={styles.calendarStripCard}>
        <View style={styles.calendarStripHeader}>
          <View style={styles.calendarDateTitleRow}>
            <CalendarDays size={14} color={COLORS.cyan} />
            <Text style={styles.calendarMonthText}>
              {formatDateLong(selectedDate, language)}
            </Text>
          </View>

          <View style={styles.weekNavButtons}>
            <TouchableOpacity style={styles.weekNavBtn} onPress={() => setWeekOffset((v) => v - 1)}>
              <ChevronLeft size={14} color={COLORS.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.weekNavBtn, weekOffset === 0 && styles.todayNavBtnActive]}
              onPress={() => {
                setWeekOffset(0);
                setSelectedDate(now);
              }}
            >
              <Text style={styles.todayNavBtnText}>{language === 'en' ? 'Today' : 'Hari ini'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.weekNavBtn} onPress={() => setWeekOffset((v) => v + 1)}>
              <ChevronRight size={14} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.slimWeekRow}>
          {weekDates.map((date) => {
            const key = formatLocalDate(date);
            const todayKey = formatLocalDate(now);
            const isSelected = key === formatLocalDate(selectedDate);
            const hasSchedule = getScheduledOccurrences(safeInventory, date, 1, safeLogs).length > 0;
            const hasLog = getLogsForLocalDate(safeLogs, date).length > 0;
            const isTodayDate = key === todayKey;

            return (
              <TouchableOpacity
                key={key}
                onPress={() => selectDate(date)}
                style={[
                  styles.slimDayCell,
                  isSelected && styles.slimDayCellActive,
                  isTodayDate && !isSelected && styles.slimDayCellToday,
                ]}
                activeOpacity={0.7}
              >
                <Text style={[styles.slimDayLabel, isSelected && styles.slimDayLabelActive]}>
                  {language === 'en' ? WEEKDAY_EN[date.getDay()] : WEEKDAY_LABELS[date.getDay()]}
                </Text>
                <Text style={[styles.slimDayNumber, isSelected && styles.slimDayNumberActive]}>
                  {formatDayNumber(date)}
                </Text>

                <View style={styles.dotIndicatorRow}>
                  {hasSchedule && <View style={[styles.statusDot, { backgroundColor: COLORS.cyan }]} />}
                  {hasLog && <View style={[styles.statusDot, { backgroundColor: COLORS.mint }]} />}
                  {!hasSchedule && !hasLog && <View style={[styles.statusDot, { backgroundColor: 'transparent' }]} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ========================================================
          3. TODAY ACTION FEED (JADWAL HARI INI)
      ======================================================== */}
      <View style={styles.feedSection}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleGroup}>
            <Clock3 size={15} color={COLORS.yellow} />
            <Text style={styles.sectionTitleText}>
              {language === 'en' ? 'Activities for This Date' : 'Aktivitas Tanggal Ini'}
            </Text>
          </View>
          <Text style={styles.sectionBadgeCount}>
            {selectedOccurrences.length + selectedLogs.length}
          </Text>
        </View>

        {selectedOccurrences.length === 0 && selectedLogs.length === 0 ? (
          <View style={styles.emptyFeedCard}>
            <CheckCircle2 size={28} color={COLORS.mint} />
            <Text style={styles.emptyFeedTitle}>
              {language === 'en' ? 'No injections on this date' : 'Tidak ada jadwal pada tanggal ini'}
            </Text>
            <Text style={styles.emptyFeedSub}>
              {language === 'en' ? 'Enjoy your day! Tap Quick Log if you took a dose.' : 'Tekan Catat jika Anda melakukan injeksi tambahan.'}
            </Text>
          </View>
        ) : (
          <View style={styles.activityFeedList}>
            {selectedOccurrences.map((occurrence) => {
              const matchedVial = safeInventory.find((v) => v.id === occurrence.inventoryId);
              const occurrenceLog = selectedLogs
                .filter((log) => log.inventoryId === occurrence.inventoryId)
                .sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)))[0];
              const statusLabel = getOccurrenceStatusLabel(occurrence, language);
              const canLog = isToday && (occurrence.status === 'due' || occurrence.status === 'missed');

              // Depletion calc
              const vialSize = Number(matchedVial?.vialSize || 0);
              const dose = Number(matchedVial?.targetDose || 0);
              const totalVol = Number(matchedVial?.bacWater || matchedVial?.currentVolumeMl || 1);
              const currentVol = Number(matchedVial?.currentVolumeMl ?? totalVol);
              const concentration = totalVol > 0 ? vialSize / totalVol : 0;
              const volPerDose = concentration > 0 && dose > 0 ? dose / concentration : 0;
              const remainingDoses = volPerDose > 0 && currentVol > 0 ? Math.floor(currentVol / volPerDose) : null;
              const progressPercent = totalVol > 0 ? Math.min(100, Math.max(0, (currentVol / totalVol) * 100)) : 100;

              return (
                <View
                  key={`${occurrence.inventoryId}-${occurrence.date}`}
                  style={[
                    styles.actionCard,
                    occurrence.status === 'due' && styles.actionCardDue,
                    occurrence.status === 'missed' && styles.actionCardMissed,
                    occurrence.status === 'completed' && styles.actionCardCompleted,
                    highlightedInventoryId === occurrence.inventoryId && styles.actionCardHighlighted,
                  ]}
                >
                  <View style={styles.actionCardLeft}>
                    <CuteVialIllustration
                      size="xs"
                      progress={progressPercent}
                      category={matchedVial?.category}
                      vialId={matchedVial?.id || occurrence.inventoryId}
                      dosesLeft={remainingDoses ?? undefined}
                      showTicks={false}
                    />
                  </View>

                  <View style={styles.actionCardCenter}>
                    <View style={styles.actionTitleRow}>
                      <Text style={styles.actionTitleText} numberOfLines={1}>
                        {occurrence.peptideName}
                      </Text>
                      {remainingDoses !== null && (
                        <View style={styles.compactRemainingPill}>
                          <Text style={styles.compactRemainingText}>~{remainingDoses}x</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.actionMetaText}>
                      {occurrenceLog
                        ? `${occurrenceLog.timeStr || occurrence.time} • ${language === 'en' ? 'Logged' : 'Dicatat'}`
                        : `${occurrence.time} • ${statusLabel}`}
                      {matchedVial ? ` • ${matchedVial.targetDose} ${matchedVial.doseUnit}` : ''}
                    </Text>
                  </View>

                  <View style={styles.actionCardRight}>
                    {canLog ? (
                      <TouchableOpacity
                        onPress={() => handleScheduledLog(occurrence)}
                        style={styles.actionInjectBtn}
                        activeOpacity={0.8}
                      >
                        <Syringe size={12} color="#231716" />
                        <Text style={styles.actionInjectText}>
                          {language === 'en' ? 'Inject' : 'Suntik'}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.statusBadge, occurrence.status === 'completed' && styles.statusBadgeCompleted]}>
                        <Text style={styles.statusBadgeText}>{statusLabel}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}

            {selectedLogs
              .filter((log) => !selectedOccurrences.some((occurrence) => occurrence.inventoryId === log.inventoryId))
              .map((log) => (
                <View key={`log-${log.id}`} style={styles.loggedFeedCard}>
                  <Syringe size={14} color={COLORS.mint} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.loggedTitleText}>{log.peptideName || 'Log Injeksi'}</Text>
                    <Text style={styles.loggedMetaText}>{formatTime(log.timeStr || '')} • {log.dose || 0} {log.unit || ''} • {log.siteId || '-'}</Text>
                  </View>
                  <View style={styles.loggedTag}><Text style={styles.loggedTagText}>LOG</Text></View>
                </View>
              ))}
          </View>
        )}
      </View>

      {/* ========================================================
          4. UPCOMING INJECTIONS STREAM (NEXT 7 DAYS)
      ======================================================== */}
      {upcoming.length > 0 && (
        <View style={styles.upcomingSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleGroup}>
              <TrendingUp size={15} color={COLORS.mint} />
              <Text style={styles.sectionTitleText}>
                {language === 'en' ? 'Upcoming Injections' : 'Jadwal Mendatang'}
              </Text>
            </View>
            <Text style={styles.sectionBadgeCount}>{upcoming.length}</Text>
          </View>

          <View style={styles.upcomingCardList}>
            {upcoming.map((occ) => (
              <View key={`up-${occ.inventoryId}-${occ.date}`} style={styles.upcomingRowItem}>
                <View style={styles.upcomingDayBadge}>
                  <Text style={styles.upcomingDayText}>
                    {formatUpcomingDay(occ.date)}
                  </Text>
                  <Text style={styles.upcomingTimeText}>{occ.time}</Text>
                </View>

                <View style={styles.upcomingInfo}>
                  <Text style={styles.upcomingNameText} numberOfLines={1}>{occ.peptideName}</Text>
                  <Text style={styles.upcomingSubText}>{getOccurrenceStatusLabel(occ, language)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ========================================================
          5. QUICK GLANCE TRAY (REPLACING 4 BIG BOX TILES)
      ======================================================== */}
      <View style={styles.glanceTrayContainer}>
        <TouchableOpacity
          style={styles.glanceChip}
          onPress={() => onNavigateTab ? onNavigateTab('inventory') : onOpenInventory && onOpenInventory()}
          activeOpacity={0.8}
        >
          <FlaskConical size={14} color={COLORS.mint} />
          <Text style={styles.glanceChipLabel}>{language === 'en' ? 'Fridge' : 'Kulkas'}</Text>
          <View style={styles.glanceNumberBadge}>
            <Text style={styles.glanceNumberText}>{analytics.activeVials}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.glanceChip}
          onPress={() => onNavigateTab ? onNavigateTab('freezer') : null}
          activeOpacity={0.8}
        >
          <Snowflake size={14} color={COLORS.cyan} />
          <Text style={styles.glanceChipLabel}>{language === 'en' ? 'Freezer' : 'Freezer'}</Text>
          <View style={styles.glanceNumberBadge}>
            <Text style={styles.glanceNumberText}>{analytics.freezerVials}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.glanceChip}
          onPress={() => onNavigateTab ? onNavigateTab('history') : null}
          activeOpacity={0.8}
        >
          <History size={14} color={COLORS.yellow} />
          <Text style={styles.glanceChipLabel}>{language === 'en' ? 'History' : 'Riwayat'}</Text>
          <View style={styles.glanceNumberBadge}>
            <Text style={styles.glanceNumberText}>{safeLogs.length}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ========================================================
          MODAL QUICK LOG
      ======================================================== */}
      <Modal visible={isQuickLogOpen} animationType="slide" transparent onRequestClose={() => setIsQuickLogOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.quickLogModal}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>{t('today.quickLogModal') || 'QUICK LOG'}</Text>
                <Text style={styles.modalTitle}>{t('today.quickLogSubtitle') || 'Catat Injeksi'}</Text>
              </View>
              <TouchableOpacity style={styles.modalClose} onPress={() => setIsQuickLogOpen(false)}>
                <Text style={styles.modalCloseText}>×</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>{t('inventory.activeVial') || 'VIAL AKTIF'}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vialPickerRow}>
              {activeVials.map((vial) => {
                const selected = vial.id === selectedQuickVial?.id;
                return (
                  <TouchableOpacity
                    key={vial.id}
                    onPress={() => selectQuickVial(vial)}
                    style={[styles.vialChip, selected && styles.vialChipActive]}
                  >
                    <Text style={[styles.vialChipName, selected && styles.vialChipNameActive]}>{vial.name}</Text>
                    <Text style={styles.vialChipMeta}>{vial.currentVolumeMl?.toFixed(2) ?? '—'} mL</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {selectedQuickVial && (
              <View style={styles.quickVialPreviewCard}>
                {(() => {
                  const bWater = Number(selectedQuickVial.bacWater || 1);
                  const cVol = Number(selectedQuickVial.currentVolumeMl ?? bWater);
                  const prog = bWater > 0 ? Math.min(100, Math.max(0, (cVol / bWater) * 100)) : 100;
                  const d = Number(quickLogDose || selectedQuickVial.targetDose || 0);
                  const vSize = Number(selectedQuickVial.vialSize || 0);
                  const conc = bWater > 0 ? vSize / bWater : 0;
                  const vPerDose = conc > 0 && d > 0 ? d / conc : 0;
                  const rem = vPerDose > 0 && cVol > 0 ? Math.floor(cVol / vPerDose) : null;

                  return (
                    <>
                      <CuteVialIllustration
                        size="xs"
                        progress={prog}
                        category={selectedQuickVial.category}
                        vialId={selectedQuickVial.id}
                        dosesLeft={rem ?? undefined}
                        showTicks={false}
                      />
                      <View style={styles.quickVialPreviewInfo}>
                        <Text style={styles.quickVialPreviewName}>{selectedQuickVial.name}</Text>
                        <Text style={styles.quickVialPreviewSub}>
                          {language === 'en' ? 'Remaining Volume:' : 'Sisa Volume:'} {cVol.toFixed(2)} mL / {bWater.toFixed(2)} mL
                        </Text>
                        {rem !== null && (
                          <View style={styles.depletionPillRow}>
                            <Target size={11} color={COLORS.mint} />
                            <Text style={styles.depletionPillText}>
                              {language === 'en' ? `~${rem} injections left` : `Sisa ~${rem}x suntikan lagi`}
                            </Text>
                          </View>
                        )}
                      </View>
                    </>
                  );
                })()}
              </View>
            )}

            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>{t('inventory.injectionDose') || 'NILAI DOSIS YANG DICATAT'}</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="decimal-pad"
                inputMode="decimal"
                value={quickLogDose}
                onChangeText={(v) => setQuickLogDose(normalizeDecimalInput(v))}
                placeholder="0.0"
                placeholderTextColor="#475569"
              />
              {quickLogMetrics && (
                <Text style={styles.calculatedText}>
                  {quickLogMetrics.valid ? `${quickLogMetrics.volumeMl} mL • ${quickLogMetrics.iu} IU` : (t('alerts.invalidCalculation') || 'Perhitungan belum valid')}
                </Text>
              )}
            </View>

            <Text style={styles.inputLabel}>{t('today.selectSite') || 'PILIH TITIK ROTASI'}</Text>
            <View style={styles.siteGrid}>
              {ROTATION_SITE_ORDER.map((site) => (
                <TouchableOpacity
                  key={site}
                  onPress={() => setQuickLogSite(site)}
                  style={[styles.siteChip, quickLogSite === site && styles.siteChipActive]}
                >
                  <Text style={[styles.siteChipCode, quickLogSite === site && styles.siteChipCodeActive]}>{site}</Text>
                  <Text style={styles.siteChipName}>{getSiteLabel(site)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>{t('today.optionalNote') || 'CATATAN (OPSIONAL)'}</Text>
              <TextInput
                style={[styles.modalInput, styles.notesInput]}
                multiline
                value={quickLogNotes}
                onChangeText={setQuickLogNotes}
                placeholder="..."
                placeholderTextColor="#475569"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsQuickLogOpen(false)}>
                <Text style={styles.cancelBtnText}>{t('app.cancel') || 'Batal'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveQuickLog}>
                <CheckCircle2 size={16} color="#231716" />
                <Text style={styles.saveBtnText}>{t('today.confirmLog') || 'Simpan Log'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    padding: 14,
    paddingBottom: 40,
    gap: 12,
  },
  heroCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: 16,
    ...SHADOWS.cardGlow,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  heroLeft: {
    flex: 1,
    gap: 3,
  },
  heroStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  statusPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  heroStatusText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.mint,
    letterSpacing: 0.8,
  },
  heroHeadline: {
    fontSize: 19,
    fontWeight: '900',
    color: '#ffffff',
  },
  heroSubtext: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  heroHighlightText: {
    color: COLORS.lilac,
    fontWeight: '800',
  },
  quickLogPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 9,
    ...SHADOWS.subtle,
  },
  quickLogPillText: {
    color: '#231716',
    fontWeight: '900',
    fontSize: 12,
  },
  calendarStripCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    gap: 10,
    ...SHADOWS.card,
  },
  calendarStripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarDateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calendarMonthText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
  },
  weekNavButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  weekNavBtn: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgDarker,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  todayNavBtnActive: {
    backgroundColor: 'rgba(188, 169, 239, 0.16)',
    borderColor: COLORS.accent,
  },
  todayNavBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.accent,
  },
  slimWeekRow: {
    gap: 6,
    paddingVertical: 2,
  },
  slimDayCell: {
    width: 44,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgDarker,
    alignItems: 'center',
  },
  slimDayCellActive: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(188, 169, 239, 0.16)',
  },
  slimDayCellToday: {
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  slimDayLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: '900',
  },
  slimDayLabelActive: {
    color: COLORS.accent,
  },
  slimDayNumber: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '900',
    marginTop: 2,
  },
  slimDayNumberActive: {
    color: COLORS.accent,
  },
  dotIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 5,
    marginTop: 4,
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  feedSection: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 10,
    ...SHADOWS.card,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitleText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
  },
  sectionBadgeCount: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    backgroundColor: COLORS.bgDarker,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  emptyFeedCard: {
    backgroundColor: COLORS.bgDarker,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  emptyFeedTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  emptyFeedSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  activityFeedList: {
    gap: 8,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgDarker,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    gap: 10,
  },
  actionCardDue: {
    borderColor: 'rgba(251, 191, 36, 0.35)',
    backgroundColor: 'rgba(251, 191, 36, 0.05)',
  },
  actionCardMissed: {
    borderColor: 'rgba(244, 63, 94, 0.35)',
    backgroundColor: 'rgba(244, 63, 94, 0.05)',
  },
  actionCardCompleted: {
    opacity: 0.65,
  },
  actionCardHighlighted: {
    borderColor: COLORS.cyan,
  },
  actionCardLeft: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCardCenter: {
    flex: 1,
    gap: 3,
  },
  actionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionTitleText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
  },
  compactRemainingPill: {
    backgroundColor: 'rgba(194, 211, 182, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.pill,
  },
  compactRemainingText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.mint,
  },
  actionMetaText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  actionCardRight: {
    alignItems: 'flex-end',
  },
  actionInjectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionInjectText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#231716',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  statusBadgeCompleted: {
    borderColor: COLORS.sage,
    backgroundColor: 'rgba(194, 211, 182, 0.12)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  loggedFeedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.bgDarker,
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loggedTitleText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  loggedMetaText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  loggedTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(188, 169, 239, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(188, 169, 239, 0.25)',
  },
  loggedTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.cyan,
  },
  upcomingSection: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 10,
    ...SHADOWS.card,
  },
  upcomingCardList: {
    gap: 6,
  },
  upcomingRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgDarker,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 8,
    gap: 10,
  },
  upcomingDayBadge: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 90,
  },
  upcomingDayText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.mint,
  },
  upcomingTimeText: {
    fontSize: 9,
    color: COLORS.textMuted,
  },
  upcomingInfo: {
    flex: 1,
  },
  upcomingNameText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  upcomingSubText: {
    fontSize: 9,
    color: COLORS.textMuted,
  },
  glanceTrayContainer: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  glanceChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.pill,
    paddingVertical: 10,
    paddingHorizontal: 8,
    ...SHADOWS.subtle,
  },
  glanceChipLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  glanceNumberBadge: {
    backgroundColor: COLORS.bgDarker,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.pill,
  },
  glanceNumberText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  quickLogModal: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalEyebrow: {
    color: COLORS.mint,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgDarker,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    color: COLORS.textMuted,
    fontSize: 22,
    lineHeight: 22,
  },
  inputLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
    marginBottom: 6,
    marginTop: 6,
  },
  vialPickerRow: {
    gap: 8,
    paddingBottom: 4,
  },
  vialChip: {
    minWidth: 120,
    backgroundColor: COLORS.bgDarker,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 8,
  },
  vialChipActive: {
    borderColor: COLORS.mint,
    backgroundColor: 'rgba(194, 211, 182, 0.1)',
  },
  vialChipName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  vialChipNameActive: {
    color: COLORS.mint,
  },
  vialChipMeta: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 2,
  },
  quickVialPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.bgDarker,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: 10,
    marginTop: 8,
  },
  quickVialPreviewInfo: {
    flex: 1,
  },
  quickVialPreviewName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
  },
  quickVialPreviewSub: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  depletionPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  depletionPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.mint,
  },
  inputCard: {
    backgroundColor: COLORS.bgDarker,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 10,
    marginTop: 8,
  },
  modalInput: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  notesInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  calculatedText: {
    color: COLORS.cyan,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
  },
  siteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  siteChip: {
    width: '31.8%',
    backgroundColor: COLORS.bgDarker,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    padding: 6,
  },
  siteChipActive: {
    borderColor: COLORS.mint,
    backgroundColor: 'rgba(194, 211, 182, 0.1)',
  },
  siteChipCode: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '900',
  },
  siteChipCodeActive: {
    color: COLORS.mint,
  },
  siteChipName: {
    color: COLORS.textMuted,
    fontSize: 8,
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: COLORS.bgDarker,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.pill,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: COLORS.textSecondary,
    fontWeight: '800',
    fontSize: 12,
  },
  saveBtn: {
    flex: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.pill,
    paddingVertical: 10,
    ...SHADOWS.subtle,
  },
  saveBtnText: {
    color: '#231716',
    fontWeight: '900',
    fontSize: 12,
  },
});
