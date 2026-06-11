/**
 * Écran d'achat — modal présenté depuis la fiche d'une course.
 *
 * Deux options proposées :
 * A. Achat unitaire de la course (prix selon grille distance).
 * B. Pass illimité mensuel ou annuel (meilleure valeur si > 1-2 courses/an).
 *
 * Méthode de paiement :
 * - iOS natif : RevenueCat / App Store (si dev build disponible).
 * - Fallback universel : Stripe Checkout (s'ouvre dans le navigateur).
 *
 * Règle : le client ne vérifie jamais lui-même le paiement.
 *   → Le webhook Cloud Function écrit le document en Firestore.
 *   → On recharge les achats après retour dans l'app.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { colors, spacing, radius } from '@/constants/theme';
import { usePricing } from '@/hooks/usePricing';
import { useLoadPurchases } from '@/hooks/useLoadPurchases';
import { openStripeCheckout } from '@/services/stripe.service';
import { useHasAccess, usePurchaseStore } from '@/store/usePurchaseStore';
import { useAuthStore } from '@/store/useAuthStore';
import { isFirebaseConfigured } from '@/constants/config';
import type { AppStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'Purchase'>;
type Nav = NativeStackNavigationProp<AppStackParamList>;

const CURRENT_SEASON = '2026';

export function PurchaseScreen() {
  const route = useRoute<Props['route']>();
  const navigation = useNavigation<Nav>();
  const { raceId } = route.params;

  const { priceFor } = usePricing();
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const hasAccess = useHasAccess(raceId, CURRENT_SEASON);
  const subscription = usePurchaseStore((s) => s.subscription);

  // Prix de la course — on ne l'a pas en paramètre, on le calcule depuis
  // les données de pricing. Pour simplifier, on passe distanceKm dans les
  // params à l'avenir ; ici on expose les deux paliers principaux.
  // (distanceKm sera passé en Phase 7 depuis RaceDetailScreen)
  const [loadingStripe, setLoadingStripe] = useState<
    null | 'race' | 'monthly' | 'annual'
  >(null);

  // Quand l'utilisateur revient de Stripe, on recharge les achats.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && loadingStripe === 'race') {
        setLoadingStripe(null);
      }
    });
    return () => sub.remove();
  }, [loadingStripe]);

  async function handleStripe(type: 'race' | 'monthly' | 'annual') {
    if (!isFirebaseConfigured || !firebaseUser) {
      Alert.alert('Non connecté', "Connecte-toi d'abord.");
      return;
    }
    setLoadingStripe(type);
    const result = await openStripeCheckout({ raceId, season: CURRENT_SEASON, type });
    setLoadingStripe(null);

    if (result === 'success') {
      Alert.alert(
        'Paiement confirmé ✓',
        'Ta course est maintenant disponible dans ta bibliothèque. '
        + "Si elle n'apparaît pas immédiatement, tire vers le bas pour rafraîchir.",
        [{ text: 'Voir ma bibliothèque', onPress: () => navigation.navigate('Tabs', { screen: 'Library' }) }],
      );
    } else if (result === 'error') {
      Alert.alert('Erreur de paiement', 'Le paiement a échoué. Réessaie ou contacte le support.');
    }
    // 'cancel' → rien à faire, l'utilisateur reste sur l'écran.
  }

  // Déjà accès → on redirige directement.
  if (hasAccess) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <Ionicons name="checkmark-circle" size={64} color={colors.success} />
          <AppText variant="title" style={styles.mt}>Tu as déjà accès</AppText>
          <AppText variant="body" color={colors.textSecondary} style={styles.mt}>
            Cette course est dans ta bibliothèque pour la saison {CURRENT_SEASON}.
          </AppText>
          <Button
            label="Aller à la bibliothèque"
            onPress={() => navigation.navigate('Tabs', { screen: 'Library' })}
            style={styles.cta}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* En-tête */}
        <AppText variant="caption" color={colors.accent}>ACCÉDER À LA COURSE</AppText>
        <AppText variant="title">Choisis ta formule</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Tentatives illimitées sur la saison {CURRENT_SEASON}. Seul ton meilleur temps compte.
        </AppText>

        {/* Option A — Course à l'unité */}
        <OptionCard
          title="Cette course uniquement"
          description="Accès saison en cours, tentatives illimitées. Prix fixé selon la distance du parcours."
          icon="trail-sign-outline"
          accent
        >
          <Button
            label="Payer via App Store"
            onPress={() =>
              Alert.alert(
                'App Store',
                "L'achat in-app nécessite un dev build EAS. En attendant, utilise le paiement web ci-dessous.",
              )
            }
            variant="secondary"
          />
          <Button
            label="Payer via Web (Stripe)"
            onPress={() => handleStripe('race')}
            loading={loadingStripe === 'race'}
          />
        </OptionCard>

        {/* Option B — Pass illimité */}
        <OptionCard
          title="Pass illimité"
          description="Toutes les courses OTC disponibles, toute la saison. Rentable dès 2 courses."
          icon="infinite-outline"
        >
          {/* Mensuel */}
          <View style={styles.passRow}>
            <View style={styles.passInfo}>
              <AppText variant="heading">17,99 € / mois</AppText>
              <AppText variant="caption" color={colors.textMuted}>
                Résiliable à tout moment
              </AppText>
            </View>
            <Button
              label="S'abonner"
              variant={subscription ? 'ghost' : 'secondary'}
              disabled={!!subscription}
              onPress={() => handleStripe('monthly')}
              loading={loadingStripe === 'monthly'}
              style={styles.passBtn}
            />
          </View>

          {/* Annuel */}
          <View style={[styles.passRow, styles.annualRow]}>
            <View style={styles.passInfo}>
              <View style={styles.annualLabel}>
                <AppText variant="heading">179 € / an</AppText>
                <View style={styles.savingsBadge}>
                  <AppText variant="caption" color={colors.black}>
                    −17 %
                  </AppText>
                </View>
              </View>
              <AppText variant="caption" color={colors.textMuted}>
                Renouvellement annuel
              </AppText>
            </View>
            <Button
              label="S'abonner"
              disabled={!!subscription}
              onPress={() => handleStripe('annual')}
              loading={loadingStripe === 'annual'}
              style={styles.passBtn}
            />
          </View>
        </OptionCard>

        {/* Restauration */}
        <Button
          label="Restaurer mes achats"
          variant="ghost"
          onPress={() =>
            Alert.alert(
              'Restauration',
              'Fonctionnalité disponible avec le dev build EAS (App Store).',
            )
          }
        />

        {/* Note légale */}
        <AppText variant="caption" color={colors.textMuted} style={styles.legal}>
          Les prix sont TTC. Les paiements App Store sont soumis aux CGU d'Apple.
          Les paiements web sont gérés par Stripe. L'accès est accordé à la saison
          en cours uniquement.
        </AppText>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Composants internes ─────────────────────────────────────────────────────

