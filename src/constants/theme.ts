/**
 * Thème « Trace Solitaire » — système de design centralisé d'OTC.
 *
 * Philosophie : fond ardoise sombre dominant, un seul accent chaud
 * (jaune Frontale) rare et précieux, réservé aux actions clés, à la
 * trace GPS et aux états validés. Esthétique dépouillée, montagnarde,
 * volontairement anti-commerciale.
 *
 * Règle d'usage : on importe TOUJOURS depuis ce fichier, jamais de
 * couleur ou d'espacement « en dur » dans les composants.
 */

/** Palette de couleurs. */
export const colors = {
  // Fonds (du plus sombre au plus clair)
  background: '#0E0F12', // ardoise quasi noire — fond principal
  surface: '#16181D', // cartes, panneaux
  surfaceElevated: '#1F222A', // éléments survolés / sélectionnés

  // Accent unique — jaune Frontale (frontale, balise avalanche)
  accent: '#F2C14E',
  accentDim: '#8A6F2C', // jaune désaturé pour états désactivés

  // Texte
  textPrimary: '#F4F4F5', // titres, contenu principal
  textSecondary: '#A1A1AA', // sous-titres, légendes
  textMuted: '#71717A', // texte discret, placeholders

  // Bordures & séparateurs
  border: '#2A2D35',
  borderSubtle: '#1F222A',

  // États sémantiques
  success: '#5EC26A', // tentative validée
  danger: '#E5484D', // rejet, erreur, alerte sécurité
  warning: '#F2C14E', // utilise l'accent

  // Trace GPS sur la carte — jaune Frontale, fine et continue
  trace: '#F2C14E',

  // Divers
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

/** Espacements (échelle de 4 px). */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/** Rayons de bordure. */
export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  full: 999,
} as const;

/**
 * Familles de polices.
 * - Space Grotesk : UI et titres.
 * - Fraunces Italic : accents éditoriaux (manifeste, citations).
 * Les noms correspondent aux clés chargées via expo-font (voir useFonts).
 */
export const fonts = {
  regular: 'SpaceGrotesk-Regular',
  medium: 'SpaceGrotesk-Medium',
  bold: 'SpaceGrotesk-Bold',
  editorial: 'Fraunces-Italic', // citations, manifeste
} as const;

/** Échelle typographique : taille + interlignage + famille. */
export const typography = {
  display: { fontFamily: fonts.bold, fontSize: 34, lineHeight: 40 },
  title: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 30 },
  heading: { fontFamily: fonts.medium, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  quote: { fontFamily: fonts.editorial, fontSize: 20, lineHeight: 28 },
} as const;

/** Objet thème agrégé, pratique à passer en contexte si besoin. */
export const theme = {
  colors,
  spacing,
  radius,
  fonts,
  typography,
} as const;

export type Theme = typeof theme;
