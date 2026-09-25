import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  Snowflake,
  Plus,
  Search,
  Trash2,
  FlaskConical,
  X,
  ArrowRight,
} from 'lucide-react-native';
import { useBioStackStore, FreezerItem } from '../store/useBioStackStore';
import { getPeptideAutofillData } from '../database/defaultPeptides';
import { useLanguage } from '../i18n/LanguageContext';
import { normalizeDecimalInput, parseDecimal } from '../utils/injectionCalculations';

export const FreezerScreen: React.FC = () => {
  const { language, t } = useLanguage();
  const {
    freezerStock,
    updateFreezerQuantity,
    removeFreezerItem,
    addFreezerItem,
    reconstituteToFridge,
    transferLiquidToFridge,
  } = useBioStackStore();

  const [searchQuery, setSearchQuery] = useState('');

  // =========================
  // MODAL TAMBAH PEPTIDA
  // =========================
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newVialSize, setNewVialSize] = useState('');
  const [newUnit, setNewUnit] = useState<'mg' | 'mcg' | 'mL'>('mg');
  const [newQuantity, setNewQuantity] = useState('');

  // =========================
  // FORM RESET + AUTO-FILL
  // =========================
  //
  // Form selalu dimulai kosong.
  // Jika nama peptide dikenali dari master database,
  // field template akan diisi otomatis tetapi tetap editable.
  // Peptide yang tidak dikenali tetap bisa diisi manual.
  // =========================
  const resetAddForm = () => {
    setNewName('');
    setNewCategory('');
    setNewDescription('');
    setNewVialSize('');
    setNewUnit('mg');
    setNewQuantity('');
  };

  const handleNewNameChange = (value: string) => {
    setNewName(value);

    const autofill = getPeptideAutofillData(value, language);

    if (!autofill) {
      // Nama tidak dikenali: jangan membawa data peptide sebelumnya.
      setNewCategory('');
      setNewDescription('');
      setNewVialSize('');
      setNewUnit('mg');
      return;
    }

    // Autofill hanya menjadi nilai awal. Semua field tetap editable.
    setNewCategory(autofill.category || '');
    setNewDescription(autofill.description || '');
    setNewVialSize(
      autofill.defaultVialSize?.toString() || ''
    );
    setNewUnit(autofill.vialUnit || 'mg');
  };

  const openAddModal = () => {
    resetAddForm();
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    resetAddForm();
  };

  // =========================
  // MODAL PELARUTAN
  // =========================
  const [selectedFreezerItem, setSelectedFreezerItem] =
    useState<FreezerItem | null>(null);
  const [isReconstituteModalOpen, setIsReconstituteModalOpen] =
    useState(false);
  const [bacWaterInput, setBacWaterInput] = useState('2.0');

  const stockList = freezerStock || [];

  const totalVials = stockList.reduce(
    (acc, curr) => acc + (curr.quantity || 0),
    0
  );

  const filteredStock = stockList.filter((item) => {
    const query = searchQuery.toLowerCase();

    return (
      item?.name?.toLowerCase().includes(query) ||
      item?.category?.toLowerCase().includes(query)
    );
  });

  // =========================
  // AKSI ITEM
  // =========================
  const handleActionOnItem = (item: FreezerItem) => {
    if (item.quantity <= 0) {
      Alert.alert(
        t('freezer.stockEmpty'),
        t('freezer.stockEmptyDescription', { name: item.name }) || `Stok ${item.name} di freezer sudah 0.`
      );
      return;
    }

    // Cairan mL langsung dipindahkan ke kulkas
    if (item.unit === 'mL') {
      Alert.alert(
        t('freezer.moveToFridge'),
        language === 'en'
          ? `${item.name} is a ready-to-use liquid compound (${item.vialSize} mL). Move 1 vial directly to active fridge without BAC Water reconstitution?`
          : `${item.name} adalah senyawa cairan siap pakai (${item.vialSize} mL). Pindahkan 1 vial langsung ke kulkas aktif tanpa pelarutan BAC Water?`,
        [
          {
            text: t('app.cancel'),
            style: 'cancel',
          },
          {
            text: t('freezer.moveToFridge'),
            onPress: () => {
              transferLiquidToFridge(item.id);

              Alert.alert(
                t('freezer.transferTitle'),
                t('freezer.transferSuccess', { name: item.name }) ||
                  (language === 'en'
                    ? `${item.name} successfully moved to active fridge.`
                    : `${item.name} berhasil dipindahkan ke kulkas aktif.`)
              );
            },
          },
        ]
      );

      return;
    }

    // Bubuk mg / mcg membuka modal pelarutan
    setSelectedFreezerItem(item);
    setBacWaterInput(
      (item.defaultBacWater || 2.0).toString()
    );
    setIsReconstituteModalOpen(true);
  };

  // =========================
  // KONFIRMASI PELARUTAN
  // =========================
  const handleConfirmReconstitute = () => {
    if (!selectedFreezerItem) return;

    const bac = parseDecimal(bacWaterInput) || 2.0;

    reconstituteToFridge(
      selectedFreezerItem.id,
      bac
    );

    setIsReconstituteModalOpen(false);

    Alert.alert(
      t('freezer.reconstitutionSuccess'),
      t('freezer.reconstitutionSuccessDescription', { name: selectedFreezerItem.name }) ||
        (language === 'en'
          ? `1 vial of ${selectedFreezerItem.name} successfully reconstituted with ${bac} mL BAC Water and added to active fridge.`
          : `1 vial ${selectedFreezerItem.name} berhasil dilarutkan dengan ${bac} mL BAC Water dan dimasukkan ke kulkas aktif.`)
    );
  };

  // =========================
  // TAMBAH PEPTIDA BARU
  // =========================
  const handleAddNewPeptide = () => {
    if (!newName.trim()) {
      Alert.alert(
        t('app.confirm'),
        language === 'en' ? 'Please enter peptide name.' : 'Harap masukkan nama peptida.'
      );
      return;
    }

    if (!newVialSize.trim()) {
      Alert.alert(
        t('app.confirm'),
        language === 'en' ? 'Please enter vial size.' : 'Harap masukkan ukuran vial.'
      );
      return;
    }

    if (!newQuantity.trim()) {
      Alert.alert(
        t('app.confirm'),
        language === 'en' ? 'Please enter stock quantity.' : 'Harap masukkan jumlah stok.'
      );
      return;
    }

    const autofill = getPeptideAutofillData(newName, language);

    const newItem = {
      id: `pep-${Date.now()}`,
      name: newName.trim(),
      category:
        newCategory.trim() || 'General Peptide',
      description:
        newDescription.trim(),
      vialSize:
        parseDecimal(newVialSize),
      unit: newUnit,
      quantity:
        parseInt(newQuantity, 10),
      // Field protokol: gunakan autofill jika dikenali, atau nilai bawaan yang aman
      defaultBacWater:
        newUnit === 'mL'
          ? 0
          : autofill?.defaultBacWater || 2.0,
      targetDose:
        autofill?.targetDose || (newUnit === 'mL' ? 0.5 : 1.0),
      frequency:
        autofill?.frequency || 'weekly',
      frequencyLabel:
        autofill?.frequencyLabel ||
        (language === 'en' ? 'Weekly' : 'Mingguan (Weekly)'),
      halfLifeDays:
        autofill?.halfLifeDays || 1.0,
      maxFridgeDays:
        autofill?.maxFridgeDays || 28,
      activeDays:
        autofill?.activeDays || ['Sen'],
      injectionTime:
        autofill?.injectionTime || '08:00',
    } as FreezerItem;

    addFreezerItem(newItem);

    setIsAddModalOpen(false);

    // Reset form sepenuhnya setelah berhasil disimpan.
    resetAddForm();

    Alert.alert(
      language === 'en' ? 'Success' : 'Sukses',
      language === 'en'
        ? `${newItem.name} successfully added to Freezer.`
        : `${newItem.name} berhasil ditambahkan ke Freezer.`
    );
  };

  return (
    <View style={styles.container}>

      {/* =====================================
          BANNER FREEZER
      ===================================== */}
      <View style={styles.bannerCard}>
        <View style={styles.bannerIconBox}>
          <Snowflake
            size={21}
            color="#38bdf8"
          />
        </View>

        <View style={styles.bannerContent}>
          <Text style={styles.bannerTitle}>
            {t('freezer.title')}
          </Text>

          <Text style={styles.bannerSubtitle}>
            {t('freezer.stockSummary', { compounds: stockList.length, vials: totalVials })} • {t('freezer.protectedStock')}
          </Text>
        </View>
      </View>

      {/* =====================================
          TAMBAH PEPTIDA
      ===================================== */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={openAddModal}
        style={styles.addMainBtn}
      >
        <Plus
          size={18}
          color="#022c22"
        />

        <Text style={styles.addMainBtnText}>
          {t('freezer.addPeptide')}
        </Text>
      </TouchableOpacity>

      {/* =====================================
          SEARCH
      ===================================== */}
      <View style={styles.searchBar}>
        <Search
          size={18}
          color="#64748b"
        />

        <TextInput
          style={styles.searchInput}
          placeholder={t('freezer.searchPlaceholder')}
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {searchQuery.length > 0 && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setSearchQuery('')}
          >
            <X
              size={17}
              color="#64748b"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* =====================================
          DAFTAR FREEZER
      ===================================== */}
      <FlatList
        data={filteredStock}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"

        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Snowflake
              size={34}
              color="#64748b"
            />

            <Text style={styles.emptyTitle}>
              {language === 'en' ? 'No Peptides Found' : 'Tidak Ditemukan Peptida'}
            </Text>

            <Text style={styles.emptySub}>
              {language === 'en'
                ? 'No freezer stock matches your search.'
                : 'Tidak ada stok freezer yang cocok dengan pencarian.'}
            </Text>
          </View>
        }

        renderItem={({ item }) => {
          const isLiquid = item.unit === 'mL';

          return (
            <View style={styles.freezerCard}>

              {/* =================================
                  HEADER CARD
              ================================= */}
              <View style={styles.cardHeader}>
                <View style={styles.titleRow}>
                  <Text
                    style={styles.peptideName}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>

                  <View style={styles.sizeBadge}>
                    <Text style={styles.sizeBadgeText}>
                      {item.vialSize} {item.unit}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    const confirmMsg = language === 'en'
                      ? `Delete ${item.name} from freezer?`
                      : `Hapus ${item.name} dari freezer?`;

                    if (Platform.OS === 'web') {
                      // window.confirm works correctly on web; Alert.alert 2-button does not
                      // eslint-disable-next-line no-alert
                      if (window.confirm(confirmMsg)) removeFreezerItem(item.id);
                      return;
                    }

                    Alert.alert(
                      language === 'en' ? 'Delete Compound' : 'Hapus Senyawa',
                      confirmMsg,
                      [
                        {
                          text: t('app.cancel'),
                          style: 'cancel',
                        },
                        {
                          text: language === 'en' ? 'Delete' : 'Hapus',
                          style: 'destructive',
                          onPress: () =>
                            removeFreezerItem(item.id),
                        },
                      ]
                    );
                  }}
                  style={styles.deleteBtn}
                >
                  <Trash2
                    size={18}
                    color="#64748b"
                  />
                </TouchableOpacity>
              </View>

              {/* =================================
                  CATEGORY
              ================================= */}
              <Text style={styles.categoryText}>
                {item.category}
              </Text>

              {/* =================================
                  ACTION ROW
              ================================= */}
              <View style={styles.actionRow}>

                {/* QUANTITY */}
                <View style={styles.qtyControl}>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() =>
                      updateFreezerQuantity(
                        item.id,
                        Math.max(
                          0,
                          item.quantity - 1
                        )
                      )
                    }
                    style={styles.qtyBtn}
                  >
                    <Text style={styles.qtyBtnText}>
                      −
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.qtyValueText}>
                    {item.quantity}{' '}
                    <Text style={styles.qtyUnitText}>
                      {t('freezer.vialUnitLabel')}
                    </Text>
                  </Text>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() =>
                      updateFreezerQuantity(
                        item.id,
                        item.quantity + 1
                      )
                    }
                    style={styles.qtyBtn}
                  >
                    <Text style={styles.qtyBtnText}>
                      +
                    </Text>
                  </TouchableOpacity>

                </View>

                {/* ACTION */}
                {isLiquid ? (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() =>
                      handleActionOnItem(item)
                    }
                    style={styles.transferActionBtn}
                  >
                    <ArrowRight
                      size={16}
                      color="#022c22"
                    />

                    <Text
                      style={styles.reconstituteBtnText}
                      numberOfLines={1}
                    >
                      {t('freezer.moveToFridge')}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() =>
                      handleActionOnItem(item)
                    }
                    style={styles.reconstituteBtn}
                  >
                    <FlaskConical
                      size={16}
                      color="#022c22"
                    />

                    <Text
                      style={styles.reconstituteBtnText}
                      numberOfLines={1}
                    >
                      {t('freezer.dissolveToFridge')}
                    </Text>
                  </TouchableOpacity>
                )}

              </View>
            </View>
          );
        }}
      />

      {/* =====================================
          MODAL PELARUTAN
      ===================================== */}
      <Modal
        visible={isReconstituteModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() =>
          setIsReconstituteModalOpen(false)
        }
      >
        <KeyboardAvoidingView
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
          style={styles.modalOverlay}
        >
          <View style={styles.modalBox}>

            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <FlaskConical
                  size={19}
                  color="#10b981"
                />

                <Text style={styles.modalHeading}>
                  {t('freezer.reconstitutionTitle')}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  setIsReconstituteModalOpen(false)
                }
              >
                <X
                  size={20}
                  color="#94a3b8"
                />
              </TouchableOpacity>
            </View>

            {selectedFreezerItem && (
              <ScrollView
                contentContainerStyle={
                  styles.reconstituteBody
                }
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >

                <Text style={styles.reconPeptideName}>
                  {selectedFreezerItem.name} (
                  {selectedFreezerItem.vialSize}{' '}
                  {selectedFreezerItem.unit})
                </Text>

                <Text style={styles.reconPeptideDesc}>
                  {t('freezer.reconstitutionDescription')}
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {language === 'en' ? 'BAC Water Volume (mL):' : 'Volume BAC Water (mL):'}
                  </Text>

                  <TextInput
                    style={styles.textInput}
                    keyboardType="decimal-pad"
                    inputMode="decimal"
                    value={bacWaterInput}
                    onChangeText={(v) => setBacWaterInput(normalizeDecimalInput(v))}
                    placeholder={language === 'en' ? 'Example: 2.0' : 'Contoh: 2.0'}
                    placeholderTextColor="#64748b"
                  />
                </View>

                {parseDecimal(bacWaterInput) > 0 && (
                  <View style={styles.reconPreviewBox}>

                    <Text style={styles.reconPreviewTitle}>
                      {language === 'en' ? 'Resulting Solution Concentration:' : 'Hasil Konsentrasi Larutan:'}
                    </Text>

                    <Text style={styles.reconPreviewVal}>
                      {(
                        selectedFreezerItem.vialSize /
                        parseDecimal(bacWaterInput)
                      ).toFixed(2)}{' '}
                      {selectedFreezerItem.unit}/mL
                    </Text>

                    <Text style={styles.reconPreviewSub}>
                      {language === 'en'
                        ? `Target dose ${selectedFreezerItem.targetDose} ${selectedFreezerItem.unit} = ${((selectedFreezerItem.targetDose / (selectedFreezerItem.vialSize / parseDecimal(bacWaterInput))) * 100).toFixed(0)} IU on U-100 syringe.`
                        : `Target dosis ${selectedFreezerItem.targetDose} ${selectedFreezerItem.unit} = ${((selectedFreezerItem.targetDose / (selectedFreezerItem.vialSize / parseDecimal(bacWaterInput))) * 100).toFixed(0)} IU pada spuit U-100.`}
                    </Text>

                  </View>
                )}

                <View style={styles.modalActionsRow}>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() =>
                      setIsReconstituteModalOpen(false)
                    }
                    style={styles.modalCancelBtn}
                  >
                    <Text style={styles.modalCancelBtnText}>
                      {t('app.cancel')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleConfirmReconstitute}
                    style={styles.modalSaveBtn}
                  >
                    <Text style={styles.modalSaveBtnText}>
                      {t('freezer.dissolveToFridge')}
                    </Text>
                  </TouchableOpacity>

                </View>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* =====================================
          MODAL TAMBAH PEPTIDA
      ===================================== */}
      <Modal
        visible={isAddModalOpen}
        animationType="slide"
        transparent
        onRequestClose={closeAddModal}
      >
        <KeyboardAvoidingView
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
          style={styles.modalOverlay}
        >
          <View style={styles.modalLargeBox}>

            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Plus
                  size={19}
                  color="#10b981"
                />

                <Text style={styles.modalHeading}>
                  {t('freezer.addModalTitle')}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={closeAddModal}
              >
                <X
                  size={20}
                  color="#94a3b8"
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={
                styles.addModalBody
              }
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {t('freezer.peptideName')}:
                </Text>

                <TextInput
                  style={styles.textInput}
                  placeholder={t('freezer.namePlaceholder')}
                  placeholderTextColor="#64748b"
                  value={newName}
                  onChangeText={handleNewNameChange}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {t('freezer.categoryShort')}:
                </Text>

                <TextInput
                  style={styles.textInput}
                  placeholder={t('freezer.autofillPlaceholder')}
                  placeholderTextColor="#64748b"
                  value={newCategory}
                  onChangeText={setNewCategory}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {t('freezer.description')}:
                </Text>

                <TextInput
                  style={[
                    styles.textInput,
                    styles.multilineTextInput,
                  ]}
                  placeholder={t('freezer.autofillPlaceholder')}
                  placeholderTextColor="#64748b"
                  value={newDescription}
                  onChangeText={setNewDescription}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              {/* UKURAN + SATUAN */}
              <View style={styles.twoColRow}>

                <View style={styles.colBox}>
                  <Text style={styles.inputLabel}>
                    {t('freezer.vialSize')}:
                  </Text>

                  <TextInput
                    style={styles.textInput}
                    keyboardType="decimal-pad"
                    inputMode="decimal"
                    value={newVialSize}
                    onChangeText={(v) => setNewVialSize(normalizeDecimalInput(v))}
                  />
                </View>

                <View style={styles.colBox}>
                  <Text style={styles.inputLabel}>
                    {t('freezer.unit')}:
                  </Text>

                  <View style={styles.unitSelectorRow}>
                    {(
                      ['mg', 'mcg', 'mL'] as (
                        | 'mg'
                        | 'mcg'
                        | 'mL'
                      )[]
                    ).map((u) => (
                      <TouchableOpacity
                        key={u}
                        activeOpacity={0.8}
                        onPress={() =>
                          setNewUnit(u)
                        }
                        style={[
                          styles.unitChip,
                          newUnit === u &&
                            styles.unitChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.unitChipText,
                            newUnit === u &&
                              styles.unitChipTextActive,
                          ]}
                        >
                          {u}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

              </View>

              {/* JUMLAH STOK */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {t('freezer.quantity')}:
                </Text>

                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={newQuantity}
                  onChangeText={setNewQuantity}
                />
              </View>

              <View style={styles.modalActionsRow}>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={closeAddModal}
                  style={styles.modalCancelBtn}
                >
                  <Text style={styles.modalCancelBtnText}>
                    {t('app.cancel')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleAddNewPeptide}
                  style={styles.modalSaveBtn}
                >
                  <Text style={styles.modalSaveBtnText}>
                    {t('freezer.saveToFreezer')}
                  </Text>
                </TouchableOpacity>

              </View>

            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  // =====================================
  // BASE
  // =====================================
  container: {
    flex: 1,
    backgroundColor: '#030712',
    paddingHorizontal: 14,
    paddingTop: 10,
  },

  // =====================================
  // BANNER
  // =====================================
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 11,
    marginBottom: 10,
  },

  bannerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: 'rgba(56, 189, 248, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  bannerContent: {
    flex: 1,
  },

  bannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },

  bannerSubtitle: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 3,
  },

  // =====================================
  // ADD BUTTON
  // =====================================
  addMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    minHeight: 46,
    paddingHorizontal: 14,
    borderRadius: 13,
    marginBottom: 10,
  },

  addMainBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#022c22',
  },

  // =====================================
  // SEARCH
  // =====================================
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 11,
    paddingHorizontal: 13,
    minHeight: 44,
    gap: 9,
    marginBottom: 10,
  },

  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 12,
    paddingVertical: 0,
  },

  // =====================================
  // LIST
  // =====================================
  listContainer: {
    paddingBottom: 104,
    gap: 10,
  },

  emptyCard: {
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 15,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 9,
    marginTop: 20,
  },

  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },

  emptySub: {
    fontSize: 10,
    lineHeight: 15,
    color: '#64748b',
    textAlign: 'center',
  },

  // =====================================
  // FREEZER CARD
  // =====================================
  freezerCard: {
    backgroundColor: '#090d16',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 11,
    paddingVertical: 9,
    gap: 5,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 24,
  },

  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 5,
  },

  peptideName: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },

  sizeBadge: {
    backgroundColor: '#111827',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },

  sizeBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#94a3b8',
  },

  deleteBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },

  categoryText: {
    fontSize: 9,
    lineHeight: 12,
    color: '#64748b',
  },

  // =====================================
  // ACTION ROW
  // =====================================
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 1,
  },

  // =====================================
  // QUANTITY
  // =====================================
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 112,
    height: 34,
    backgroundColor: '#030712',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 2,
  },

  qtyBtn: {
    width: 31,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
  },

  qtyBtnText: {
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '800',
    color: '#94a3b8',
  },

  qtyValueText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },

  qtyUnitText: {
    fontSize: 8,
    fontWeight: '400',
    color: '#64748b',
  },

  // =====================================
  // ACTION BUTTON
  // =====================================
  reconstituteBtn: {
    flex: 1,
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    borderRadius: 8,
  },

  transferActionBtn: {
    flex: 1,
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#38bdf8',
    paddingHorizontal: 8,
    borderRadius: 8,
  },

  reconstituteBtnText: {
    flexShrink: 1,
    fontSize: 9,
    fontWeight: '800',
    color: '#022c22',
  },

  // =====================================
  // MODAL
  // =====================================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },

  modalBox: {
    backgroundColor: '#090d16',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
    maxHeight: '85%',
  },

  modalLargeBox: {
    backgroundColor: '#090d16',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#1e293b',
    maxHeight: '88%',
    padding: 16,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#1e293b',
    paddingBottom: 13,
  },

  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },

  modalHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },

  reconstituteBody: {
    paddingTop: 13,
    gap: 11,
  },

  addModalBody: {
    paddingTop: 13,
    gap: 11,
    paddingBottom: 4,
  },

  reconPeptideName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#38bdf8',
  },

  reconPeptideDesc: {
    fontSize: 10,
    lineHeight: 15,
    color: '#94a3b8',
  },

  inputGroup: {
    gap: 5,
  },

  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#cbd5e1',
  },

  textInput: {
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 9,
    minHeight: 42,
    paddingHorizontal: 11,
    paddingVertical: 9,
    color: '#ffffff',
    fontSize: 12,
  },

  multilineTextInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },

  twoColRow: {
    flexDirection: 'row',
    gap: 10,
  },

  colBox: {
    flex: 1,
    gap: 5,
  },

  threeColRow: {
    flexDirection: 'row',
    gap: 7,
  },

  unitSelectorRow: {
    flexDirection: 'row',
    gap: 5,
  },

  unitChip: {
    flex: 1,
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1e293b',
    minHeight: 42,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  unitChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderColor: '#10b981',
  },

  unitChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },

  unitChipTextActive: {
    color: '#10b981',
  },

  // =====================================
  // RECON PREVIEW
  // =====================================
  reconPreviewBox: {
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.30)',
    borderRadius: 11,
    padding: 11,
    gap: 3,
  },

  reconPreviewTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10b981',
  },

  reconPreviewVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },

  reconPreviewSub: {
    fontSize: 9,
    lineHeight: 14,
    color: '#64748b',
  },

  // =====================================
  // MODAL ACTIONS
  // =====================================
  modalActionsRow: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 7,
  },

  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1e293b',
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalCancelBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },

  modalSaveBtn: {
    flex: 2,
    backgroundColor: '#10b981',
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalSaveBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#022c22',
  },
});