function OptionCard({
  title,
  description,
  icon,
  accent = false,
  children,
}: {
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={[cardStyles.card, accent && cardStyles.cardAccent]}>
      {accent && <View style={cardStyles.trace} />}
      <View style={cardStyles.body}>
        <View style={cardStyles.header}>
          <Ionicons name={icon} size={22} color={accent ? colors.accent : colors.textSecondary} />
          <View style={cardStyles.headerText}>
            <AppText variant="heading">{title}</AppText>
            <AppText variant="caption" color={colors.textSecondary}>{description}</AppText>
          </View>
        </View>
        <View style={cardStyles.actions}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  mt: { marginTop: spacing.sm, textAlign: 'center' },
  cta: { marginTop: spacing.lg, alignSelf: 'stretch' },
  passRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  annualRow: { paddingTop: spacing.md },
  passInfo: { flex: 1, gap: 2 },
  passBtn: { minWidth: 110 },
  annualLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  savingsBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: radius.sm,
  },
  legal: { textAlign: 'center', marginTop: spacing.sm },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardAccent: { borderColor: `${colors.accent}50` },
  trace: { height: 3, backgroundColor: colors.accent },
  body: { padding: spacing.md, gap: spacing.md },
  header: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  headerText: { flex: 1, gap: 4 },
  actions: { gap: spacing.sm },
});
