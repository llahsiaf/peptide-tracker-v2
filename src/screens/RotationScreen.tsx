import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import Svg, {
  Circle,
  Path,
  Text as SvgText,
  G,
  Line,
} from 'react-native-svg';
import {
  RotateCw,
  Compass,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react-native';
import {
  useBioStackStore,
  ROTATION_SITES,
} from '../store/useBioStackStore';

type BodyZone =
  | 'perut'
  | 'paha'
  | 'lengan'
  | 'bokong';

interface SitePoint {
  id: string;
  code: string;
  name: string;
  subText: string;
  zone: BodyZone;
}

const ALL_SITES: SitePoint[] = [
  // Zona Perut
  {
    id: 'KA',
    code: 'KA',
    name: 'Kanan Atas (KA)',
    subText:
      'Perut kanan atas (2-3 cm dari pusar)',
    zone: 'perut',
  },
  {
    id: 'KiA',
    code: 'KiA',
    name: 'Kiri Atas (KiA)',
    subText:
      'Perut kiri atas (2-3 cm dari pusar)',
    zone: 'perut',
  },
  {
    id: 'KB',
    code: 'KB',
    name: 'Kanan Bawah (KB)',
    subText:
      'Perut kanan bawah (2-3 cm dari pusar)',
    zone: 'perut',
  },
  {
    id: 'KiB',
    code: 'KiB',
    name: 'Kiri Bawah (KiB)',
    subText:
      'Perut kiri bawah (2-3 cm dari pusar)',
    zone: 'perut',
  },

  // Zona Paha
  {
    id: 'PKi',
    code: 'PKi',
    name: 'Paha Kiri (PKi)',
    subText:
      'Sisi luar paha atas kiri',
    zone: 'paha',
  },
  {
    id: 'PKn',
    code: 'PKn',
    name: 'Paha Kanan (PKn)',
    subText:
      'Sisi luar paha atas kanan',
    zone: 'paha',
  },

  // Zona Lengan
  {
    id: 'LKi',
    code: 'LKi',
    name: 'Lengan Kiri (LKi)',
    subText:
      'Trisep / sisi belakang lengan kiri',
    zone: 'lengan',
  },
  {
    id: 'LKn',
    code: 'LKn',
    name: 'Lengan Kanan (LKn)',
    subText:
      'Trisep / sisi belakang lengan kanan',
    zone: 'lengan',
  },

  // Zona Bokong
  {
    id: 'BKi',
    code: 'BKi',
    name: 'Bokong Kiri (BKi)',
    subText:
      'Kuadran atas luar bokong kiri',
    zone: 'bokong',
  },
  {
    id: 'BKn',
    code: 'BKn',
    name: 'Bokong Kanan (BKn)',
    subText:
      'Kuadran atas luar bokong kanan',
    zone: 'bokong',
  },
];

const ALL_SITES_EN: SitePoint[] = [
  {
    id: 'KA',
    code: 'RU',
    name: 'Right Upper (RU)',
    subText: 'Right upper abdomen (2-3 cm from navel)',
    zone: 'perut',
  },
  {
    id: 'KiA',
    code: 'LU',
    name: 'Left Upper (LU)',
    subText: 'Left upper abdomen (2-3 cm from navel)',
    zone: 'perut',
  },
  {
    id: 'KB',
    code: 'RL',
    name: 'Right Lower (RL)',
    subText: 'Right lower abdomen (2-3 cm from navel)',
    zone: 'perut',
  },
  {
    id: 'KiB',
    code: 'LL',
    name: 'Left Lower (LL)',
    subText: 'Left lower abdomen (2-3 cm from navel)',
    zone: 'perut',
  },
  {
    id: 'PKi',
    code: 'LT',
    name: 'Left Thigh (LT)',
    subText: 'Outer side of upper left thigh',
    zone: 'paha',
  },
  {
    id: 'PKn',
    code: 'RT',
    name: 'Right Thigh (RT)',
    subText: 'Outer side of upper right thigh',
    zone: 'paha',
  },
  {
    id: 'LKi',
    code: 'LA',
    name: 'Left Arm (LA)',
    subText: 'Triceps / back of left upper arm',
    zone: 'lengan',
  },
  {
    id: 'LKn',
    code: 'RA',
    name: 'Right Arm (RA)',
    subText: 'Triceps / back of right upper arm',
    zone: 'lengan',
  },
  {
    id: 'BKi',
    code: 'LG',
    name: 'Left Glute (LG)',
    subText: 'Upper outer quadrant of left glute',
    zone: 'bokong',
  },
  {
    id: 'BKn',
    code: 'RG',
    name: 'Right Glute (RG)',
    subText: 'Upper outer quadrant of right glute',
    zone: 'bokong',
  },
];

export const SITE_CODE_EN: Record<string, string> = {
  KA: 'RU',
  KiA: 'LU',
  KB: 'RL',
  KiB: 'LL',
  PKi: 'LT',
  PKn: 'RT',
  LKi: 'LA',
  LKn: 'RA',
  BKi: 'LG',
  BKn: 'RG',
};

export const getSiteDisplayCode = (siteId: string, language: 'id' | 'en') => {
  if (language === 'en') {
    return SITE_CODE_EN[siteId] || siteId;
  }
  return siteId;
};

const ANATOMY_IMAGES: Record<BodyZone, any> = {
  perut: require('../assets/anatomy/abdomen.jpg'),
  paha: require('../assets/anatomy/thigh.jpg'),
  lengan: require('../assets/anatomy/arm.jpg'),
  bokong: require('../assets/anatomy/glute.jpg'),
};

export const RotationScreen: React.FC = () => {
  const { language, t } = useLanguage();
  const {
    currentSite,
    setSite,
    rotateToNextSite,
    injectionHistory,
  } = useBioStackStore();

  const [selectedZone, setSelectedZone] =
    useState<BodyZone>('perut');

  const sitesList = language === 'en' ? ALL_SITES_EN : ALL_SITES;

  const currentPoint =
    sitesList.find(
      (s) => s.id === currentSite,
    ) || sitesList[0];

  const activeZoneSites =
    sitesList.filter(
      (s) => s.zone === selectedZone,
    );

  const getZoneLabel = (zone: BodyZone) => {
    if (language === 'en') {
      switch (zone) {
        case 'perut':
          return 'ABDOMEN';
        case 'paha':
          return 'THIGH';
        case 'lengan':
          return 'ARM';
        case 'bokong':
          return 'GLUTE';
      }
    }
    return zone.toUpperCase();
  };

  const getSiteLastUsed = (
    siteId: string,
  ) => {
    const history = Array.isArray(
      injectionHistory,
    )
      ? injectionHistory
      : [];

    const log = history.find(
      (h) => h?.siteId === siteId,
    );

    if (!log) {
      const trans = t('rotation.noLog');
      if (trans && trans !== 'rotation.noLog') {
        return trans;
      }
      return language === 'en' ? 'Never injected' : 'Belum pernah disuntik';
    }

    return log.timestamp || (language === 'en' ? 'Just now' : 'Baru saja');
  };

  const handleNextRotation = () => {
    rotateToNextSite();
  };

  const siteFill = (
    siteId: string,
  ) =>
    currentSite === siteId
      ? 'rgba(16, 185, 129, 0.20)'
      : '#0f172a';

  const siteStroke = (
    siteId: string,
  ) =>
    currentSite === siteId
      ? '#10b981'
      : '#334155';

  const siteStrokeWidth = (
    siteId: string,
  ) =>
    currentSite === siteId ? 2.5 : 1;

  const siteText = (
    siteId: string,
  ) =>
    currentSite === siteId
      ? '#10b981'
      : '#ffffff';

  const renderInteractiveSite = (siteId: string, cx: number, cy: number) => {
    const isSelected = currentSite === siteId;
    const displayCode = getSiteDisplayCode(siteId, language as 'id' | 'en');

    return (
      <G key={siteId} onPress={() => setSite(siteId)}>
        {/* Glow halo saat aktif */}
        {isSelected && (
          <>
            <Circle
              cx={cx}
              cy={cy}
              r="27"
              fill="rgba(16, 185, 129, 0.22)"
            />
            <Circle
              cx={cx}
              cy={cy}
              r="23"
              stroke="#10b981"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              opacity={0.9}
            />
          </>
        )}

        {/* Lingkaran dasar */}
        <Circle
          cx={cx}
          cy={cy}
          r="18"
          fill={isSelected ? '#064e3b' : 'rgba(9, 13, 22, 0.82)'}
          stroke={isSelected ? '#10b981' : '#38bdf8'}
          strokeWidth={isSelected ? 2.5 : 1.5}
        />

        {/* Titik indikator kecil */}
        <Circle
          cx={cx}
          cy={cy - 7}
          r="2.5"
          fill={isSelected ? '#34d399' : '#38bdf8'}
        />

        {/* Kode Titik (RU, LU, KA, KiA, dll) */}
        <SvgText
          x={cx}
          y={cy + 4}
          fill={isSelected ? '#ffffff' : '#f1f5f9'}
          fontSize="11"
          fontWeight="900"
          textAnchor="middle"
        >
          {displayCode}
        </SvgText>

        {/* Sub-label status */}
        <SvgText
          x={cx}
          y={cy + 13}
          fill={isSelected ? '#34d399' : '#94a3b8'}
          fontSize="6.5"
          fontWeight="700"
          textAnchor="middle"
        >
          {isSelected ? (language === 'en' ? 'ACTIVE' : 'AKTIF') : (language === 'en' ? 'SELECT' : 'PILIH')}
        </SvgText>
      </G>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.scrollContent
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Banner Protokol */}
      <View
        style={styles.bannerCard}
      >
        <View
          style={
            styles.bannerIconBox
          }
        >
          <Compass
            size={20}
            color="#10b981"
          />
        </View>

        <View
          style={styles.bannerContent}
        >
          <Text
            style={styles.bannerTitle}
          >
            {language === 'en'
              ? 'Anatomical Rotation Protocol'
              : 'Protokol Rotasi Anatomi'}
          </Text>

          <Text
            style={styles.bannerDesc}
          >
            {language === 'en'
              ? 'Prevents lipohypertrophy and subcutaneous scar tissue buildup.'
              : 'Mencegah lipohipertrofi dan penumpukan jaringan parut subkutan.'}
          </Text>
        </View>
      </View>

      {/* Kartu Target Titik Aktif */}
      <View
        style={
          styles.activeTargetCard
        }
      >
        <View
          style={
            styles.targetHeaderRow
          }
        >
          <View>
            <Text
              style={
                styles.targetLabel
              }
            >
              {language === 'en'
                ? 'NEXT TARGET SITE'
                : 'TARGET TITIK BERIKUTNYA'}
            </Text>

            <Text
              style={styles.targetName}
            >
              {currentPoint.name}
            </Text>
          </View>

          <View
            style={
              styles.targetCodeBadge
            }
          >
            <Text
              style={
                styles.targetCodeText
              }
            >
              {currentPoint.code}
            </Text>
          </View>
        </View>

        <Text
          style={styles.targetSubText}
        >
          {currentPoint.subText}
        </Text>

        <TouchableOpacity
          style={
            styles.rotateActionBtn
          }
          onPress={
            handleNextRotation
          }
        >
          <RotateCw
            size={16}
            color="#022c22"
          />

          <Text
            style={
              styles.rotateActionBtnText
            }
          >
            {language === 'en'
              ? 'Rotate to Next Site'
              : 'Putar ke Titik Selanjutnya'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Pemilih Tab */}
      <View
        style={
          styles.zoneSelectorContainer
        }
      >
        {(
          [
            'perut',
            'paha',
            'lengan',
            'bokong',
          ] as BodyZone[]
        ).map((zone) => (
          <TouchableOpacity
            key={zone}
            onPress={() =>
              setSelectedZone(zone)
            }
            style={[
              styles.zoneTab,
              selectedZone ===
                zone &&
                styles.zoneTabActive,
            ]}
          >
            <Text
              style={[
                styles.zoneTabText,
                selectedZone ===
                  zone &&
                  styles.zoneTabTextActive,
              ]}
            >
              {getZoneLabel(zone)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Diagram Anatomi */}
      <View
        style={styles.visualMapCard}
      >
        <Text
          style={
            styles.mapHeaderTitle
          }
        >
          {language === 'en' ? 'ANATOMY DIAGRAM' : 'DIAGRAM ANATOMI'} (
          {getZoneLabel(selectedZone)}
          )
        </Text>

        <View style={styles.svgContainer}>
          <Image
            source={ANATOMY_IMAGES[selectedZone]}
            style={styles.anatomyBgImage}
            resizeMode="contain"
          />

          <Svg
            height="260"
            width="100%"
            viewBox="0 0 300 260"
            style={styles.anatomyOverlaySvg}
          >
            {/* PERUT (ABDOMEN) */}
            {selectedZone === 'perut' && (
              <G>
                {/* Safe buffer ring di sekitar pusar */}
                <Circle
                  cx="150"
                  cy="135"
                  r="20"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                  opacity={0.4}
                />
                <Circle
                  cx="150"
                  cy="135"
                  r="4"
                  fill="#0284c7"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                />
                <SvgText
                  x="150"
                  y="148"
                  fill="#38bdf8"
                  fontSize="7"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {language === 'en' ? 'NAVEL' : 'PUSAR'}
                </SvgText>

                {/* 4 Titik Kuadran Abdomen */}
                {renderInteractiveSite('KA', 110, 105)}
                {renderInteractiveSite('KiA', 190, 105)}
                {renderInteractiveSite('KB', 110, 165)}
                {renderInteractiveSite('KiB', 190, 165)}

                <SvgText
                  x="150"
                  y="252"
                  fill="#64748b"
                  fontSize="8"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {language === 'en' ? 'ANTERIOR · ABDOMEN' : 'DEPAN · ABDOMEN'}
                </SvgText>
              </G>
            )}

            {/* PAHA (THIGH) */}
            {selectedZone === 'paha' && (
              <G>
                {renderInteractiveSite('PKi', 108, 120)}
                {renderInteractiveSite('PKn', 192, 120)}

                <SvgText
                  x="150"
                  y="252"
                  fill="#64748b"
                  fontSize="8"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {language === 'en' ? 'ANTERIOR · THIGH' : 'DEPAN · PAHA'}
                </SvgText>
              </G>
            )}

            {/* LENGAN (ARM) */}
            {selectedZone === 'lengan' && (
              <G>
                {renderInteractiveSite('LKi', 56, 115)}
                {renderInteractiveSite('LKn', 244, 115)}

                <SvgText
                  x="150"
                  y="252"
                  fill="#64748b"
                  fontSize="8"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {language === 'en' ? 'LATERAL · UPPER ARM' : 'SISI · LENGAN ATAS'}
                </SvgText>
              </G>
            )}

            {/* BOKONG (GLUTE) */}
            {selectedZone === 'bokong' && (
              <G>
                {/* Garis Panduan Kuadran Atas Luar */}
                <Line
                  x1="104"
                  y1="65"
                  x2="104"
                  y2="125"
                  stroke="#38bdf8"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                  opacity={0.3}
                />
                <Line
                  x1="76"
                  y1="95"
                  x2="132"
                  y2="95"
                  stroke="#38bdf8"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                  opacity={0.3}
                />

                <Line
                  x1="196"
                  y1="65"
                  x2="196"
                  y2="125"
                  stroke="#38bdf8"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                  opacity={0.3}
                />
                <Line
                  x1="168"
                  y1="95"
                  x2="224"
                  y2="95"
                  stroke="#38bdf8"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                  opacity={0.3}
                />

                {renderInteractiveSite('BKi', 104, 95)}
                {renderInteractiveSite('BKn', 196, 95)}

                <SvgText
                  x="150"
                  y="252"
                  fill="#64748b"
                  fontSize="8"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {language === 'en' ? 'POSTERIOR · GLUTE' : 'BELAKANG · BOKONG'}
                </SvgText>
              </G>
            )}
          </Svg>
        </View>
      </View>

      {/* Grid Pilihan Titik Manual */}
      <Text
        style={
          styles.sectionHeaderTitle
        }
      >
        {language === 'en' ? 'MANUAL SITE SELECTION' : 'PILIH TITIK MANUAL'} (
        {getZoneLabel(selectedZone)}
        )
      </Text>

      <View
        style={styles.manualGrid}
      >
        {activeZoneSites.map(
          (item) => {
            const isSelected =
              currentSite ===
              item.id;

            return (
              <TouchableOpacity
                key={item.id}
                onPress={() =>
                  setSite(
                    item.id,
                  )
                }
                style={[
                  styles.manualSiteCard,
                  isSelected &&
                    styles.manualSiteCardActive,
                ]}
              >
                <View
                  style={
                    styles.siteCardTop
                  }
                >
                  <Text
                    style={[
                      styles.siteCardCode,
                      isSelected &&
                        styles.siteCardCodeActive,
                    ]}
                  >
                    {item.code}
                  </Text>

                  {isSelected ? (
                    <CheckCircle2
                      size={16}
                      color="#10b981"
                    />
                  ) : (
                    <Clock
                      size={14}
                      color="#64748b"
                    />
                  )}
                </View>

                <Text
                  style={
                    styles.siteCardName
                  }
                >
                  {item.name}
                </Text>

                <Text
                  style={
                    styles.siteCardSub
                  }
                >
                  {getSiteLastUsed(
                    item.id,
                  )}
                </Text>
              </TouchableOpacity>
            );
          },
        )}
      </View>

      <View
        style={styles.safetyCard}
      >
        <ShieldCheck
          size={16}
          color="#10b981"
        />

        <Text
          style={styles.safetyText}
        >
          {language === 'en'
            ? 'Maintain at least 2.5 cm distance from previous injection sites to preserve subcutaneous tissue elasticity.'
            : 'Jarak penyuntikan minimal 2.5 cm dari bekas tusukan sebelumnya untuk menjaga elastisitas jaringan lemak subkutan.'}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },

  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 104,
    gap: 12,
  },

  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },

  bannerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor:
      'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  bannerContent: {
    flex: 1,
  },

  bannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },

  bannerDesc: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },

  activeTargetCard: {
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor:
      'rgba(16, 185, 129, 0.3)',
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },

  targetHeaderRow: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
  },

  targetLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 0.5,
  },

  targetName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 2,
  },

  targetCodeBadge: {
    backgroundColor:
      'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  targetCodeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10b981',
  },

  targetSubText: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 8,
  },

  rotateActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 10,
  },

  rotateActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#022c22',
  },

  zoneSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: '#090d16',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 4,
  },

  zoneTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },

  zoneTabActive: {
    backgroundColor:
      'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
  },

  zoneTabText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },

  zoneTabTextActive: {
    color: '#10b981',
  },

  visualMapCard: {
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },

  mapHeaderTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },

  svgContainer: {
    backgroundColor: '#030712',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    height: 270,
    overflow: 'hidden',
    position: 'relative',
  },

  anatomyBgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },

  anatomyOverlaySvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },

  sectionHeaderTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginTop: 4,
  },

  manualGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  manualSiteCard: {
    width: '48.5%',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },

  manualSiteCardActive: {
    borderColor: '#10b981',
    backgroundColor:
      'rgba(16, 185, 129, 0.05)',
  },

  siteCardTop: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
  },

  siteCardCode: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
  },

  siteCardCodeActive: {
    color: '#10b981',
  },

  siteCardName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },

  siteCardSub: {
    fontSize: 9,
    color: '#64748b',
  },

  safetyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor:
      'rgba(16, 185, 129, 0.05)',
    borderWidth: 1,
    borderColor:
      'rgba(16, 185, 129, 0.2)',
    padding: 12,
    borderRadius: 12,
  },

  safetyText: {
    flex: 1,
    fontSize: 10,
    color: '#94a3b8',
    lineHeight: 14,
  },
});
