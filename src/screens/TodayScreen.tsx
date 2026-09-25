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
import { calculateInjectionMetrics, normalizeDecimalInput } from '../utils/injectionCalculations';
import { getSiteLabel, getSiteCode, getTrackerSuggestedSite, ROTATION_SITE_ORDER } from '../utils/rotationUtils';
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
                  <View style={styles.statusIcon}>{statusIcon(occurrence.status)}</View>
                  <View style={styles.activityMain}>
                    <Text style={[styles.activityTitle, occurrence.status === 'completed' && styles.activityTitleCompleted, occurrence.status === 'missed' && styles.activityTitleMissed]}>
                      {occurrence.peptideName}
                    </Text>
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
  container: { flex: 1, backgroundColor: '#030712' },
  content: { padding: 14, paddingBottom: 34, gap: 10 },
  heroCard: { backgroundColor: '#090d16', borderWidth: 1, borderColor: '#1e293b', borderRadius: 16, padding: 14 },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(16,185,129,0.10)' },
  heroCopy: { flex: 1 },
  eyebrow: { fontSize: 9, letterSpacing: 1.2, color: '#10b981', fontWeight: '900' },
  heroTitle: { fontSize: 17, color: '#fff', fontWeight: '900', marginTop: 2 },
  heroSubtitle: { fontSize: 10, color: '#64748b', marginTop: 3 },
  quickLogBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#10b981', borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8 },
  quickLogText: { color: '#022c22', fontWeight: '900', fontSize: 11 },
  metricRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  metricCard: { flex: 1, borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, backgroundColor: '#030712', padding: 9 },
  metricIcon: { marginBottom: 4 }, metricValue: { color: '#fff', fontSize: 18, fontWeight: '900' }, metricLabel: { color: '#64748b', fontSize: 9, marginTop: 1 },
  sectionCard: { backgroundColor: '#090d16', borderWidth: 1, borderColor: '#1e293b', borderRadius: 14, padding: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 }, sectionTitle: { color: '#fff', fontSize: 12, fontWeight: '900' }, sectionMeta: { color: '#64748b', fontSize: 9, fontWeight: '800' },
  weekControls: { flexDirection: 'row', gap: 5 }, smallIconBtn: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, borderColor: '#1e293b', alignItems: 'center', justifyContent: 'center', backgroundColor: '#030712' },
  weekRow: { gap: 6, paddingVertical: 2 }, dayCell: { width: 48, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#1e293b', backgroundColor: '#030712', alignItems: 'center' }, dayCellActive: { borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.12)' },
  dayLabel: { fontSize: 9, color: '#64748b', fontWeight: '900' }, dayLabelActive: { color: '#10b981' }, dayNumber: { fontSize: 17, color: '#fff', fontWeight: '900', marginTop: 2 }, dayNumberActive: { color: '#10b981' },
  dotRow: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 8, marginTop: 4 }, dot: { width: 5, height: 5, borderRadius: 3 }, dotSchedule: { backgroundColor: '#38bdf8' }, dotLog: { backgroundColor: '#10b981' }, todayRing: { width: 5, height: 5, borderRadius: 3, borderWidth: 1, borderColor: '#f59e0b' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 9 }, legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 }, legendText: { color: '#64748b', fontSize: 8 }, currentDateText: { color: '#94a3b8', fontSize: 9, marginLeft: 'auto', fontWeight: '700' },
  activityList: { gap: 5 }, activityRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#111827', borderRadius: 9 }, activityRowDue: { backgroundColor: 'rgba(245,158,11,0.07)', borderColor: 'rgba(245,158,11,0.22)', borderWidth: 1, paddingHorizontal: 7 }, activityRowMissed: { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.28)', borderWidth: 1, paddingHorizontal: 7 }, activityRowCompleted: { opacity: 0.62 }, activityRowHighlighted: { borderColor: '#38bdf8', borderWidth: 1, paddingHorizontal: 7 }, statusIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#030712', alignItems: 'center', justifyContent: 'center' }, activityMain: { flex: 1 }, activityTitle: { color: '#fff', fontSize: 12, fontWeight: '900' }, activityTitleCompleted: { color: '#cbd5e1' }, activityTitleMissed: { color: '#fecaca' }, activitySub: { color: '#64748b', fontSize: 9, marginTop: 2 }, statusBadge: { borderWidth: 1, borderColor: '#334155', borderRadius: 7, paddingHorizontal: 6, paddingVertical: 4 }, statusBadgeDone: { borderColor: 'rgba(16,185,129,0.35)', backgroundColor: 'rgba(16,185,129,0.08)' }, statusBadgeMissed: { borderColor: 'rgba(239,68,68,0.35)', backgroundColor: 'rgba(239,68,68,0.08)' }, statusBadgeText: { color: '#94a3b8', fontSize: 8, fontWeight: '900' }, statusBadgeTextMissed: { color: '#fca5a5' }, activityActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#10b981', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 7 }, activityActionBtnMissed: { backgroundColor: '#f59e0b' }, activityActionText: { color: '#022c22', fontSize: 8, fontWeight: '900' }, loggedBadge: { borderWidth: 1, borderColor: 'rgba(56,189,248,0.35)', backgroundColor: 'rgba(56,189,248,0.08)', borderRadius: 7, paddingHorizontal: 6, paddingVertical: 4 }, loggedBadgeText: { color: '#38bdf8', fontSize: 8, fontWeight: '900' },
  upcomingRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#111827' }, dateBlock: { width: 34, alignItems: 'center' }, dateBlockDay: { color: '#fff', fontSize: 13, fontWeight: '900' }, dateBlockMonth: { color: '#64748b', fontSize: 8, marginTop: 1 }, upcomingStatus: { color: '#38bdf8', fontSize: 8, fontWeight: '900' }, upcomingDone: { color: '#10b981' },
  gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, summaryTile: { width: '48.8%', backgroundColor: '#090d16', borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, padding: 10 }, summaryTileIcon: { marginBottom: 5 }, summaryTileValue: { color: '#fff', fontSize: 18, fontWeight: '900' }, summaryTileLabel: { color: '#64748b', fontSize: 9, marginTop: 2 },
  analyticsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, analyticsMetric: { width: '48.8%', borderRadius: 10, borderWidth: 1, borderColor: '#1e293b', padding: 9, backgroundColor: '#030712' }, analyticsMetricValue: { color: '#fff', fontSize: 18, fontWeight: '900' }, analyticsMetricLabel: { color: '#64748b', fontSize: 8, marginTop: 2 }, analyticsDivider: { height: 1, backgroundColor: '#1e293b', marginVertical: 10 }, analyticsCaption: { color: '#94a3b8', fontSize: 9, fontWeight: '800', marginBottom: 6 }, analyticsEmpty: { color: '#64748b', fontSize: 9 }, rankRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#111827' }, rankName: { color: '#fff', fontSize: 9, fontWeight: '700' }, rankCount: { color: '#64748b', fontSize: 9 },
  nextCard: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#090d16', borderWidth: 1, borderColor: '#1e293b', borderRadius: 14, padding: 11 }, nextIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(56,189,248,0.08)' }, nextMain: { flex: 1 }, nextLabel: { color: '#38bdf8', fontSize: 8, fontWeight: '900', letterSpacing: 1 }, nextTitle: { color: '#fff', fontSize: 11, fontWeight: '900', marginTop: 2 }, nextSub: { color: '#64748b', fontSize: 9, marginTop: 1 },
  emptyState: { borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, backgroundColor: '#030712', padding: 14, alignItems: 'center' }, emptyStateText: { color: '#64748b', fontSize: 9, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' },
  quickLogModal: { backgroundColor: '#090d16', borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, borderColor: '#1e293b', padding: 16, maxHeight: '88%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  modalEyebrow: { color: '#10b981', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 2 },
  modalClose: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#030712', borderWidth: 1, borderColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  modalCloseText: { color: '#94a3b8', fontSize: 24, lineHeight: 24 },
  inputLabel: { color: '#64748b', fontSize: 9, fontWeight: '900', letterSpacing: 0.7, marginBottom: 6, marginTop: 5 },
  vialPickerRow: { gap: 7, paddingBottom: 3 },
  vialChip: { minWidth: 125, backgroundColor: '#030712', borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, padding: 9 },
  vialChipActive: { borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)' },
  vialChipName: { color: '#fff', fontSize: 11, fontWeight: '800' },
  vialChipNameActive: { color: '#10b981' },
  vialChipMeta: { color: '#64748b', fontSize: 8, marginTop: 3 },
  inputCard: { backgroundColor: '#030712', borderWidth: 1, borderColor: '#1e293b', borderRadius: 11, padding: 10, marginTop: 7 },
  modalInput: { color: '#fff', fontSize: 15, fontWeight: '800', backgroundColor: '#090d16', borderWidth: 1, borderColor: '#334155', borderRadius: 9, paddingHorizontal: 12, paddingVertical: 10 },
  notesInput: { minHeight: 72, textAlignVertical: 'top' },
  calculatedText: { color: '#38bdf8', fontSize: 9, fontWeight: '800', marginTop: 6 },
  siteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  siteChip: { width: '31.8%', backgroundColor: '#030712', borderWidth: 1, borderColor: '#1e293b', borderRadius: 9, padding: 8 },
  siteChipActive: { borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)' },
  siteChipCode: { color: '#94a3b8', fontSize: 10, fontWeight: '900' },
  siteChipCodeActive: { color: '#10b981' },
  siteChipName: { color: '#64748b', fontSize: 7, marginTop: 2 },
  modalActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  cancelBtn: { flex: 1, backgroundColor: '#030712', borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  cancelBtnText: { color: '#94a3b8', fontWeight: '800', fontSize: 11 },
  saveBtn: { flex: 1.5, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, backgroundColor: '#10b981', borderRadius: 10, paddingVertical: 11 },
  saveBtnText: { color: '#022c22', fontWeight: '900', fontSize: 11 },
  disclaimerText: { color: '#475569', fontSize: 8, lineHeight: 12, marginTop: 9, textAlign: 'center' },
});
