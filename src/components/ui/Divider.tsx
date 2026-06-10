/** Séparateur horizontal avec texte optionnel centré (ex. « ou »). */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { colors, spacing } from '@/constants/theme';

interface DividerProps {
  label?: string;
}

export function Divider({ label }: DividerProps) {
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      {label ? (
        <AppText variant="caption" color={colors.textMuted} style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  label: { paddingHorizontal: spacing.xs },
});
