import { secrets } from "base44:runtime";

const TOKEN_URL = "https://www.strava.com/api/v3/oauth/token";
const API_BASE = "https://www.strava.com/api/v3";

export function getCredentials() {
  const client_id = secrets.get("STRAVA_CLIENT_ID");
  const client_secret = secrets.get("STRAVA_CLIENT_SECRET");
  if (!client_id || !client_secret) {
    throw new Error("Identifiants Strava non configurés (STRAVA_CLIENT_ID / STRAVA_CLIENT_SECRET).");
  }
  return { client_id, client_secret };
}

export function authorizeUrl({ redirect_uri, scope = "activity:read_all", state }) {
  const { client_id } = getCredentials();
  const params = new URLSearchParams({
    client_id,
    redirect_uri,
    response_type: "code",
    approval_prompt: "auto",
    scope
  });
  if (state) params.set("state", state);
  return `https://www.strava.com/oauth/authorize?${params.toString()}`;
}

export async function exchangeCode(code, redirect_uri) {
  const { client_id, client_secret } = getCredentials();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id, client_secret, code, grant_type: "authorization_code" })
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Échange de code Strava échoué (${res.status}): ${txt}`);
  }
  return res.json();
}

export async function refreshToken(refresh_token) {
  const { client_id, client_secret } = getCredentials();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id, client_secret, refresh_token, grant_type: "refresh_token" })
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Refresh Strava échoué (${res.status}): ${txt}`);
  }
  return res.json();
}

export async function getActivities(access_token, page = 1, per_page = 30) {
  const res = await fetch(`${API_BASE}/athlete/activities?page=${page}&per_page=${per_page}`, {
    headers: { Authorization: `Bearer ${access_token}` }
  });
  if (!res.ok) throw new Error(`Récupération des activités Strava échouée (${res.status})`);
  return res.json();
}

export async function getActivity(access_token, activityId) {
  const res = await fetch(`${API_BASE}/activities/${activityId}`, {
    headers: { Authorization: `Bearer ${access_token}` }
  });
  if (!res.ok) throw new Error(`Récupération de l'activité Strava échouée (${res.status})`);
  return res.json();
}

// Abonnement webhook (une seule souscription par application Strava)
export async function listPushSubscriptions() {
  const { client_id, client_secret } = getCredentials();
  const res = await fetch(`${API_BASE}/push_subscriptions?client_id=${client_id}&client_secret=${client_secret}`);
  if (!res.ok) throw new Error(`Lecture abonnement Strava échouée (${res.status}): ${await res.text()}`);
  return res.json();
}

export async function createPushSubscription(callback_url, verify_token) {
  const { client_id, client_secret } = getCredentials();
  const form = new URLSearchParams({ client_id, client_secret, callback_url, verify_token });
  const res = await fetch(`${API_BASE}/push_subscriptions`, { method: "POST", body: form });
  const txt = await res.text();
  if (!res.ok) throw new Error(`Création abonnement Strava échouée (${res.status}): ${txt}`);
  return JSON.parse(txt);
}

export async function getStreams(access_token, activityId) {
  const res = await fetch(`${API_BASE}/activities/${activityId}/streams?keys=latlng,time,altitude&key_by_type=true`, {
    headers: { Authorization: `Bearer ${access_token}` }
  });
  if (!res.ok) throw new Error(`Récupération des streams Strava échouée (${res.status})`);
  return res.json();
}

// Renvoie un token d'accès valide, en le rafraîchissant s'il expire dans < 1 min.
// Met à jour la connexion en base quand un refresh a eu lieu.
export async function getValidToken(base44, connection) {
  let { access_token, refresh_token, expires_at } = connection;
  if (expires_at && expires_at * 1000 < Date.now() + 60000) {
    const refreshed = await refreshToken(refresh_token);
    access_token = refreshed.access_token;
    await base44.entities.StravaConnection.update(connection.id, {
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      expires_at: refreshed.expires_at
    });
  }
  return access_token;
}

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, (c) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;"
  }[c]));
}

// Reconstruit un fichier GPX valide à partir des streams Strava (latlng, time, altitude)
export function buildGpx(streams, name = "OTC Activity") {
  const latlng = (streams.latlng && streams.latlng.data) || [];
  const time = (streams.time && streams.time.data) || [];
  const altitude = (streams.altitude && streams.altitude.data) || [];
  const len = Math.min(latlng.length, time.length);
  if (len === 0) throw new Error("Aucune donnée GPS dans cette activité.");

  const pts = [];
  for (let i = 0; i < len; i++) {
    const [lat, lon] = latlng[i];
    const t = new Date(time[i] * 1000).toISOString();
    const ele = altitude[i] !== undefined ? `\n        <ele>${Number(altitude[i]).toFixed(1)}</ele>` : "";
    pts.push(`      <trkpt lat="${lat}" lon="${lon}">${ele}\n        <time>${t}</time>\n      </trkpt>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="OTC — Off Trail Challenge" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>${escapeXml(name)}</name></metadata>
  <trk>
    <name>${escapeXml(name)}</name>
    <trkseg>
${pts.join("\n")}
    </trkseg>
  </trk>
</gpx>`;
}