/**
 * Écran provisoire générique. Affiche un titre et la phase qui le
 * remplacera. Sert d'échafaudage tant que l'écran réel n'est pas codé.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { colors, spacing } from '@/constants/theme';

interface PlaceholderScreenProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function PlaceholderScreen({
  title,
  subtitle,
  icon = 'trail-sign-outline',
}: PlaceholderScreenProps) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.center}>
        <Ionicons name={icon} size={48} color={colors.accent} />
        <AppText variant="title" style={styles.title}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText
            variant="caption"
            color={colors.textMuted}
            style={styles.subtitle}
          >
            {subtitle}
          </AppText>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  title: { marginTop: spacing.md },
  subtitle: { marginTop: spacing.sm, textAlign: 'center' },
});
