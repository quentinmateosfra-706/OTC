// Validation d'une activité GPS contre une course OTC — partagée par
// validateAttempt (import manuel) et stravaWebhook (import automatique).
import {
  computeDistance, computeElevationGain, computeMatchPct, validateCheckpoints
} from "./geo.ts";

export const MATCH_THRESHOLD_PCT = 85;
export const MATCH_RADIUS_M = 75;
export const CHECKPOINT_RADIUS_M = 100;

export function evaluateAttempt(race, streams) {
  const latlng = (streams.latlng && streams.latlng.data) || [];
  const time = (streams.time && streams.time.data) || [];
  const altitude = (streams.altitude && streams.altitude.data) || [];
  if (latlng.length < 2) return { error: "Activité sans trace GPS exploitable" };

  const trace = (race.trace_preview || []).map((p) => [p[0], p[1]]);
  const checkpoints = race.checkpoints || [];

  const distance_km = computeDistance(latlng) / 1000;
  const elevation_gain_m = computeElevationGain(altitude);
  const elapsed_time_s = time.length ? time[time.length - 1] - time[0] : 0;
  const avg_speed_kmh = elapsed_time_s > 0 ? distance_km / (elapsed_time_s / 3600) : 0;

  const match_pct = trace.length > 1 ? computeMatchPct(latlng, trace, MATCH_RADIUS_M) : 0;
  const cp = validateCheckpoints(latlng, checkpoints, CHECKPOINT_RADIUS_M);
  const checkpoints_total = checkpoints.length;

  const validated =
    match_pct >= MATCH_THRESHOLD_PCT &&
    checkpoints_total > 0 &&
    cp.validated === checkpoints_total;

  const reasons = [];
  if (!validated) {
    if (match_pct < MATCH_THRESHOLD_PCT) {
      reasons.push(`Correspondance trace ${Math.round(match_pct)}% (seuil ${MATCH_THRESHOLD_PCT}%)`);
    }
    if (checkpoints_total > 0 && cp.validated < checkpoints_total) {
      reasons.push(`${checkpoints_total - cp.validated} checkpoint(s) manqué(s) sur ${checkpoints_total}`);
    }
    if (!trace.length) reasons.push("Trace officielle indisponible");
  }

  return {
    status: validated ? "validated" : "rejected",
    distance_km: Number(distance_km.toFixed(2)),
    elapsed_time_s: Math.round(elapsed_time_s),
    moving_time_s: Math.round(elapsed_time_s),
    elevation_gain_m: Math.round(elevation_gain_m),
    match_pct: Number(match_pct.toFixed(1)),
    checkpoints_validated: cp.validated,
    checkpoints_total,
    checkpoints_missed: cp.missed,
    avg_speed_kmh: Number(avg_speed_kmh.toFixed(1)),
    rejection_reason: reasons.join(" · ")
  };
}

export function fmtDuration(sec) {
  if (sec == null) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}'${String(s).padStart(2, "0")}"`;
  return `${m}'${String(s).padStart(2, "0")}"`;
}
