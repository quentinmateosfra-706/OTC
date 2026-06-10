/**
 * Composant texte typé sur l'échelle typographique du thème.
 * On évite ainsi les styles de police « en dur » dans les écrans.
 */
import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { colors, typography } from '@/constants/theme';

type Variant = keyof typeof typography;

interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: string;
}

export function AppText({
  variant = 'body',
  color = colors.textPrimary,
  style,
  ...rest
}: AppTextProps) {
  const variantStyle = typography[variant] as TextStyle;
  return <Text style={[variantStyle, { color }, style]} {...rest} />;
}
