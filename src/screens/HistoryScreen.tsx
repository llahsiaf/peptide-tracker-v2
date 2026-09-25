import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
  Platform,
} from 'react-native';
import {
  History,
  Trash2,
  Download,
  Calendar,
  Syringe,
  MapPin,
  Activity,
  TrendingUp,
  FlaskConical,
  Clock,
} from 'lucide-react-native';
import { useBioStackStore } from '../store/useBioStackStore';
import { getVialJourneys, getPeptideUsageStats } from '../utils/analyticsUtils';
import { useLanguage } from '../i18n/LanguageContext';
import { CuteVialIllustration } from '../components/common/CuteVialIllustration';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme';

// Pemetaan Nama Titik Anatomi Indonesia
const SITE_LABEL_MAP: Record<string, string> = {
  KA: 'Perut Kanan Atas',
  KiA: 'Perut Kiri Atas',
  KB: 'Perut Kanan Bawah',
  KiB: 'Perut Kiri Bawah',
  PKi: 'Paha Kiri Luar',
  PKn: 'Paha Kanan Luar',
  LKi: 'Lengan Kiri',
  LKn: 'Lengan Kanan',
  BKi: 'Bokong Kiri',
  BKn: 'Bokong Kanan',
  // Backward compatibility untuk log lama
  TR: 'Perut Kanan Atas',
  TL: 'Perut Kiri Atas',
  BR: 'Perut Kanan Bawah',
  BL: 'Perut Kiri Bawah',
  LT: 'Paha Kiri Luar',
  RT: 'Paha Kanan Luar',
  LA: 'Lengan Kiri',
  RA: 'Lengan Kanan',
  LG: 'Bokong Kiri',
  RG: 'Bokong Kanan',
};

const SITE_LABEL_MAP_EN: Record<string, string> = {
  KA: 'Right Upper Abdomen',
  KiA: 'Left Upper Abdomen',
  KB: 'Right Lower Abdomen',
  KiB: 'Left Lower Abdomen',
  PKi: 'Left Outer Thigh',
  PKn: 'Right Outer Thigh',
  LKi: 'Left Arm',
  LKn: 'Right Arm',
  BKi: 'Left Glute',
  BKn: 'Right Glute',
  TR: 'Right Upper Abdomen',
  TL: 'Left Upper Abdomen',
  BR: 'Right Lower Abdomen',
  BL: 'Left Lower Abdomen',
  LT: 'Left Outer Thigh',
  RT: 'Right Outer Thigh',
  LA: 'Left Arm',
  RA: 'Right Arm',
  LG: 'Left Glute',
  RG: 'Right Glute',
};

