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

export interface FrostyBadgeProps {
  size?: number;
  count?: number;
}

export const FrostyFreezerBadge: React.FC<FrostyBadgeProps> = ({
  size = 48,
}) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg viewBox="0 0 64 64" width={size} height={size}>
        <Defs>
          <LinearGradient id="frostyBoxGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#38bdf8" />
            <Stop offset="100%" stopColor="#0284c7" />
          </LinearGradient>
          <LinearGradient id="snowGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#ffffff" />
            <Stop offset="100%" stopColor="#bae6fd" />
          </LinearGradient>
        </Defs>

        {/* Kotak Freezer Mini Rounded */}
        <Rect
          x="8"
          y="12"
          width="48"
          height="42"
          rx="10"
          fill="url(#frostyBoxGrad)"
          stroke="#0369a1"
          strokeWidth="2.5"
        />

        {/* Lapisan Salju Tebal di Atap Kotak (Snow Cap) */}
        <Path
          d="M 8 22 Q 14 26 20 23 Q 26 27 32 24 Q 38 28 44 23 Q 50 26 56 22 L 56 18 Q 56 12 50 12 L 14 12 Q 8 12 8 18 Z"
          fill="url(#snowGrad)"
        />

        {/* Gagang Pintu Kulkas Mini */}
        <Rect x="46" y="28" width="4" height="12" rx="2" fill="#ffffff" opacity={0.85} />

        {/* Kristal Es Berkilau (Snowflake Sparkle) */}
        <G transform="translate(24, 28)">
          <Line x1="8" y1="0" x2="8" y2="16" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
          <Line x1="0" y1="8" x2="16" y2="8" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
          <Line x1="2.5" y1="2.5" x2="13.5" y2="13.5" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
          <Line x1="13.5" y1="2.5" x2="2.5" y2="13.5" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
          <Circle cx="8" cy="8" r="2" fill="#bae6fd" />
        </G>

        {/* Kilau Bintang Kecil */}
        <Circle cx="16" cy="46" r="1.5" fill="#ffffff" opacity={0.9} />
        <Circle cx="44" cy="48" r="1.2" fill="#ffffff" opacity={0.8} />
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
