import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { X, Activity, Check } from 'lucide-react-native';
import { ActiveInventoryItem } from '../types';
import { SyringeVisualizer } from './SyringeVisualizer';
import { useLanguage } from '../i18n/LanguageContext';
import { normalizeDecimalInput, parseDecimal } from '../utils/injectionCalculations';
import { COLORS } from '../theme';

interface DoseDetailModalProps {
  visible: boolean;
  item: ActiveInventoryItem | null;
  onClose: () => void;
  onSave: (id: string, newDose: number, newBac: number) => void;
}

export const DoseDetailModal: React.FC<DoseDetailModalProps> = ({ visible, item, onClose, onSave }) => {
  const { language } = useLanguage();
  const [doseInput, setDoseInput] = useState<string>(item?.selectedDose?.toString() ?? '0');
  const [bacWaterInput, setBacWaterInput] = useState<string>((item?.bacWaterMl || 2.0).toString());

  useEffect(() => {
    if (item) {
      setDoseInput((item.selectedDose ?? 0).toString());
      setBacWaterInput((item.bacWaterMl || 2.0).toString());
    }
  }, [item]);

  if (!item) return null;

  const dose = parseDecimal(doseInput);
  const bacWater = parseDecimal(bacWaterInput) || 1.0;
  const vialSize = item.vialSizeMg || 1;
  const isLiquidMl = item.unit === 'mL';
  const volMl = isLiquidMl ? dose : (dose / vialSize) * bacWater;
  const u100Units = Math.round(volMl * 100 * 10) / 10;
  const dialClicks = Math.round(volMl * (item.penClicksPerMl || 100));

  const handleSave = () => {
    onSave(item.id, dose, bacWater);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>{item.name}</Text>
              <Text style={styles.headerSubtitle}>
                {item.vialSizeMg} {item.unit === 'mL' ? 'mL Liquid' : 'mg Vial'} • {item.category}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Quick Presets */}
            <Text style={styles.sectionLabel}>
              {language === 'en' ? 'Quick Dose Presets' : 'Preset Dosis Cepat'}
            </Text>
            <View style={styles.presetRow}>
              {(['low', 'standard', 'high'] as const).map((type) => {
                const presetVal = item.presetDoses?.[type] || 1.0;
                const isSelected = dose === presetVal;
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setDoseInput(presetVal.toString())}
                    style={[styles.presetCard, isSelected && styles.presetCardActive]}
                  >
                    <Text style={[styles.presetType, isSelected && styles.presetTextActive]}>
                      {type.toUpperCase()}
                    </Text>
                    <Text style={[styles.presetValue, isSelected && styles.presetTextActive]}>
                      {presetVal} {item.unit}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Target Dose Input */}
            <View style={styles.inputGroup}>
              <View style={styles.inputHeader}>
                <Text style={styles.inputLabel}>
                  {language === 'en' ? 'Target Injection Dose' : 'Target Dosis Injeksi'}
                </Text>
                <Text style={styles.inputValueHighlight}>{dose} {item.unit}</Text>
              </View>
              <TextInput
                style={styles.numericInput}
                keyboardType="decimal-pad"
                inputMode="decimal"
                value={doseInput}
                onChangeText={(val) => setDoseInput(normalizeDecimalInput(val))}
              />
            </View>

            {/* BAC Water Input */}
            {!isLiquidMl && (
              <View style={styles.inputGroup}>
                <View style={styles.inputHeader}>
                  <Text style={styles.inputLabel}>
                    {language === 'en' ? 'Reconstitution Volume (BAC Water)' : 'Volume Pelarut (BAC Water)'}
                  </Text>
                  <Text style={styles.inputValueHighlightCyan}>{bacWater} mL</Text>
                </View>
                <TextInput
                  style={styles.numericInputCyan}
                  keyboardType="decimal-pad"
                  inputMode="decimal"
                  value={bacWaterInput}
                  onChangeText={(val) => setBacWaterInput(normalizeDecimalInput(val))}
                />
              </View>
            )}

            {/* Syringe Visualizer */}
            <SyringeVisualizer u100Units={u100Units} volMl={volMl} />

            {/* Precision Metrics Card */}
            <View style={styles.metricsBox}>
              <View style={styles.metricsHeader}>
                <Activity size={14} color="#bca9ef" />
                <Text style={styles.metricsTitle}>
                  {language === 'en' ? 'Precision Calculation Results' : 'Hasil Kalkulasi Presisi'}
                </Text>
              </View>
              <View style={styles.metricsGrid}>
                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>Volume</Text>
                  <Text style={styles.metricValue}>{volMl.toFixed(3)}</Text>
                  <Text style={styles.metricUnit}>mL</Text>
                </View>
                <View style={[styles.metricCol, styles.metricColHighlightEmerald]}>
                  <Text style={styles.metricLabelEmerald}>
                    {language === 'en' ? 'U-100 Syringe' : 'Spuit U-100'}
                  </Text>
                  <Text style={styles.metricValueEmerald}>{u100Units}</Text>
                  <Text style={styles.metricUnitEmerald}>IU</Text>
                </View>
                <View style={[styles.metricCol, styles.metricColHighlightCyan]}>
                  <Text style={styles.metricLabelCyan}>Dial Pen</Text>
                  <Text style={styles.metricValueCyan}>{dialClicks}</Text>
                  <Text style={styles.metricUnitCyan}>
                    {language === 'en' ? 'Clicks' : 'Klik'}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action Button */}
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Check size={16} color="#231716" />
            <Text style={styles.saveButtonText}>
              {language === 'en' ? 'Apply & Save Dose' : 'Terapkan & Simpan Dosis'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: '90%',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingVertical: 12,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetCard: {
    flex: 1,
    backgroundColor: COLORS.cardElevated,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  presetCardActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  presetType: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
  },
  presetValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#e2e8f0',
    fontFamily: 'Courier',
    marginTop: 2,
  },
  presetTextActive: {
    color: '#231716',
  },
  inputGroup: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  inputValueHighlight: {
    fontSize: 12,
    fontWeight: '800',
    color: '#bca9ef',
  },
  inputValueHighlightCyan: {
    fontSize: 12,
    fontWeight: '800',
    color: '#06b6d4',
  },
  numericInput: {
    backgroundColor: '#090d16',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bca9ef',
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
    paddingVertical: 8,
    fontFamily: 'Courier',
  },
  numericInputCyan: {
    backgroundColor: '#090d16',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#06b6d4',
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
    paddingVertical: 8,
    fontFamily: 'Courier',
  },
  metricsBox: {
    backgroundColor: '#090d16',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(188, 169, 239, 0.4)',
  },
  metricsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  metricsTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#bca9ef',
    textTransform: 'uppercase',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCol: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  metricColHighlightEmerald: {
    backgroundColor: 'rgba(188, 169, 239, 0.1)',
    borderColor: '#bca9ef',
  },
  metricColHighlightCyan: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderColor: '#06b6d4',
  },
  metricLabel: { fontSize: 8, color: '#64748b', fontWeight: '700' },
  metricLabelEmerald: { fontSize: 8, color: '#c2d3b6', fontWeight: '700' },
  metricLabelCyan: { fontSize: 8, color: '#38bdf8', fontWeight: '700' },
  metricValue: { fontSize: 13, fontWeight: '800', color: '#ffffff', fontFamily: 'Courier' },
  metricValueEmerald: { fontSize: 14, fontWeight: '900', color: '#c2d3b6', fontFamily: 'Courier' },
  metricValueCyan: { fontSize: 14, fontWeight: '900', color: '#38bdf8', fontFamily: 'Courier' },
  metricUnit: { fontSize: 8, color: '#475569' },
  metricUnitEmerald: { fontSize: 8, color: '#bca9ef' },
  metricUnitCyan: { fontSize: 8, color: '#06b6d4' },
  saveButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  saveButtonText: {
    color: '#231716',
    fontWeight: '800',
    fontSize: 13,
  },
});
