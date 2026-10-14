import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Mountain, TrendingUp, TrendingDown, Clock, Users, MapPin, Calendar, ChevronRight,
  Download, Play, Flag, ShieldCheck, Trophy, Route, Eye, Loader2, Map as MapIcon
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { rankings } from "@/lib/mockData";
import ElevationProfile from "@/components/ElevationProfile";
import RaceMap from "@/components/RaceMap";
import { cn } from "@/lib/utils";
import { BETA_FREE_LABEL } from "@/lib/beta";
import { downloadRaceGpx } from "@/lib/gpx";

const DIFFICULTY = {
  decouverte: "Découverte",
  court: "Accessible",
  moyen: "Soutenu",
  long: "Difficile",
  ultra: "Expert"
};

const fmtDate = (s) =>
  s ? new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—";

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [race, setRace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [purchased, setPurchased] = useState(false);
  const [buying, setBuying] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [attemptStarted, setAttemptStarted] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await base44.entities.Race.get(id);
        if (alive) setRace(r);
        // Un même coureur peut ré-ouvrir le parcours : on vérifie l'achat bêta existant.
        try {
          const me = await base44.auth.me();
          if (me) {
            const existing = await base44.entities.Purchase.filter(
              { race_id: id, status: "active", created_by_id: me.id }, "-created_date", 1
            );
            if (alive && existing.length) setPurchased(true);
          }
        } catch {}
      } catch (e) {
        if (alive) setError(e.message || "Parcours introuvable");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  // Achat bêta : simulation gratuite, aucun vrai paiement.
  async function handlePurchase() {
    setBuying(true);
    try {
      await base44.entities.Purchase.create({
        purchase_type: "unit",
        amount_eur: 0,
        purchase_date: new Date().toISOString(),
        status: "active",
        payment_provider: "simulation",
        race_id: race.id,
        season: race.season || null,
        waiver_accepted_at: new Date().toISOString()
      });
      setPurchased(true);
    } catch (e) {
      setError(e.message || "Déblocage impossible.");
    } finally {
      setBuying(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 flex items-center justify-center text-muted-foreground">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Chargement du parcours…
      </div>
    );
  }

  if (error || !race) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-muted-foreground">{error || "Parcours introuvable."}</p>
        <Link to="/parcours" className="mt-4 inline-flex items-center gap-1 text-primary text-sm">
          <ArrowLeft className="w-4 h-4" /> Retour aux parcours
        </Link>
      </div>
    );
  }

  const trace = Array.isArray(race.trace_preview) ? race.trace_preview : [];
  const checkpoints = Array.isArray(race.checkpoints) ? race.checkpoints : [];
  const elevations = trace.map((p) => p[2]);
  const difficulty = DIFFICULTY[race.distance_category] || "—";
  const courseRanking = rankings.course;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5">
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>

      {/* Hero */}
      <div className="relative h-52 sm:h-64 rounded-3xl overflow-hidden border border-border topo-lines bg-secondary">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute bottom-0 p-6">
          <div className="text-[11px] tracking-[0.2em] uppercase text-primary mb-1.5">
            {race.region} · Édition {race.season}
          </div>
          <h1 className="font-heading font-bold text-3xl sm:text-4xl tracking-tight text-balance">{race.name}</h1>
        </div>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
        {[
          { icon: Mountain, label: "Distance", value: `${race.distance_km} km` },
          { icon: TrendingUp, label: "D+", value: `+${Math.round(race.elevation_gain_m)} m` },
          { icon: TrendingDown, label: "D-", value: `-${Math.round(race.elevation_loss_m)} m` },
          { icon: Clock, label: "Difficulté", value: difficulty }
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-4">
            <Icon className="w-4 h-4 text-primary mb-2" />
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
            <div className="font-heading font-bold text-lg">{value}</div>
          </div>
        ))}
      </div>

      {/* Trace map */}
      <div className="mt-5 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapIcon className="w-4 h-4 text-primary" />
            <h2 className="font-heading font-semibold">Tracé officiel</h2>
          </div>
          <span className="text-xs text-muted-foreground">{trace.length} points · {checkpoints.length} checkpoints</span>
        </div>
        <div className="h-72 sm:h-96 rounded-xl overflow-hidden border border-border">
          {trace.length > 1 ? (
            <RaceMap trace_preview={trace} checkpoints={checkpoints} start_point={race.start_point} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
              Tracé non disponible pour ce parcours.
            </div>
          )}
        </div>
      </div>

      {/* Elevation profile */}
      <div className="mt-5 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Route className="w-4 h-4 text-primary" />
            <h2 className="font-heading font-semibold">Profil altimétrique</h2>
          </div>
          <span className="text-xs text-muted-foreground">
            {race.distance_km} km · +{Math.round(race.elevation_gain_m)} m · max {Math.round(race.altitude_max_m)} m
          </span>
        </div>
        {elevations.length > 1 ? (
          <ElevationProfile profile={elevations} className="w-full h-32" />
        ) : (
          <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">Profil non disponible.</div>
        )}
      </div>

      {/* Description */}
      {race.description && (
        <div className="mt-5 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-heading font-semibold mb-2">Le parcours</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{race.description}</p>
        </div>
      )}

      {/* Checkpoints */}
      <div className="mt-5 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Flag className="w-4 h-4 text-primary" />
          <h2 className="font-heading font-semibold">Les checkpoints</h2>
        </div>
        <div className="space-y-2">
          {checkpoints.map((cp, i) => (
            <div key={cp.num ?? i} className="flex items-center gap-3 text-sm py-1.5 border-b border-border/40 last:border-0">
              <span className="w-7 h-7 rounded-full bg-primary/15 text-primary text-[11px] font-bold flex items-center justify-center shrink-0">
                {cp.num ?? i + 1}
              </span>
              <span className="flex-1 text-foreground/90">Checkpoint {cp.num ?? i + 1}</span>
              <span className="text-muted-foreground tabular-nums">{cp.km} km</span>
              <span className="text-muted-foreground tabular-nums w-16 text-right">{Math.round(cp.alt)} m</span>
            </div>
          ))}
        </div>
      </div>

      {/* Window + participants */}
      <div className="mt-5 grid sm:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-[11px] uppercase tracking-wider">Fenêtre de tentative</span>
          </div>
          <div className="font-heading font-semibold text-sm">
            {fmtDate(race.window_start)} — {fmtDate(race.window_end)}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-primary mb-2">
            <MapPin className="w-4 h-4" />
            <span className="text-[11px] uppercase tracking-wider">Type de parcours</span>
          </div>
          <div className="font-heading font-semibold capitalize">{race.route_type || "—"}</div>
        </div>
      </div>

      {/* Règlement & autonomie */}
      <div className="mt-5 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <h2 className="font-heading font-semibold">Règlement & autonomie</h2>
        </div>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            Tu cours <span className="text-foreground font-medium">seul</span>, sans balisage, sans ravitaillement, sans assistance.
            OTC n'assure ni le marquage du terrain, ni le réapprovisionnement, ni l'organisation d'un secours.
          </p>
          <p>
            Tu es <span className="text-foreground font-medium">seul responsable de ta sécurité</span>. Vérifie la météo,
            préviens un proche de ton itinéraire et de ton heure de retour, emporte l'eau, la nutrition et l'équipement adaptés à la montagne.
          </p>
          <p>
            La tentative n'est validée que si ta trace suit le parcours officiel (≥ 85 % de correspondance) et passe les checkpoints dans l'ordre.
            Les tentatives sont illimitées ; seule la meilleure performance est conservée.
          </p>
        </div>
      </div>

      {/* Ranking preview */}
      <div className="mt-5 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            <h2 className="font-heading font-semibold">Classement</h2>
          </div>
          <Link to="/classement" className="text-xs text-primary hover:underline">Voir tout</Link>
        </div>
        <div className="space-y-1">
          {courseRanking.slice(0, 5).map((r) => (
            <div key={r.rank} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
              <span className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                r.rank === 1 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>
                {r.rank}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{r.name}</div>
                <div className="text-[11px] text-muted-foreground">{r.city}</div>
              </div>
              <div className="font-heading font-semibold text-sm tabular-nums">{r.time}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Action bar */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        {!purchased ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Accès au parcours</div>
                <div className="font-heading font-bold text-2xl text-primary">0,00 €</div>
                <div className="text-[11px] text-primary font-medium mt-0.5">{BETA_FREE_LABEL}</div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                Tentatives illimitées<br />Meilleure performance conservée
              </div>
            </div>
            <button
              onClick={handlePurchase}
              disabled={buying}
              className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-full text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 inline-flex items-center justify-center"
            >
              {buying ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Déblocage…</> : "Débloquer le défi"}
            </button>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              Bêta club : accès gratuit, aucun paiement requis.
            </p>
          </>
        ) : attemptStarted ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary text-sm font-medium">
              <Play className="w-4 h-4" /> Tentative en cours
            </div>
            <ol className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div className="flex-1">
                  <div className="text-foreground font-medium">Télécharge la trace GPX officielle</div>
                  <div className="text-xs text-muted-foreground mb-2">Envoie-la vers ta montre GPS.</div>
                  <button
                    onClick={() => downloadRaceGpx(race)}
                    className="inline-flex items-center gap-1.5 border border-primary/40 text-primary rounded-full px-3.5 py-1.5 text-xs font-medium hover:bg-primary/10 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Télécharger le GPX
                  </button>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div className="flex-1">
                  <div className="text-foreground font-medium">Cours le parcours en autonomie</div>
                  <div className="text-xs text-muted-foreground">Sans balisage, sans ravito. Préviens un proche de ton itinéraire.</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                <div className="flex-1">
                  <div className="text-foreground font-medium">Importe ton activité Strava pour valider</div>
                  <div className="text-xs text-muted-foreground mb-2">La validation compare ta trace au parcours officiel.</div>
                  <Link
                    to="/strava"
                    className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-full px-3.5 py-1.5 text-xs font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Aller à Strava <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </li>
            </ol>
            <button
              onClick={() => setAttemptStarted(false)}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Annuler la tentative
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-300 text-sm mb-1">
              <ShieldCheck className="w-4 h-4" /> Défi débloqué — tentatives illimitées
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => downloadRaceGpx(race)}
                className="flex items-center justify-center gap-2 border border-border rounded-full py-3 text-sm font-medium hover:border-primary/40 hover:text-primary transition-colors"
              >
                <Download className="w-4 h-4" /> GPX
              </button>
              <button
                onClick={() => setShowChecklist(true)}
                className="flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-full py-3 text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                <Play className="w-4 h-4" /> Lancer une tentative
              </button>
            </div>
            <button className="w-full flex items-center justify-center gap-2 border border-dashed border-border rounded-full py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Eye className="w-4 h-4" /> Mode reconnaissance (hors classement)
            </button>
          </div>
        )}
      </div>

      {/* Safety checklist modal */}
      {showChecklist && <SafetyChecklist onClose={() => setShowChecklist(false)} onStart={() => setAttemptStarted(true)} />}
    </div>
  );
}

