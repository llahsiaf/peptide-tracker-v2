import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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

export interface CuteSyringeProps {
  u100Units: number; // e.g. 10 to 100 IU
  volMl: number;     // e.g. 0.1 mL
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CuteSyringeIllustration: React.FC<CuteSyringeProps> = ({
  u100Units = 10,
  volMl = 0.1,
  color = '#10b981',
  size = 'md',
}) => {
  const clampedUnits = Math.min(100, Math.max(0, u100Units));

  // Barrel dimensions in SVG viewBox 0 0 320 80
  const barrelStart = 60;
  const barrelEnd = 240;
  const barrelLength = barrelEnd - barrelStart; // 180
  const fillWidth = (clampedUnits / 100) * barrelLength;
  const plungerX = barrelStart + fillWidth;

  const width = size === 'sm' ? 240 : size === 'lg' ? 340 : 290;
  const height = size === 'sm' ? 65 : size === 'lg' ? 90 : 75;

  return (
    <View style={styles.wrapper}>
      <Svg viewBox="0 0 320 80" width={width} height={height}>
        <Defs>
          <LinearGradient id="syrLiquidGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity={0.85} />
            <Stop offset="100%" stopColor={color} stopOpacity={0.98} />
          </LinearGradient>
          <LinearGradient id="syrPlungerGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#94a3b8" />
            <Stop offset="50%" stopColor="#cbd5e1" />
            <Stop offset="100%" stopColor="#64748b" />
          </LinearGradient>
          <LinearGradient id="syrGlassGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity={0.2} />
            <Stop offset="40%" stopColor="#38bdf8" stopOpacity={0.06} />
            <Stop offset="100%" stopColor="#ffffff" stopOpacity={0.12} />
          </LinearGradient>
        </Defs>

        {/* 1. JARUM SPUIT (NEEDLE) */}
        <Line x1="12" y1="40" x2="52" y2="40" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M 12 39 L 16 38 L 16 41 Z" fill="#cbd5e1" />

        {/* 2. HUB JARUM (NEEDLE HUB - ORANGE/TRANSPARENT CAP) */}
        <Path d="M 50 32 L 60 30 L 60 50 L 50 48 Z" fill="#fb923c" stroke="#ea580c" strokeWidth="1.5" />

        {/* 3. BATANG PENDORONG (PLUNGER ROD) */}
        <Rect
          x={plungerX}
          y="35"
          width={Math.max(10, 290 - plungerX)}
          height="10"
          rx="3"
          fill="url(#syrPlungerGrad)"
        />
        {/* Tombol Pendorong Ujung (Thumb Rest) */}
        <Rect
          x={Math.max(plungerX + 20, 288)}
          y="25"
          width="8"
          height="30"
          rx="3"
          fill="#475569"
          stroke="#64748b"
          strokeWidth="1.5"
        />

        {/* 4. CAIRAN DI DALAM TABUNG SPUIT (LIQUID IN BARREL) */}
        {fillWidth > 0 && (
          <Rect
            x={barrelStart}
            y="23"
            width={fillWidth}
            height="34"
            fill="url(#syrLiquidGrad)"
          />
        )}

        {/* 5. KARET SEAL PISTON HITAM (BLACK RUBBER STOPPER) */}
        <Rect
          x={Math.max(barrelStart, plungerX - 5)}
          y="21"
          width="8"
          height="38"
          rx="2"
          fill="#1e293b"
          stroke="#0f172a"
          strokeWidth="1.5"
        />

        {/* 6. TABUNG KACA SPUIT (GLASS BARREL) */}
        <Rect
          x={barrelStart}
          y="20"
          width={barrelLength}
          height="40"
          rx="6"
          fill="url(#syrGlassGrad)"
          stroke="#475569"
          strokeWidth="2.5"
        />

        {/* Sayap Jari (Finger Grips / Flanges) */}
        <Rect x="238" y="10" width="7" height="60" rx="3" fill="#334155" stroke="#475569" strokeWidth="1.5" />

        {/* 7. GARIS TIK TAKARAN U-100 (CALIBRATION TICKS) */}
        {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((unit) => {
          const x = barrelStart + (unit / 100) * barrelLength;
          const isMajor = unit % 20 === 0;
          return (
            <Line
              key={unit}
              x1={x}
              y1={20}
              x2={x}
              y2={isMajor ? 32 : 27}
              stroke="#ffffff"
              strokeWidth={isMajor ? 1.8 : 1}
              opacity={0.7}
            />
          );
        })}

        {/* 8. KILAU KACA KARTUN */}
        <Line
          x1={barrelStart + 8}
          y1="25"
          x2={barrelEnd - 8}
          y2="25"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity={0.4}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
