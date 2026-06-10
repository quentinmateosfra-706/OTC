import React from 'react';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';

/**
 * Rappel de sécurité obligatoire avant une tentative (checklist
 * matériel + confirmation des risques, horodaté) — Phase 7.
 */
export function SafetyBriefingScreen() {
  return (
    <PlaceholderScreen
      title="Rappel de sécurité"
      subtitle="Checklist matériel obligatoire (Phase 7)"
      icon="warning-outline"
    />
  );
}
