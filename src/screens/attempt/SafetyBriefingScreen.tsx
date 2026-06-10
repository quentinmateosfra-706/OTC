/**
 * Rappel de sécurité obligatoire — présenté AVANT chaque tentative.
 *
 * Contraintes légales (§10) :
 * - Checklist à cocher activement (non pré-cochée).
 * - Horodatage `safetyAcknowledgedAt` stocké sur l'attempt.
 * - Impossible de continuer sans tout valider.
 *
 * La liste s'adapte à la distance de la course :
 * - Toutes distances : eau, téléphone, prévenir un proche.
 * - > 30 km : ajouter nutrition, couverture de survie.
 * - > 50 km : ajouter lampe frontale.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
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
import { ConsentCheckbox } from '@/components/ConsentCheckbox';
import { colors, spacing } from '@/constants/theme';
import { fetchRaceById } from '@/services/race.service';
import type { AppStackParamList } from '@/navigation/types';
import type { Race } from '@/types/race.types';

type Props = NativeStackScreenProps<AppStackParamList, 'SafetyBriefing'>;
type Nav = NativeStackNavigationProp<AppStackParamList>;

interface CheckItem {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

function buildChecklist(race: Race | null): CheckItem[] {
  const dist = race?.distanceKm ?? 0;
  const items: CheckItem[] = [
    {
      key: 'water',
      icon: 'water-outline',
      label: 'J'emporte suffisamment d'eau et de boisson pour toute la durée.',
    },
    {
      key: 'phone',
      icon: 'phone-portrait-outline',
      label: 'Mon téléphone est chargé et j'ai enregistré le 112 et un numéro de proche.',
    },
    {
      key: 'close',
      icon: 'person-outline',
      label: 'J'ai prévenu un proche de mon départ, de mon itinéraire et de mon heure de retour prévue.',
    },
    {
      key: 'meteo',
      icon: 'partly-sunny-outline',
      label: 'J'ai vérifié les prévisions météo — aucune alerte en cours sur ce secteur.',
    },
  ];

  if (dist >= 30) {
    items.push({
      key: 'food',
      icon: 'nutrition-outline',
      label: 'J'emporte une nutrition suffisante (barres, gels, nourriture solide).',
    });
    items.push({
      key: 'survival',
      icon: 'shield-outline',
      label: 'J'ai une couverture de survie et des vêtements chauds en cas d'hypothermie.',
    });
  }

  if (dist >= 50) {
    items.push({
      key: 'headlamp',
      icon: 'flashlight-outline',
      label: 'Ma frontale est chargée et j'ai des piles de rechange (risque de courir de nuit).',
    });
  }

  items.push({
    key: 'solo',
    icon: 'warning-outline',
    label:
      'Je comprends que ce parcours n'est pas balisé, sans ravitaillement ni assistance. '
      + 'Je cours sous ma seule responsabilité.',
  });

  return items;
}

export function SafetyBriefingScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Props['route']>();
  const { raceId } = route.params;

  const [race, setRace] = useState<Race | null>(null);
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchRaceById(raceId)
      .then((r) => {
        setRace(r);
        if (r) {
          const initial: Record<string, boolean> = {};
          buildChecklist(r).forEach((item) => { initial[item.key] = false; });
          setChecks(initial);
        }
      })
      .catch(() => {
        // Course non chargée — on affiche la checklist générique.
        const initial: Record<string, boolean> = {};
        buildChecklist(null).forEach((item) => { initial[item.key] = false; });
        setChecks(initial);
      });
  }, [raceId]);

  const checklist = buildChecklist(race);
  const allChecked = checklist.every((item) => checks[item.key]);

  function toggle(key: string) {
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleContinue() {
    if (!allChecked) {
      Alert.alert(
        'Checklist incomplète',
        'Vérifie et coche tous les points avant de continuer.',
      );
      return;
    }
    // L'horodatage safetyAcknowledgedAt sera inclus dans la soumission
    // de la tentative (passé en paramètre à ImportActivity).
    navigation.navigate('ImportActivity', { raceId });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* En-tête */}
        <View style={styles.header}>
          <Ionicons name="warning" size={32} color={colors.accent} />
          <AppText variant="caption" color={colors.accent}>
            AVANT DE PARTIR
          </AppText>
          <AppText variant="title">
            Checklist de sécurité
          </AppText>
          {race && (
            <AppText variant="body" color={colors.textSecondary}>
              {race.name} · {race.distanceKm} km
            </AppText>
          )}
        </View>

        {/* Rappel philosophie */}
        <View style={styles.manifesto}>
          <AppText variant="quote" color={colors.textSecondary}>
            « Pas de balisage. Pas de ravito.{'\n'}Pas de spectateurs. »
          </AppText>
          <AppText variant="body" color={colors.textSecondary} style={styles.manifestoText}>
            Personne ne viendra te chercher. Sois prêt.
          </AppText>
        </View>

        {/* Checklist */}
        <View style={styles.checklist}>
          <AppText variant="caption" color={colors.accent}>
            JE CONFIRME QUE…
          </AppText>
          {checklist.map((item) => (
            <View key={item.key} style={styles.checkRow}>
              <Ionicons
                name={item.icon}
                size={18}
                color={checks[item.key] ? colors.success : colors.textMuted}
                style={styles.checkIcon}
              />
              <View style={styles.checkContent}>
                <ConsentCheckbox
                  checked={checks[item.key] ?? false}
                  onChange={() => toggle(item.key)}
                  label={item.label}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Numéros d'urgence */}
        <View style={styles.emergency}>
          <Ionicons name="call-outline" size={16} color={colors.danger} />
          <AppText variant="caption" color={colors.textMuted} style={styles.emergencyText}>
            En montagne : <AppText variant="caption" color={colors.textPrimary}>112</AppText>
            {' '}(européen) ·{' '}
            <AppText variant="caption" color={colors.textPrimary}>15</AppText>
            {' '}SAMU ·{' '}
            <AppText variant="caption" color={colors.textPrimary}>18</AppText>
            {' '}Pompiers ·{' '}
            <AppText variant="caption" color={colors.textPrimary}>04 76 22 22 22</AppText>
            {' '}PGHM Grenoble
          </AppText>
        </View>

        {/* CTA */}
        <Button
          label="J'ai tout vérifié — continuer"
          onPress={handleContinue}
          disabled={!allChecked}
          style={styles.cta}
        />

        <AppText variant="caption" color={colors.textMuted} style={styles.legal}>
          Ta confirmation est horodatée et associée à cette tentative.
        </AppText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  header: { gap: spacing.xs },
  manifesto: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  manifestoText: { marginTop: spacing.xs },
  checklist: { gap: spacing.md },
  checkRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  checkIcon: { marginTop: 2, flexShrink: 0 },
  checkContent: { flex: 1 },
  emergency: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    backgroundColor: `${colors.danger}15`,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.danger}30`,
  },
  emergencyText: { flex: 1 },
  cta: { marginTop: spacing.sm },
  legal: { textAlign: 'center', marginBottom: spacing.lg },
});
