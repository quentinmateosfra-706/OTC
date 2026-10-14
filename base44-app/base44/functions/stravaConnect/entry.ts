import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { authorizeUrl, exchangeCode } from "../../shared/strava.ts";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Non authentifié" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { action, redirect_uri, code } = body;

    // Renvoie l'URL d'autorisation Strava à ouvrir côté client
    if (action === "auth_url" || (!action && !code)) {
      if (!redirect_uri) return Response.json({ error: "redirect_uri requis" }, { status: 400 });
      return Response.json({ url: authorizeUrl({ redirect_uri, scope: "activity:read_all" }) });
    }

    // Échange le code OAuth contre des tokens et stocke la connexion
    if (action === "connect" && code) {
      if (!redirect_uri) return Response.json({ error: "redirect_uri requis" }, { status: 400 });
      const tokenData = await exchangeCode(code, redirect_uri);

      const existing = await base44.entities.StravaConnection.filter({ created_by_id: user.id });
      for (const c of existing) await base44.entities.StravaConnection.delete(c.id);

      await base44.entities.StravaConnection.create({
        athlete_id: String((tokenData.athlete && tokenData.athlete.id) || ""),
        athlete_name: (tokenData.athlete && tokenData.athlete.username) || "",
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.expires_at,
        scope: tokenData.scope || "activity:read_all"
      });

      return Response.json({ connected: true, athlete: tokenData.athlete });
    }

    // Statut de connexion de l'utilisateur courant
    if (action === "status") {
      const conns = await base44.entities.StravaConnection.filter({ created_by_id: user.id });
      if (!conns.length) return Response.json({ connected: false });
      const c = conns[0];
      return Response.json({ connected: true, athlete_id: c.athlete_id, athlete_name: c.athlete_name, expires_at: c.expires_at });
    }

    // Déconnexion : supprime les tokens
    if (action === "disconnect") {
      const conns = await base44.entities.StravaConnection.filter({ created_by_id: user.id });
      for (const c of conns) await base44.entities.StravaConnection.delete(c.id);
      return Response.json({ disconnected: true });
    }

    return Response.json({ error: "Action inconnue" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}