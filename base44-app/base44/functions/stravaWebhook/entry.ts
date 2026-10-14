import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import {
  getValidToken, getStreams, getActivity, listPushSubscriptions, createPushSubscription
} from "../../shared/strava.ts";
import { evaluateAttempt } from "../../shared/validation.ts";
import { notifyValidated } from "../../shared/notify.ts";

// Appelée par Strava (pas d'utilisateur connecté) : validation GET de l'abonnement,
// puis un POST par événement. Réponses rapides et toujours 200 sur les événements,
// sinon Strava réessaie.
const VERIFY_TOKEN = "otc-strava-webhook";
const CALLBACK_URL = "https://off-trail-challenge.base44.app/functions/stravaWebhook";

function inWindow(race, date) {
  const d = date.toISOString().slice(0, 10);
  if (race.window_start && d < race.window_start) return false;
  if (race.window_end && d > race.window_end) return false;
  return true;
}

async function handleActivity(sr, ownerId, activityId) {
  const conns = await sr.entities.StravaConnection.filter({ athlete_id: String(ownerId) });
  if (!conns.length) return { skipped: "athlète inconnu" };
  const conn = conns[0];
  const runnerId = conn.created_by_id;

  const purchases = await sr.entities.Purchase.filter({ created_by_id: runnerId, status: "active" }, "-created_date", 200);
  if (!purchases.length) return { skipped: "aucune inscription" };

  const token = await getValidToken(sr, conn);
  const activity = await getActivity(token, activityId);
  if (!activity.map || !activity.map.summary_polyline) return { skipped: "sans GPS" };
  const start = new Date(activity.start_date);

  // Courses éligibles : inscription antérieure au départ, course active, fenêtre ouverte
  const raceIds = [...new Set(purchases
    .filter((p) => p.race_id && new Date(p.purchase_date || p.created_date) <= start)
    .map((p) => p.race_id))];
  if (!raceIds.length) return { skipped: "aucune inscription antérieure" };

  let streams = null;
  const results = [];
  for (const raceId of raceIds) {
    const race = await sr.entities.Race.get(raceId).catch(() => null);
    if (!race || race.status !== "active" || !inWindow(race, start)) continue;

    const dup = await sr.entities.Attempt.filter({ race_id: raceId, strava_activity_id: String(activityId) });
    if (dup.length) continue;

    if (!streams) streams = await getStreams(token, activityId);
    const ev = evaluateAttempt(race, streams);
    // Import auto : on n'enregistre que les réussites, une sortie sans rapport est ignorée.
    if (ev.error || ev.status !== "validated") { results.push({ race: race.name, status: "ignored" }); continue; }

    const attempt = await sr.entities.Attempt.create({
      ...ev,
      race_id: raceId,
      strava_activity_id: String(activityId),
      activity_date: start.toISOString(),
      season: race.season || "",
      runner_id: runnerId,
      source: "auto"
    });
    await notifyValidated(sr, { runnerId, race, attempt });
    results.push({ race: race.name, status: "validated" });
  }
  return { results };
}

export default async function (req) {
  const url = new URL(req.url);

  // Validation de l'abonnement par Strava
  if (req.method === "GET") {
    if (url.searchParams.get("hub.verify_token") === VERIFY_TOKEN) {
      return Response.json({ "hub.challenge": url.searchParams.get("hub.challenge") });
    }
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const base44 = createClientFromRequest(req);
  const sr = base44.asServiceRole;
  const body = await req.json().catch(() => ({}));

  // Administration (bouton dans le profil, admin uniquement)
  if (body.action === "status" || body.action === "subscribe") {
    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== "admin") return Response.json({ error: "Réservé à l'administrateur" }, { status: 403 });
    try {
      const subs = await listPushSubscriptions();
      if (body.action === "status" || subs.length) return Response.json({ active: subs.length > 0, subscriptions: subs });
      const created = await createPushSubscription(CALLBACK_URL, VERIFY_TOKEN);
      return Response.json({ active: true, created });
    } catch (e) {
      return Response.json({ error: e.message }, { status: 500 });
    }
  }

  // Événement Strava
  try {
    if (body.object_type === "activity" && body.aspect_type === "create") {
      const out = await handleActivity(sr, body.owner_id, body.object_id);
      console.log("stravaWebhook", body.object_id, JSON.stringify(out));
    }
  } catch (e) {
    console.log("stravaWebhook erreur", body.object_id, e && e.message);
  }
  return Response.json({ ok: true });
}
