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
} from 'lucide-react-native';
import { useBioStackStore } from '../store/useBioStackStore';
import { getVialJourneys, getPeptideUsageStats } from '../utils/analyticsUtils';
import { useLanguage } from '../i18n/LanguageContext';

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
            color="#10b981"
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
              color="#38bdf8"
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
              color="#38bdf8"
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
              color="#10b981"
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
              color="#10b981"
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

        {vialJourneys.length ===
        0 ? (
          <Text
            style={
              styles.vialEmpty
            }
          >
            {language === 'en'
              ? 'No vials recorded yet.'
              : 'Belum ada vial yang tercatat.'}
          </Text>
        ) : (
          vialJourneys
            .slice(0, 6)
            .map((vial) => (
              <View
                key={vial.id}
                style={
                  styles.vialJourneyCard
                }
              >
                <View
                  style={
                    styles.vialJourneyTop
                  }
                >
                  <View
                    style={
                      styles.vialJourneyNameWrap
                    }
                  >
                    <Text
                      style={
                        styles.vialJourneyName
                      }
                    >
                      {vial.name}
                    </Text>

                    <Text
                      style={
                        styles.vialJourneyMeta
                      }
                    >
                      {
                        vial.injectionCount
                      }{' '}
                      {language === 'en' ? 'logs' : 'log'} ·{' '}
                      {
                        vial.notesCount
                      }{' '}
                      {language === 'en' ? 'notes' : 'catatan'}
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.vialJourneyPercent
                    }
                  >
                    {
                      vial.usagePercent
                    }
                    %
                  </Text>
                </View>

                <View
                  style={
                    styles.progressTrack
                  }
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${vial.usagePercent}%`,
                      },
                    ]}
                  />
                </View>

                <View
                  style={
                    styles.vialJourneyBottom
                  }
                >
                  <Text
                    style={
                      styles.vialJourneyMeta
                    }
                  >
                    {vial.usedVolumeMl.toFixed(
                      2,
                    )}{' '}
                    /{' '}
                    {vial.initialVolumeMl.toFixed(
                      2,
                    )}{' '}
                    {language === 'en' ? 'mL logged' : 'mL tercatat'}
                  </Text>

                  <Text
                    style={
                      styles.vialJourneyMeta
                    }
                  >
                    {vial.nextScheduledDate
                      ? `Next ${vial.nextScheduledDate} ${vial.nextScheduledTime || ''}`
                      : (language === 'en' ? 'No schedule' : 'Tidak ada jadwal')}
                  </Text>
                </View>
              </View>
            ))
        )}
      </View>

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
        {filteredHistory.length ===
        0 ? (
          <View
            style={styles.emptyCard}
          >
            <Activity
              size={32}
              color="#64748b"
            />

            <Text
              style={
                styles.emptyTitle
              }
            >
              {language === 'en'
                ? 'No Injection Logs'
                : 'Belum Ada Log Injeksi'}
            </Text>

            <Text
              style={
                styles.emptySub
              }
            >
              {language === 'en'
                ? 'Tap Inject Now on the Fridge tab to record a new injection.'
                : 'Tekan tombol Suntik Sekarang pada tab Inventory untuk mencatat log penyuntikan baru.'}
            </Text>
          </View>
        ) : (
          filteredHistory.map(
            (item, index) => {
              if (!item)
                return null;

              return (
                <View
                  key={
                    item?.id ||
                    `history-item-${index}`
                  }
                  style={
                    styles.logCard
                  }
                >
                  <View
                    style={
                      styles.logHeader
                    }
                  >
                    <View
                      style={
                        styles.peptideNameRow
                      }
                    >
                      <Syringe
                        size={14}
                        color="#10b981"
                      />

                      <Text
                        style={
                          styles.peptideNameText
                        }
                      >
                        {item.peptideName ||
                          (language === 'en' ? 'Peptide Compound' : 'Senyawa Peptida')}
                      </Text>
                    </View>

                    <TouchableOpacity
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
                              style:
                                'cancel',
                            },
                            {
                              text: language === 'en' ? 'Delete' : 'Hapus',
                              style:
                                'destructive',
                              onPress:
                                () =>
                                  deleteInjectionLog(
                                    item.id,
                                  ),
                            },
                          ],
                        );
                      }}
                      style={
                        styles.deleteBtn
                      }
                    >
                      <Trash2
                        size={14}
                        color="#64748b"
                      />
                    </TouchableOpacity>
                  </View>

                  <View
                    style={
                      styles.logDetailsRow
                    }
                  >
                    <View
                      style={
                        styles.badgeDose
                      }
                    >
                      <Text
                        style={
                          styles.badgeDoseText
                        }
                      >
                        {item.dose ||
                          0}{' '}
                        {item.unit ||
                          'mg'}
                      </Text>
                    </View>

                    {Boolean(
                      item.volumeMl,
                    ) && (
                      <View
                        style={
                          styles.badgeVolume
                        }
                      >
                        <Text
                          style={
                            styles.badgeVolumeText
                          }
                        >
                          {
                            item.volumeMl
                          }{' '}
                          mL
                        </Text>
                      </View>
                    )}

                    <View
                      style={
                        styles.badgeSite
                      }
                    >
                      <MapPin
                        size={10}
                        color="#38bdf8"
                      />

                      <Text
                        style={
                          styles.badgeSiteText
                        }
                      >
                        {getSiteDisplay(
                          item.siteId,
                        )}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={
                      styles.logFooter
                    }
                  >
                    <Calendar
                      size={11}
                      color="#64748b"
                    />

                    <Text
                      style={
                        styles.timestampText
                      }
                    >
                      {item.recordedAtLocal ||
                        item.timestamp ||
                        '-'}
                    </Text>
                  </View>

                  {item.notes ? (
                    <View
                      style={
                        styles.notesRow
                      }
                    >
                      <Text
                        style={
                          styles.notesLabel
                        }
                      >
                        {language === 'en' ? 'Notes:' : 'Catatan:'}
                      </Text>

                      <Text
                        style={
                          styles.notesText
                        }
                      >
                        {item.notes}
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            },
          )
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
    paddingHorizontal: 14,
    paddingTop: 10,
  },

  scrollContent: {
    paddingBottom: 120,
  },

  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    marginBottom: 10,
  },

  summaryIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor:
      'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryContent: {
    flex: 1,
  },

  summaryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },

  summarySubtitle: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },

  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  iconActionBtn: {
    padding: 8,
    backgroundColor: '#030712',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },

  insightCard: {
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    gap: 10,
  },

  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  insightTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },

  insightMeta: {
    fontSize: 8,
    color: '#64748b',
    fontWeight: '700',
  },

  sectionTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  insightGrid: {
    flexDirection: 'row',
    gap: 7,
  },

  insightMetric: {
    flex: 1,
    backgroundColor: '#030712',
    borderRadius: 10,
    padding: 9,
    borderWidth: 1,
    borderColor: '#111827',
  },

  insightValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },

  insightLabel: {
    marginTop: 2,
    fontSize: 8,
    color: '#64748b',
  },

  mostUsedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingTop: 3,
  },

  mostUsedText: {
    fontSize: 8,
    color: '#94a3b8',
  },

  mostUsedStrong: {
    color: '#ffffff',
    fontWeight: '800',
  },

  vialSection: {
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    gap: 9,
  },

  vialEmpty: {
    color: '#64748b',
    fontSize: 9,
  },

  vialJourneyCard: {
    backgroundColor: '#030712',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#111827',
    gap: 7,
  },

  vialJourneyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  vialJourneyNameWrap: {
    flex: 1,
    paddingRight: 10,
  },

  vialJourneyName: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },

  vialJourneyMeta: {
    color: '#64748b',
    fontSize: 7,
  },

  vialJourneyPercent: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '900',
  },

  progressTrack: {
    height: 6,
    backgroundColor: '#111827',
    borderRadius: 4,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },

  vialJourneyBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },

  filterScroll: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
    flexWrap: 'wrap',
  },

  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
  },

  filterChipActive: {
    backgroundColor:
      'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
  },

  filterChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },

  filterChipTextActive: {
    color: '#10b981',
  },

  listContainer: {
    gap: 8,
    paddingBottom: 8,
  },

  emptyCard: {
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    marginTop: 30,
  },

  emptyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },

  emptySub: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 15,
  },

  logCard: {
    backgroundColor: '#090d16',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
    gap: 8,
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
  },

  peptideNameText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },

  deleteBtn: {
    padding: 4,
  },

  logDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },

  badgeDose: {
    backgroundColor:
      'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor:
      'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },

  badgeDoseText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#f59e0b',
  },

  badgeVolume: {
    backgroundColor:
      'rgba(6, 182, 212, 0.1)',
    borderWidth: 1,
    borderColor:
      'rgba(6, 182, 212, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },

  badgeVolumeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#06b6d4',
  },

  badgeSite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor:
      'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor:
      'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },

  badgeSiteText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38bdf8',
  },

  logFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderTopWidth: 1,
    borderColor: '#111827',
    paddingTop: 6,
  },

  timestampText: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '600',
  },

  notesRow: {
    flexDirection: 'row',
    gap: 5,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#111827',
  },

  notesLabel: {
    color: '#64748b',
    fontSize: 8,
    fontWeight: '800',
  },

  notesText: {
    flex: 1,
    color: '#94a3b8',
    fontSize: 8,
    lineHeight: 12,
  },
});