export const HistoryScreen: React.FC = () => {
  const { language, t } = useLanguage();
  const { injectionHistory, deleteInjectionLog, clearHistory } =
    useBioStackStore();
  const [filterPeptide, setFilterPeptide] =
    useState<string>('all');
  const [activeSegment, setActiveSegment] =
    useState<'logs' | 'vials'>('logs');

  // Proteksi data jika storage mengembalikan nilai null/undefined
  const safeHistory = Array.isArray(injectionHistory)
    ? injectionHistory.filter(Boolean)
    : [];

  // Ambil daftar nama peptida unik untuk filter
  const uniquePeptides = Array.from(
    new Set(
      safeHistory
        .map((item) => item?.peptideName)
        .filter(Boolean),
    ),
  );

  const filteredHistory =
    filterPeptide === 'all'
      ? safeHistory
      : safeHistory.filter(
          (item) =>
            item?.peptideName === filterPeptide,
        );

  const { inventory, freezerStock } =
    useBioStackStore();

  const vialJourneys = useMemo(
    () =>
      getVialJourneys(
        Array.isArray(inventory)
          ? inventory
          : [],
        safeHistory,
      ),
    [inventory, safeHistory],
  );

  const usageStats = useMemo(
    () =>
      getPeptideUsageStats(
        safeHistory,
      ),
    [safeHistory],
  );

  const mostUsed = usageStats[0];

  const totalVolumeLogged =
    usageStats.reduce(
      (sum, item) =>
        sum + item.totalVolumeMl,
      0,
    );

  const activeJourneyCount =
    vialJourneys.filter(
      (vial) =>
        vial.lifecycleStatus ===
        'active',
    ).length;

  const getPeptideCategory = (name: string) => {
    const invItem = (inventory || []).find(
      (i) => i.name?.toLowerCase() === (name || '').toLowerCase()
    );
    if (invItem?.category) return invItem.category;
    const freezerItem = (freezerStock || []).find(
      (f) => f.name?.toLowerCase() === (name || '').toLowerCase()
    );
    return freezerItem?.category || '';
  };

  const handleExportCSV =
    async () => {
      if (
        safeHistory.length === 0
      ) {
        Alert.alert(
          'Info',
          language === 'en'
            ? 'No history data to export.'
            : 'Belum ada data riwayat untuk diekspor.',
        );
        return;
      }

      try {
        const header =
          'ID,Peptide,Dose,Unit,Volume_mL,Injection_Site,Timestamp,Notes\n';

        const rows = safeHistory
          .map(
            (h) =>
              `"${h?.id || ''}","${h?.peptideName || ''}","${h?.dose || 0}","${h?.unit || ''}","${h?.volumeMl || ''}","${h?.siteId || ''}","${h?.timestamp || ''}","${(h?.notes || '').replace(/"/g, '""')}"`,
          )
          .join('\n');

        const csvData =
          header + rows;

        await Share.share({
          title:
            language === 'en'
              ? 'BioStack PRO Injection History'
              : 'Riwayat Injeksi BioStack PRO',
          message: csvData,
        });
      } catch (e) {
        Alert.alert(
          language === 'en' ? 'Error' : 'Gagal',
          language === 'en'
            ? 'Unable to export history.'
            : 'Tidak dapat mengekspor riwayat.',
        );
      }
    };

  const handleClearAll =
    () => {
      if (
        safeHistory.length === 0
      )
        return;

      const title = language === 'en' ? 'Clear All History' : 'Hapus Semua Riwayat';
      const msg = language === 'en'
        ? 'Are you sure you want to delete all injection history logs? This action cannot be undone.'
        : 'Apakah Anda yakin ingin menghapus seluruh log riwayat injeksi? Tindakan ini tidak dapat dibatalkan.';

      if (Platform.OS === 'web') {
        // eslint-disable-next-line no-alert
        if (window.confirm(`${title}\n\n${msg}`)) {
          clearHistory();
        }
        return;
      }

      Alert.alert(
        title,
        msg,
        [
          {
            text: t('app.cancel'),
            style: 'cancel',
          },
          {
            text: language === 'en' ? 'Clear All' : 'Hapus Semua',
            style: 'destructive',
            onPress: () =>
              clearHistory(),
          },
        ],
      );
    };

  const getSiteDisplay = (
    siteId: string,
  ) => {
    if (!siteId) return 'KA';

    const map = language === 'en' ? SITE_LABEL_MAP_EN : SITE_LABEL_MAP;
    return map[siteId]
      ? `${siteId} (${map[siteId]})`
      : siteId;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.scrollContent
      }
      showsVerticalScrollIndicator={
        false
      }
    >
      {/* Banner Ringkasan Riwayat */}
      <View
        style={styles.summaryCard}
      >
        <View
          style={
            styles.summaryIconBox
          }
        >
          <History
            size={20}
            color={COLORS.accent}
          />
        </View>

        <View
          style={
            styles.summaryContent
          }
        >
          <Text
            style={
              styles.summaryTitle
            }
          >
            {language === 'en'
              ? 'Peptide Administration Logs'
              : 'Log Administrasi Peptida'}
          </Text>

          <Text
            style={
              styles.summarySubtitle
            }
          >
            {language === 'en'
              ? `Total ${safeHistory.length} injection records`
              : `Total ${safeHistory.length} tindakan penyuntikan tercatat`}
          </Text>
        </View>

        <View
          style={
            styles.actionBtnRow
          }
        >
          <TouchableOpacity
            onPress={
              handleExportCSV
            }
            style={
              styles.iconActionBtn
            }
          >
            <Download
              size={16}
              color={COLORS.accent}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={
              handleClearAll
            }
            style={
              styles.iconActionBtn
            }
          >
            <Trash2
              size={16}
              color="#ef4444"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Segmented Switcher */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeSegment === 'logs' && styles.segmentBtnActive]}
          onPress={() => setActiveSegment('logs')}
          activeOpacity={0.8}
        >
          <Activity size={14} color={activeSegment === 'logs' ? '#231716' : COLORS.textMuted} />
          <Text style={[styles.segmentBtnText, activeSegment === 'logs' && styles.segmentBtnTextActive]}>
            {language === 'en' ? 'Injection Logs' : 'Riwayat Injeksi'} ({safeHistory.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeSegment === 'vials' && styles.segmentBtnActive]}
          onPress={() => setActiveSegment('vials')}
          activeOpacity={0.8}
        >
          <FlaskConical size={14} color={activeSegment === 'vials' ? '#231716' : COLORS.textMuted} />
          <Text style={[styles.segmentBtnText, activeSegment === 'vials' && styles.segmentBtnTextActive]}>
            {language === 'en' ? 'Vial Journeys' : 'Perjalanan Vial'} ({vialJourneys.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* VIEW: PERJALANAN VIAL & ANALITIK */}
      {activeSegment === 'vials' && (
        <>
          {/* Ringkasan Penggunaan */}
          <View
            style={styles.insightCard}
          >
        <View
          style={styles.insightHeader}
        >
          <View
            style={
              styles.sectionTitleWithIcon
            }
          >
            <TrendingUp
              size={14}
              color={COLORS.accent}
            />

            <Text
              style={
                styles.insightTitle
              }
            >
              {language === 'en'
                ? 'Usage Summary'
                : 'Ringkasan Penggunaan' /* Ringkasan Penggunaan */}
            </Text>
          </View>

          <Text
            style={
              styles.insightMeta
            }
          >
            {activeJourneyCount}{' '}
            {language === 'en'
              ? 'active vials'
              : 'vial aktif'}
          </Text>
        </View>

        <View
          style={styles.insightGrid}
        >
          <View
            style={
              styles.insightMetric
            }
          >
            <Text
              style={
                styles.insightValue
              }
            >
              {safeHistory.length}
            </Text>

            <Text
              style={
                styles.insightLabel
              }
            >
              {language === 'en'
                ? 'Total logs'
                : 'Total log'}
            </Text>
          </View>

          <View
            style={
              styles.insightMetric
            }
          >
            <Text
              style={
                styles.insightValue
              }
            >
              {totalVolumeLogged.toFixed(
                2,
              )}
            </Text>

            <Text
              style={
                styles.insightLabel
              }
            >
              {language === 'en'
                ? 'mL logged'
                : 'mL tercatat'}
            </Text>
          </View>

          <View
            style={
              styles.insightMetric
            }
          >
            <Text
              style={
                styles.insightValue
              }
            >
              {vialJourneys.length}
            </Text>

            <Text
              style={
                styles.insightLabel
              }
            >
              {language === 'en'
                ? 'Vials logged'
                : 'Vial tercatat'}
            </Text>
          </View>
        </View>

        {mostUsed ? (
          <View
            style={
              styles.mostUsedRow
            }
          >
            <FlaskConical
              size={12}
              color={COLORS.accent}
            />

            <Text
              style={
                styles.mostUsedText
              }
            >
              {language === 'en'
                ? 'Most frequent: '
                : 'Paling sering: '}
              <Text
                style={
                  styles.mostUsedStrong
                }
              >
                {mostUsed.name}
              </Text>{' '}
              · {mostUsed.count}{' '}
              {language === 'en'
                ? 'logs'
                : 'log'}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Perjalanan Vial */}
      <View
        style={styles.vialSection}
      >
        <View
          style={styles.insightHeader}
        >
          <View
            style={
              styles.sectionTitleWithIcon
            }
          >
            <FlaskConical
              size={14}
              color={COLORS.accent}
            />

            <Text
              style={
                styles.insightTitle
              }
            >
              {language === 'en'
                ? 'Vial Journey'
                : 'Perjalanan Vial' /* Perjalanan Vial */}
            </Text>
          </View>

          <Text
            style={
              styles.insightMeta
            }
          >
            usage tracker
          </Text>
        </View>

        {vialJourneys.length === 0 ? (
          <Text style={styles.vialEmpty}>
            {language === 'en'
              ? 'No vials recorded yet.'
              : 'Belum ada vial yang tercatat.'}
          </Text>
        ) : (
          vialJourneys.slice(0, 6).map((vial) => (
            <View key={vial.id} style={styles.vialJourneyCard}>
              <View style={styles.vialJourneyRow}>
                <View style={styles.vialJourneyIconWrap}>
                  <CuteVialIllustration
                    size="xs"
                    progress={Math.max(0, 100 - vial.usagePercent)}
                    category={getPeptideCategory(vial.name)}
                    showTicks={false}
                  />
                </View>

                <View style={{ flex: 1, gap: 6 }}>
                  <View style={styles.vialJourneyTop}>
                    <View style={styles.vialJourneyNameWrap}>
                      <Text style={styles.vialJourneyName} numberOfLines={1}>
                        {vial.name}
                      </Text>
                      <Text style={styles.vialJourneyMeta}>
                        {vial.injectionCount}{' '}
                        {language === 'en' ? 'logs' : 'log'} ·{' '}
                        {vial.notesCount}{' '}
                        {language === 'en' ? 'notes' : 'catatan'}
                      </Text>
                    </View>

                    <Text style={styles.vialJourneyPercent}>
                      {vial.usagePercent}%
                    </Text>
                  </View>

                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(100, vial.usagePercent)}%`,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.vialJourneyBottom}>
                    <Text style={styles.vialJourneyMeta}>
                      {vial.usedVolumeMl.toFixed(2)} /{' '}
                      {vial.initialVolumeMl.toFixed(2)}{' '}
                      {language === 'en' ? 'mL logged' : 'mL tercatat'}
                    </Text>

                    <Text style={styles.vialJourneyMeta}>
                      {vial.nextScheduledDate
                        ? `Next ${vial.nextScheduledDate} ${vial.nextScheduledTime || ''}`
                        : (language === 'en' ? 'No schedule' : 'Tidak ada jadwal')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
      </>
      )}

      {/* VIEW: RIWAYAT INJEKSI */}
      {activeSegment === 'logs' && (
        <>
      {/* Filter Peptida */}
      {uniquePeptides.length >
        0 && (
        <View
          style={
            styles.filterScroll
          }
        >
          <TouchableOpacity
            onPress={() =>
              setFilterPeptide(
                'all',
              )
            }
            style={[
              styles.filterChip,
              filterPeptide ===
                'all' &&
                styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                filterPeptide ===
                  'all' &&
                  styles.filterChipTextActive,
              ]}
            >
              {language === 'en' ? 'All' : 'Semua'} (
              {
                safeHistory.length
              }
              )
            </Text>
          </TouchableOpacity>

          {uniquePeptides.map(
            (pep) => (
              <TouchableOpacity
                key={pep}
                onPress={() =>
                  setFilterPeptide(
                    pep,
                  )
                }
                style={[
                  styles.filterChip,
                  filterPeptide ===
                    pep &&
                    styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filterPeptide ===
                      pep &&
                      styles.filterChipTextActive,
                  ]}
                >
                  {pep}
                </Text>
              </TouchableOpacity>
            ),
          )}
        </View>
      )}

      {/* Daftar Log Injeksi */}
      <View
        style={styles.listContainer}
      >
        {filteredHistory.length === 0 ? (
          <View style={styles.emptyCard}>
            <Activity size={36} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>
              {language === 'en'
                ? 'No Injection Logs'
                : 'Belum Ada Log Injeksi'}
            </Text>
            <Text style={styles.emptySub}>
              {language === 'en'
                ? 'Tap Inject Now on the Fridge tab to record a new injection.'
                : 'Tekan tombol Suntik Sekarang pada tab Inventory untuk mencatat log penyuntikan baru.'}
            </Text>
          </View>
        ) : (
          filteredHistory.map((item, index) => {
            if (!item) return null;

            return (
              <View
                key={item?.id || `history-item-${index}`}
                style={styles.logCard}
              >
                <View style={styles.logCardMainRow}>
                  <View style={styles.logCardVialBox}>
                    <CuteVialIllustration
                      size="xs"
                      progress={100}
                      category={getPeptideCategory(item.peptideName)}
                      showTicks={false}
                    />
                  </View>

                  <View style={styles.logCardContent}>
                    <View style={styles.logHeader}>
                      <View style={styles.peptideNameRow}>
                        <Text style={styles.peptideNameText} numberOfLines={1}>
                          {item.peptideName ||
                            (language === 'en' ? 'Peptide Compound' : 'Senyawa Peptida')}
                        </Text>
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => {
                          const title = language === 'en' ? 'Delete Log' : 'Hapus Log';
                          const msg = language === 'en'
                            ? 'Delete this injection record?'
                            : 'Hapus catatan injeksi ini?';

                          if (Platform.OS === 'web') {
                            // eslint-disable-next-line no-alert
                            if (window.confirm(`${title}\n\n${msg}`)) {
                              deleteInjectionLog(item.id);
                            }
                            return;
                          }

                          Alert.alert(
                            title,
                            msg,
                            [
                              {
                                text: t('app.cancel'),
                                style: 'cancel',
                              },
                              {
                                text: language === 'en' ? 'Delete' : 'Hapus',
                                style: 'destructive',
                                onPress: () => deleteInjectionLog(item.id),
                              },
                            ],
                          );
                        }}
                        style={styles.deleteBtn}
                      >
                        <Trash2 size={13} color="#ef4444" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.logDetailsRow}>
                      <View style={styles.badgeDose}>
                        <Text style={styles.badgeDoseText}>
                          {item.dose || 0} {item.unit || 'mg'}
                        </Text>
                      </View>

                      {Boolean(item.volumeMl) && (
                        <View style={styles.badgeVolume}>
                          <Text style={styles.badgeVolumeText}>
                            {item.volumeMl} mL
                          </Text>
                        </View>
                      )}

                      <View style={styles.badgeSite}>
                        <MapPin size={10} color={COLORS.mint} />
                        <Text style={styles.badgeSiteText}>
                          {getSiteDisplay(item.siteId)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.logFooter}>
                      <Clock size={11} color={COLORS.textMuted} />
                      <Text style={styles.timestampText}>
                        {item.recordedAtLocal || item.timestamp || '-'}
                      </Text>
                    </View>
                  </View>
                </View>

                {item.notes ? (
                  <View style={styles.notesRow}>
                    <Text style={styles.notesLabel}>
                      {language === 'en' ? 'Notes:' : 'Catatan:'}
                    </Text>
                    <Text style={styles.notesText}>{item.notes}</Text>
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </View>
      </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  scrollContent: {
    paddingBottom: 130,
  },

  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: 16,
    gap: 12,
    marginBottom: 12,
    ...SHADOWS.cardGlow,
  },

  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    gap: 4,
  },

  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: RADIUS.pill,
  },

  segmentBtnActive: {
    backgroundColor: COLORS.accent,
    ...SHADOWS.subtle,
  },

  segmentBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textMuted,
  },

  segmentBtnTextActive: {
    color: '#231716',
    fontWeight: '900',
  },

  summaryIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(188, 169, 239, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(188, 169, 239, 0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryContent: {
    flex: 1,
  },

  summaryTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },

  summarySubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  iconActionBtn: {
    padding: 9,
    backgroundColor: COLORS.bgDarker,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  insightCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: 16,
    marginBottom: 12,
    gap: 12,
    ...SHADOWS.card,
  },

  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  insightTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
  },

  insightMeta: {
    fontSize: 10,
    color: COLORS.mint,
    fontWeight: '800',
    backgroundColor: 'rgba(194, 211, 182, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },

  sectionTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  insightGrid: {
    flexDirection: 'row',
    gap: 8,
  },

  insightMetric: {
    flex: 1,
    backgroundColor: COLORS.bgDarker,
    borderRadius: RADIUS.lg,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },

  insightValue: {
    fontSize: 17,
    fontWeight: '900',
    color: '#ffffff',
  },

  insightLabel: {
    marginTop: 3,
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: '700',
  },

  mostUsedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 2,
  },

  mostUsedText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  mostUsedStrong: {
    color: COLORS.mint,
    fontWeight: '900',
  },

  vialSection: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: 16,
    marginBottom: 12,
    gap: 12,
    ...SHADOWS.card,
  },

  vialEmpty: {
    color: COLORS.textMuted,
    fontSize: 11,
  },

  vialJourneyCard: {
    backgroundColor: COLORS.bgDarker,
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  vialJourneyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  vialJourneyIconWrap: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  vialJourneyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  vialJourneyNameWrap: {
    flex: 1,
    paddingRight: 8,
  },

  vialJourneyName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },

  vialJourneyMeta: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },

  vialJourneyPercent: {
    color: COLORS.mint,
    fontSize: 13,
    fontWeight: '900',
  },

  progressTrack: {
    height: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: COLORS.mint,
    borderRadius: RADIUS.pill,
  },

  vialJourneyBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },

  filterScroll: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    flexWrap: 'wrap',
  },

  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  filterChipActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
    ...SHADOWS.subtle,
  },

  filterChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
  },

  filterChipTextActive: {
    color: '#231716',
    fontWeight: '900',
  },

  listContainer: {
    gap: 10,
    paddingBottom: 8,
  },

  emptyCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: 28,
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    ...SHADOWS.card,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff',
  },

  emptySub: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },

  logCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 8,
    ...SHADOWS.card,
  },

  logCardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  logCardVialBox: {
    width: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logCardContent: {
    flex: 1,
    gap: 6,
  },

  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  peptideNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },

  peptideNameText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },

  deleteBtn: {
    padding: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },

  logDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },

  badgeDose: {
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },

  badgeDoseText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.amber,
  },

  badgeVolume: {
    backgroundColor: 'rgba(34, 211, 238, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },

  badgeVolumeText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.cyan,
  },

  badgeSite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(194, 211, 182, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(194, 211, 182, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },

  badgeSiteText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.mint,
  },

  logFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 6,
  },

  timestampText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '700',
  },

  notesRow: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },

  notesLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '800',
  },

  notesText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 10,
    lineHeight: 14,
  },
});
