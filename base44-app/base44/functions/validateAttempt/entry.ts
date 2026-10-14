import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { getValidToken, getStreams } from "../../shared/strava.ts";
import { evaluateAttempt } from "../../shared/validation.ts";
import { notifyValidated } from "../../shared/notify.ts";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Non authentifié" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { race_id, strava_activity_id } = body;
    if (!race_id || !strava_activity_id) {
      return Response.json({ error: "race_id et strava_activity_id requis" }, { status: 400 });
    }

    const race = await base44.entities.Race.get(race_id);
    if (!race) return Response.json({ error: "Parcours introuvable" }, { status: 404 });

    // Déjà importée (ex. par l'import automatique) : on renvoie la tentative existante
    const existing = await base44.entities.Attempt.filter({ race_id, strava_activity_id: String(strava_activity_id) });
    const mine = existing.find((a) => (a.runner_id || a.created_by_id) === user.id);
    if (mine) {
      return Response.json({ attempt_id: mine.id, already_imported: true, ...mine });
    }

    const conns = await base44.entities.StravaConnection.filter({ created_by_id: user.id });
    if (!conns.length) return Response.json({ error: "Strava non connecté" }, { status: 400 });
    const access_token = await getValidToken(base44, conns[0]);

    const streams = await getStreams(access_token, strava_activity_id);
    const ev = evaluateAttempt(race, streams);
    if (ev.error) return Response.json({ error: ev.error }, { status: 400 });

    const attempt = await base44.entities.Attempt.create({
      ...ev,
      race_id,
      strava_activity_id: String(strava_activity_id),
      activity_date: new Date().toISOString(),
      season: race.season || "",
      runner_id: user.id,
      source: "manual"
    });

    if (ev.status === "validated") {
      try {
        await notifyValidated(base44.asServiceRole, { runnerId: user.id, race, attempt });
      } catch (e) {
        console.log("notification non envoyée:", e && e.message);
      }
    }

    return Response.json({ attempt_id: attempt.id, ...ev });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
