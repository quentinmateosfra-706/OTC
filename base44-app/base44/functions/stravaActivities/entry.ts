import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { getActivities, getStreams, buildGpx, getValidToken } from "../../shared/strava.ts";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Non authentifié" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    const conns = await base44.entities.StravaConnection.filter({ created_by_id: user.id });
    if (!conns.length) return Response.json({ error: "Strava non connecté" }, { status: 400 });
    const conn = conns[0];
    const access_token = await getValidToken(base44, conn);

    // Liste des activités récentes du coureur
    if (action === "list" || !action) {
      const acts = await getActivities(access_token, 1, 30);
      const mapped = acts.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        sport_type: a.sport_type,
        distance: Math.round(a.distance),
        moving_time: a.moving_time,
        elapsed_time: a.elapsed_time,
        total_elevation_gain: Math.round(a.total_elevation_gain),
        start_date: a.start_date,
        start_latlng: a.start_latlng,
        has_gps: !!(a.map && a.map.summary_polyline)
      }));
      return Response.json({ activities: mapped });
    }

    // Génère et renvoie le GPX d'une activité (reconstruit depuis les streams)
    if (action === "gpx") {
      const { activity_id, name } = body;
      if (!activity_id) return Response.json({ error: "activity_id requis" }, { status: 400 });
      const streams = await getStreams(access_token, activity_id);
      const gpx = buildGpx(streams, name || "OTC Activity");
      return new Response(gpx, {
        status: 200,
        headers: {
          "Content-Type": "application/gpx+xml",
          "Content-Disposition": `attachment; filename="otc-activite.gpx"`
        }
      });
    }

    return Response.json({ error: "Action inconnue" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}