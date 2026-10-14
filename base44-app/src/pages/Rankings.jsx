import React, { useEffect, useState } from "react";
import { Trophy, Medal, Loader2, MapPin } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

const SEX_FILTERS = [
  { value: "all", label: "Tous" },
  { value: "H", label: "Hommes" },
  { value: "F", label: "Femmes" }
];

const CAT_FILTERS = [
  { value: "all", label: "Toutes" },
  { value: "Senior", label: "Senior" },
  { value: "V1", label: "V1" },
  { value: "V2", label: "V2" },
  { value: "V3", label: "V3" }
];

function catBadge(row) {
  const parts = [];
  if (row.category) parts.push(row.category);
  if (row.sex) parts.push(row.sex);
  return parts.join(" ");
}

export default function Rankings() {
  const [scope, setScope] = useState("race"); // 'race' | 'general'
  const [races, setRaces] = useState([]);
  const [raceId, setRaceId] = useState("");
  const [sex, setSex] = useState("all");
  const [category, setCategory] = useState("all");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Charger les courses pour le sélecteur
  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.Race.filter({ status: "active" }, "-created_date", 100);
        setRaces(list);
        if (list.length) setRaceId((prev) => prev || list[0].id);
      } catch { /* catalogue vide */ }
    })();
  }, []);

  // Charger le classement
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (scope === "race" && !raceId) { setRows([]); setLoading(false); return; }
      setLoading(true);
      setError("");
      try {
        const selected = races.find((r) => r.id === raceId);
        const payload = { scope, sex, category };
        if (scope === "race") {
          payload.race_id = raceId;
          if (selected?.season) payload.season = selected.season;
        }
        const res = await base44.functions.invoke("leaderboard", payload);
        if (!cancelled) setRows(res.data?.rows || []);
      } catch (e) {
        if (!cancelled) { setError(e.message || "Classement indisponible."); setRows([]); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [scope, raceId, sex, category, races]);

  const selectedRace = races.find((r) => r.id === raceId);
  const metric = (r) => (scope === "race" ? r.time : `${r.score} pts`);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <span className="text-[11px] tracking-[0.3em] uppercase text-primary font-medium">Classement</span>
        <h1 className="mt-2 font-heading font-bold text-3xl tracking-tight">
          {scope === "race" ? "Classement par course" : "Classement général"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {scope === "race"
            ? "Le meilleur temps de chaque coureur sur un parcours."
            : "La performance cumulée des coureurs OTC, toutes courses confondues."}
        </p>
      </div>

      {/* Onglets scope */}
      <div className="inline-flex rounded-full border border-border bg-card p-1 mb-5">
        {[
          { value: "race", label: "Par course" },
          { value: "general", label: "Général" }
        ].map((t) => (
          <button
            key={t.value}
            onClick={() => setScope(t.value)}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-medium transition-colors",
              scope === t.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Sélecteur de course */}
      {scope === "race" && races.length > 0 && (
        <div className="mb-4">
          <select
            value={raceId}
            onChange={(e) => setRaceId(e.target.value)}
            className="w-full h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
          >
            {races.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}{r.season ? ` · ${r.season}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Filtres sexe + catégorie */}
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex flex-wrap gap-1.5">
          {SEX_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setSex(f.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                sex === f.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CAT_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setCategory(f.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                category === f.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex items-center justify-center text-muted-foreground">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Chargement du classement…
        </div>
      ) : error ? (
        <div className="py-12 text-center text-sm text-destructive">{error}</div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
          <Trophy className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Aucune performance validée pour ces critères.
            <br />
            Sois le premier à valider une trace.
          </p>
        </div>
      ) : (
        <>
          {/* Podium */}
          {rows.length >= 3 && (
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[1, 0, 2].map((idx) => {
                const r = rows[idx];
                const isFirst = idx === 0;
                return (
                  <div
                    key={r.rank}
                    className={cn(
                      "rounded-2xl border p-4 text-center flex flex-col items-center",
                      isFirst ? "border-primary/40 bg-primary/5 pt-6" : "border-border bg-card"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center mb-2",
                      isFirst ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    )}>
                      <Medal className="w-5 h-5" />
                    </div>
                    <div className="font-heading font-bold text-sm leading-tight truncate w-full">{r.name.split(" ")[0]}</div>
                    <div className="text-[11px] text-muted-foreground truncate w-full">{r.city || catBadge(r)}</div>
                    <div className="mt-2 font-heading font-bold text-sm tabular-nums text-primary">{metric(r)}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Liste */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {rows.map((r, i) => (
              <div
                key={`${r.rank}-${r.name}-${i}`}
                className={cn(
                  "flex items-center gap-3 px-4 py-3.5 border-b border-border/40 last:border-0",
                  i === 0 && "bg-primary/5"
                )}
              >
                <span className={cn(
                  "w-8 text-center font-heading font-bold tabular-nums",
                  r.rank === 1 ? "text-primary" : "text-muted-foreground"
                )}>
                  {r.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{r.name}</div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 flex-wrap">
                    {r.city && <span className="inline-flex items-center gap-0.5"><MapPin className="w-3 h-3" />{r.city}</span>}
                    {catBadge(r) && <span className="px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{catBadge(r)}</span>}
                    {scope === "general" && r.courses ? <span>· {r.courses} course{r.courses > 1 ? "s" : ""}</span> : null}
                  </div>
                </div>
                <div className="font-heading font-semibold text-sm tabular-nums text-primary">
                  {metric(r)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Trophy className="w-4 h-4 text-primary" />
        Le classement récompense la performance. Il ne conditionne jamais l'accès aux parcours.
      </div>
    </div>
  );
}
