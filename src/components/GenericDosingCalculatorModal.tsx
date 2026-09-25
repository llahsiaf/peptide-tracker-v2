import React, { useState, useMemo } from 'react';
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
import { Calculator, X, Sparkles, Droplet, Syringe, RotateCcw } from 'lucide-react-native';
import Svg, { Rect, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useLanguage } from '../i18n/LanguageContext';
import {
  calculateGenericDosing,
  normalizeDecimalInput,
  parseDecimal,
} from '../utils/injectionCalculations';
import { SyringeVisualizer } from './SyringeVisualizer';
import { COLORS, RADIUS, SHADOWS } from '../theme';

interface GenericDosingCalculatorModalProps {
  visible: boolean;
  onClose: () => void;
}

export const GenericDosingCalculatorModal: React.FC<GenericDosingCalculatorModalProps> = ({
  visible,
  onClose,
}) => {
  const { language, t } = useLanguage();

  const [vialSize, setVialSize] = useState('10');
  const [vialUnit, setVialUnit] = useState<'mg' | 'mcg' | 'mL'>('mg');
  const [bacWater, setBacWater] = useState('2.0');
  const [targetDose, setTargetDose] = useState('250');
  const [doseUnit, setDoseUnit] = useState<'mg' | 'mcg' | 'mL'>('mcg');

  const result = useMemo(() => {
    const vSize = parseDecimal(vialSize);
    const bWater = parseDecimal(bacWater);
    const tDose = parseDecimal(targetDose);

    return calculateGenericDosing({
      vialAmount: vSize,
      vialUnit,
      bacWaterMl: bWater,
      doseAmount: tDose,
      doseUnit,
    });
  }, [vialSize, vialUnit, bacWater, targetDose, doseUnit]);

  const handleReset = () => {
    setVialSize('10');
    setVialUnit('mg');
    setBacWater('2.0');
    setTargetDose('250');
    setDoseUnit('mcg');
  };

  const iu = result.valid ? Math.min(100, Math.max(0, result.iu)) : 0;
  const svgWidth = 280;
  const fillWidth = (iu / 100) * 180;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconBox}>
                <Calculator size={18} color="#10b981" />
              </View>
              <View>
                <Text style={styles.headerTitle}>{t('calculator.title')}</Text>
                <Text style={styles.headerSubtitle}>{t('calculator.subtitle')}</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel={t('app.close')}>
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
            keyboardShouldPersistTaps="handled"
          >
            {/* 1. UKURAN VIAL */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>{t('calculator.vialSizeLabel')}</Text>
                <View style={styles.unitToggleGroup}>
                  {(['mg', 'mcg', 'mL'] as const).map((unit) => (
                    <TouchableOpacity
                      key={unit}
                      onPress={() => {
                        setVialUnit(unit);
                        if (unit === 'mL') setDoseUnit('mL');
                        else if (doseUnit === 'mL') setDoseUnit('mg');
                      }}
                      style={[styles.unitToggleBtn, vialUnit === unit && styles.unitToggleBtnActive]}
                    >
                      <Text style={[styles.unitToggleText, vialUnit === unit && styles.unitToggleTextActive]}>
                        {unit}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TextInput
                style={styles.textInput}
                keyboardType="decimal-pad"
                inputMode="decimal"
                value={vialSize}
                onChangeText={(v) => setVialSize(normalizeDecimalInput(v))}
                placeholder={language === 'en' ? 'e.g. 10' : 'Contoh: 10'}
                placeholderTextColor="#64748b"
              />

              {/* Quick Vial Presets */}
              <View style={styles.quickChipsRow}>
                {['2', '5', '10', '15', '50'].map((chip) => (
                  <TouchableOpacity
                    key={chip}
                    onPress={() => setVialSize(chip)}
                    style={[styles.quickChip, vialSize === chip && styles.quickChipActive]}
                  >
                    <Text style={[styles.quickChipText, vialSize === chip && styles.quickChipTextActive]}>
                      {chip} {vialUnit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 2. BAC WATER (Pelarut) */}
            {vialUnit !== 'mL' && (
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>{t('calculator.bacWaterLabel')}</Text>
                  <Text style={styles.inputMetaLabel}>mL</Text>
                </View>

                <TextInput
                  style={styles.textInput}
                  keyboardType="decimal-pad"
                  inputMode="decimal"
                  value={bacWater}
                  onChangeText={(v) => setBacWater(normalizeDecimalInput(v))}
                  placeholder={language === 'en' ? 'e.g. 2.0' : 'Contoh: 2.0'}
                  placeholderTextColor="#64748b"
                />

                <View style={styles.quickChipsRow}>
                  {['1.0', '1.5', '2.0', '2.5', '3.0'].map((chip) => (
                    <TouchableOpacity
                      key={chip}
                      onPress={() => setBacWater(chip)}
                      style={[styles.quickChip, bacWater === chip && styles.quickChipActive]}
                    >
                      <Text style={[styles.quickChipText, bacWater === chip && styles.quickChipTextActive]}>
                        {chip} mL
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* 3. TARGET DOSIS + OPSI MG & MCG */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>{t('calculator.targetDoseLabel')}</Text>
                <View style={styles.unitToggleGroup}>
                  {(vialUnit === 'mL' ? (['mL'] as const) : (['mg', 'mcg'] as const)).map((unit) => (
                    <TouchableOpacity
                      key={unit}
                      onPress={() => {
                        if (unit !== doseUnit) {
                          const curDose = parseDecimal(targetDose);
                          if (unit === 'mcg' && doseUnit === 'mg') {
                            setTargetDose((curDose * 1000).toString());
                          } else if (unit === 'mg' && doseUnit === 'mcg') {
                            setTargetDose((curDose / 1000).toString());
                          }
                          setDoseUnit(unit);
                        }
                      }}
                      style={[styles.unitToggleBtn, doseUnit === unit && styles.unitToggleBtnActive]}
                    >
                      <Text style={[styles.unitToggleText, doseUnit === unit && styles.unitToggleTextActive]}>
                        {unit}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TextInput
                style={styles.textInput}
                keyboardType="decimal-pad"
                inputMode="decimal"
                value={targetDose}
                onChangeText={(v) => setTargetDose(normalizeDecimalInput(v))}
                placeholder={
                  doseUnit === 'mcg'
                    ? (language === 'en' ? 'e.g. 250' : 'Contoh: 250')
                    : (language === 'en' ? 'e.g. 0.5' : 'Contoh: 0.5')
                }
                placeholderTextColor="#64748b"
              />

              {/* Quick Dose Presets */}
              <View style={styles.quickChipsRow}>
                {(doseUnit === 'mcg' ? ['100', '250', '500', '750', '1000'] : ['0.1', '0.25', '0.5', '1.0', '2.5']).map((chip) => (
                  <TouchableOpacity
                    key={chip}
                    onPress={() => setTargetDose(chip)}
                    style={[styles.quickChip, targetDose === chip && styles.quickChipActive]}
                  >
                    <Text style={[styles.quickChipText, targetDose === chip && styles.quickChipTextActive]}>
                      {chip} {doseUnit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* HASIL KALKULASI */}
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Syringe size={16} color="#10b981" />
                <Text style={styles.resultTitle}>{t('calculator.resultTitle')}</Text>
              </View>

              <View style={styles.metricsGrid}>
                {/* Metric 1: Volume */}
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>{t('calculator.volumeToInject')}</Text>
                  <Text style={styles.metricValHighlight}>{result.valid ? `${result.volumeMlStr} mL` : '—'}</Text>
                  <Text style={styles.metricSub}>{t('calculator.volumeSub')}</Text>
                </View>

                {/* Metric 2: U-100 Units (IU) */}
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>{t('calculator.syringeMarking')}</Text>
                  <Text style={styles.metricValAccent}>{result.valid ? `${result.iu} IU` : '—'}</Text>
                  <Text style={styles.metricSub}>{t('calculator.syringeSub')}</Text>
                </View>
              </View>

              {/* Visualisasi Spuit SVG Interaktif */}
              <View style={styles.visualizerContainer}>
                <Text style={styles.visualizerLabel}>{t('calculator.syringeVisualizerLabel')}</Text>
                <SyringeVisualizer
                  u100Units={result.valid ? result.iu : 0}
                  volMl={result.valid ? result.volumeMl : 0}
                  showHeader={false}
                />
              </View>

              {/* Sekunder: Konsentrasi & Dosis per Vial */}
              <View style={styles.secondaryStatsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>{t('calculator.concentration')}:</Text>
                  <Text style={styles.statValue}>
                    {result.valid ? `${result.concentrationMgPerMl} mg/mL` : '—'}
                  </Text>
                </View>

                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>{t('calculator.totalDosesInVial')}:</Text>
                  <Text style={styles.statValue}>
                    {result.valid ? `~${result.dosesPerVial} ${t('calculator.dosesUnit')}` : '—'}
                  </Text>
                </View>
              </View>

              {result.valid && (
                <View style={styles.tipBox}>
                  <Sparkles size={14} color="#34d399" />
                  <Text style={styles.tipText}>
                    {t('calculator.summaryFormula', {
                      vial: `${vialSize} ${vialUnit}`,
                      bac: `${bacWater} mL`,
                      dose: `${targetDose} ${doseUnit}`,
                      vol: `${result.volumeMlStr} mL`,
                      iu: `${result.iu} IU`,
                    })}
                  </Text>
                </View>
              )}
            </View>

            {/* Reset Button */}
            <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
              <RotateCcw size={14} color="#94a3b8" />
              <Text style={styles.resetBtnText}>{t('calculator.resetValues')}</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    height: '88%',
    backgroundColor: '#090d16',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#1e293b',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f8fafc',
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  scrollBody: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  inputGroup: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputMetaLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38bdf8',
  },
  unitToggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#030712',
    borderRadius: 8,
    padding: 2,
    gap: 2,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  unitToggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  unitToggleBtnActive: {
    backgroundColor: '#10b981',
  },
  unitToggleText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
  },
  unitToggleTextActive: {
    color: '#022c22',
  },
  textInput: {
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '800',
    paddingHorizontal: 14,
    paddingVertical: 10,
    textAlign: 'center',
  },
  quickChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  quickChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  quickChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
  },
  quickChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
  },
  quickChipTextActive: {
    color: '#34d399',
  },
  resultCard: {
    backgroundColor: '#05131b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    gap: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resultTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#030712',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  metricValHighlight: {
    fontSize: 22,
    fontWeight: '900',
    color: '#38bdf8',
    marginVertical: 4,
  },
  metricValAccent: {
    fontSize: 22,
    fontWeight: '900',
    color: '#10b981',
    marginVertical: 4,
  },
  metricSub: {
    fontSize: 8,
    color: '#64748b',
  },
  visualizerContainer: {
    backgroundColor: '#030712',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
  },
  visualizerLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  secondaryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingTop: 4,
  },
  statItem: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#94a3b8',
  },
  statValue: {
    fontSize: 10,
    fontWeight: '800',
    color: '#f8fafc',
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  tipText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 15,
    color: '#34d399',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  resetBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
});
