/**
 * Profil altimétrique dessiné en SVG (react-native-svg).
 *
 * - Rempli sous la courbe en dégradé ardoise → jaune Frontale très atténué.
 * - Ligne de profil en jaune Frontale, fine et continue.
 * - Axes discrets : distance (km) en abscisse, altitude (m) en ordonnée.
 */
import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  G,
  Path,
  Defs,
  LinearGradient,
  Stop,
  Line,
  Text as SvgText,
} from 'react-native-svg';
import { colors, spacing } from '@/constants/theme';
import type { ElevationPoint } from '@/types/race.types';

interface ElevationChartProps {
  data: ElevationPoint[];
  width: number;
  height?: number;
}

const PAD = { top: 16, right: 8, bottom: 24, left: 42 };

export function ElevationChart({ data, width, height = 120 }: ElevationChartProps) {
  const cw = width - PAD.left - PAD.right;
  const ch = height - PAD.top - PAD.bottom;

  const { linePath, fillPath, yTicks, xTicks } = useMemo(() => {
    if (data.length < 2) return { linePath: '', fillPath: '', yTicks: [], xTicks: [] };

    const maxDist = data[data.length - 1].distanceM;
    const elevs = data.map((p) => p.elevationM);
    const minE = Math.min(...elevs);
    const maxE = Math.max(...elevs);
    const rangeE = maxE - minE || 1;

    const tx = (d: number) => (d / maxDist) * cw;
    const ty = (e: number) => ch - ((e - minE) / rangeE) * ch;

    const pts = data
      .map((p) => `${tx(p.distanceM).toFixed(1)},${ty(p.elevationM).toFixed(1)}`)
      .join(' L ');

    const line = `M ${pts}`;
    const fill = `${line} L ${tx(maxDist).toFixed(1)},${ch} L 0,${ch} Z`;

    const yStep = rangeE / 2;
    const yT = [0, 1, 2].map((i) => ({
      y: ty(minE + i * yStep),
      label: `${Math.round(minE + i * yStep)}`,
    }));

    const totalKm = maxDist / 1000;
    const xT = [0, 0.33, 0.66, 1].map((t) => ({
      x: t * cw,
      label: `${(t * totalKm).toFixed(0)} km`,
    }));

    return { linePath: line, fillPath: fill, yTicks: yT, xTicks: xT };
  }, [data, cw, ch]);

  if (!data.length) return null;

  return (
    <View style={styles.wrapper}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="elvGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.accent} stopOpacity="0.2" />
            <Stop offset="1" stopColor={colors.accent} stopOpacity="0.02" />
          </LinearGradient>
        </Defs>

        <G x={PAD.left} y={PAD.top}>
          {/* Remplissage */}
          <Path d={fillPath} fill="url(#elvGrad)" />

          {/* Ligne du profil */}
          <Path
            d={linePath}
            stroke={colors.accent}
            strokeWidth={1.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Graduations altitude */}
          {yTicks.map((t, i) => (
            <G key={`y${i}`}>
              <Line
                x1={0} y1={t.y} x2={cw} y2={t.y}
                stroke={colors.border}
                strokeWidth={0.5}
                strokeDasharray="3,4"
              />
              <SvgText x={-4} y={t.y + 3} textAnchor="end" fontSize={9} fill={colors.textMuted}>
                {t.label}
              </SvgText>
            </G>
          ))}

          {/* Graduations distance */}
          {xTicks.map((t, i) => (
            <SvgText
              key={`x${i}`}
              x={t.x}
              y={ch + 14}
              textAnchor="middle"
              fontSize={9}
              fill={colors.textMuted}
            >
              {t.label}
            </SvgText>
          ))}
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginVertical: spacing.xs },
});
