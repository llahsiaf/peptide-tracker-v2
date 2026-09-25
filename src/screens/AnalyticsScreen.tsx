import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Activity,
  BarChart3,
  CalendarRange,
  ChevronDown,
  FlaskConical,
  Package,
  Syringe,
  TrendingUp,
} from 'lucide-react-native';

import { useBioStackStore } from '../store/useBioStackStore';
import { useLanguage } from '../i18n/LanguageContext';

import {
  getAnalyticsDateRange,
  getDailyActivity,
  getPeptideDailyActivity,
  getPeptideUsageStats,
  getVialJourneys,
} from '../utils/analyticsUtils';

/*
 * FIX CRASH ANALYTICS
 *
 * AnalyticsScreen menggunakan getScheduledOccurrencesBetween()
 * untuk menghitung kepatuhan jadwal.
 *
 * Fungsi tersebut berada di scheduleUtils.ts.
 */
import { getScheduledOccurrencesBetween } from '../utils/scheduleUtils';

import {
  COLORS,
  RADIUS,
  SHADOWS,
} from '../theme';

const RANGE_OPTIONS = [14, 30, 60] as const;

export const AnalyticsScreen: React.FC = () => {
  const { language, t } = useLanguage();

  const formatDateLabel = (value: string) => {
    const date = new Date(`${value}T12:00:00`);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'id-ID', {
      day: '2-digit',
      month: 'short',
    }).format(date);
  };

  const {
    inventory,
    injectionHistory,
    freezerStock,
  } = useBioStackStore();

  const [range, setRange] = useState<number>(30);
  const [selectedPeptide, setSelectedPeptide] =
    useState<string>('all');
  const [showAllVials, setShowAllVials] =
    useState(false);

  /*
   * Defensive guards.
   *
   * Analytics harus tetap bisa dibuka walaupun
   * salah satu data store kosong / malformed.
   */
  const safeInventory = Array.isArray(inventory)
    ? inventory
    : [];

  const safeLogs = Array.isArray(injectionHistory)
    ? injectionHistory
    : [];

  const freezerCount = Array.isArray(freezerStock)
    ? freezerStock.reduce(
        (sum, item) =>
          sum +
          Math.max(
            0,
            Number(item?.quantity) || 0,
          ),
        0,
      )
    : 0;

  /*
   * Rentang tanggal Analytics.
   */
  const rangeInfo = useMemo(
    () => getAnalyticsDateRange(range),
    [range],
  );

  /*
   * Semua jadwal yang berada di dalam
   * rentang Analytics.
   */
  const scheduledRange = useMemo(() => {
    const start = new Date(
      `${rangeInfo.start}T12:00:00`,
    );

    const end = new Date(
      `${rangeInfo.end}T12:00:00`,
    );

    return getScheduledOccurrencesBetween(
      safeInventory,
      start,
      end,
      new Date(),
      safeLogs,
    );
  }, [
    safeInventory,
    safeLogs,
    rangeInfo,
  ]);

  /*
   * Aktivitas harian.
   */
  const dailyActivity = useMemo(
    () =>
      getDailyActivity(
        safeLogs,
        scheduledRange.map((item) => ({
          date: item.date,
          completed: item.completed,
        })),
        range,
      ),
    [
      safeLogs,
      scheduledRange,
      range,
    ],
  );

  /*
   * Statistik penggunaan per peptide.
   */
  const usageStats = useMemo(
    () => getPeptideUsageStats(safeLogs),
    [safeLogs],
  );

  /*
   * Filter peptide.
   */
  const peptideOptions = useMemo(
    () => [
      { id: 'all', label: language === 'en' ? 'All' : 'Semua' },
      ...usageStats.map((item) => ({
        id: item.name,
        label: item.name,
      })),
    ],
    [usageStats, language],
  );

  const isAllPeptides =
    selectedPeptide === 'all' ||
    selectedPeptide === 'Semua' ||
    selectedPeptide === 'All';

  const filteredLogs = useMemo(
    () =>
      isAllPeptides
        ? safeLogs
        : safeLogs.filter(
            (log) =>
              log.peptideName ===
              selectedPeptide,
          ),
    [
      safeLogs,
      selectedPeptide,
      isAllPeptides,
    ],
  );

  /*
   * Aktivitas harian berdasarkan peptide
   * jika filter peptide digunakan.
   */
  const filteredDaily = useMemo(
    () =>
      isAllPeptides
        ? dailyActivity
        : getPeptideDailyActivity(
            safeLogs,
            selectedPeptide,
            range,
          ),
    [
      safeLogs,
      selectedPeptide,
      range,
      dailyActivity,
      isAllPeptides,
    ],
  );

  /*
   * Timeline perjalanan vial.
   */
  const vialJourneys = useMemo(
    () =>
      getVialJourneys(
        safeInventory,
        safeLogs,
      ).sort(
        (a, b) =>
          b.injectionCount -
          a.injectionCount,
      ),
    [
      safeInventory,
      safeLogs,
    ],
  );

  /*
   * Metric utama.
   */
  const totalVolume =
    filteredLogs.reduce(
      (sum, log) =>
        sum +
        Math.max(
          0,
          Number(log.volumeMl) || 0,
        ),
      0,
    );

  const activeVials =
    safeInventory.filter(
      (item) =>
        (item.lifecycleStatus ||
          'active') ===
        'active',
    ).length;

  const completed =
    scheduledRange.filter(
      (item) => item.completed,
    ).length;

  const scheduled =
    scheduledRange.length;

  const completionRate =
    scheduled > 0
      ? Math.round(
          (completed / scheduled) *
            100,
        )
      : 0;

  const maxDailyLogs = Math.max(
    1,
    ...filteredDaily.map(
      (item) => item.logs,
    ),
  );

  const visibleVials =
    showAllVials
      ? vialJourneys
      : vialJourneys.slice(0, 5);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
      showsVerticalScrollIndicator={
        false
      }
    >
      {/* =========================
          HERO
      ========================== */}
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <BarChart3
            size={20}
            color={
              COLORS.accentStrong
            }
          />
        </View>

        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>
            PERSONAL ANALYTICS
          </Text>

          <Text style={styles.heroTitle}>
            {language === 'en' ? 'Tracker Patterns' : 'Pola Tracker'}
          </Text>

          <Text
            style={
              styles.heroSubtitle
            }
          >
            {formatDateLabel(
              rangeInfo.start,
            )}{' '}
            –{' '}
            {formatDateLabel(
              rangeInfo.end,
            )}{' '}
            · {language === 'en' ? 'descriptive data' : 'data deskriptif'}
          </Text>
        </View>
      </View>

      {/* =========================
          RANGE FILTER
      ========================== */}
      <View style={styles.rangeRow}>
        {RANGE_OPTIONS.map(
          (option) => (
            <TouchableOpacity
              key={option}
              onPress={() =>
                setRange(option)
              }
              style={[
                styles.rangeChip,
                range === option &&
                  styles.rangeChipActive,
              ]}
            >
              <Text
                style={[
                  styles.rangeText,
                  range === option &&
                    styles.rangeTextActive,
                ]}
              >
                {option} {language === 'en' ? 'days' : 'hari'}
              </Text>
            </TouchableOpacity>
          ),
        )}
      </View>

      {/* =========================
          PEPTIDE FILTER
      ========================== */}
      <View style={styles.filterScroll}>
        {peptideOptions.map(
          (item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() =>
                setSelectedPeptide(
                  item.id,
                )
              }
              style={[
                styles.filterChip,
                selectedPeptide ===
                  item.id &&
                  styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedPeptide ===
                    item.id &&
                    styles.filterChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ),
        )}
      </View>

      {/* =========================
          METRICS
      ========================== */}
      <View style={styles.metricGrid}>
        <Metric
          icon={
            <Syringe
              size={15}
              color={
                COLORS.accent
              }
            />
          }
          label={language === 'en' ? 'Logs' : 'Log'}
          value={String(
            filteredLogs.length,
          )}
        />

        <Metric
          icon={
            <Activity
              size={15}
              color={COLORS.cyan}
            />
          }
          label={language === 'en' ? 'mL logged' : 'mL tercatat'}
          value={totalVolume.toFixed(
            2,
          )}
        />

        <Metric
          icon={
            <FlaskConical
              size={15}
              color={
                COLORS.accentStrong
              }
            />
          }
          label={language === 'en' ? 'Active vials' : 'Vial aktif'}
          value={String(
            activeVials,
          )}
        />

        <Metric
          icon={
            <Package
              size={15}
              color={COLORS.cyan}
            />
          }
          label="Freezer"
          value={String(
            freezerCount,
          )}
        />
      </View>

      {/* =========================
          KEPATUHAN JADWAL
      ========================== */}
      <View style={styles.card}>
        <View
          style={
            styles.sectionHeader
          }
        >
          <View
            style={styles.titleRow}
          >
            <CalendarRange
              size={16}
              color={COLORS.cyan}
            />

            <Text
              style={
                styles.sectionTitle
              }
            >
              {language === 'en'
                ? 'Schedule Compliance'
                : 'Kepatuhan Jadwal'}
            </Text>
          </View>

          <Text
            style={
              styles.sectionMeta
            }
          >
            {completionRate}% {language === 'en' ? 'completed' : 'selesai'}
          </Text>
        </View>

        <View
          style={
            styles.bigMetricRow
          }
        >
          <View>
            <Text
              style={
                styles.bigMetric
              }
            >
              {completed}
            </Text>

            <Text
              style={
                styles.metricLabel
              }
            >
              {language === 'en'
                ? `completed of ${scheduled} scheduled`
                : `selesai dari ${scheduled} jadwal`}
            </Text>
          </View>

          <View
            style={
              styles.rateRing
            }
          >
            <Text
              style={
                styles.rateText
              }
            >
              {completionRate}%
            </Text>
          </View>
        </View>

        <Text
          style={
            styles.helperText
          }
        >
          {language === 'en'
            ? 'This percentage compares recorded schedules with logged entries.'
            : 'Persentase ini hanya membandingkan jadwal yang tercatat dengan log yang ada.'}
        </Text>
      </View>

      {/* =========================
          AKTIVITAS HARIAN
      ========================== */}
      <View style={styles.card}>
        <View
          style={
            styles.sectionHeader
          }
        >
          <View
            style={styles.titleRow}
          >
            <TrendingUp
              size={16}
              color={COLORS.accent}
            />

            <Text
              style={
                styles.sectionTitle
              }
            >
              {language === 'en'
                ? 'Daily Activity'
                : 'Aktivitas Harian' /* Aktivitas Harian */}
            </Text>
          </View>

          <Text
            style={
              styles.sectionMeta
            }
          >
            {range} {language === 'en' ? 'days' : 'hari'}
          </Text>
        </View>

        <View style={styles.chart}>
          {filteredDaily.map(
            (item) => (
              <View
                key={item.date}
                style={
                  styles.barColumn
                }
              >
                <Text
                  style={
                    styles.barValue
                  }
                >
                  {item.logs || ''}
                </Text>

                <View
                  style={
                    styles.barTrack
                  }
                >
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${Math.max(
                          4,
                          (item.logs /
                            maxDailyLogs) *
                            100,
                        )}%`,
                      },
                    ]}
                  />
                </View>

                <Text
                  style={
                    styles.barLabel
                  }
                >
                  {item.label}
                </Text>
              </View>
            ),
          )}
        </View>

        <View
          style={
            styles.chartLegend
          }
        >
          <View
            style={
              styles.legendItem
            }
          >
            <View
              style={
                styles.legendDot
              }
            />

            <Text
              style={
                styles.legendText
              }
            >
              {language === 'en' ? 'Logs per day' : 'Log per hari'}
            </Text>
          </View>
        </View>
      </View>

      {/* =========================
          PENGGUNAAN PER PEPTIDA
      ========================== */}
      <View style={styles.card}>
        <View
          style={
            styles.sectionHeader
          }
        >
          <View
            style={styles.titleRow}
          >
            <FlaskConical
              size={16}
              color={
                COLORS.accentStrong
              }
            />

            <Text
              style={
                styles.sectionTitle
              }
            >
              {language === 'en'
                ? 'Usage by Peptide'
                : 'Penggunaan per Peptida'}
            </Text>
          </View>
        </View>

        {usageStats.length ===
        0 ? (
          <Text
            style={
              styles.emptyText
            }
          >
            {language === 'en' ? 'No history yet.' : 'Belum ada history.'}
          </Text>
        ) : (
          usageStats
            .slice(0, 8)
            .map(
              (item, index) => (
                <View
                  key={item.name}
                  style={
                    styles.peptideRow
                  }
                >
                  <View
                    style={
                      styles.rankBox
                    }
                  >
                    <Text
                      style={
                        styles.rankText
                      }
                    >
                      {index + 1}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.peptideCopy
                    }
                  >
                    <Text
                      style={
                        styles.peptideName
                      }
                    >
                      {item.name}
                    </Text>

                    <Text
                      style={
                        styles.peptideMeta
                      }
                    >
                      {item.totalVolumeMl.toFixed(
                        2,
                      )}{' '}
                      mL · {item.notes}{' '}
                      {language === 'en' ? 'notes' : 'catatan'}
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.peptideCount
                    }
                  >
                    {item.count}
                  </Text>
                </View>
              ),
            )
        )}
      </View>

      {/* =========================
          TIMELINE VIAL
      ========================== */}
      <View style={styles.card}>
        <View
          style={
            styles.sectionHeader
          }
        >
          <View
            style={styles.titleRow}
          >
            <Package
              size={16}
              color={COLORS.cyan}
            />

            <Text
              style={
                styles.sectionTitle
              }
            >
              {language === 'en'
                ? 'Vial Timeline'
                : 'Timeline Vial' /* Timeline Vial */}
            </Text>
          </View>

          <Text
            style={
              styles.sectionMeta
            }
          >
            {vialJourneys.length}{' '}
            {language === 'en' ? 'vials' : 'vial'}
          </Text>
        </View>

        {visibleVials.length ===
        0 ? (
          <Text
            style={
              styles.emptyText
            }
          >
            {language === 'en'
              ? 'No vials in inventory.'
              : 'Belum ada vial di inventory.'}
          </Text>
        ) : (
          visibleVials.map(
            (vial) => (
              <View
                key={vial.id}
                style={
                  styles.vialRow
                }
              >
                <View
                  style={
                    styles.vialHeader
                  }
                >
                  <View
                    style={
                      styles.peptideCopy
                    }
                  >
                    <Text
                      style={
                        styles.peptideName
                      }
                    >
                      {vial.name}
                    </Text>

                    <Text
                      style={
                        styles.peptideMeta
                      }
                    >
                      {
                        vial.injectionCount
                      }{' '}
                      {language === 'en' ? 'logs' : 'log'} ·{' '}
                      {vial.currentVolumeMl.toFixed(
                        2,
                      )}{' '}
                      {language === 'en' ? 'mL remaining' : 'mL tersisa'}
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.percent
                    }
                  >
                    {vial.usagePercent}%
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

                <Text
                  style={
                    styles.peptideMeta
                  }
                >
                  {vial.lastInjectedAt
                    ? `${language === 'en' ? 'Last: ' : 'Terakhir: '}${new Date(
                        vial.lastInjectedAt,
                      ).toLocaleString(
                        language === 'en' ? 'en-US' : 'id-ID',
                        {
                          day: '2-digit',
                          month: 'short',
                        },
                      )}`
                    : (language === 'en' ? 'No logs yet' : 'Belum ada log')}
                </Text>
              </View>
            ),
          )
        )}

        {vialJourneys.length >
          5 && (
          <TouchableOpacity
            style={
              styles.expandBtn
            }
            onPress={() =>
              setShowAllVials(
                (value) => !value,
              )
            }
          >
            <Text
              style={
                styles.expandText
              }
            >
              {showAllVials
                ? (language === 'en' ? 'Show less' : 'Tampilkan lebih sedikit')
                : (language === 'en' ? 'Show all vials' : 'Tampilkan semua vial')}
            </Text>

            <ChevronDown
              size={15}
              color={COLORS.cyan}
              style={
                showAllVials
                  ? {
                      transform: [
                        {
                          rotate:
                            '180deg',
                        },
                      ],
                    }
                  : undefined
              }
            />
          </TouchableOpacity>
        )}
      </View>

      {/* =========================
          FOOTER NOTE
      ========================== */}
      <View
        style={
          styles.footerNote
        }
      >
        <Text
          style={
            styles.footerText
          }
        >
          {language === 'en'
            ? 'Analytics is a summary of data you logged yourself and is not intended as medical advice.'
            : 'Analytics adalah ringkasan data yang kamu catat sendiri dan tidak dimaksudkan sebagai rekomendasi terapi.'}
        </Text>
      </View>
    </ScrollView>
  );
};

/* =========================================================
   METRIC COMPONENT
========================================================= */

const Metric = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <View style={styles.metric}>
    <View
      style={
        styles.metricIcon
      }
    >
      {icon}
    </View>

    <Text
      style={
        styles.metricValue
      }
    >
      {value}
    </Text>

    <Text
      style={
        styles.metricLabel
      }
    >
      {label}
    </Text>
  </View>
);

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      COLORS.bg,
  },

  content: {
    padding: 14,
    paddingBottom: 110,
    gap: 12,
  },

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius:
      RADIUS.xl,
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    ...SHADOWS.card,
  },

  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor:
      'rgba(16,185,129,0.1)',
    alignItems: 'center',
    justifyContent:
      'center',
  },

  heroCopy: {
    flex: 1,
  },

  eyebrow: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    color:
      COLORS.accent,
  },

  heroTitle: {
    marginTop: 2,
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
  },

  heroSubtitle: {
    marginTop: 3,
    fontSize: 11,
    color:
      COLORS.muted,
  },

  rangeRow: {
    flexDirection: 'row',
    gap: 8,
  },

  rangeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  rangeChipActive: {
    backgroundColor:
      'rgba(16,185,129,0.1)',
    borderColor:
      'rgba(16,185,129,0.35)',
  },

  rangeText: {
    fontSize: 11,
    fontWeight: '800',
    color:
      COLORS.muted,
  },

  rangeTextActive: {
    color:
      COLORS.accent,
  },

  filterScroll: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },

  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  filterChipActive: {
    backgroundColor:
      'rgba(56,189,248,0.1)',
    borderColor:
      'rgba(56,189,248,0.3)',
  },

  filterChipText: {
    fontSize: 10,
    fontWeight: '800',
    color:
      COLORS.muted,
  },

  filterChipTextActive: {
    color:
      COLORS.cyan,
  },

  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  metric: {
    width: '48%',
    flexGrow: 1,
    minWidth: '46%',
    padding: 12,
    borderRadius:
      RADIUS.lg,
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  metricIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor:
      COLORS.cardElevated,
    alignItems: 'center',
    justifyContent:
      'center',
  },

  metricValue: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: '900',
    color:
      COLORS.text,
  },

  metricLabel: {
    marginTop: 2,
    fontSize: 10,
    color:
      COLORS.muted,
    fontWeight: '700',
  },

  card: {
    padding: 14,
    borderRadius:
      RADIUS.lg,
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    ...SHADOWS.card,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginBottom: 12,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color:
      COLORS.text,
  },

  sectionMeta: {
    fontSize: 10,
    color:
      COLORS.muted,
    fontWeight: '800',
  },

  bigMetricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  bigMetric: {
    fontSize: 34,
    fontWeight: '900',
    color:
      COLORS.text,
  },

  rateRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 5,
    borderColor:
      COLORS.accent,
    alignItems: 'center',
    justifyContent:
      'center',
  },

  rateText: {
    fontSize: 14,
    fontWeight: '900',
    color:
      COLORS.accent,
  },

  helperText: {
    marginTop: 10,
    fontSize: 10,
    lineHeight: 15,
    color:
      COLORS.muted,
  },

  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 150,
    gap: 3,
    paddingTop: 18,
  },

  barColumn: {
    flex: 1,
    alignItems: 'center',
    minWidth: 7,
  },

  barValue: {
    height: 14,
    fontSize: 7,
    color:
      COLORS.textSoft,
    fontWeight: '800',
  },

  barTrack: {
    flex: 1,
    width: '72%',
    backgroundColor:
      COLORS.cardElevated,
    borderRadius: 5,
    justifyContent:
      'flex-end',
    overflow: 'hidden',
  },

  barFill: {
    width: '100%',
    backgroundColor:
      COLORS.accent,
    borderRadius: 5,
    minHeight: 3,
  },

  barLabel: {
    marginTop: 5,
    fontSize: 7,
    color:
      COLORS.muted,
    transform: [
      {
        rotate: '-45deg',
      },
    ],
  },

  chartLegend: {
    marginTop: 6,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor:
      COLORS.accent,
  },

  legendText: {
    fontSize: 9,
    color:
      COLORS.muted,
  },

  peptideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.borderSoft,
  },

  rankBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor:
      COLORS.cardElevated,
    alignItems: 'center',
    justifyContent:
      'center',
  },

  rankText: {
    fontSize: 10,
    fontWeight: '900',
    color:
      COLORS.muted,
  },

  peptideCopy: {
    flex: 1,
    marginLeft: 10,
  },

  peptideName: {
    fontSize: 12,
    fontWeight: '900',
    color:
      COLORS.text,
  },

  peptideMeta: {
    marginTop: 2,
    fontSize: 9,
    color:
      COLORS.muted,
  },

  peptideCount: {
    fontSize: 17,
    fontWeight: '900',
    color:
      COLORS.text,
  },

  vialRow: {
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.borderSoft,
  },

  vialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  percent: {
    fontSize: 12,
    fontWeight: '900',
    color:
      COLORS.accent,
  },

  progressTrack: {
    height: 7,
    borderRadius: 99,
    backgroundColor:
      COLORS.cardElevated,
    overflow: 'hidden',
    marginTop: 9,
    marginBottom: 6,
  },

  progressFill: {
    height: '100%',
    backgroundColor:
      COLORS.accent,
    borderRadius: 99,
  },

  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'center',
    gap: 5,
    paddingTop: 13,
  },

  expandText: {
    fontSize: 10,
    fontWeight: '800',
    color:
      COLORS.cyan,
  },

  emptyText: {
    fontSize: 11,
    color:
      COLORS.muted,
  },

  footerNote: {
    padding: 8,
    alignItems: 'center',
  },

  footerText: {
    textAlign: 'center',
    fontSize: 9,
    lineHeight: 14,
    color:
      COLORS.muted,
    maxWidth: 330,
  },
});
