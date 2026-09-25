import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { X, Calendar, Clock, Activity, Check, CheckCircle2 } from 'lucide-react-native';
import { InventoryItem } from '../../store/useBioStackStore';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../theme';
import { useLanguage } from '../../i18n/LanguageContext';

export interface ScheduleModalProps {
  visible: boolean;
  item: InventoryItem | null;
  onClose: () => void;
  onSave: (id: string, updates: Partial<InventoryItem>) => void;
}

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

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  visible,
  item,
  onClose,
  onSave,
}) => {
  const { language } = useLanguage();

  const presets = [
    {
      id: 'daily',
      label: language === 'en' ? 'Daily' : 'Harian (Daily)',
      sub: language === 'en' ? 'Every Day' : 'Setiap Hari',
      days: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
    },
    {
      id: '2x_week',
      label: language === 'en' ? '2x / Week' : '2x Seminggu',
      sub: language === 'en' ? 'Mon, Thu' : 'Sen, Kam',
      days: ['Sen', 'Kam'],
    },
    {
      id: '3x_week',
      label: language === 'en' ? '3x / Week' : '3x Seminggu',
      sub: language === 'en' ? 'Mon, Wed, Fri' : 'Sen, Rab, Jum',
      days: ['Sen', 'Rab', 'Jum'],
    },
    {
      id: 'weekly',
      label: language === 'en' ? 'Weekly' : 'Mingguan (Weekly)',
      sub: language === 'en' ? 'Mon' : 'Sen',
      days: ['Sen'],
    },
  ];

  const [frequency, setFrequency] = useState('weekly');
  const [frequencyLabel, setFrequencyLabel] = useState('Weekly');
  const [activeDays, setActiveDays] = useState<string[]>(['Sen']);
  const [injectionTime, setInjectionTime] = useState('08:00');
  const [hasCycle, setHasCycle] = useState(false);
  const [cycleOnWeeks, setCycleOnWeeks] = useState(8);
  const [cycleOffWeeks, setCycleOffWeeks] = useState(4);

  useEffect(() => {
    if (item) {
      setFrequency(item.frequency || 'weekly');
      setFrequencyLabel(item.frequencyLabel || 'Weekly');
      setActiveDays(item.activeDays || ['Sen']);
      setInjectionTime(item.injectionTime || '08:00');
      setHasCycle(Boolean(item.hasCycle));
      setCycleOnWeeks(item.cycleOnWeeks || 8);
      setCycleOffWeeks(item.cycleOffWeeks || 4);
    }
  }, [item]);

  if (!item) return null;

  const handleSelectPreset = (p: typeof presets[0]) => {
    setFrequency(p.id);
    setFrequencyLabel(p.label);
    setActiveDays(p.days);
  };

  const handleToggleDay = (day: string) => {
    if (activeDays.includes(day)) {
      if (activeDays.length > 1) {
        setActiveDays(activeDays.filter((d) => d !== day));
      }
    } else {
      setActiveDays([...activeDays, day]);
    }
  };

  const handleSave = () => {
    onSave(item.id, {
      frequency,
      frequencyLabel,
      activeDays,
      injectionTime,
      hasCycle,
      cycleOnWeeks,
      cycleOffWeeks,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>{language === 'en' ? 'Injection Schedule' : 'Jadwal Injeksi'}</Text>
              <Text style={styles.headerSubtitle}>{item.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
            keyboardShouldPersistTaps="handled"
          >
            {/* 1. FREQUENCY PRESETS */}
            <Text style={styles.sectionLabel}>{language === 'en' ? 'Frequency Preset' : 'Pilihan Frekuensi'}</Text>
            <View style={styles.presetGrid}>
              {presets.map((p) => {
                const isSelected = frequency === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => handleSelectPreset(p)}
                    style={[styles.presetCard, isSelected && styles.presetCardActive]}
                  >
                    <View style={styles.presetRadioRow}>
                      <Text style={[styles.presetTitle, isSelected && styles.presetTitleActive]}>
                        {p.label}
                      </Text>
                      {isSelected && <CheckCircle2 size={16} color={COLORS.mint} />}
                    </View>
                    <Text style={styles.presetSub}>{p.sub}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 2. PILIH HARI AKTIF */}
            <Text style={styles.sectionLabel}>{language === 'en' ? 'Injection Days' : 'Hari Penyuntikan'}</Text>
            <View style={styles.daysRow}>
              {DAYS_OF_WEEK.map((d) => {
                const isSelected = activeDays.includes(d);
                const displayDay = language === 'en' ? (DAY_TRANSLATIONS[d] || d) : d;
                return (
                  <TouchableOpacity
                    key={d}
                    onPress={() => handleToggleDay(d)}
                    style={[styles.dayChip, isSelected && styles.dayChipActive]}
                  >
                    <Text style={[styles.dayChipText, isSelected && styles.dayChipTextActive]}>
                      {displayDay}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 3. JAM TINDAKAN */}
            <View style={styles.timeCard}>
              <View style={styles.timeIconWrap}>
                <Clock size={18} color={COLORS.cyan} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.timeLabel}>{language === 'en' ? 'Reminder Time' : 'Jam Pengingat Injeksi'}</Text>
                <Text style={styles.timeSub}>{language === 'en' ? 'Format HH:MM' : 'Format JJ:MM'}</Text>
              </View>
              <TextInput
                style={styles.timeInput}
                value={injectionTime}
                onChangeText={setInjectionTime}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                placeholder="08:00"
                placeholderTextColor="#64748b"
                textAlign="center"
              />
            </View>

            {/* 4. SIKLUS / PERIODISASI */}
            <View style={styles.cycleCard}>
              <View style={styles.cycleHeaderRow}>
                <View style={styles.cycleIconWrap}>
                  <Activity size={16} color={COLORS.purple} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cycleTitle}>{language === 'en' ? 'Cycle / Periodization' : 'Siklus / Periodisasi'}</Text>
                  <Text style={styles.cycleSub}>{language === 'en' ? 'e.g. 8 weeks on, 4 weeks off' : 'misal 8 minggu on, 4 minggu off'}</Text>
                </View>
                <Switch
                  value={hasCycle}
                  onValueChange={setHasCycle}
                  trackColor={{ false: '#334155', true: COLORS.purple }}
                  thumbColor="#ffffff"
                />
              </View>

              {hasCycle && (
                <View style={styles.cycleInputsRow}>
                  <View style={styles.cycleCol}>
                    <Text style={styles.cycleColLabel}>{language === 'en' ? 'Weeks ON' : 'Minggu ON'}</Text>
                    <TextInput
                      style={styles.cycleInput}
                      keyboardType="number-pad"
                      inputMode="numeric"
                      value={cycleOnWeeks.toString()}
                      onChangeText={(v) => setCycleOnWeeks(parseInt(v, 10) || 1)}
                      textAlign="center"
                    />
                  </View>
                  <View style={styles.cycleCol}>
                    <Text style={styles.cycleColLabel}>{language === 'en' ? 'Weeks OFF' : 'Minggu OFF'}</Text>
                    <TextInput
                      style={styles.cycleInput}
                      keyboardType="number-pad"
                      inputMode="numeric"
                      value={cycleOffWeeks.toString()}
                      onChangeText={(v) => setCycleOffWeeks(parseInt(v, 10) || 1)}
                      textAlign="center"
                    />
                  </View>
                </View>
              )}
            </View>

            {/* TOMBOL SIMPAN */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Check size={18} color="#042f2e" />
              <Text style={styles.saveBtnText}>{language === 'en' ? 'Save Schedule' : 'Simpan Jadwal'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.85)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: COLORS.cardElevated,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: COLORS.border,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.lg,
  },
  presetCard: {
    width: '48.5%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  presetCardActive: {
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderColor: COLORS.mint,
  },
  presetRadioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  presetTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textSoft,
  },
  presetTitleActive: {
    color: COLORS.mint,
  },
  presetSub: {
    fontSize: 11,
    color: '#94a3b8',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  dayChip: {
    flex: 1,
    marginHorizontal: 2,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  dayChipActive: {
    backgroundColor: COLORS.mint,
    borderColor: COLORS.mint,
  },
  dayChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
  },
  dayChipTextActive: {
    color: '#022c22',
  },
  timeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
  },
  timeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  timeSub: {
    fontSize: 11,
    color: '#94a3b8',
  },
  timeInput: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: RADIUS.md,
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.cyan,
    paddingVertical: 8,
    paddingHorizontal: 12,
    width: 80,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  cycleCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  cycleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cycleIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(192, 132, 252, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cycleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  cycleSub: {
    fontSize: 11,
    color: '#94a3b8',
  },
  cycleInputsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  cycleCol: {
    flex: 1,
    alignItems: 'center',
  },
  cycleColLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 6,
  },
  cycleInput: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: RADIUS.md,
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.purple,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.3)',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.mint,
    paddingVertical: 14,
    borderRadius: RADIUS.pill,
    ...SHADOWS.cardGlow,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#022c22',
  },
});