function SafetyChecklist({ onClose, onStart }) {
  const items = [
    "Eau", "Nutrition", "Téléphone chargé", "GPS / montre chargée",
    "Équipement adapté", "Vérification météo", "Prévenir un proche"
  ];
  const [checked, setChecked] = useState(items.map(() => false));
  const allChecked = checked.every(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 animate-fade-up">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <h3 className="font-heading font-bold text-lg">Tu vas courir en autonomie</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          OTC n'assure ni balisage, ni ravitaillement, ni secours. Confirme ta checklist avant de démarrer.
        </p>
        <div className="space-y-2.5">
          {items.map((it, i) => (
            <button
              key={it}
              onClick={() => setChecked((c) => c.map((v, idx) => (idx === i ? !v : v)))}
              className="w-full flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-left text-sm hover:border-primary/40 transition-colors"
            >
              <span className={cn("w-5 h-5 rounded-md border flex items-center justify-center transition-colors",
                checked[i] ? "bg-primary border-primary text-primary-foreground" : "border-border")}>
                {checked[i] && "✓"}
              </span>
              {it}
            </button>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button onClick={onClose} className="border border-border rounded-full py-3 text-sm text-muted-foreground hover:text-foreground">
            Annuler
          </button>
          <button
            disabled={!allChecked}
            onClick={() => { onStart && onStart(); onClose(); }}
            className={cn("rounded-full py-3 text-sm font-semibold transition-colors",
              allChecked ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-secondary text-muted-foreground cursor-not-allowed")}
          >
            Démarrer la tentative
          </button>
        </div>
      </div>
    </div>
  );
}