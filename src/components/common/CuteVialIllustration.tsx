import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Rect,
  Path,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  G,
  Line,
} from 'react-native-svg';

export interface CuteVialProps {
  progress?: number; // 0 - 100 (% sisa cairan)
  size?: 'xs' | 'sm' | 'md' | 'lg';
  category?: string;
  colorOverride?: string;
  isPowder?: boolean; // True jika vial bubuk di freezer
  dosesLeft?: number; // Jumlah sisa sesi suntik
  showTicks?: boolean;
}

export const CuteVialIllustration: React.FC<CuteVialProps> = ({
  progress = 100,
  size = 'md',
  category = '',
  colorOverride,
  isPowder = false,
  dosesLeft,
  showTicks = true,
}) => {
  // Tentukan dimensi sesuai prop size
  const dimensions = {
    xs: { width: 38, height: 58, scale: 0.53 },
    sm: { width: 52, height: 80, scale: 0.75 },
    md: { width: 72, height: 110, scale: 1 },
    lg: { width: 92, height: 140, scale: 1.28 },
  }[size];

  // Tentukan palet warna cairan berdasarkan kategori peptida
  const getThemeColor = () => {
    if (colorOverride) {
      return { top: colorOverride, bottom: colorOverride, cap: colorOverride, bubble: '#ffffff' };
    }
    const cat = (category || '').toLowerCase();
    if (cat.includes('glp') || cat.includes('weight') || cat.includes('fat') || cat.includes('metabol')) {
      return { top: '#fb923c', bottom: '#ea580c', cap: '#f97316', bubble: '#fed7aa' };
    }
    if (cat.includes('heal') || cat.includes('recover') || cat.includes('injury') || cat.includes('gut')) {
      return { top: '#c2d3b6', bottom: '#95aa88', cap: '#a3be95', bubble: '#eaf2e6' };
    }
    if (cat.includes('gh') || cat.includes('anti-aging') || cat.includes('sleep') || cat.includes('longev')) {
      return { top: '#648cf7', bottom: '#1f4ab2', cap: '#1f4ab2', bubble: '#d6e2ff' };
    }
    if (cat.includes('brain') || cat.includes('neuro') || cat.includes('focus')) {
      return { top: '#fb7185', bottom: '#e11d48', cap: '#f43f5e', bubble: '#fecdd3' };
    }
    // Default Warm Amber / Copper
    return { top: '#DF8A3A', bottom: '#c97528', cap: '#DF8A3A', bubble: '#fef3c7' };
  };

  const theme = getThemeColor();
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const isEmpty = clampedProgress <= 0 && !isPowder;

  // Koordinat badan vial (berdasarkan viewBox 0 0 100 150)
  const bottleTop = 45;
  const bottleBottom = 138;
  const totalHeight = bottleBottom - bottleTop; // 93
  const liquidHeight = (clampedProgress / 100) * totalHeight;
  const liquidY = bottleBottom - liquidHeight;

  return (
    <View style={[styles.container, { width: dimensions.width, height: dimensions.height }]}>
      <Svg viewBox="0 0 100 150" width={dimensions.width} height={dimensions.height}>
        <Defs>
          {/* Gradien Cairan Utama */}
          <LinearGradient id="liquidGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={theme.top} stopOpacity={0.92} />
            <Stop offset="100%" stopColor={theme.bottom} stopOpacity={0.98} />
          </LinearGradient>

          {/* Gradien Kaca Vial */}
          <LinearGradient id="glassGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity={0.16} />
            <Stop offset="25%" stopColor="#DF8A3A" stopOpacity={0.06} />
            <Stop offset="75%" stopColor="#ffffff" stopOpacity={0.04} />
            <Stop offset="100%" stopColor="#ffffff" stopOpacity={0.18} />
          </LinearGradient>

          {/* Gradien Bubuk (Freezer) */}
          <LinearGradient id="powderGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#e2e8f0" stopOpacity={0.95} />
            <Stop offset="100%" stopColor="#94a3b8" stopOpacity={0.9} />
          </LinearGradient>

          {/* Gradien Crimp Metal Aluminium */}
          <LinearGradient id="metalCrimpGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#64748b" />
            <Stop offset="35%" stopColor="#cbd5e1" />
            <Stop offset="70%" stopColor="#94a3b8" />
            <Stop offset="100%" stopColor="#475569" />
          </LinearGradient>
        </Defs>

        {/* 1. BAYANGAN BAWAH BOTOL */}
        <Circle cx="50" cy="144" r="24" fill="#000000" opacity={0.35} />

        {/* 2. LATAR DALAM BOTOL KACA */}
        <Rect
          x="20"
          y="45"
          width="60"
          height="95"
          rx="16"
          ry="16"
          fill="url(#glassGrad)"
          stroke="#475569"
          strokeWidth="3"
        />

        {/* 3. LEHER BOTOL KACA */}
        <Rect
          x="35"
          y="27"
          width="30"
          height="19"
          rx="3"
          fill="url(#glassGrad)"
          stroke="#475569"
          strokeWidth="3"
        />

        {/* 4. ISI DALAM VIAL: CAIRAN BERGELOMBANG ATAU BUBUK */}
        {isPowder ? (
          // Mode Bubuk Beku (Freezer)
          <G>
            <Path
              d="M 23 124 Q 35 119 50 122 Q 65 125 77 121 L 77 130 Q 77 138 69 138 L 31 138 Q 23 138 23 130 Z"
              fill="url(#powderGrad)"
            />
            <Circle cx="35" cy="127" r="1.5" fill="#f8fafc" opacity={0.8} />
            <Circle cx="48" cy="125" r="2" fill="#ffffff" opacity={0.9} />
            <Circle cx="62" cy="128" r="1.5" fill="#cbd5e1" opacity={0.8} />
            
            {/* Sparkle Kristal Es */}
            <Path
              d="M 50 72 L 52 79 L 59 81 L 52 83 L 50 90 L 48 83 L 41 81 L 48 79 Z"
              fill="#38bdf8"
              opacity={0.85}
            />
            <Path
              d="M 33 58 L 34.5 63 L 39.5 64.5 L 34.5 66 L 33 71 L 31.5 66 L 26.5 64.5 L 31.5 63 Z"
              fill="#bae6fd"
              opacity={0.7}
            />
          </G>
        ) : (
          // Mode Cairan Aktif (Fridge)
          !isEmpty && (
            <G>
              {/* Permukaan Cairan Bergelombang */}
              <Path
                d={`
                  M 23 ${liquidY + 4}
                  Q 36 ${liquidY - 3} 50 ${liquidY + 2}
                  T 77 ${liquidY + 1}
                  L 77 126
                  Q 77 137 66 137
                  L 34 137
                  Q 23 137 23 126
                  Z
                `}
                fill="url(#liquidGrad)"
              />

              {/* Garis Kilau Permukaan Air */}
              <Path
                d={`M 26 ${liquidY + 3} Q 40 ${liquidY - 2} 54 ${liquidY + 2} T 74 ${liquidY + 1}`}
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                opacity={0.7}
                fill="none"
              />

              {/* Gelembung Udara Lucu */}
              {clampedProgress > 25 && (
                <Circle
                  cx="36"
                  cy={Math.min(128, liquidY + 18)}
                  r="3.2"
                  fill={theme.bubble}
                  opacity={0.75}
                />
              )}
              {clampedProgress > 45 && (
                <Circle
                  cx="58"
                  cy={Math.min(130, liquidY + 30)}
                  r="2.2"
                  fill={theme.bubble}
                  opacity={0.7}
                />
              )}
              {clampedProgress > 60 && (
                <Circle
                  cx="44"
                  cy={Math.min(132, liquidY + 42)}
                  r="1.8"
                  fill="#ffffff"
                  opacity={0.8}
                />
              )}
            </G>
          )
        )}

        {/* 5. GARIS STRIP TAKARAN DOSIS */}
        {showTicks && !isPowder && (
          <G opacity={0.45}>
            <Line x1="70" y1="65" x2="74" y2="65" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
            <Line x1="68" y1="80" x2="74" y2="80" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
            <Line x1="70" y1="95" x2="74" y2="95" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
            <Line x1="68" y1="110" x2="74" y2="110" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
            <Line x1="70" y1="125" x2="74" y2="125" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
          </G>
        )}

        {/* 6. PANTULAN KILAU KACA KARTUN */}
        <Path
          d="M 28 55 L 28 122 Q 28 130 32 132 Q 31 118 31 60 Q 31 56 28 55 Z"
          fill="#ffffff"
          opacity={0.35}
        />
        <Circle cx="29" cy="53" r="1.5" fill="#ffffff" opacity={0.6} />

        {/* 7. RING ALUMINIUM CRIMP */}
        <Rect
          x="32"
          y="18"
          width="36"
          height="11"
          rx="3"
          fill="url(#metalCrimpGrad)"
          stroke="#334155"
          strokeWidth="2"
        />
        <Line x1="34" y1="23" x2="66" y2="23" stroke="#ffffff" strokeWidth="1.2" opacity={0.5} />

        {/* 8. TUTUP KARET BERWARNA (FLIP-TOP CAP) */}
        <Rect
          x="30"
          y="8"
          width="40"
          height="12"
          rx="5"
          fill={theme.cap}
          stroke="#1e293b"
          strokeWidth="2.5"
        />
        <Path
          d="M 35 11 Q 50 9 65 11"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          opacity={0.65}
          fill="none"
        />

        {/* 9. EKSPRESI VIAL KOSONG (JIKA HABIS) */}
        {isEmpty && (
          <G opacity={0.7}>
            <Circle cx="44" cy="90" r="2" fill="#94a3b8" />
            <Circle cx="56" cy="90" r="2" fill="#94a3b8" />
            <Path
              d="M 46 98 Q 50 95 54 98"
              stroke="#94a3b8"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </G>
        )}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
