import React, { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X, Loader2 } from "lucide-react";
import CourseCard from "@/components/CourseCard";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

const DIFFICULTY = {
  decouverte: "Découverte",
  court: "Accessible",
  moyen: "Soutenu",
  long: "Difficile",
  ultra: "Expert"
};

export default function Courses() {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("Toutes");
  const [difficulty, setDifficulty] = useState("Tous");
  const [maxDist, setMaxDist] = useState(0); // 0 = Tous
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await base44.entities.Race.filter({ status: "active" }, "name", 100);
        if (alive) setRaces(list);
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const regions = useMemo(() => {
    const set = new Set(races.map((r) => r.region).filter(Boolean));
    return ["Toutes", ...Array.from(set)];
  }, [races]);

  const difficulties = useMemo(() => {
    const set = new Set(races.map((r) => DIFFICULTY[r.distance_category]).filter(Boolean));
    return ["Tous", ...Array.from(set)];
  }, [races]);

  const filtered = useMemo(() => {
    return races.filter((r) => {
      const q = query.toLowerCase();
      const matchQ = !q || (r.name || "").toLowerCase().includes(q) || (r.region || "").toLowerCase().includes(q);
      const matchR = region === "Toutes" || r.region === region;
      const matchD = difficulty === "Tous" || DIFFICULTY[r.distance_category] === difficulty;
      const matchDist = maxDist === 0 || (r.distance_km || 0) <= maxDist;
      return matchQ && matchR && matchD && matchDist;
    });
  }, [races, query, region, difficulty, maxDist]);

  const activeFilters = (region !== "Toutes" ? 1 : 0) + (difficulty !== "Tous" ? 1 : 0) + (maxDist !== 0 ? 1 : 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <span className="text-[11px] tracking-[0.3em] uppercase text-primary font-medium">Catalogue</span>
        <h1 className="mt-2 font-heading font-bold text-3xl tracking-tight">Les parcours</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {races.length} parcours issus de courses officielles, à courir en autonomie quand tu veux.
        </p>
      </div>

      {/* Search + filter toggle */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un parcours, une région…"
            className="w-full bg-card border border-border rounded-full pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            "relative inline-flex items-center gap-2 border rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
            showFilters || activeFilters ? "border-primary/40 text-primary bg-primary/10" : "border-border text-muted-foreground"
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtres
          {activeFilters > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="mb-6 rounded-2xl border border-border bg-card p-4 space-y-4 animate-fade-up">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Région</div>
            <div className="flex flex-wrap gap-2">
              {regions.map((r) => (
                <button
                  key={r}
                  onClick={() => setRegion(r)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-full border transition-colors",
                    region === r ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Difficulté</div>
            <div className="flex flex-wrap gap-2">
              {difficulties.map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-full border transition-colors",
                    difficulty === d ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Distance max</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setMaxDist(0)}
                className={cn("text-xs px-3 py-1.5 rounded-full border", maxDist === 0 ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground")}
              >
                Toutes
              </button>
              {[15, 25, 40, 60].map((d) => (
                <button
                  key={d}
                  onClick={() => setMaxDist(d)}
                  className={cn("text-xs px-3 py-1.5 rounded-full border", maxDist === d ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground")}
                >
                  ≤ {d} km
                </button>
              ))}
            </div>
          </div>
          {activeFilters > 0 && (
            <button onClick={() => { setRegion("Toutes"); setDifficulty("Tous"); setMaxDist(0); }} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" /> Réinitialiser
            </button>
          )}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Chargement des parcours…
        </div>
      ) : (
        <>
          <div className="mb-4 text-xs text-muted-foreground">{filtered.length} résultat{filtered.length > 1 ? "s" : ""}</div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r) => (
              <CourseCard key={r.id} race={r} />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-20 text-muted-foreground text-sm">
              Aucun parcours ne correspond à ces filtres.
            </div>
          )}
        </>
      )}
    </div>
  );
}