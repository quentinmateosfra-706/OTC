/**
 * Case à cocher de consentement RGPD.
 *
 * Contraintes légales impératives :
 * - NON pré-cochée (defaultChecked interdit).
 * - L'utilisateur doit activement cocher.
 * - Affiche un lien vers le document concerné.
 */
import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './ui/AppText';
import { colors, radius, spacing } from '@/constants/theme';

interface ConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  /** Texte du lien cliquable à la fin du label (ex. « CGU »). */
  linkText?: string;
  onLinkPress?: () => void;
  error?: string;
}

export function ConsentCheckbox({
  checked,
  onChange,
  label,
  linkText,
  onLinkPress,
  error,
}: ConsentCheckboxProps) {
  return (
    <View>
      <Pressable
        style={styles.row}
        onPress={() => onChange(!checked)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
      >
        {/* Boîte à cocher */}
        <View style={[styles.box, checked && styles.boxChecked]}>
          {checked && (
            <Ionicons name="checkmark" size={14} color={colors.black} />
          )}
        </View>

        {/* Texte + lien optionnel */}
        <View style={styles.textWrap}>
          <AppText variant="caption" color={colors.textSecondary}>
            {label}{' '}
            {linkText && onLinkPress ? (
              <AppText
                variant="caption"
                color={colors.accent}
                onPress={onLinkPress}
              >
                {linkText}
              </AppText>
            ) : null}
          </AppText>
        </View>
      </Pressable>

      {error ? (
        <AppText variant="caption" color={colors.danger} style={styles.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  box: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  boxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
  textWrap: { flex: 1 },
  error: { marginTop: spacing.xs },
});
