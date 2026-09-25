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
  TrendingUp,
  XCircle,
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
import { COLORS, RADIUS, SHADOWS } from '../theme';
import type { InventoryItem } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { getLanguage } from '../i18n/translations';

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

export const TodayScreen: React.FC<{
  onOpenInventory?: () => void;
  notificationTarget?: { inventoryId?: string; date?: string } | null;
}> = ({ onOpenInventory, notificationTarget }) => {
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
  const upcoming = useMemo(() => getScheduledOccurrences(safeInventory, now, 7, safeLogs).slice(0, 8), [safeInventory, safeLogs, now]);
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
    if (!selectedQuickVial || !quickLogMetrics?.valid || quickLogMetrics.volumeMlNumber <= 0) {
      Alert.alert(
        language === 'en' ? 'Invalid data' : 'Data belum valid',
        language === 'en'
          ? 'Check vial and entered values.'
          : 'Periksa vial dan nilai yang dimasukkan.'
      );
      return;
    }

    const remaining = selectedQuickVial.currentVolumeMl ?? quickLogMetrics.volumeMlNumber;
    if (remaining < quickLogMetrics.volumeMlNumber) {
      Alert.alert(
        language === 'en' ? 'Insufficient liquid' : 'Cairan tidak cukup',
        language === 'en'
          ? 'Log volume exceeds remaining liquid recorded on vial.'
          : 'Volume log melebihi sisa cairan yang tercatat pada vial.'
      );
      return;
    }

    const now = new Date();
    const localDate = formatLocalDate(now);
    const localTime = now.toLocaleTimeString(language === 'en' ? 'en-US' : 'id-ID', { hour: '2-digit', minute: '2-digit' });
    const recorded = recordInjection(
      selectedQuickVial.id,
      {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        peptideName: selectedQuickVial.name,
        dose: quickLogMetrics.dose,
        unit: quickLogMetrics.doseUnit,
        volumeMl: quickLogMetrics.volumeMl,
        siteId: quickLogSite,
        timestamp: now.toISOString(),
        inventoryId: selectedQuickVial.id,
        recordedAtLocal: now.toLocaleString(language === 'en' ? 'en-US' : 'id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
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
    const msg = `${item.name}\n${language === 'en' ? 'Schedule' : 'Jadwal'} ${occurrence.time}\nDial ${metrics.dialClicks} ${language === 'en' ? 'clicks' : 'klik'}`;

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
          ? `${item.name} successfully recorded at ${actual.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}.`
          : `${item.name} berhasil dicatat pada ${actual.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}.`
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
  const statusIcon = (status: ScheduledOccurrence['status']) => {
    if (status === 'completed') return <CheckCircle2 size={15} color="#10b981" />;
    if (status === 'missed') return <XCircle size={15} color="#ef4444" />;
    if (status === 'due') return <Clock3 size={15} color="#f59e0b" />;
    return <CalendarDays size={15} color="#38bdf8" />;
  };

  return (
    <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroIconBox}><Activity size={19} color="#10b981" /></View>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>PERSONAL TRACKER</Text>
            <Text style={styles.heroTitle}>{isToday ? (language === 'en' ? "Today's Summary" : (t('today.title') || 'Ringkasan Hari Ini')) : formatDateLong(selectedDate, language)}</Text>
            <Text style={styles.heroSubtitle}>{formatDateLong(now, language)} • {language === 'en' ? 'Next site' : (t('rotation.suggestedSite') || 'Titik berikutnya')} {getSiteCode(currentSite, language)}</Text>
          </View>
          <TouchableOpacity style={styles.quickLogBtn} onPress={openQuickLog}>
            <Syringe size={15} color="#022c22" />
            <Text style={styles.quickLogText}>{t('today.quickLog') || 'Log'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.metricRow}>
          <MetricCard icon={<CalendarDays size={14} color="#38bdf8" />} label={language === 'en' ? 'Schedule' : (t('inventory.todaySchedule') || 'Jadwal')} value={String(selectedOccurrences.length)} />
          <MetricCard icon={<CheckCircle2 size={14} color="#10b981" />} label={language === 'en' ? 'Completed' : (t('status.completed') || 'Selesai')} value={String(selectedOccurrences.filter((item) => item.status === 'completed').length)} />
          <MetricCard icon={<AlertTriangle size={14} color="#f59e0b" />} label={language === 'en' ? 'Missed' : (t('status.missed') || 'Terlewat')} value={String(isToday ? selectedOccurrences.filter((item) => item.status === 'missed').length : 0)} />
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <CalendarDays size={16} color="#38bdf8" />
            <Text style={styles.sectionTitle}>{language === 'en' ? 'Weekly Calendar' : 'Kalender Mingguan'}</Text>
          </View>
          <View style={styles.weekControls}>
            <TouchableOpacity style={styles.smallIconBtn} onPress={() => setWeekOffset((value) => value - 1)}><ChevronLeft size={15} color="#94a3b8" /></TouchableOpacity>
            <TouchableOpacity style={styles.smallIconBtn} onPress={() => setWeekOffset((value) => value + 1)}><ChevronRight size={15} color="#94a3b8" /></TouchableOpacity>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekRow}>
          {weekDates.map((date) => {
            const key = formatLocalDate(date);
            const todayKey = formatLocalDate(now);
            const isSelected = key === formatLocalDate(selectedDate);
            const hasSchedule = getScheduledOccurrences(safeInventory, date, 1, safeLogs).length > 0;
            const hasLog = getLogsForLocalDate(safeLogs, date).length > 0;
            return (
              <TouchableOpacity key={key} onPress={() => selectDate(date)} style={[styles.dayCell, isSelected && styles.dayCellActive]}>
                <Text style={[styles.dayLabel, isSelected && styles.dayLabelActive]}>{language === 'en' ? WEEKDAY_EN[date.getDay()] : WEEKDAY_LABELS[date.getDay()]}</Text>
                <Text style={[styles.dayNumber, isSelected && styles.dayNumberActive]}>{formatDayNumber(date)}</Text>
                <View style={styles.dotRow}>
                  {hasSchedule && <View style={[styles.dot, styles.dotSchedule]} />}
                  {hasLog && <View style={[styles.dot, styles.dotLog]} />}
                  {key === todayKey && <View style={[styles.todayRing]} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View style={styles.legendRow}>
          <LegendDot label={language === 'en' ? 'Schedule' : 'Jadwal'} style={styles.dotSchedule} />
          <LegendDot label="Log" style={styles.dotLog} />
          <Text style={styles.currentDateText}>{formatDateLong(selectedDate, language)}</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}><Clock3 size={16} color="#f59e0b" /><Text style={styles.sectionTitle}>{language === 'en' ? 'Activity' : 'Aktivitas'}</Text></View>
          <Text style={styles.sectionMeta}>{selectedOccurrences.length + selectedLogs.length} {language === 'en' ? 'items' : 'item'}</Text>
        </View>
        {selectedOccurrences.length === 0 && selectedLogs.length === 0 ? (
          <EmptyState text={language === 'en' ? 'No schedule or log on this date.' : 'Tidak ada jadwal atau log pada tanggal ini.'} />
        ) : (
          <View style={styles.activityList}>
            {selectedOccurrences.map((occurrence) => {
              const occurrenceLog = selectedLogs
                .filter((log) => log.inventoryId === occurrence.inventoryId)
                .sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)))[0];
              const statusLabel = getOccurrenceStatusLabel(occurrence, language);
              const canLog = isToday && (occurrence.status === 'due' || occurrence.status === 'missed');
              const matchedVial = safeInventory.find((v) => v.id === occurrence.inventoryId);

              // Dose depletion estimate for this vial
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
                    styles.activityRow,
                    occurrence.status === 'due' && styles.activityRowDue,
                    occurrence.status === 'missed' && styles.activityRowMissed,
                    occurrence.status === 'completed' && styles.activityRowCompleted,
                    highlightedInventoryId === occurrence.inventoryId && styles.activityRowHighlighted,
                  ]}
                >
                  <View style={styles.activityVialWrap}>
                    {matchedVial ? (
                      <CuteVialIllustration
                        size="sm"
                        progress={progressPercent}
                        category={matchedVial.category}
                        dosesLeft={remainingDoses ?? undefined}
                      />
                    ) : (
                      <View style={styles.statusIcon}>{statusIcon(occurrence.status)}</View>
                    )}
                  </View>

                  <View style={styles.activityMain}>
                    <View style={styles.activityTitleRow}>
                      <Text style={[styles.activityTitle, occurrence.status === 'completed' && styles.activityTitleCompleted, occurrence.status === 'missed' && styles.activityTitleMissed]}>
                        {occurrence.peptideName}
                      </Text>
                      {remainingDoses !== null && (
                        <View style={[
                          styles.depletionPill,
                          remainingDoses <= 3 ? styles.depletionAlert : remainingDoses <= 7 ? styles.depletionWarning : styles.depletionSafe
                        ]}>
                          <Text style={[
                            styles.depletionPillText,
                            remainingDoses <= 3 ? styles.depletionAlertText : remainingDoses <= 7 ? styles.depletionWarningText : styles.depletionSafeText
                          ]}>
                            🎯 ~{remainingDoses}x
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.activitySub}>
                      {occurrenceLog ? `${occurrenceLog.timeStr || occurrence.time} • ${language === 'en' ? 'Logged' : 'Dicatat'}` : `${occurrence.time} • ${statusLabel}`}
                    </Text>
                  </View>

                  {canLog ? (
                    <TouchableOpacity
                      onPress={() => handleScheduledLog(occurrence)}
                      style={[styles.activityActionBtn, occurrence.status === 'missed' && styles.activityActionBtnMissed]}
                    >
                      <Syringe size={12} color="#022c22" />
                      <Text style={styles.activityActionText}>
                        {occurrence.status === 'missed' ? (language === 'en' ? 'Log' : (t('today.quickLog') || 'Catat')) : (language === 'en' ? 'Inject Now' : (t('today.injectNow') || 'Suntik Sekarang'))}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.statusBadge, occurrence.status === 'completed' && styles.statusBadgeDone, occurrence.status === 'missed' && styles.statusBadgeMissed]}>
                      <Text style={[styles.statusBadgeText, occurrence.status === 'missed' && styles.statusBadgeTextMissed]}>
                        {statusLabel}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}

            {selectedLogs
              .filter((log) => !selectedOccurrences.some((occurrence) => occurrence.inventoryId === log.inventoryId))
              .map((log) => (
                <View key={`log-${log.id}`} style={styles.activityRow}>
                  <View style={styles.statusIcon}><Syringe size={15} color="#10b981" /></View>
                  <View style={styles.activityMain}>
                    <Text style={styles.activityTitle}>{log.peptideName || 'Log injeksi'}</Text>
                    <Text style={styles.activitySub}>{formatTime(log.timeStr || '')} • {log.dose || 0} {log.unit || ''} • {log.siteId || '-'}</Text>
                  </View>
                  <View style={styles.loggedBadge}><Text style={styles.loggedBadgeText}>LOG</Text></View>
                </View>
              ))}
          </View>
        )}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}><TrendingUp size={16} color="#10b981" /><Text style={styles.sectionTitle}>{language === 'en' ? 'Next 7 Days' : '7 Hari ke Depan'}</Text></View>
          <Text style={styles.sectionMeta}>{analytics.schedule7DayTotal} {language === 'en' ? 'schedules' : 'jadwal'}</Text>
        </View>
        {upcoming.length === 0 ? <EmptyState text={language === 'en' ? 'No upcoming schedules.' : 'Belum ada jadwal mendatang.'} /> : upcoming.map((occurrence) => (
          <View key={`up-${occurrence.inventoryId}-${occurrence.date}`} style={styles.upcomingRow}>
            <View style={styles.dateBlock}><Text style={styles.dateBlockDay}>{occurrence.date.slice(-2)}</Text><Text style={styles.dateBlockMonth}>{occurrence.date.slice(5, 7)}</Text></View>
            <View style={styles.activityMain}><Text style={styles.activityTitle}>{occurrence.peptideName}</Text><Text style={styles.activitySub}>{occurrence.date} • {occurrence.time}</Text></View>
            <Text style={[styles.upcomingStatus, occurrence.status === 'completed' && styles.upcomingDone]}>{getOccurrenceStatusLabel(occurrence, language)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.gridRow}>
        <SummaryTile icon={<FlaskConical size={16} color="#10b981" />} label={language === 'en' ? 'Active Vials' : 'Vial aktif'} value={String(analytics.activeVials)} />
        <SummaryTile icon={<PackageCheck size={16} color="#64748b" />} label={language === 'en' ? 'Empty Vials' : 'Vial kosong'} value={String(analytics.emptyVials)} />
        <SummaryTile icon={<Snowflake size={16} color="#38bdf8" />} label={language === 'en' ? 'Freezer' : 'Freezer'} value={String(analytics.freezerVials)} />
        <SummaryTile icon={<Archive size={16} color="#64748b" />} label={language === 'en' ? 'Archive' : 'Arsip'} value={String(analytics.archivedVials)} />
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}><TrendingUp size={16} color="#38bdf8" /><Text style={styles.sectionTitle}>{language === 'en' ? 'Personal Analytics' : 'Analytics Pribadi'}</Text></View>
          <Text style={styles.sectionMeta}>{language === 'en' ? '30 days' : '30 hari'}</Text>
        </View>
        <View style={styles.analyticsGrid}>
          <AnalyticsMetric label={language === 'en' ? 'Logged records' : 'Log tercatat'} value={String(analytics.last30DaysLogs)} />
          <AnalyticsMetric label={language === 'en' ? 'Scheduled' : 'Jadwal terjadwal'} value={String(analytics.scheduledLast30Days)} />
          <AnalyticsMetric label={language === 'en' ? 'Completed' : 'Jadwal selesai'} value={String(analytics.completedScheduledLast30Days)} />
          <AnalyticsMetric label={language === 'en' ? 'Today completion' : 'Completion hari ini'} value={`${analytics.todayCompletionPercent}%`} />
        </View>
        <View style={styles.analyticsDivider} />
        <Text style={styles.analyticsCaption}>{language === 'en' ? 'Most frequently logged peptides' : 'Peptida paling sering tercatat'}</Text>
        {analytics.topPeptides.length === 0 ? <Text style={styles.analyticsEmpty}>{language === 'en' ? 'No history data yet.' : 'Belum ada data history.'}</Text> : analytics.topPeptides.map((item) => (
          <View key={item.name} style={styles.rankRow}>
            <Text style={styles.rankName}>{item.name}</Text>
            <Text style={styles.rankCount}>{item.count} log</Text>
          </View>
        ))}
      </View>

      {nextByVial?.next && (
        <View style={styles.nextCard}>
          <View style={styles.nextIcon}><Droplets size={17} color="#38bdf8" /></View>
          <View style={styles.nextMain}><Text style={styles.nextLabel}>NEXT SCHEDULED</Text><Text style={styles.nextTitle}>{nextByVial.item.name}</Text><Text style={styles.nextSub}>{nextByVial.next.date} • {nextByVial.next.time}</Text></View>
          <History size={15} color="#64748b" />
        </View>
      )}
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
                        size="sm"
                        progress={prog}
                        category={selectedQuickVial.category}
                        dosesLeft={rem ?? undefined}
                      />
                      <View style={styles.quickVialPreviewInfo}>
                        <Text style={styles.quickVialPreviewName}>{selectedQuickVial.name}</Text>
                        <Text style={styles.quickVialPreviewSub}>
                          {language === 'en' ? 'Remaining Volume:' : 'Sisa Volume:'} {cVol.toFixed(2)} mL / {bWater.toFixed(2)} mL
                        </Text>
                        {rem !== null && (
                          <View style={[styles.depletionPill, rem <= 3 ? styles.depletionAlert : rem <= 7 ? styles.depletionWarning : styles.depletionSafe, { marginTop: 4, alignSelf: 'flex-start' }]}>
                            <Text style={[styles.depletionPillText, rem <= 3 ? styles.depletionAlertText : rem <= 7 ? styles.depletionWarningText : styles.depletionSafeText]}>
                              🎯 {language === 'en' ? `~${rem} injections left` : `Sisa ~${rem}x suntikan lagi`}
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
                <CheckCircle2 size={16} color="#022c22" />
                <Text style={styles.saveBtnText}>{t('today.confirmLog') || 'Simpan Log'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.disclaimerText}>{language === 'en' ? 'Quick Log only records entered data and calculates volume from stored vial parameters.' : 'Quick Log hanya mencatat data yang kamu masukkan dan menghitung volume dari parameter vial yang tersimpan.'}</Text>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const MetricCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <View style={styles.metricCard}><View style={styles.metricIcon}>{icon}</View><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>
);
const SummaryTile = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <View style={styles.summaryTile}><View style={styles.summaryTileIcon}>{icon}</View><Text style={styles.summaryTileValue}>{value}</Text><Text style={styles.summaryTileLabel}>{label}</Text></View>
);
const AnalyticsMetric = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.analyticsMetric}><Text style={styles.analyticsMetricValue}>{value}</Text><Text style={styles.analyticsMetricLabel}>{label}</Text></View>
);
const LegendDot = ({ label, style }: { label: string; style: object }) => <View style={styles.legendItem}><View style={[styles.dot, style]} /><Text style={styles.legendText}>{label}</Text></View>;
const EmptyState = ({ text }: { text: string }) => <View style={styles.emptyState}><Text style={styles.emptyStateText}>{text}</Text></View>;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 14, paddingBottom: 34, gap: 12 },
  heroCard: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.xl, padding: 16, ...SHADOWS.cardGlow },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroIconBox: { width: 44, height: 44, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(52, 211, 153, 0.12)', borderWidth: 1, borderColor: 'rgba(52, 211, 153, 0.25)' },
  heroCopy: { flex: 1 },
  eyebrow: { fontSize: 10, letterSpacing: 1.2, color: COLORS.mint, fontWeight: '900' },
  heroTitle: { fontSize: 18, color: '#fff', fontWeight: '900', marginTop: 2 },
  heroSubtitle: { fontSize: 11, color: COLORS.textMuted, marginTop: 3 },
  quickLogBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.mint, borderRadius: RADIUS.pill, paddingHorizontal: 12, paddingVertical: 9, ...SHADOWS.subtle },
  quickLogText: { color: '#022c22', fontWeight: '900', fontSize: 12 },
  metricRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  metricCard: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, backgroundColor: COLORS.bgDarker, padding: 10 },
  metricIcon: { marginBottom: 4 }, metricValue: { color: '#fff', fontSize: 20, fontWeight: '900' }, metricLabel: { color: COLORS.textMuted, fontSize: 10, marginTop: 1 },
  sectionCard: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.xl, padding: 14, ...SHADOWS.subtle },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, sectionTitle: { color: '#fff', fontSize: 14, fontWeight: '900' }, sectionMeta: { color: COLORS.textMuted, fontSize: 10, fontWeight: '800' },
  weekControls: { flexDirection: 'row', gap: 6 }, smallIconBtn: { width: 30, height: 30, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgDarker },
  weekRow: { gap: 8, paddingVertical: 2 }, dayCell: { width: 50, paddingVertical: 10, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bgDarker, alignItems: 'center' }, dayCellActive: { borderColor: COLORS.mint, backgroundColor: 'rgba(52, 211, 153, 0.12)' },
  dayLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: '900' }, dayLabelActive: { color: COLORS.mint }, dayNumber: { fontSize: 18, color: '#fff', fontWeight: '900', marginTop: 2 }, dayNumberActive: { color: COLORS.mint },
  dotRow: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 8, marginTop: 4 }, dot: { width: 5, height: 5, borderRadius: 3 }, dotSchedule: { backgroundColor: COLORS.cyan }, dotLog: { backgroundColor: COLORS.mint }, todayRing: { width: 5, height: 5, borderRadius: 3, borderWidth: 1, borderColor: COLORS.yellow },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 }, legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 }, legendText: { color: COLORS.textMuted, fontSize: 9 }, currentDateText: { color: COLORS.textSecondary, fontSize: 10, marginLeft: 'auto', fontWeight: '700' },
  activityList: { gap: 8 },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border, borderRadius: RADIUS.lg, backgroundColor: 'rgba(21, 29, 48, 0.4)' },
  activityRowDue: { backgroundColor: 'rgba(251, 191, 36, 0.08)', borderColor: 'rgba(251, 191, 36, 0.3)', borderWidth: 1 },
  activityRowMissed: { backgroundColor: 'rgba(244, 63, 94, 0.08)', borderColor: 'rgba(244, 63, 94, 0.3)', borderWidth: 1 },
  activityRowCompleted: { opacity: 0.65 },
  activityRowHighlighted: { borderColor: COLORS.cyan, borderWidth: 1 },
  activityVialWrap: { width: 34, height: 44, alignItems: 'center', justifyContent: 'center' },
  statusIcon: { width: 32, height: 32, borderRadius: RADIUS.md, backgroundColor: COLORS.bgDarker, alignItems: 'center', justifyContent: 'center' },
  activityMain: { flex: 1 },
  activityTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  activityTitle: { color: '#fff', fontSize: 13, fontWeight: '900' },
  activityTitleCompleted: { color: COLORS.textSecondary },
  activityTitleMissed: { color: '#fecaca' },
  activitySub: { color: COLORS.textMuted, fontSize: 10, marginTop: 3 },
  depletionPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: RADIUS.pill, borderWidth: 1 },
  depletionPillText: { fontSize: 9, fontWeight: '900' },
  depletionSafe: { backgroundColor: 'rgba(52, 211, 153, 0.12)', borderColor: 'rgba(52, 211, 153, 0.35)' },
  depletionSafeText: { color: COLORS.mint },
  depletionWarning: { backgroundColor: 'rgba(251, 191, 36, 0.12)', borderColor: 'rgba(251, 191, 36, 0.35)' },
  depletionWarningText: { color: COLORS.yellow },
  depletionAlert: { backgroundColor: 'rgba(244, 63, 94, 0.14)', borderColor: 'rgba(244, 63, 94, 0.40)' },
  depletionAlertText: { color: COLORS.pink },
  statusBadge: { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 8, paddingVertical: 4 },
  statusBadgeDone: { borderColor: 'rgba(52, 211, 153, 0.4)', backgroundColor: 'rgba(52, 211, 153, 0.1)' },
  statusBadgeMissed: { borderColor: 'rgba(244, 63, 94, 0.4)', backgroundColor: 'rgba(244, 63, 94, 0.1)' },
  statusBadgeText: { color: COLORS.textSecondary, fontSize: 9, fontWeight: '900' },
  statusBadgeTextMissed: { color: '#fca5a5' },
  activityActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.mint, borderRadius: RADIUS.pill, paddingHorizontal: 10, paddingVertical: 7 },
  activityActionBtnMissed: { backgroundColor: COLORS.yellow },
  activityActionText: { color: '#022c22', fontSize: 9, fontWeight: '900' },
  loggedBadge: { borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.35)', backgroundColor: 'rgba(56, 189, 248, 0.08)', borderRadius: RADIUS.md, paddingHorizontal: 7, paddingVertical: 4 },
  loggedBadgeText: { color: COLORS.cyan, fontSize: 9, fontWeight: '900' },
  upcomingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  dateBlock: { width: 36, alignItems: 'center' }, dateBlockDay: { color: '#fff', fontSize: 14, fontWeight: '900' }, dateBlockMonth: { color: COLORS.textMuted, fontSize: 9, marginTop: 1 },
  upcomingStatus: { color: COLORS.cyan, fontSize: 9, fontWeight: '900' }, upcomingDone: { color: COLORS.mint },
  gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  summaryTile: { width: '48.8%', backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: 12 },
  summaryTileIcon: { marginBottom: 6 }, summaryTileValue: { color: '#fff', fontSize: 20, fontWeight: '900' }, summaryTileLabel: { color: COLORS.textMuted, fontSize: 10, marginTop: 2 },
  analyticsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  analyticsMetric: { width: '48.8%', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: 10, backgroundColor: COLORS.bgDarker },
  analyticsMetricValue: { color: '#fff', fontSize: 20, fontWeight: '900' }, analyticsMetricLabel: { color: COLORS.textMuted, fontSize: 9, marginTop: 2 },
  analyticsDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  analyticsCaption: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '800', marginBottom: 8 },
  analyticsEmpty: { color: COLORS.textMuted, fontSize: 10 },
  rankRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rankName: { color: '#fff', fontSize: 10, fontWeight: '700' }, rankCount: { color: COLORS.textMuted, fontSize: 10 },
  nextCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.xl, padding: 12 },
  nextIcon: { width: 36, height: 36, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(56, 189, 248, 0.1)' },
  nextMain: { flex: 1 }, nextLabel: { color: COLORS.cyan, fontSize: 9, fontWeight: '900', letterSpacing: 1 }, nextTitle: { color: '#fff', fontSize: 12, fontWeight: '900', marginTop: 2 }, nextSub: { color: COLORS.textMuted, fontSize: 10, marginTop: 1 },
  emptyState: { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, backgroundColor: COLORS.bgDarker, padding: 16, alignItems: 'center' },
  emptyStateText: { color: COLORS.textMuted, fontSize: 10, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  quickLogModal: { backgroundColor: COLORS.card, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: 16, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  modalEyebrow: { color: COLORS.mint, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  modalTitle: { color: '#fff', fontSize: 19, fontWeight: '900', marginTop: 2 },
  modalClose: { width: 34, height: 34, borderRadius: RADIUS.md, backgroundColor: COLORS.bgDarker, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  modalCloseText: { color: COLORS.textMuted, fontSize: 24, lineHeight: 24 },
  inputLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '900', letterSpacing: 0.7, marginBottom: 6, marginTop: 6 },
  vialPickerRow: { gap: 8, paddingBottom: 4 },
  vialChip: { minWidth: 130, backgroundColor: COLORS.bgDarker, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: 10 },
  vialChipActive: { borderColor: COLORS.mint, backgroundColor: 'rgba(52, 211, 153, 0.1)' },
  vialChipName: { color: '#fff', fontSize: 12, fontWeight: '800' },
  vialChipNameActive: { color: COLORS.mint },
  vialChipMeta: { color: COLORS.textMuted, fontSize: 9, marginTop: 3 },
  quickVialPreviewCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.bgDarker, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: 12, marginTop: 10 },
  quickVialPreviewInfo: { flex: 1 },
  quickVialPreviewName: { color: '#fff', fontSize: 13, fontWeight: '900' },
  quickVialPreviewSub: { color: COLORS.textMuted, fontSize: 10, marginTop: 2 },
  inputCard: { backgroundColor: COLORS.bgDarker, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: 12, marginTop: 8 },
  modalInput: { color: '#fff', fontSize: 16, fontWeight: '800', backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 10 },
  notesInput: { minHeight: 70, textAlignVertical: 'top' },
  calculatedText: { color: COLORS.cyan, fontSize: 10, fontWeight: '800', marginTop: 6 },
  siteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  siteChip: { width: '31.8%', backgroundColor: COLORS.bgDarker, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 8 },
  siteChipActive: { borderColor: COLORS.mint, backgroundColor: 'rgba(52, 211, 153, 0.1)' },
  siteChipCode: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '900' },
  siteChipCodeActive: { color: COLORS.mint },
  siteChipName: { color: COLORS.textMuted, fontSize: 8, marginTop: 2 },
  modalActions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  cancelBtn: { flex: 1, backgroundColor: COLORS.bgDarker, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { color: COLORS.textSecondary, fontWeight: '800', fontSize: 12 },
  saveBtn: { flex: 1.5, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, backgroundColor: COLORS.mint, borderRadius: RADIUS.lg, paddingVertical: 12, ...SHADOWS.subtle },
  saveBtnText: { color: '#022c22', fontWeight: '900', fontSize: 12 },
  disclaimerText: { color: COLORS.textMuted, fontSize: 9, lineHeight: 13, marginTop: 10, textAlign: 'center' },
});
