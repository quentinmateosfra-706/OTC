/** Statut de validation d'une tentative. */
export type AttemptStatus = 'pending' | 'valid' | 'rejected';

/** Document `attempts/{attemptId}`. */
export interface Attempt {
  id: string;
  userId: string;
  raceId: string;
  season: string;
  stravaActivityId: string;
  importedAt: string; // ISO
  status: AttemptStatus;
  rejectionReason: string | null;
  activityDate: string; // ISO
  officialTimeSeconds: number | null;
  gpsMatchScore: number | null; // 0.0–1.0
  checkpointsPassed: number | null;
  isBestTime: boolean;
  // Horodatage du rappel sécurité accepté AVANT la tentative.
  safetyAcknowledgedAt: string; // ISO
}
