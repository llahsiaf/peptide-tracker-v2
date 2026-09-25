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
} from 'react-native';
import { X, Activity, Droplets, Sparkles, Check } from 'lucide-react-native';
import { InventoryItem } from '../../store/useBioStackStore';
import {
  calculateInjectionMetrics,
  normalizeDecimalInput,
  parseDecimal,
} from '../../utils/injectionCalculations';
import { CuteVialIllustration } from '../common/CuteVialIllustration';
import { CuteSyringeIllustration } from '../common/CuteSyringeIllustration';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../theme';
import { useLanguage } from '../../i18n/LanguageContext';

export interface EditDoseModalProps {
  visible: boolean;
  item: InventoryItem | null;
  onClose: () => void;
  onSave: (id: string, updates: Partial<InventoryItem>) => void;
}

export const EditDoseModal: React.FC<EditDoseModalProps> = ({
  visible,
  item,
  onClose,
  onSave,
}) => {
  const { language } = useLanguage();
  const [targetDoseInput, setTargetDoseInput] = useState('');
  const [bacWaterInput, setBacWaterInput] = useState('');
  const [doseUnit, setDoseUnit] = useState<'mg' | 'mcg' | 'mL'>('mg');

  useEffect(() => {
    if (item) {
      setTargetDoseInput((item.targetDose || 0).toString());
      setBacWaterInput((item.bacWater || 0).toString());
      setDoseUnit((item.doseUnit || item.unit || 'mg') as 'mg' | 'mcg' | 'mL');
    }
  }, [item]);

  if (!item) return null;

  const liveMetrics = calculateInjectionMetrics(
    item,
    targetDoseInput,
    bacWaterInput,
    doseUnit
  );

  const parsedDose = parseDecimal(targetDoseInput);
  const parsedBac = parseDecimal(bacWaterInput);

  // Estimasi jumlah total dosis per vial
  const vialInMg = item.unit === 'mg' ? item.vialSize : item.vialSize / 1000;
  const doseInMg = doseUnit === 'mg' ? parsedDose : doseUnit === 'mcg' ? parsedDose / 1000 : parsedDose;
  const estimatedTotalShots = doseInMg > 0 ? Math.floor(vialInMg / doseInMg) : 0;

  const handleApplyPreset = (multiplier: number) => {
    const standard = item.targetDose || 1;
    setTargetDoseInput((standard * multiplier).toString());
  };

  const handleSave = () => {
    onSave(item.id, {
      targetDose: parsedDose || item.targetDose,
      doseUnit: doseUnit,
      bacWater: item.unit === 'mL' ? 0 : (parsedBac || item.bacWater),
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
          {/* Header Modal */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>{item.name}</Text>
              <Text style={styles.headerSubtitle}>
                {item.vialSize} {item.unit} Vial • {item.category}
              </Text>
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
            {/* 1. QUICK PRESET CHIPS */}
            <Text style={styles.sectionLabel}>
              {language === 'en' ? 'Quick Dose Presets' : 'Preset Dosis Cepat'}
            </Text>
            <View style={styles.presetRow}>
              {[
                { label: 'LOW', mult: 0.5 },
                { label: 'STANDARD', mult: 1 },
                { label: 'HIGH', mult: 2 },
              ].map(({ label, mult }) => {
                const val = (item.targetDose * mult).toFixed(1);
                return (
                  <TouchableOpacity
                    key={label}
                    onPress={() => handleApplyPreset(mult)}
                    style={styles.presetBtn}
                  >
                    <Text style={styles.presetBtnLabel}>{label}</Text>
                    <Text style={styles.presetBtnVal}>
                      {val} {item.unit}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 2. TARGET DOSIS INPUT */}
            <View style={styles.inputGroup}>
              <View style={styles.inputHeader}>
                <Text style={styles.inputLabel}>
                  {language === 'en' ? 'Target Injection Dose' : 'Target Dosis Injeksi'}
                </Text>
                {item.unit !== 'mL' && (
                  <View style={styles.unitToggleGroup}>
                    {(['mg', 'mcg'] as const).map((u) => (
                      <TouchableOpacity
                        key={u}
                        onPress={() => {
                          if (u !== doseUnit) {
                            const cur = parseDecimal(targetDoseInput);
                            if (u === 'mcg' && doseUnit === 'mg') {
                              setTargetDoseInput((cur * 1000).toString());
                            } else if (u === 'mg' && doseUnit === 'mcg') {
                              setTargetDoseInput((cur / 1000).toString());
                            }
                            setDoseUnit(u);
                          }
                        }}
                        style={[
                          styles.unitToggleBtn,
                          doseUnit === u && styles.unitToggleBtnActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.unitToggleText,
                            doseUnit === u && styles.unitToggleTextActive,
                          ]}
                        >
                          {u}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <TextInput
                style={styles.textInputMain}
                keyboardType="decimal-pad"
                inputMode="decimal"
                value={targetDoseInput}
                onChangeText={(v) => setTargetDoseInput(normalizeDecimalInput(v))}
                textAlign="center"
                placeholder="0.0"
                placeholderTextColor="#64748b"
              />
            </View>

            {/* 3. BAC WATER INPUT (HANYA JIKA BUKAN mL) */}
            {item.unit !== 'mL' && (
              <View style={styles.inputGroup}>
                <View style={styles.inputHeader}>
                  <Text style={styles.inputLabel}>
                    {language === 'en' ? 'Diluent Volume (BAC Water)' : 'Volume Pelarut (BAC Water)'}
                  </Text>
                  <Text style={styles.inputUnitTag}>mL</Text>
                </View>

                <TextInput
                  style={styles.textInputBlue}
                  keyboardType="decimal-pad"
                  inputMode="decimal"
                  value={bacWaterInput}
                  onChangeText={(v) => setBacWaterInput(normalizeDecimalInput(v))}
                  textAlign="center"
                  placeholder="2.0"
                  placeholderTextColor="#64748b"
                />
              </View>
            )}

            {/* 4. FITUR UTAMA: ESTIMASI TOTAL SUNTIKAN PER VIAL */}
            {estimatedTotalShots > 0 && (
              <View style={styles.estimationBanner}>
                <Sparkles size={16} color="#fbbf24" />
                <Text style={styles.estimationText}>
                  {language === 'en'
                    ? `With this dose, 1 vial yields approx. `
                    : `Dengan takaran ini, 1 vial cukup untuk sekitar `}
                  <Text style={styles.estimationHighlight}>
                    {estimatedTotalShots}x {language === 'en' ? 'shots' : 'suntikan'}
                  </Text>
                  !
                </Text>
              </View>
            )}

            {/* 5. VISUALISASI SPUIT U-100 KARTUN */}
            <View style={styles.syringeSection}>
              <Text style={styles.syringeHeaderTitle}>
                {language === 'en' ? 'U-100 Insulin Syringe Mark' : 'Garis Spuit U-100'}
              </Text>
              <CuteSyringeIllustration
                u100Units={liveMetrics.iu}
                volMl={liveMetrics.volumeMlNumber}
                color={COLORS.mint}
              />
            </View>

            {/* 6. RINGKASAN METRIK PRESISI */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricCardLabel}>VOLUME</Text>
                <Text style={styles.metricCardValCyan}>{liveMetrics.volumeMl}</Text>
                <Text style={styles.metricCardSub}>mL</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricCardLabel}>U-100 IU</Text>
                <Text style={styles.metricCardValMint}>{liveMetrics.iu}</Text>
                <Text style={styles.metricCardSub}>Units</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricCardLabel}>KONSENTRASI</Text>
                <Text style={styles.metricCardVal}>
                  {liveMetrics.concentration.toFixed(1)}
                </Text>
                <Text style={styles.metricCardSub}>{item.unit}/mL</Text>
              </View>
            </View>

            {/* 7. TOMBOL SIMPAN */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Check size={18} color="#042f2e" />
              <Text style={styles.saveBtnText}>
                {language === 'en' ? 'Save Changes' : 'Simpan Perubahan'}
              </Text>
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
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.lg,
  },
  presetBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  presetBtnLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
  },
  presetBtnVal: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSoft,
  },
  inputUnitTag: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.cyan,
  },
  unitToggleGroup: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: RADIUS.sm,
    padding: 2,
  },
  unitToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm - 2,
  },
  unitToggleBtnActive: {
    backgroundColor: COLORS.mint,
  },
  unitToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  unitToggleTextActive: {
    color: '#022c22',
  },
  textInputMain: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: RADIUS.md,
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.mint,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  textInputBlue: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: RADIUS.md,
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.cyan,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  estimationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    gap: 8,
  },
  estimationText: {
    flex: 1,
    fontSize: 13,
    color: '#fef08a',
    fontWeight: '600',
  },
  estimationHighlight: {
    fontWeight: '900',
    color: '#fbbf24',
  },
  syringeSection: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: RADIUS.lg,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginVertical: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  syringeHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 6,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: SPACING.sm,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  metricCardLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  metricCardVal: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 2,
  },
  metricCardValCyan: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.cyan,
    marginTop: 2,
  },
  metricCardValMint: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.mint,
    marginTop: 2,
  },
  metricCardSub: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.mint,
    paddingVertical: 14,
    borderRadius: RADIUS.pill,
    marginTop: SPACING.lg,
    ...SHADOWS.cardGlow,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#022c22',
  },
});
