import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, G, Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';
import { useLanguage } from '../i18n/LanguageContext';

export interface SyringeVisualizerProps {
  u100Units: number;
  volMl?: number;
  showHeader?: boolean;
}

export const SyringeVisualizer: React.FC<SyringeVisualizerProps> = ({
  u100Units,
  volMl,
  showHeader = true,
}) => {
  const { language } = useLanguage();
  const boundedUnits = Math.max(0, Math.min(100, Math.round(u100Units)));
  
  // Orientasi Benar:
  // Jarum & 0 IU di KIRI, Skala 0 s/d 100 ke KANAN, Plunger & Gagang di KANAN
  const barrelStartX = 54;
  const barrelWidth = 180;
  const barrelHeight = 36;
  const barrelY = 17;
  const barrelEndX = barrelStartX + barrelWidth; // 234

  const fillWidth = (boundedUnits / 100) * barrelWidth;
  const targetX = barrelStartX + fillWidth;
  // Plunger ditarik ke kanan: pangkal batang ikut bergerak mundur saat dosis ditarik
  const plungerShaftEnd = Math.min(292, barrelEndX + 18 + (boundedUnits / 100) * 36);

  return (
    <View style={showHeader ? styles.container : styles.inlineContainer}>
      {showHeader && (
        <View style={styles.headerRow}>
          <Text style={styles.title}>
            {language === 'en' ? 'U-100 Syringe Simulation' : 'Simulasi Spuit U-100'}
          </Text>
          {volMl !== undefined && (
            <Text style={styles.badgeText}>
              {boundedUnits} IU ({volMl.toFixed(3)} mL)
            </Text>
          )}
        </View>
      )}

      <Svg width="100%" height={80} viewBox="0 0 300 80">
        <Defs>
          <LinearGradient id="syringeLiquidGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#059669" stopOpacity="0.85" />
            <Stop offset="100%" stopColor="#10b981" stopOpacity="0.95" />
          </LinearGradient>
          <LinearGradient id="syringeBarrelGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#0f172a" stopOpacity="0.9" />
            <Stop offset="100%" stopColor="#090d16" stopOpacity="0.95" />
          </LinearGradient>
        </Defs>

        {/* 1. Jarum & Hub di KIRI (Menempel di titik 0 IU) */}
        {/* Kanula Jarum (Needle Cannula) */}
        <Line
          x1="12"
          y1={barrelY + barrelHeight / 2}
          x2="44"
          y2={barrelY + barrelHeight / 2}
          stroke="#94a3b8"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Beveled Tip Jarum */}
        <Line
          x1="12"
          y1={barrelY + barrelHeight / 2}
          x2="15"
          y2={barrelY + barrelHeight / 2 - 1.5}
          stroke="#cbd5e1"
          strokeWidth="1.5"
        />
        {/* Hub Plastik Jarum */}
        <Rect
          x="44"
          y={barrelY + 8}
          width="10"
          height={barrelHeight - 16}
          rx="2"
          fill="#334155"
          stroke="#475569"
          strokeWidth="1"
        />

        {/* 2. Tabung Spuit Utama (Barrel) */}
        <Rect
          x={barrelStartX}
          y={barrelY}
          width={barrelWidth}
          height={barrelHeight}
          rx="5"
          fill="url(#syringeBarrelGrad)"
          stroke="#1e293b"
          strokeWidth="1.5"
        />

        {/* 3. Sayap Belakang Spuit (Finger Flange) */}
        <Rect
          x={barrelEndX - 2}
          y={barrelY - 5}
          width="6"
          height={barrelHeight + 10}
          rx="2"
          fill="#1e293b"
          stroke="#334155"
          strokeWidth="1.2"
        />

        {/* 4. Cairan Peptida Hijau (Mengisi dari Kiri / 0 IU ke Kanan) */}
        {fillWidth > 0 && (
          <Rect
            x={barrelStartX + 1}
            y={barrelY + 1.5}
            width={Math.min(barrelWidth - 2, fillWidth)}
            height={barrelHeight - 3}
            rx="3"
            fill="url(#syringeLiquidGrad)"
          />
        )}

        {/* 5. Karet Penahan Piston (Rubber Stopper) di Ujung Cairan */}
        <Rect
          x={Math.max(barrelStartX, targetX - 4)}
          y={barrelY + 2}
          width="6"
          height={barrelHeight - 4}
          rx="2"
          fill="#0f172a"
          stroke="#334155"
          strokeWidth="1.2"
        />

        {/* 6. Batang Pendorong Plunger & Flange Jempol (Di Kanan) */}
        <Line
          x1={Math.max(barrelStartX + 2, targetX + 2)}
          y1={barrelY + barrelHeight / 2}
          x2={plungerShaftEnd}
          y2={barrelY + barrelHeight / 2}
          stroke="#334155"
          strokeWidth="4"
          strokeLinecap="square"
        />
        {/* Bantalan Jempol (Thumb Rest) */}
        <Rect
          x={plungerShaftEnd - 2}
          y={barrelY - 4}
          width="6"
          height={barrelHeight + 8}
          rx="2"
          fill="#1e293b"
          stroke="#334155"
          strokeWidth="1.2"
        />

        {/* 7. Skala Garis Ukur (0 s.d 100 IU Mengalir dari Kiri ke Kanan) */}
        {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((tick) => {
          const x = barrelStartX + (tick / 100) * barrelWidth;
          const isMajor = tick % 20 === 0;
          return (
            <G key={`tick-${tick}`}>
              <Line
                x1={x}
                y1={barrelY}
                x2={x}
                y2={barrelY + (isMajor ? 10 : 5)}
                stroke={isMajor ? '#64748b' : '#334155'}
                strokeWidth={isMajor ? 1.2 : 0.8}
              />
              {isMajor && (
                <SvgText
                  x={x}
                  y={barrelY + 24}
                  fill="#94a3b8"
                  fontSize="8"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {tick}
                </SvgText>
              )}
            </G>
          );
        })}

        {/* 8. Garis Bidik Target & Label Dosis */}
        {boundedUnits > 0 && (
          <G>
            {/* Garis bidik vertikal hijau neon */}
            <Line
              x1={targetX}
              y1={barrelY - 4}
              x2={targetX}
              y2={barrelY + barrelHeight + 4}
              stroke="#10b981"
              strokeWidth="2"
            />
            {/* Pointer segitiga */}
            <Polygon
              points={`${targetX - 4},${barrelY + barrelHeight + 7} ${targetX + 4},${barrelY + barrelHeight + 7} ${targetX},${barrelY + barrelHeight + 2}`}
              fill="#10b981"
            />
            {/* Teks Mark X IU */}
            <SvgText
              x={targetX}
              y={barrelY + barrelHeight + 17}
              fill="#10b981"
              fontSize="9"
              fontWeight="800"
              textAnchor="middle"
            >
              {language === 'en' ? `Mark ${boundedUnits} IU` : `Garis ${boundedUnits} IU`}
            </SvgText>
          </G>
        )}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#090d16',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginVertical: 6,
  },
  inlineContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34d399',
    fontFamily: 'Courier',
  },
});
