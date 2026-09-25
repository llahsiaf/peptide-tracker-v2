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

export interface CheerfulHistoryBadgeProps {
  size?: number;
}

export const CheerfulHistoryBadge: React.FC<CheerfulHistoryBadgeProps> = ({
  size = 48,
}) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg viewBox="0 0 64 64" width={size} height={size}>
        <Defs>
          {/* Gradien Kotak Utama: Warm Tangerine Amber */}
          <LinearGradient id="historyBoxGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#fb923c" />
            <Stop offset="50%" stopColor="#f59e0b" />
            <Stop offset="100%" stopColor="#d97706" />
          </LinearGradient>

          {/* Gradien Atap / Cap: Soft Cream Sunset */}
          <LinearGradient id="historyCapGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#ffffff" />
            <Stop offset="100%" stopColor="#fed7aa" />
          </LinearGradient>

          {/* Gradien Piringan Jam: Pure Clean Cream White */}
          <LinearGradient id="clockFaceGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#ffffff" />
            <Stop offset="100%" stopColor="#fffbeb" />
          </LinearGradient>

          {/* Gradien Pita Bookmark Hijau Mint Segar */}
          <LinearGradient id="ribbonGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#a7f3d0" />
            <Stop offset="100%" stopColor="#34d399" />
          </LinearGradient>
        </Defs>

        {/* Winder Crown Loop di bagian atas (ala Pocket Watch / Chrono Vault) */}
        <Rect
          x="27"
          y="7"
          width="10"
          height="6"
          rx="2"
          fill="#fde047"
          stroke="#b45309"
          strokeWidth="1.8"
        />

        {/* Kotak Vault Riwayat Mini Rounded */}
        <Rect
          x="8"
          y="12"
          width="48"
          height="42"
          rx="10"
          fill="url(#historyBoxGrad)"
          stroke="#9a3412"
          strokeWidth="2.5"
        />

        {/* Lapisan Cap Atap Halus (Wavy Cap senada dengan Freezer) */}
        <Path
          d="M 8 22 Q 14 26 20 23 Q 26 27 32 24 Q 38 28 44 23 Q 50 26 56 22 L 56 18 Q 56 12 50 12 L 14 12 Q 8 12 8 18 Z"
          fill="url(#historyCapGrad)"
        />

        {/* Pita Penanda Buku / Ribbon Cheerful di pojok kanan */}
        <Path
          d="M 45 12 L 45 27 L 48.5 24 L 52 27 L 52 12 Z"
          fill="url(#ribbonGrad)"
          stroke="#059669"
          strokeWidth="1"
        />

        {/* Piringan Jam Bulat Putih Bersih di Tengah */}
        <Circle
          cx="31"
          cy="36"
          r="12.5"
          fill="url(#clockFaceGrad)"
          stroke="#b45309"
          strokeWidth="1.8"
        />

        {/* Indikator Jam 12, 3, 6, 9 */}
        <Circle cx="31" cy="26" r="1" fill="#b45309" />
        <Circle cx="41" cy="36" r="1" fill="#b45309" />
        <Circle cx="31" cy="46" r="1" fill="#b45309" />
        <Circle cx="21" cy="36" r="1" fill="#b45309" />

        {/* Jarum Jam Ceria 10:10 (Pose Senyum) */}
        <Line
          x1="31"
          y1="36"
          x2="26"
          y2="30"
          stroke="#9a3412"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <Line
          x1="31"
          y1="36"
          x2="37"
          y2="29"
          stroke="#ea580c"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Pin Tengah Jarum Jam */}
        <Circle cx="31" cy="36" r="2.2" fill="#c2410c" />
        <Circle cx="31" cy="36" r="0.9" fill="#ffffff" />

        {/* Kilau Bintang Sparkle Putih (Meniru Freezer Snowflake Sparkles) */}
        <G transform="translate(13, 24)">
          <Line x1="4" y1="0" x2="4" y2="8" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
          <Line x1="0" y1="4" x2="8" y2="4" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
        </G>
        <Circle cx="16" cy="47" r="1.5" fill="#ffffff" opacity={0.95} />
        <Circle cx="44" cy="48" r="1.3" fill="#ffffff" opacity={0.85} />
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
