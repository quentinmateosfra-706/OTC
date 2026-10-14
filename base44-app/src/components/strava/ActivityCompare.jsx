import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, CheckCircle2, XCircle, Flag, Route, TrendingUp, Clock, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";

function fmtDuration(sec) {
  if (!sec) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}'${String(s).padStart(2, "0")}"`;
  return `${m}'${String(s).padStart(2, "0")}"`;
}

export default function ActivityCompare({ activity }) {
  const [races, setRaces] = useState([]);
  const [raceId, setRaceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.Race.filter({ status: "active" }, "name", 100);
        setRaces(list);
        if (list.length) setRaceId(list[0].id);
      } catch (e) {
        setError(e.message);
      }
    })();
  }, []);

  async function validate() {
    if (!raceId) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await base44.functions.invoke("validateAttempt", {
        race_id: raceId,
        strava_activity_id: activity.id
      });
      setResult(res.data);
    } catch (e) {
      setError(e.message || "Validation impossible");
    } finally {
      setLoading(false);
    }
  }

  const validated = result?.status === "validated";

  return (
    <div className="mt-3 rounded-xl border border-border bg-secondary/40 p-3.5">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
        Comparer à un parcours officiel
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <select
          value={raceId}
          onChange={(e) => setRaceId(e.target.value)}
          className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
        >
          {races.length === 0 && <option value="">Aucun parcours disponible</option>}
          {races.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} · {r.distance_km} km
            </option>
          ))}
        </select>
        <button
          onClick={validate}
          disabled={!raceId || loading}
          className="inline-flex items-center justify-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60 hover:bg-primary/90 transition-colors"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Validation…</>
          ) : (
            "Valider la tentative"
          )}
        </button>
      </div>

      {error && <div className="mt-2.5 text-xs text-destructive">{error}</div>}

      {result && (
        <div className="mt-3.5 space-y-3">
          <div className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium",
            validated ? "bg-emerald-400/10 text-emerald-300" : "bg-destructive/10 text-destructive"
          )}>
            {validated ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {validated ? "Tentative validée — performance enregistrée" : "Tentative non validée"}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <Metric icon={Route} label="Correspondance" value={`${Math.round(result.match_pct)} %`} />
            <Metric icon={Flag} label="Checkpoints" value={`${result.checkpoints_validated}/${result.checkpoints_total}`} />
            <Metric icon={Route} label="Distance" value={`${result.distance_km} km`} />
            <Metric icon={TrendingUp} label="D+" value={`+${result.elevation_gain_m} m`} />
            <Metric icon={Clock} label="Temps" value={fmtDuration(result.elapsed_time_s)} />
            <Metric icon={Gauge} label="Vitesse moy." value={`${result.avg_speed_kmh} km/h`} />
          </div>

          {!validated && result.rejection_reason && (
            <div className="text-xs text-muted-foreground leading-relaxed">
              Motif : {result.rejection_reason}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <div className="font-heading font-semibold text-sm mt-0.5 tabular-nums">{value}</div>
    </div>
  );
}