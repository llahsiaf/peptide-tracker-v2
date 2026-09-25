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
        label: language === 'en' ? 'Only 1 Shot Left! ❄️' : 'Tinggal 1x Suntik Lagi! ❄️',
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
      bg: 'rgba(52, 211, 153, 0.16)',
      border: '#34d399',
      textColor: '#34d399',
      label: language === 'en' ? `${dosesLeft} Shots Left (~${daysLeft}d)` : `Sisa ${dosesLeft}x Suntik (~${daysLeft} hari)`,
      icon: 'check',
    };
  };

  const badge = getDoseBadgeStyle();

  return (
    <View style={[styles.card, isPaused && styles.cardPaused]}>
      {/* 1. BADGE ESTIMASI SISA SUNTIKAN DI ATAS KARTU */}
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

      {/* 2. BODY KARTU: VIAL KARTUN DI KIRI, INFORMASI DI KANAN */}
      <View style={styles.cardBody}>
        {/* Kolom Kiri: Ilustrasi Botol Vial Kartun SVG Dinamis */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onOpenEditDose(item)}
          style={styles.vialWrapper}
        >
          <CuteVialIllustration
            progress={liquid.progressPercent}
            category={item.category}
            size="md"
            dosesLeft={dosesLeft}
          />
          <Text style={styles.tapToEditHint}>
            {language === 'en' ? 'Tap to edit' : 'Ubah dosis'}
          </Text>
        </TouchableOpacity>

        {/* Kolom Kanan: Detail Peptida & Spesifikasi Dosis */}
        <View style={styles.infoCol}>
          {/* Header Baris Nama Peptida */}
          <View style={styles.nameRow}>
            <TouchableOpacity onPress={() => onOpenEditDose(item)} style={{ flex: 1 }}>
              <Text style={styles.peptideName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.categorySub} numberOfLines={1}>
                {item.category || 'General Peptide'} • {item.vialSize}{item.unit} Vial
              </Text>
            </TouchableOpacity>

            {/* Quick Actions (Jadwal & Kalender) */}
            <View style={styles.headerIcons}>
              {onSyncCalendar && (
                <TouchableOpacity
                  onPress={() => onSyncCalendar(item)}
                  style={styles.circleIconBtn}
                  accessibilityLabel="Sync Calendar"
                >
                  <Calendar size={15} color="#94a3b8" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => onOpenSchedule(item)}
                style={styles.circleIconBtn}
                accessibilityLabel="Set Schedule"
              >
                <Clock size={15} color="#38bdf8" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Kartu Mini Spesifikasi Dosis & Spuit U-100 */}
          <TouchableOpacity
            style={styles.doseSpecCard}
            onPress={() => onOpenEditDose(item)}
            activeOpacity={0.85}
          >
            <View style={styles.doseSpecRow}>
              <View style={styles.dosePill}>
                <Text style={styles.dosePillLabel}>{language === 'en' ? 'DOSE' : 'DOSIS'}</Text>
                <Text style={styles.dosePillVal}>
                  {item.targetDose} {metrics.doseUnit}
                </Text>
              </View>

              <View style={styles.specDivider} />

              <View style={styles.dosePill}>
                <Text style={styles.dosePillLabel}>U-100</Text>
                <Text style={styles.dosePillValGreen}>
                  {metrics.iu} IU
                </Text>
              </View>

              <View style={styles.specDivider} />

              <View style={styles.dosePill}>
                <Text style={styles.dosePillLabel}>VOL</Text>
                <Text style={styles.dosePillValCyan}>
                  {metrics.volumeMl} mL
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Progress Bar Cairan Rounded Ceria */}
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

          {/* Jadwal Injeksi Berikutnya */}
          <View style={styles.scheduleRow}>
            <Clock size={13} color="#94a3b8" />
            <Text style={styles.scheduleText} numberOfLines={1}>
              {isPaused
                ? (language === 'en' ? '⏸️ Schedule Paused' : '⏸️ Jadwal Dijeda')
                : nextOccurrence
                ? `${nextOccurrence.date === now.toISOString().split('T')[0] ? (language === 'en' ? 'Today' : 'Hari ini') : nextOccurrence.date} • ${nextOccurrence.time || '08:00'}`
                : (language === 'en' ? 'No upcoming schedule' : 'Tidak ada jadwal')}
            </Text>
          </View>
        </View>
      </View>

      {/* 3. TOMBOL AKSI BAWAH KARTU (CHUBBY BUTTONS) */}
      <View style={styles.cardActionsRow}>
        {/* Tombol Catat Dosis Cepat */}
        <TouchableOpacity
          style={[styles.primaryActionBtn, isEmpty && styles.actionBtnDisabled]}
          onPress={() => onQuickLog(item)}
          disabled={isEmpty}
        >
          <Syringe size={16} color="#042f2e" />
          <Text style={styles.primaryActionBtnText}>
            {language === 'en' ? 'Log Dose' : 'Catat Suntik'}
          </Text>
        </TouchableOpacity>

        {/* Tombol Pause/Resume */}
        <TouchableOpacity
          style={styles.secondaryActionBtn}
          onPress={() => onTogglePause(item.id, isPaused)}
        >
          {isPaused ? (
            <PlayCircle size={15} color="#34d399" />
          ) : (
            <PauseCircle size={15} color="#94a3b8" />
          )}
          <Text style={[styles.secondaryActionBtnText, isPaused && { color: '#34d399' }]}>
            {isPaused
              ? (language === 'en' ? 'Resume' : 'Lanjut')
              : (language === 'en' ? 'Pause' : 'Jeda')}
          </Text>
        </TouchableOpacity>

        {/* Tombol Hapus / Buang */}
        <TouchableOpacity
          style={styles.dangerActionBtn}
          onPress={() => onRemoveItem(item.id, item.name)}
        >
          <Trash2 size={15} color="#f43f5e" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1.5,
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
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  doseBadgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doseBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  liquidVolMeta: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vialWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    paddingVertical: 4,
  },
  tapToEditHint: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '600',
  },
  infoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  peptideName: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  categorySub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 1,
    fontWeight: '500',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  circleIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  doseSpecCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: RADIUS.md,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  doseSpecRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  dosePill: {
    alignItems: 'center',
  },
  dosePillLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dosePillVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#f8fafc',
    marginTop: 2,
  },
  dosePillValGreen: {
    fontSize: 13,
    fontWeight: '800',
    color: '#34d399',
    marginTop: 2,
  },
  dosePillValCyan: {
    fontSize: 13,
    fontWeight: '800',
    color: '#38bdf8',
    marginTop: 2,
  },
  specDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#1e293b',
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
    marginVertical: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: RADIUS.pill,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  scheduleText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.mint,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    ...SHADOWS.cardGlow,
  },
  primaryActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#022c22',
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
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  secondaryActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },
  dangerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.25)',
  },
});
