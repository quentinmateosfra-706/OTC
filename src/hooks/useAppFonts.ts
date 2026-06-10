/**
 * Chargement des polices du thème (Space Grotesk + Fraunces Italic).
 *
 * Les fichiers .ttf doivent être placés dans src/assets/fonts/.
 * Tant qu'ils sont absents, on renvoie `true` (polices système) pour ne
 * pas bloquer le développement de la Phase 1.
 */
import { useFonts } from 'expo-font';
import { fonts } from '@/constants/theme';

export function useAppFonts(): boolean {
  // NOTE Phase 1 : les .ttf ne sont pas encore committés (binaires).
  // On garde le câblage prêt ; décommenter une fois les fichiers ajoutés.
  //
  // const [loaded] = useFonts({
  //   [fonts.regular]: require('@/assets/fonts/SpaceGrotesk-Regular.ttf'),
  //   [fonts.medium]: require('@/assets/fonts/SpaceGrotesk-Medium.ttf'),
  //   [fonts.bold]: require('@/assets/fonts/SpaceGrotesk-Bold.ttf'),
  //   [fonts.editorial]: require('@/assets/fonts/Fraunces-Italic.ttf'),
  // });
  // return loaded;

  void useFonts; // évite l'avertissement d'import inutilisé
  void fonts;
  return true;
}
