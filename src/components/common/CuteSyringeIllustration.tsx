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
  Polygon,
  Text as SvgText,
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
  color = '#bca9ef',
  size = 'md',
}) => {
  const clampedUnits = Math.min(100, Math.max(0, u100Units));

  // Barrel dimensions in SVG viewBox 0 0 350 110
  const barrelStart = 65;
  const barrelEnd = 265;
  const barrelLength = barrelEnd - barrelStart; // 200 units for 100 IU = 2 units per IU
  const barrelTop = 38;
  const barrelHeight = 44;
  const barrelBottom = barrelTop + barrelHeight; // 82

  const fillWidth = (clampedUnits / 100) * barrelLength;
  const plungerX = barrelStart + fillWidth;

  const width = size === 'sm' ? 260 : size === 'lg' ? 360 : 315;
  const height = size === 'sm' ? 80 : size === 'lg' ? 115 : 98;

  // Major units to display numeric text for
  const tickUnits = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const minorTicks = Array.from({ length: 51 }, (_, i) => i * 2);

  return (
    <View style={styles.wrapper}>
      <Svg viewBox="0 0 350 110" width={width} height={height}>
        <Defs>
          {/* Gradient Cairan Ceria */}
          <LinearGradient id="syrLiquidGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity={0.80} />
            <Stop offset="100%" stopColor={color} stopOpacity={0.98} />
          </LinearGradient>

          {/* Gradient Batang Pendorong */}
          <LinearGradient id="syrPlungerGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#94a3b8" />
            <Stop offset="50%" stopColor="#e2e8f0" />
            <Stop offset="100%" stopColor="#64748b" />
          </LinearGradient>

          {/* Gradient Tabung Kaca Transparan */}
          <LinearGradient id="syrGlassGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity={0.16} />
            <Stop offset="50%" stopColor="#bca9ef" stopOpacity={0.06} />
            <Stop offset="100%" stopColor="#ffffff" stopOpacity={0.08} />
          </LinearGradient>
        </Defs>

        {/* 1. JARUM SPUIT (STAINLESS STEEL NEEDLE) */}
        <Line x1="10" y1={barrelTop + barrelHeight / 2} x2="52" y2={barrelTop + barrelHeight / 2} stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
        <Path
          d={`M 10 ${barrelTop + barrelHeight / 2 - 1} L 15 ${barrelTop + barrelHeight / 2 - 2} L 15 ${barrelTop + barrelHeight / 2 + 1} Z`}
          fill="#f8fafc"
        />

        {/* 2. HUB JARUM (ORANGE SAFETY HUB) */}
        <Path
          d={`M 50 ${barrelTop + 10} L 65 ${barrelTop + 8} L 65 ${barrelBottom - 8} L 50 ${barrelBottom - 10} Z`}
          fill="#fb923c"
          stroke="#ea580c"
          strokeWidth="1.5"
        />

        {/* 3. BATANG PENDORONG (PLUNGER ROD) */}
        <Rect
          x={plungerX}
          y={barrelTop + barrelHeight / 2 - 6}
          width={Math.max(10, 320 - plungerX)}
          height="12"
          rx="3"
          fill="url(#syrPlungerGrad)"
        />

        {/* Tombol Pendorong Ujung (Thumb Rest) */}
        <Rect
          x={Math.max(plungerX + 24, 320)}
          y={barrelTop - 4}
          width="9"
          height={barrelHeight + 8}
          rx="4"
          fill="#334155"
          stroke="#64748b"
          strokeWidth="1.8"
        />

        {/* 4. CAIRAN DALAM TABUNG SPUIT */}
        {fillWidth > 0 && (
          <G>
            <Rect
              x={barrelStart}
              y={barrelTop + 3}
              width={fillWidth}
              height={barrelHeight - 6}
              fill="url(#syrLiquidGrad)"
            />
            {/* Gelembung Kartun Mini */}
            {fillWidth > 30 && (
              <>
                <Circle cx={barrelStart + 16} cy={barrelTop + 14} r="2.5" fill="#ffffff" opacity={0.6} />
                <Circle cx={barrelStart + 35} cy={barrelTop + 26} r="2" fill="#ffffff" opacity={0.5} />
              </>
            )}
            {fillWidth > 70 && (
              <Circle cx={barrelStart + fillWidth - 18} cy={barrelTop + 16} r="2.2" fill="#ffffff" opacity={0.65} />
            )}
          </G>
        )}

        {/* 5. KARET SEAL HITAM PISTON (BLACK RUBBER STOPPER) */}
        <Rect
          x={Math.max(barrelStart, plungerX - 6)}
          y={barrelTop + 2}
          width="9"
          height={barrelHeight - 4}
          rx="2.5"
          fill="#0f172a"
          stroke="#334155"
          strokeWidth="1.5"
        />

        {/* 6. TABUNG KACA SPUIT (GLASS BARREL) */}
        <Rect
          x={barrelStart}
          y={barrelTop}
          width={barrelLength}
          height={barrelHeight}
          rx="8"
          fill="url(#syrGlassGrad)"
          stroke="#475569"
          strokeWidth="2.5"
        />

        {/* Sayap Jari (Finger Grips / Flanges) */}
        <Rect
          x={barrelEnd}
          y={barrelTop - 12}
          width="8"
          height={barrelHeight + 24}
          rx="4"
          fill="#1e293b"
          stroke="#475569"
          strokeWidth="1.8"
        />

        {/* 7. GARIS TIK MINOR (Setiap 2 IU) */}
        {minorTicks.map((unit) => {
          if (unit % 10 === 0) return null; // Dilewati karena ditangani major ticks
          const x = barrelStart + (unit / 100) * barrelLength;
          return (
            <Line
              key={`minor-${unit}`}
              x1={x}
              y1={barrelTop}
              x2={x}
              y2={barrelTop + 6}
              stroke="#cbd5e1"
              strokeWidth="0.8"
              opacity={0.5}
            />
          );
        })}

        {/* 8. GARIS TIK MAJOR & ANGKA DETAIL (0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100) */}
        {tickUnits.map((unit) => {
          const x = barrelStart + (unit / 100) * barrelLength;
          const isPrime = unit % 20 === 0;
          return (
            <G key={`major-${unit}`}>
              {/* Garis Ukur */}
              <Line
                x1={x}
                y1={barrelTop}
                x2={x}
                y2={barrelTop + (isPrime ? 14 : 10)}
                stroke="#ffffff"
                strokeWidth={isPrime ? 1.8 : 1.2}
                opacity={0.9}
              />
              {/* Teks Angka Satuan Skala U-100 */}
              <SvgText
                x={x}
                y={barrelTop + 24}
                fill={clampedUnits >= unit && unit > 0 ? '#ffffff' : '#94a3b8'}
                fontSize="8.5"
                fontWeight="900"
                textAnchor="middle"
              >
                {unit}
              </SvgText>
            </G>
          );
        })}

        {/* 9. POINTER AKTIF TINGKAT DOSIS (ACTIVE DOSE PIN / POINTER) */}
        {clampedUnits > 0 && (
          <G>
            {/* Garis penunjuk vertikal lilac */}
            <Line
              x1={plungerX}
              y1={barrelTop - 14}
              x2={plungerX}
              y2={barrelBottom + 2}
              stroke="#bca9ef"
              strokeWidth="2"
              strokeDasharray="2 2"
              opacity={0.85}
            />
            {/* Badge penanda di atas plunger */}
            <Rect
              x={Math.max(barrelStart - 5, Math.min(plungerX - 22, barrelEnd - 25))}
              y={barrelTop - 25}
              width="44"
              height="16"
              rx="8"
              fill="#231716"
              stroke="#bca9ef"
              strokeWidth="1.5"
            />
            <SvgText
              x={Math.max(barrelStart - 5, Math.min(plungerX - 22, barrelEnd - 25)) + 22}
              y={barrelTop - 14}
              fill="#bca9ef"
              fontSize="9"
              fontWeight="900"
              textAnchor="middle"
            >
              {clampedUnits} IU
            </SvgText>
          </G>
        )}

        {/* 10. KILAU KACA KARTUN */}
        <Line
          x1={barrelStart + 8}
          y1={barrelTop + 5}
          x2={barrelEnd - 8}
          y2={barrelTop + 5}
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          opacity={0.45}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
});
