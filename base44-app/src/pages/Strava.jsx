import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { stravaRedirect } from "@/lib/stravaRedirect";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import { ArrowLeft, Link2, Unlink, Loader2, Download, Mountain, TrendingUp, Clock, MapPin, Activity as ActivityIcon, GitCompare } from "lucide-react";
import { cn } from "@/lib/utils";
import ActivityCompare from "@/components/strava/ActivityCompare";

function fmtDuration(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}'`;
  return `${m}'${String(s).padStart(2, "0")}"`;
}

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return iso; }
}

export default function Strava() {
  const { toast } = useToast();
  const [status, setStatus] = useState("loading"); // loading | connected | disconnected
  const [athlete, setAthlete] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loadingActs, setLoadingActs] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [importing, setImporting] = useState(null);
  const [compareId, setCompareId] = useState(null);
  const codeProcessedRef = useRef(false);

  const redirect_uri = stravaRedirect("/strava");

  async function checkStatus() {
    try {
      const res = await base44.functions.invoke("stravaConnect", { action: "status" });
      if (res.data.connected) {
        setStatus("connected");
        setAthlete(res.data);
      } else {
        setStatus("disconnected");
      }
    } catch {
      setStatus("disconnected");
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code && !codeProcessedRef.current) {
      codeProcessedRef.current = true;
      setConnecting(true);
      base44.functions.invoke("stravaConnect", { action: "connect", code, redirect_uri })
        .then((res) => {
          toast({ title: "Strava connecté", description: "Tes activités peuvent être importées." });
          window.history.replaceState({}, "", "/strava");
          setStatus("connected");
          setAthlete(res.data.athlete);
        })
        .catch((e) => {
          toast({ title: "Erreur de connexion Strava", description: e.message, variant: "destructive" });
          window.history.replaceState({}, "", "/strava");
          setStatus("disconnected");
        })
        .finally(() => setConnecting(false));
    } else {
      checkStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleConnect() {
    try {
      const res = await base44.functions.invoke("stravaConnect", { action: "auth_url", redirect_uri });
      window.location.href = res.data.url;
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  }

  async function handleDisconnect() {
    try {
      await base44.functions.invoke("stravaConnect", { action: "disconnect" });
      setStatus("disconnected");
      setAthlete(null);
      setActivities([]);
      toast({ title: "Strava déconnecté" });
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  }

  async function loadActivities() {
    setLoadingActs(true);
    try {
      const res = await base44.functions.invoke("stravaActivities", { action: "list" });
      setActivities(res.data.activities || []);
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setLoadingActs(false);
    }
  }

  useEffect(() => {
    if (status === "connected") loadActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function importGpx(act) {
    setImporting(act.id);
    try {
      const res = await base44.functions.invoke("stravaActivities", { action: "gpx", activity_id: act.id, name: act.name });
      const gpx = typeof res.data === "string" ? res.data : String(res.data);
      const blob = new Blob([gpx], { type: "application/gpx+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `otc-${act.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.gpx`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Trace GPX importée", description: act.name });
    } catch (e) {
      toast({ title: "Import impossible", description: e.message, variant: "destructive" });
    } finally {
      setImporting(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/profil" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5">
        <ArrowLeft className="w-4 h-4" /> Profil
      </Link>

      <div className="mb-6">
        <span className="text-[11px] tracking-[0.3em] uppercase text-primary font-medium">Activités</span>
        <h1 className="mt-2 font-heading font-bold text-3xl tracking-tight">Connexion Strava</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          Connecte ton compte Strava pour récupérer automatiquement tes activités et importer tes traces GPS. Aucune saisie manuelle.
        </p>
      </div>

      {/* Connection card */}
      <div className="rounded-2xl border border-border bg-card p-5 mb-6">
        {status === "loading" && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Vérification de la connexion…
          </div>
        )}

        {status === "disconnected" && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-[#FC4C02] flex items-center justify-center text-white font-bold text-sm">S</div>
              <div>
                <div className="font-heading font-semibold">Strava non connecté</div>
                <div className="text-xs text-muted-foreground">Autorise l'accès à tes activités (lecture seule).</div>
              </div>
            </div>
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full flex items-center justify-center gap-2 bg-[#FC4C02] text-white font-semibold py-3 rounded-full text-sm hover:bg-[#FC4C02]/90 transition-colors disabled:opacity-60"
            >
              {connecting ? <><Loader2 className="w-4 h-4 animate-spin" /> Connexion…</> : <><Link2 className="w-4 h-4" /> Connecter mon compte Strava</>}
            </button>
            <p className="mt-3 text-[11px] text-muted-foreground text-center">
              Tu seras redirigé vers Strava, puis reviendras ici automatiquement.
            </p>
          </>
        )}

        {status === "connected" && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#FC4C02] flex items-center justify-center text-white font-bold text-sm">S</div>
              <div>
                <div className="font-heading font-semibold flex items-center gap-2">
                  Strava connecté
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <div className="text-xs text-muted-foreground">
                  {athlete?.athlete_name ? `Athlète ${athlete.athlete_name}` : "Activités synchronisées"}
                </div>
              </div>
            </div>
            <button onClick={handleDisconnect} className="inline-flex items-center gap-1.5 border border-border rounded-full px-3.5 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Unlink className="w-3.5 h-3.5" /> Déconnecter
            </button>
          </div>
        )}
      </div>

      {/* Activities list */}
      {status === "connected" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-semibold">Activités récentes</h2>
            <button onClick={loadActivities} className="text-xs text-primary hover:underline">Actualiser</button>
          </div>

          {loadingActs ? (
            <div className="flex items-center gap-3 text-sm text-muted-foreground py-10 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> Récupération des activités…
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-10">Aucune activité récente trouvée.</div>
          ) : (
            <div className="space-y-2">
              {activities.map((a) => (
                <div key={a.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <ActivityIcon className="w-4 h-4 text-primary shrink-0" />
                        <span className="font-medium text-sm truncate">{a.name}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{fmtDate(a.start_date)}</span>
                        <span className="flex items-center gap-1"><Mountain className="w-3 h-3" />{(a.distance / 1000).toFixed(1)} km</span>
                        <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />+{a.total_elevation_gain} m</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmtDuration(a.moving_time)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => importGpx(a)}
                        disabled={!a.has_gps || importing === a.id}
                        className={cn(
                          "shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium transition-colors",
                          a.has_gps
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "bg-secondary text-muted-foreground cursor-not-allowed"
                        )}
                      >
                        {importing === a.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                        {a.has_gps ? "GPX" : "Sans GPS"}
                      </button>
                      {a.has_gps && (
                        <button
                          onClick={() => setCompareId(compareId === a.id ? null : a.id)}
                          className={cn(
                            "shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium border transition-colors",
                            compareId === a.id ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <GitCompare className="w-3.5 h-3.5" /> Comparer
                        </button>
                      )}
                    </div>
                  </div>
                  {compareId === a.id && <ActivityCompare activity={a} />}
                </div>
              ))}
            </div>
          )}

          <p className="mt-4 text-xs text-muted-foreground">
            Une fois ta tentative de parcours terminée, importe la trace GPX correspondante. La validation automatique comparera ta trace au parcours officiel.
          </p>
        </div>
      )}
    </div>
  );
}