import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import {
  Calendar,
  Clock,
  PlayCircle,
  PauseCircle,
  Trash2,
  Syringe,
  CheckCircle2,
  ChevronRight,
  Flame,
  AlertTriangle,
} from 'lucide-react-native';
import { InventoryItem } from '../../store/useBioStackStore';
import { calculateInjectionMetrics, getLiquidStatus } from '../../utils/injectionCalculations';
import { getOccurrenceForDate, getNextScheduledOccurrence } from '../../utils/scheduleUtils';
import { CuteVialIllustration } from '../common/CuteVialIllustration';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../theme';
import { useLanguage } from '../../i18n/LanguageContext';

export interface InventoryCardProps {
  item: InventoryItem;
  injectionHistory: any[];
  onOpenEditDose: (item: InventoryItem) => void;
  onOpenSchedule: (item: InventoryItem) => void;
  onQuickLog: (item: InventoryItem) => void;
  onTogglePause: (id: string, currentlyPaused: boolean) => void;
  onRemoveItem: (id: string, name: string) => void;
  onSyncCalendar?: (item: InventoryItem) => void;
}

export const InventoryCard: React.FC<InventoryCardProps> = ({
  item,
  injectionHistory,
  onOpenEditDose,
  onOpenSchedule,
  onQuickLog,
  onTogglePause,
  onRemoveItem,
  onSyncCalendar,
}) => {
  const { language } = useLanguage();
  const metrics = calculateInjectionMetrics(item);
  const liquid = getLiquidStatus(item);
  const now = new Date();

  const todayOccurrence = getOccurrenceForDate(item, now, now, injectionHistory);
  const nextOccurrence = todayOccurrence || getNextScheduledOccurrence(item, now, injectionHistory, 30);

  const isPaused = Boolean(item.schedulePaused);
  const isEmpty = liquid.currentVol <= 0;

  // FITUR UTAMA: Estimasi Sisa Suntikan
  const dosesLeft = liquid.dosesLeft;
  const daysLeft = liquid.daysLeft;

  // Format jadwal dengan nama hari eksplisit (contoh: "Senin, 28 Sep • 08:00")
  const formatNextScheduleWithDay = (dateStr: string, timeStr?: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return `${dateStr} • ${timeStr || '08:00'}`;
    const targetDate = new Date(y, m - 1, d);
    const isToday = targetDate.toDateString() === now.toDateString();
    const tmr = new Date(now);
    tmr.setDate(tmr.getDate() + 1);
    const isTomorrow = targetDate.toDateString() === tmr.toDateString();

    const dayNameId = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][targetDate.getDay()];
    const dayNameEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][targetDate.getDay()];
    const monthNameId = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][targetDate.getMonth()];
    const monthNameEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][targetDate.getMonth()];

    const timePart = timeStr || '08:00';

    if (language === 'en') {
      if (isToday) return `Today (${dayNameEn}) • ${timePart}`;
      if (isTomorrow) return `Tomorrow (${dayNameEn}) • ${timePart}`;
      return `${dayNameEn}, ${monthNameEn} ${d} • ${timePart}`;
    } else {
      if (isToday) return `Hari ini (${dayNameId}) • ${timePart}`;
      if (isTomorrow) return `Besok (${dayNameId}) • ${timePart}`;
      return `${dayNameId}, ${d} ${monthNameId} • ${timePart}`;
    }
  };

  // Tentukan badge gaya & warna berdasarkan sisa suntikan
  const getDoseBadgeStyle = () => {
    if (isEmpty) {
      return {
        bg: 'rgba(100, 116, 139, 0.16)',
        border: '#475569',
        textColor: '#94a3b8',
        label: language === 'en' ? 'Vial Empty' : 'Vial Habis',
        icon: null,
      };
    }
    if (dosesLeft <= 1) {
      return {
        bg: 'rgba(244, 63, 94, 0.16)',
        border: '#fb7185',
        textColor: '#fb7185',
        label: language === 'en' ? 'Only 1 Shot Left!' : 'Tinggal 1x Suntik Lagi!',
        icon: 'alert',
      };
    }
    if (dosesLeft <= 3) {
      return {
        bg: 'rgba(251, 146, 60, 0.16)',
        border: '#fb923c',
        textColor: '#fb923c',
        label: language === 'en' ? `${dosesLeft} Shots Left (~${daysLeft}d)` : `Sisa ${dosesLeft}x Suntik (~${daysLeft} hari)`,
        icon: 'warning',
      };
    }
    return {
      bg: 'rgba(194, 211, 182, 0.16)',
      border: '#c2d3b6',
      textColor: '#c2d3b6',
      label: language === 'en' ? `${dosesLeft} Shots Left (~${daysLeft}d)` : `Sisa ${dosesLeft}x Suntik (~${daysLeft} hari)`,
      icon: 'check',
    };
  };

  const badge = getDoseBadgeStyle();

  return (
    <View style={[styles.card, isPaused && styles.cardPaused]}>
      {/* 1. Header: Pill Sisa Suntik & Volume Meta */}
      <View style={[styles.doseBadgeRow, { backgroundColor: badge.bg, borderColor: badge.border }]}>
        <View style={styles.doseBadgeLeft}>
          <Text style={[styles.doseBadgeText, { color: badge.textColor }]}>
            {badge.label}
          </Text>
        </View>
        <Text style={styles.liquidVolMeta}>
          {liquid.currentVol.toFixed(2)} / {liquid.initialVol.toFixed(1)} mL
        </Text>
      </View>

      {/* 2. Main Row: Compact Cute Vial (size="sm") + Info Block */}
      <View style={styles.cardMainRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onOpenEditDose(item)}
          style={styles.vialWrapper}
        >
          <CuteVialIllustration
            progress={liquid.progressPercent}
            category={item.category}
            size="sm"
            dosesLeft={dosesLeft}
          />
        </TouchableOpacity>

        <View style={styles.cardInfo}>
          {/* Baris Nama & Quick Icons */}
          <View style={styles.nameHeaderRow}>
            <TouchableOpacity onPress={() => onOpenEditDose(item)} style={{ flex: 1, paddingRight: 6 }}>
              <Text style={styles.peptideName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.categorySub} numberOfLines={1}>
                {item.category || 'General Peptide'} • {item.vialSize}{item.unit}
              </Text>
            </TouchableOpacity>

            <View style={styles.quickIconRow}>
              {onSyncCalendar && (
                <TouchableOpacity
                  onPress={() => onSyncCalendar(item)}
                  style={styles.circleIconBtn}
                  accessibilityLabel="Sync Calendar"
                >
                  <Calendar size={13} color="#94a3b8" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => onOpenSchedule(item)}
                style={styles.circleIconBtn}
                accessibilityLabel="Set Schedule"
              >
                <Clock size={13} color={COLORS.cyan} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.circleIconDangerBtn}
                onPress={() => onRemoveItem(item.id, item.name)}
                accessibilityLabel="Delete Vial"
              >
                <Trash2 size={13} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Baris Dosis Ringkas (Inline Pill Badges) */}
          <TouchableOpacity
            style={styles.dosePillRow}
            onPress={() => onOpenEditDose(item)}
            activeOpacity={0.8}
          >
            <View style={styles.miniPillDose}>
              <Text style={styles.miniPillLabel}>{language === 'en' ? 'DOSE' : 'DOSIS'}</Text>
              <Text style={styles.miniPillValue}>{item.targetDose} {metrics.doseUnit}</Text>
            </View>

            <View style={styles.miniPillIu}>
              <Text style={styles.miniPillLabel}>U-100</Text>
              <Text style={styles.miniPillValueMint}>{metrics.iu} IU</Text>
            </View>

            <View style={styles.miniPillVol}>
              <Text style={styles.miniPillLabel}>VOL</Text>
              <Text style={styles.miniPillValueCyan}>{metrics.volumeMl} mL</Text>
            </View>
          </TouchableOpacity>

          {/* Progress Bar Ramping */}
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${liquid.progressPercent}%`,
                  backgroundColor:
                    dosesLeft <= 1 ? COLORS.danger : dosesLeft <= 3 ? COLORS.orange : COLORS.cyan,
                },
              ]}
            />
          </View>

          {/* Jadwal Hari Eksplisit */}
          <View style={styles.scheduleRow}>
            {isPaused ? <PauseCircle size={12} color="#94a3b8" /> : <Calendar size={12} color={COLORS.mint} />}
            <Text style={styles.scheduleText} numberOfLines={1}>
              {isPaused
                ? (language === 'en' ? 'Schedule Paused' : 'Jadwal Dijeda')
                : nextOccurrence
                ? formatNextScheduleWithDay(nextOccurrence.date, nextOccurrence.time)
                : (language === 'en' ? 'No upcoming schedule' : 'Tidak ada jadwal')}
              {item.activeDays && item.activeDays.length > 0 && !isPaused
                ? ` (${item.activeDays.join(', ')})`
                : ''}
            </Text>
          </View>
        </View>
      </View>

      {/* 3. Action Buttons: Log Dose Pill + Pause Pill */}
      <View style={styles.cardActionsRow}>
        <TouchableOpacity
          style={[styles.primaryActionBtn, isEmpty && styles.actionBtnDisabled]}
          onPress={() => onQuickLog(item)}
          disabled={isEmpty}
          activeOpacity={0.8}
        >
          <Syringe size={14} color="#231716" />
          <Text style={styles.primaryActionBtnText}>
            {language === 'en' ? 'Log Dose' : 'Catat Suntik'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryActionBtn}
          onPress={() => onTogglePause(item.id, isPaused)}
          activeOpacity={0.8}
        >
          {isPaused ? (
            <PlayCircle size={13} color={COLORS.mint} />
          ) : (
            <PauseCircle size={13} color="#94a3b8" />
          )}
          <Text style={[styles.secondaryActionBtnText, isPaused && { color: COLORS.mint }]}>
            {isPaused
              ? (language === 'en' ? 'Resume' : 'Lanjut')
              : (language === 'en' ? 'Pause' : 'Jeda')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  cardPaused: {
    opacity: 0.75,
    borderColor: '#334155',
  },
  doseBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    marginBottom: 8,
  },
  doseBadgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doseBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  liquidVolMeta: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '700',
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vialWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardInfo: {
    flex: 1,
  },
  nameHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  peptideName: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  categorySub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
    fontWeight: '600',
  },
  quickIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  circleIconBtn: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  circleIconDangerBtn: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.2)',
  },
  dosePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginVertical: 4,
  },
  miniPillDose: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  miniPillIu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(194, 211, 182, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(194, 211, 182, 0.28)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  miniPillVol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(188, 169, 239, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(188, 169, 239, 0.28)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  miniPillLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textMuted,
  },
  miniPillValue: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.amber,
  },
  miniPillValueMint: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.sage,
  },
  miniPillValueCyan: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.lilac,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
    marginVertical: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: RADIUS.pill,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  scheduleText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.accent,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    ...SHADOWS.subtle,
  },
  primaryActionBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#231716',
  },
  actionBtnDisabled: {
    backgroundColor: '#334155',
    opacity: 0.6,
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  secondaryActionBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
  },
});
