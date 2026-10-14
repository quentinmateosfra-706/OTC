import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Formatage temps HhMM'SS" (identique au profil)
function fmtDuration(sec) {
  if (sec == null) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}'${String(s).padStart(2, "0")}"`;
  return `${m}'${String(s).padStart(2, "0")}"`;
}

// Catégorie d'âge FFA à partir de la date de naissance et de l'année de saison
function ageCategory(birthDate, seasonYear) {
  if (!birthDate) return null;
  const by = new Date(birthDate).getFullYear();
  if (!by || Number.isNaN(by)) return null;
  const age = seasonYear - by;
  if (age < 40) return "Senior";
  if (age < 50) return "V1";
  if (age < 60) return "V2";
  return "V3";
}

function sexLetter(sex) {
  if (sex === "male") return "H";
  if (sex === "female") return "F";
  return "";
}

function yearOf(s) {
  const m = String(s || "").match(/\d{4}/);
  const y = m ? parseInt(m[0], 10) : NaN;
  return Number.isNaN(y) ? new Date().getFullYear() : y;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    // asServiceRole : lecture des profils des autres coureurs (classement public),
    // en ne renvoyant que des champs d'affichage (nom, ville, catégorie, temps).
    const db = base44.asServiceRole.entities;

    const body = await req.json().catch(() => ({}));
    const scope = body.scope === "general" ? "general" : "race";
    const { race_id, season, sex, category } = body;

    const query = { status: "validated" };
    if (scope === "race" && race_id) query.race_id = race_id;
    if (season) query.season = season;

    const [attempts, profiles, races] = await Promise.all([
      db.Attempt.filter(query, "-created_date", 2000),
      db.RunnerProfile.list("-created_date", 5000),
      db.Race.list("-created_date", 500)
    ]);

    const profileByUser = {};
    for (const p of profiles) if (p.created_by_id) profileByUser[p.created_by_id] = p;
    const raceById = {};
    for (const r of races) raceById[r.id] = r;

    // Meilleur temps par (coureur, course)
    const best = {};
    for (const a of attempts) {
      const uid = a.runner_id || a.created_by_id;
      if (!uid || a.elapsed_time_s == null) continue;
      const key = `${uid}__${a.race_id}`;
      if (!best[key] || a.elapsed_time_s < best[key].elapsed_time_s) best[key] = a;
    }

    // Enrichissement (jointure profil + catégorie)
    const enriched = Object.values(best).map((a) => {
      const runner = a.runner_id || a.created_by_id;
      const p = profileByUser[runner] || {};
      const seasonYear = yearOf(a.season || (raceById[a.race_id] && raceById[a.race_id].season));
      return {
        uid: runner,
        race_id: a.race_id,
        race_name: (raceById[a.race_id] && raceById[a.race_id].name) || "",
        name: p.full_name || "Athlète",
        city: p.city || "",
        sex: sexLetter(p.sex),
        category: ageCategory(p.birth_date, seasonYear),
        elapsed_time_s: a.elapsed_time_s,
        time: fmtDuration(a.elapsed_time_s),
        date: a.activity_date || a.created_date || null
      };
    });

    // Filtres sexe / catégorie
    let filtered = enriched;
    if (sex === "H" || sex === "F") filtered = filtered.filter((e) => e.sex === sex);
    if (category && category !== "all") filtered = filtered.filter((e) => e.category === category);

    if (scope === "race") {
      if (race_id) filtered = filtered.filter((e) => e.race_id === race_id);
      filtered.sort((x, y) => x.elapsed_time_s - y.elapsed_time_s);
      const rows = filtered.map((e, i) => ({
        rank: i + 1,
        name: e.name,
        city: e.city,
        sex: e.sex,
        category: e.category,
        time: e.time,
        elapsed_time_s: e.elapsed_time_s,
        date: e.date,
        race_name: e.race_name
      }));
      return Response.json({ scope, rows });
    }

    // Classement général : points par course = max(1, 101 - rang)
    const byRace = {};
    for (const e of filtered) (byRace[e.race_id] = byRace[e.race_id] || []).push(e);

    const pointsByUser = {};
    for (const rid of Object.keys(byRace)) {
      const arr = byRace[rid].sort((x, y) => x.elapsed_time_s - y.elapsed_time_s);
      arr.forEach((e, i) => {
        const pts = Math.max(1, 101 - (i + 1));
        const u = pointsByUser[e.uid] || {
          name: e.name, city: e.city, sex: e.sex, category: e.category, score: 0, courses: new Set()
        };
        u.score += pts;
        u.courses.add(rid);
        u.name = e.name; u.city = e.city; u.sex = e.sex; u.category = e.category;
        pointsByUser[e.uid] = u;
      });
    }

    const general = Object.values(pointsByUser).map((u) => ({
      name: u.name, city: u.city, sex: u.sex, category: u.category,
      score: u.score, courses: u.courses.size
    }));
    general.sort((a, b) => b.score - a.score);
    const rows = general.map((r, i) => ({ rank: i + 1, ...r }));

    return Response.json({ scope, rows });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
