import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
} from 'react-native';
import { Plus, Snowflake, FlaskConical, Sparkles } from 'lucide-react-native';
import { useBioStackStore, InventoryItem, FreezerItem } from '../store/useBioStackStore';
import { exportToAppleCalendar } from '../utils/calendarHelper';
import { calculateInjectionMetrics, getLiquidStatus } from '../utils/injectionCalculations';
import { getTrackerSuggestedSite, getSiteCode } from '../utils/rotationUtils';
import { InventoryCard } from '../components/inventory/InventoryCard';
import { EditDoseModal } from '../components/inventory/EditDoseModal';
import { ScheduleModal } from '../components/inventory/ScheduleModal';
import { TakeFromFreezerModal } from '../components/inventory/TakeFromFreezerModal';
import { CuteVialIllustration } from '../components/common/CuteVialIllustration';
import { FrostyFreezerBadge } from '../components/common/FrostyFreezerBadge';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';

export const InventoryScreen: React.FC = () => {
  const { language, t } = useLanguage();
  const {
    inventory,
    freezerStock,
    currentSite,
    recordInjection,
    removeInventoryItem,
    updateInventoryItem,
    reconstituteToFridge,
    transferLiquidToFridge,
    setSchedulePaused,
  } = useBioStackStore();

  const injectionHistory = useBioStackStore(
    (state) => state.injectionHistory || [],
  );

  const [lifecycleFilter, setLifecycleFilter] = useState<'active' | 'empty'>('active');
  const [isTakeFreezerModalOpen, setIsTakeFreezerModalOpen] = useState(false);
  const [isEditDoseModalOpen, setIsEditDoseModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleItem, setScheduleItem] = useState<InventoryItem | null>(null);

  // Filter daftar vial aktif vs kosong
  const safeInventory = Array.isArray(inventory) ? inventory : [];
  const activeList = safeInventory.filter((item) => {
    const liquid = getLiquidStatus(item);
    return (item.lifecycleStatus || (liquid.currentVol <= 0 ? 'empty' : 'active')) === 'active';
  });

  const emptyList = safeInventory.filter((item) => {
    const liquid = getLiquidStatus(item);
    return (item.lifecycleStatus || (liquid.currentVol <= 0 ? 'empty' : 'active')) === 'empty';
  });

  const displayedList = lifecycleFilter === 'active' ? activeList : emptyList;

  // Handler Quick Log Injeksi
  const handleQuickLog = (item: InventoryItem) => {
    const metrics = calculateInjectionMetrics(item);
    if (!metrics.valid || metrics.volumeMlNumber <= 0) {
      Alert.alert(
        language === 'en' ? 'Calculation Error' : 'Kesalahan Perhitungan',
        language === 'en' ? 'Dose or BAC water value is invalid.' : 'Nilai dosis atau BAC water belum valid.'
      );
      return;
    }

    const liquid = getLiquidStatus(item);
    if (liquid.currentVol < metrics.volumeMlNumber) {
      Alert.alert(
        language === 'en' ? 'Liquid Depleted' : 'Cairan Tidak Cukup',
        language === 'en'
          ? 'Remaining liquid is insufficient for this dose. Time to reconstitute a new vial!'
          : 'Sisa cairan dalam vial tidak mencukupi untuk dosis ini. Waktunya melarutkan vial baru!'
      );
      return;
    }

    const now = new Date();
    const siteCode = getSiteCode(currentSite);

    recordInjection(
      item.id,
      {
        id: `inj-${Date.now()}`,
        peptideName: item.name,
        dose: metrics.dose,
        unit: metrics.doseUnit,
        volumeMl: metrics.volumeMl,
        siteId: siteCode,
        timestamp: now.toISOString(),
        inventoryId: item.id,
        recordedAtLocal: now.toLocaleString(),
        dateStr: now.toISOString().split('T')[0],
        timeStr: now.toTimeString().slice(0, 5),
      },
      metrics.volumeMlNumber
    );

    const successMsg = language === 'en'
      ? `${item.name} dose logged (${metrics.volumeMl} mL • ${metrics.iu} IU). Remaining volume updated!`
      : `Dosis ${item.name} berhasil dicatat (${metrics.volumeMl} mL • ${metrics.iu} IU). Sisa cairan diperbarui!`;

    Alert.alert(
      language === 'en' ? 'Dose Recorded! 🎉' : 'Injeksi Berhasil Dicatat! 🎉',
      successMsg
    );
  };

  // Handler Pause / Resume
  const handleTogglePause = (id: string, currentlyPaused: boolean) => {
    const title = currentlyPaused
      ? (language === 'en' ? 'Resume Schedule' : 'Lanjutkan Jadwal')
      : (language === 'en' ? 'Pause Schedule' : 'Jeda Jadwal');
    const msg = currentlyPaused
      ? (language === 'en' ? 'Resume schedule for this peptide?' : 'Lanjutkan kembali jadwal pengingat peptida ini?')
      : (language === 'en' ? 'Pause schedule temporarily?' : 'Jeda sementara jadwal pengingat peptida ini?');

    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (window.confirm(`${title}\n\n${msg}`)) {
        setSchedulePaused(id, !currentlyPaused);
      }
      return;
    }

    Alert.alert(title, msg, [
      { text: language === 'en' ? 'Cancel' : 'Batal', style: 'cancel' },
      { text: currentlyPaused ? 'Resume' : 'Pause', onPress: () => setSchedulePaused(id, !currentlyPaused) },
    ]);
  };

  // Handler Hapus Vial
  const handleRemoveItem = (id: string, name: string) => {
    const title = language === 'en' ? 'Discard Vial' : 'Buang / Hapus Vial';
    const msg = language === 'en'
      ? `Remove ${name} from your active fridge?`
      : `Hapus vial ${name} dari kulkas aktif Anda?`;

    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (window.confirm(`${title}\n\n${msg}`)) {
        removeInventoryItem(id);
      }
      return;
    }

    Alert.alert(title, msg, [
      { text: language === 'en' ? 'Cancel' : 'Batal', style: 'cancel' },
      { text: language === 'en' ? 'Delete' : 'Hapus', style: 'destructive', onPress: () => removeInventoryItem(id) },
    ]);
  };

  // Handler Export Kalender
  const handleSyncCalendar = (item: InventoryItem) => {
    exportToAppleCalendar({
      peptideName: item.name,
      targetDose: item.targetDose,
      unit: item.unit,
      activeDays: item.activeDays || ['Sen'],
      injectionTime: item.injectionTime || '08:00',
      frequencyLabel: item.frequencyLabel || 'Weekly',
    });
  };

  return (
    <View style={styles.screen}>
      {/* 1. HEADER ROW: TABS AKTIF/KOSONG & TOMBOL AMBIL DARI FREEZER */}
      <View style={styles.topControlBar}>
        {/* Toggle Tab Filter: Aktif vs Habis */}
        <View style={styles.filterPillsGroup}>
          <TouchableOpacity
            style={[styles.filterPill, lifecycleFilter === 'active' && styles.filterPillActive]}
            onPress={() => setLifecycleFilter('active')}
          >
            <Text style={[styles.filterPillText, lifecycleFilter === 'active' && styles.filterPillTextActive]}>
              {language === 'en' ? 'Active' : 'Aktif'} ({activeList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, lifecycleFilter === 'empty' && styles.filterPillActive]}
            onPress={() => setLifecycleFilter('empty')}
          >
            <Text style={[styles.filterPillText, lifecycleFilter === 'empty' && styles.filterPillTextActive]}>
              {language === 'en' ? 'Empty' : 'Habis'} ({emptyList.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tombol Ambil Vial dari Freezer */}
        <TouchableOpacity
          style={styles.takeFreezerBtn}
          onPress={() => setIsTakeFreezerModalOpen(true)}
          activeOpacity={0.85}
        >
          <Snowflake size={15} color="#042f2e" />
          <Text style={styles.takeFreezerBtnText}>
            {language === 'en' ? 'Take Vial' : 'Ambil Vial'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 2. DAFTAR VIAL AKTIF ATAU KOSONG */}
      <FlatList
        data={displayedList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <CuteVialIllustration size="lg" progress={0} />
            <Text style={styles.emptyTitle}>
              {lifecycleFilter === 'empty'
                ? (language === 'en' ? 'No Empty Vials Yet' : 'Belum Ada Vial Kosong')
                : (language === 'en' ? 'Fridge is Empty! 🧪' : 'Kulkas Masih Kosong! 🧪')}
            </Text>
            <Text style={styles.emptySubtitle}>
              {lifecycleFilter === 'empty'
                ? (language === 'en' ? 'All active vials still contain liquid.' : 'Semua vial di kulkas masih memiliki cairan.')
                : (language === 'en' ? 'Tap "Take Vial" above to reconstitute peptide from freezer.' : 'Tekan tombol "Ambil Vial" di atas untuk melarutkan peptida dari freezer.')}
            </Text>

            {lifecycleFilter === 'active' && (
              <TouchableOpacity
                style={styles.emptyTakeBtn}
                onPress={() => setIsTakeFreezerModalOpen(true)}
              >
                <Snowflake size={16} color="#042f2e" />
                <Text style={styles.emptyTakeBtnText}>
                  {language === 'en' ? 'Take from Freezer' : 'Ambil dari Freezer'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <InventoryCard
            item={item}
            injectionHistory={injectionHistory}
            onOpenEditDose={(selected) => {
              setEditingItem(selected);
              setIsEditDoseModalOpen(true);
            }}
            onOpenSchedule={(selected) => {
              setScheduleItem(selected);
              setIsScheduleModalOpen(true);
            }}
            onQuickLog={handleQuickLog}
            onTogglePause={handleTogglePause}
            onRemoveItem={handleRemoveItem}
            onSyncCalendar={handleSyncCalendar}
          />
        )}
      />

      {/* 3. MODALS MODULAR */}
      {/* Modal Edit Dosis */}
      <EditDoseModal
        visible={isEditDoseModalOpen}
        item={editingItem}
        onClose={() => setIsEditDoseModalOpen(false)}
        onSave={(id, updates) => updateInventoryItem(id, updates)}
      />

      {/* Modal Jadwal & Siklus */}
      <ScheduleModal
        visible={isScheduleModalOpen}
        item={scheduleItem}
        onClose={() => setIsScheduleModalOpen(false)}
        onSave={(id, updates) => updateInventoryItem(id, updates)}
      />

      {/* Modal Ambil Vial dari Freezer */}
      <TakeFromFreezerModal
        visible={isTakeFreezerModalOpen}
        freezerStock={freezerStock || []}
        onClose={() => setIsTakeFreezerModalOpen(false)}
        onReconstitute={(freezerId, bac) => reconstituteToFridge(freezerId, bac)}
        onTransferLiquid={(freezerId) => transferLiquidToFridge(freezerId)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  topControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  filterPillsGroup: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: RADIUS.pill,
    padding: 3,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: RADIUS.pill,
  },
  filterPillActive: {
    backgroundColor: COLORS.cardElevated,
    ...SHADOWS.card,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },
  filterPillTextActive: {
    color: COLORS.mint,
  },
  takeFreezerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.mint,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: RADIUS.pill,
    ...SHADOWS.cardGlow,
  },
  takeFreezerBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#022c22',
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: 80,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 18,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  emptyTakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.mint,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: RADIUS.pill,
    marginTop: 22,
    ...SHADOWS.cardGlow,
  },
  emptyTakeBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#022c22',
  },
});
