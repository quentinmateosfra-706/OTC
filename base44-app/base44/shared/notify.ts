// Notification (in-app + email) quand une tentative est validée.
// `sr` = client service-role (base44.asServiceRole).
import { fmtDuration } from "./validation.ts";

const APP_URL = "https://off-trail-challenge.base44.app";

function ordinal(n) {
  return n === 1 ? "1er" : `${n}e`;
}

// Rang du coureur sur la course (meilleur temps par coureur)
async function raceRank(sr, raceId, runnerId) {
  const atts = await sr.entities.Attempt.filter({ race_id: raceId, status: "validated" }, "-created_date", 2000);
  const best = {};
  for (const a of atts) {
    const uid = a.runner_id || a.created_by_id;
    if (!uid || a.elapsed_time_s == null) continue;
    if (best[uid] == null || a.elapsed_time_s < best[uid]) best[uid] = a.elapsed_time_s;
  }
  const sorted = Object.entries(best).sort((x, y) => x[1] - y[1]);
  const idx = sorted.findIndex(([uid]) => uid === runnerId);
  return { rank: idx + 1, total: sorted.length, best: best[runnerId] };
}

export async function notifyValidated(sr, { runnerId, race, attempt }) {
  const { rank, total, best } = await raceRank(sr, race.id, runnerId);
  const time = fmtDuration(attempt.elapsed_time_s);
  const isBest = best == null || attempt.elapsed_time_s <= best;
  const rankTxt = rank > 0 ? `${ordinal(rank)} sur ${total}` : "";

  const title = rank === 1 ? "🏆 Course validée — tu es en tête !" : "🏁 Course validée !";
  const body = isBest
    ? `${race.name} en ${time}${rankTxt ? ` — ${rankTxt} au classement` : ""}. Bien joué !`
    : `${race.name} en ${time}. Ton record reste ${fmtDuration(best)} (${rankTxt}).`;

  await sr.entities.Notification.create({
    recipient_id: runnerId,
    title,
    body,
    link: "/classement",
    kind: "attempt_validated",
    read: false
  });

  try {
    const user = await sr.entities.User.get(runnerId);
    const profiles = await sr.entities.RunnerProfile.filter({ created_by_id: runnerId }, "-created_date", 1);
    const firstName = ((profiles[0] && profiles[0].full_name) || (user && user.full_name) || "").split(" ")[0];
    if (user && user.email) {
      const subject = isBest
        ? `🏁 ${race.name} validée en ${time}${rankTxt ? ` — ${rankTxt} !` : ""}`
        : `🏁 ${race.name} validée en ${time}`;
      const lines = [
        `Bravo${firstName ? " " + firstName : ""} !`,
        "",
        `Ta sortie Strava a été reconnue sur « ${race.name} » et ajoutée automatiquement :`,
        "",
        `⏱  Temps officiel : ${time}`,
        `📍 Trace suivie : ${Math.round(attempt.match_pct)} % · Checkpoints : ${attempt.checkpoints_validated}/${attempt.checkpoints_total}`,
        rankTxt ? `🏆 Classement : ${rankTxt}` : "",
        isBest ? "" : `Ton meilleur temps sur ce parcours reste ${fmtDuration(best)}.`,
        "",
        `Voir le classement : ${APP_URL}/classement`,
        "",
        "Pas de balisage. Pas de ravito. Pas de spectateurs. Juste toi, la trace — et maintenant ton nom au classement.",
        "",
        "— L'équipe OTC"
      ].filter((l, i, arr) => l !== "" || arr[i - 1] !== "");
      await sr.integrations.Core.SendEmail({
        to: user.email,
        subject,
        body: lines.join("\n"),
        from_name: "OTC — Off Trail Challenge"
      });
    }
  } catch (e) {
    console.log("email non envoyé:", e && e.message);
  }
}
