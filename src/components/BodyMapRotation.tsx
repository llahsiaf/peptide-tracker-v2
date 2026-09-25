import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Path,
  Line,
  Circle,
  G,
  Text as SvgText,
} from 'react-native-svg';
import { INJECTION_SITES } from '../database/defaultPeptides';
import { useLanguage } from '../i18n/LanguageContext';

interface BodyMapRotationProps {
  currentSiteIndex: number;
  onSelectSite: (index: number) => void;
}

const SITE_CODE_EN: Record<string, string> = {
  KA: 'RU',
  KiA: 'LU',
  KB: 'RL',
  KiB: 'LL',
};

const SITE_LABEL_EN: Record<string, string> = {
  KA: 'Right Upper (RU)',
  KiA: 'Left Upper (LU)',
  KB: 'Right Lower (RL)',
  KiB: 'Left Lower (LL)',
};

export const BodyMapRotation: React.FC<BodyMapRotationProps> = ({
  currentSiteIndex,
  onSelectSite,
}) => {
  const { language } = useLanguage();
  return (
    <View style={styles.container}>
      <Svg width="100%" height={260} viewBox="0 0 320 320">
        <Defs>
          <LinearGradient id="torsoGrad" x1="160" y1="20" x2="160" y2="300" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor="#291c1b" stopOpacity="0.9" />
            <Stop offset="50%" stopColor="#231716" stopOpacity="0.7" />
            <Stop offset="100%" stopColor="#1a100f" stopOpacity="0.95" />
          </LinearGradient>

          <RadialGradient id="targetGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#bca9ef" stopOpacity="0.6" />
            <Stop offset="60%" stopColor="#bca9ef" stopOpacity="0.25" />
            <Stop offset="100%" stopColor="#bca9ef" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Torso Outer Contour */}
        <Path
          d="M 65,30 C 85,85 75,135 60,185 C 50,225 65,275 90,295 L 230,295 C 255,275 270,225 260,185 C 245,135 235,85 255,30 Z"
          fill="url(#torsoGrad)"
          stroke="#1e293b"
          strokeWidth="2.5"
        />

        {/* Rib Cage Margin Guides */}
        <Path
          d="M 95,55 C 130,95 160,95 160,95 C 160,95 190,95 225,55"
          stroke="#1e293b"
          strokeWidth="2"
          strokeDasharray="4 4"
          strokeLinecap="round"
        />

        {/* Pelvic Hip Contours */}
        <Path
          d="M 75,245 C 110,275 160,275 160,275 C 160,275 210,275 245,245"
          stroke="#1e293b"
          strokeWidth="2"
          strokeDasharray="4 4"
          strokeLinecap="round"
        />

        {/* Linea Alba & Transumbilical Reference Lines */}
        <Line x1="160" y1="50" x2="160" y2="275" stroke="#162035" strokeWidth="1.5" strokeDasharray="3 3" />
        <Line x1="70" y1="160" x2="250" y2="160" stroke="#162035" strokeWidth="1.5" strokeDasharray="3 3" />

        {/* Safe Distance Ring Buffer */}
        <Circle cx="160" cy="160" r="32" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 3" opacity="0.4" />

        {/* Belly Button (Umbilicus) */}
        <Circle cx="160" cy="160" r="10" fill="#1a100f" stroke="#bca9ef" strokeWidth="2" />
        <Circle cx="160" cy="160" r="4" fill="#bca9ef" />
        <SvgText x="160" y="145" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="800">
          {language === 'en' ? 'NAVEL' : 'PUSAR'}
        </SvgText>

        {/* 4 Quadrants Interactive Targets */}
        {INJECTION_SITES.map((site, idx) => {
          const isCurrent = idx === currentSiteIndex;
          const displayCode = language === 'en' ? (SITE_CODE_EN[site.code] || site.code) : site.code;
          const displayLabel = language === 'en'
            ? (SITE_LABEL_EN[site.code] || site.name)
            : `${site.name.split(' ')[0]} ${site.name.split(' ')[1]}`;

          return (
            <G key={site.id} onPress={() => onSelectSite(idx)}>
              {isCurrent && (
                <>
                  <Circle cx={site.cx} cy={site.cy} r="34" fill="url(#targetGlow)" />
                  <Circle cx={site.cx} cy={site.cy} r="28" stroke="#bca9ef" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.9" />
                </>
              )}

              <Circle
                cx={site.cx}
                cy={site.cy}
                r="22"
                fill={isCurrent ? '#352423' : '#0e1424'}
                stroke={isCurrent ? '#bca9ef' : '#1e293b'}
                strokeWidth={isCurrent ? '2.5' : '1.5'}
              />

              <Circle cx={site.cx} cy={site.cy} r="5" fill={isCurrent ? '#c2d3b6' : '#334155'} />

              <SvgText
                x={site.cx}
                y={site.cy + 3}
                textAnchor="middle"
                fill={isCurrent ? '#ffffff' : '#94a3b8'}
                fontSize="9"
                fontWeight="900"
                fontFamily="monospace"
              >
                {displayCode}
              </SvgText>

              <SvgText
                x={site.cx}
                y={site.cy + 32}
                textAnchor="middle"
                fill={isCurrent ? '#c2d3b6' : '#64748b'}
                fontSize="8"
                fontWeight="700"
              >
                {displayLabel}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#231716',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
});
