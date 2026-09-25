import React, { useState } from 'react';
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
import { X, Snowflake, FlaskConical, Droplet, ArrowRight, ArrowLeft, Check } from 'lucide-react-native';
import { FreezerItem } from '../../store/useBioStackStore';
import { normalizeDecimalInput, parseDecimal } from '../../utils/injectionCalculations';
import { FrostyFreezerBadge } from '../common/FrostyFreezerBadge';
import { CuteVialIllustration } from '../common/CuteVialIllustration';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../theme';
import { useLanguage } from '../../i18n/LanguageContext';

export interface TakeFromFreezerModalProps {
  visible: boolean;
  freezerStock: FreezerItem[];
  onClose: () => void;
  onReconstitute: (freezerId: string, bacWaterMl: number) => void;
  onTransferLiquid: (freezerId: string) => void;
}

export const TakeFromFreezerModal: React.FC<TakeFromFreezerModalProps> = ({
  visible,
  freezerStock = [],
  onClose,
  onReconstitute,
  onTransferLiquid,
}) => {
  const { language } = useLanguage();
  const [selectedItem, setSelectedItem] = useState<FreezerItem | null>(null);
  const [bacWaterInput, setBacWaterInput] = useState('2.0');

  const handleSelect = (item: FreezerItem) => {
    setSelectedItem(item);
    setBacWaterInput((item.defaultBacWater || 2.0).toString());
  };

  const handleConfirm = () => {
    if (!selectedItem) return;
    if (selectedItem.unit === 'mL') {
      onTransferLiquid(selectedItem.id);
    } else {
      const bac = parseDecimal(bacWaterInput) || 2.0;
      onReconstitute(selectedItem.id, bac);
    }
    setSelectedItem(null);
    onClose();
  };

  const parsedBac = parseDecimal(bacWaterInput) || 2.0;
  const resultingConc = selectedItem && parsedBac > 0 ? (selectedItem.vialSize / parsedBac).toFixed(2) : '0';

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
              <FrostyFreezerBadge size={36} />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.headerTitle}>
                  {language === 'en' ? 'Take Vial from Freezer' : 'Ambil Vial dari Freezer'}
                </Text>
                <Text style={styles.headerSubtitle}>
                  {language === 'en' ? 'Select frozen peptide to move to active fridge' : 'Pilih stok beku untuk dipindahkan ke kulkas aktif'}
                </Text>
              </View>
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
            {freezerStock.length === 0 ? (
              <View style={styles.emptyBox}>
                <Snowflake size={36} color="#64748b" />
                <Text style={styles.emptyTitle}>
                  {language === 'en' ? 'Freezer is Empty' : 'Stok Freezer Masih Kosong'}
                </Text>
                <Text style={styles.emptySub}>
                  {language === 'en'
                    ? 'Add peptide stock in the Freezer tab first.'
                    : 'Tambahkan stok peptida baru di tab Freezer terlebih dahulu.'}
                </Text>
              </View>
            ) : selectedItem ? (
              // Step 2: Konfirmasi Pelarutan untuk Item Terpilih
              <View>
                <TouchableOpacity
                  onPress={() => setSelectedItem(null)}
                  style={[styles.backBtn, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}
                >
                  <ArrowLeft size={14} color={COLORS.accent} />
                  <Text style={styles.backBtnText}>
                    {language === 'en' ? 'Choose another vial' : 'Pilih vial lainnya'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.selectedVialCard}>
                  <CuteVialIllustration
                    isPowder={selectedItem.unit !== 'mL'}
                    category={selectedItem.category}
                    size="md"
                    progress={100}
                  />
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.selectedName}>{selectedItem.name}</Text>
                    <Text style={styles.selectedMeta}>
                      {selectedItem.vialSize} {selectedItem.unit} • {selectedItem.category}
                    </Text>
                    <Text style={styles.selectedStock}>
                      {language === 'en' ? `Available in freezer: ${selectedItem.quantity} vials` : `Tersedia di freezer: ${selectedItem.quantity} vial`}
                    </Text>
                  </View>
                </View>

                {selectedItem.unit !== 'mL' ? (
                  <View style={styles.reconForm}>
                    <Text style={styles.reconFormTitle}>
                      {language === 'en' ? 'Reconstitution Setup (BAC Water)' : 'Pengaturan Pelarutan (BAC Water)'}
                    </Text>
                    <Text style={styles.reconFormDesc}>
                      {language === 'en'
                        ? 'Enter volume of bacteriostatic water to add into this vial:'
                        : 'Berapa mL air pelarut bakteriostatik yang akan dimasukkan ke vial:'}
                    </Text>

                    <View style={styles.bacInputRow}>
                      <TextInput
                        style={styles.bacInput}
                        keyboardType="decimal-pad"
                        inputMode="decimal"
                        value={bacWaterInput}
                        onChangeText={(v) => setBacWaterInput(normalizeDecimalInput(v))}
                        textAlign="center"
                      />
                      <Text style={styles.bacUnitTag}>mL</Text>
                    </View>

                    <View style={styles.previewBox}>
                      <Text style={styles.previewLabel}>
                        {language === 'en' ? 'Resulting Solution Concentration:' : 'Konsentrasi Larutan Jadi:'}
                      </Text>
                      <Text style={styles.previewVal}>
                        {resultingConc} {selectedItem.unit}/mL
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.liquidNoticeBox}>
                    <Droplet size={20} color={COLORS.cyan} />
                    <Text style={styles.liquidNoticeText}>
                      {language === 'en'
                        ? 'This is a liquid peptide. No reconstitution needed. It will be moved directly to active fridge.'
                        : 'Peptida cair siap pakai. Tidak memerlukan pelarutan dan langsung siap disuntikkan.'}
                    </Text>
                  </View>
                )}

                <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                  <FlaskConical size={18} color="#042f2e" />
                  <Text style={styles.confirmBtnText}>
                    {selectedItem.unit === 'mL'
                      ? (language === 'en' ? 'Move to Active Fridge' : 'Pindahkan ke Kulkas Aktif')
                      : (language === 'en' ? 'Reconstitute & Move to Fridge' : 'Larutkan & Masukkan ke Kulkas')}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Step 1: Daftar Pilihan Stok di Freezer
              <View>
                <Text style={styles.sectionLabel}>
                  {language === 'en' ? 'Select a peptide to reconstitute:' : 'Pilih peptida untuk dilarutkan:'}
                </Text>
                {freezerStock.map((vial) => (
                  <TouchableOpacity
                    key={vial.id}
                    onPress={() => handleSelect(vial)}
                    style={styles.vialItemCard}
                    activeOpacity={0.8}
                  >
                    <CuteVialIllustration
                      isPowder={vial.unit !== 'mL'}
                      category={vial.category}
                      size="sm"
                      progress={100}
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.vialItemName}>{vial.name}</Text>
                      <Text style={styles.vialItemMeta}>
                        {vial.vialSize} {vial.unit} • {vial.category}
                      </Text>
                      <Text style={styles.vialItemQuantity}>
                        {vial.quantity} {language === 'en' ? 'vials left' : 'vial tersisa'}
                      </Text>
                    </View>
                    <ArrowRight size={18} color={COLORS.cyan} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
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
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: SPACING.md,
  },
  vialItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  vialItemName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  vialItemMeta: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  vialItemQuantity: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.cyan,
    marginTop: 4,
  },
  backBtn: {
    marginBottom: SPACING.md,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.cyan,
  },
  selectedVialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(188, 169, 239, 0.08)',
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(188, 169, 239, 0.25)',
    marginBottom: SPACING.lg,
  },
  selectedName: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  selectedMeta: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  selectedStock: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.mint,
    marginTop: 4,
  },
  reconForm: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: SPACING.lg,
  },
  reconFormTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  reconFormDesc: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 12,
    lineHeight: 18,
  },
  bacInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  bacInput: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: RADIUS.md,
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.cyan,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(188, 169, 239, 0.35)',
  },
  bacUnitTag: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.cyan,
  },
  previewBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  previewLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  previewVal: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.mint,
    marginTop: 2,
  },
  liquidNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(188, 169, 239, 0.08)',
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(188, 169, 239, 0.25)',
    marginBottom: SPACING.lg,
  },
  liquidNoticeText: {
    flex: 1,
    fontSize: 13,
    color: '#bae6fd',
    lineHeight: 19,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: RADIUS.pill,
    ...SHADOWS.cardGlow,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#231716',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
});
