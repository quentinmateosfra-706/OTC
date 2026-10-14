import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mountain, TrendingUp, Trophy, Clock, ChevronRight, Link2, Unlink,
  Loader2, KeyRound, ShieldCheck, CheckCircle2, XCircle, Receipt, LineChart, User, LogOut
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { stravaRedirect } from "@/lib/stravaRedirect";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import StatsDashboard from "@/components/profile/StatsDashboard";

function fmtDuration(sec) {
  if (!sec && sec !== 0) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}'${String(s).padStart(2, "0")}"`;
  return `${m}'${String(s).padStart(2, "0")}"`;
}

function fmtDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return iso; }
}

const STATUS = {
  validated: { label: "Validée", icon: CheckCircle2, cls: "text-emerald-400" },
  rejected: { label: "Rejetée", icon: XCircle, cls: "text-destructive" },
  pending: { label: "En attente", icon: Loader2, cls: "text-muted-foreground" }
};

const SEX_LABEL = { male: "Homme", female: "Femme", other: "Autre" };
const LEVEL_LABEL = {
  decouverte: "Découverte",
  regulier: "Régulier",
  confirme: "Confirmé",
  expert: "Expert",
  elite: "Élite"
};

const btnBase =
  "inline-flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-xs font-semibold transition-[background,color,box-shadow,transform] [transition-duration:180ms] active:translate-y-px focus-visible:[outline:2px_solid_#f2c95d] focus-visible:[outline-offset:3px]";
const btnGhost = "border-[#485363] bg-[#202a38] text-[#d4dbe4] hover:bg-[#303c4d] hover:text-white hover:shadow-[0_4px_14px_#080e1740]";
const btnOrange = "border-[#fc4c02] bg-[#fc4c02] text-white hover:bg-[#e94700] hover:text-white shrink-0";

export default function Profile() {
  const { user: ctxUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState(ctxUser);
  const [attempts, setAttempts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [raceMap, setRaceMap] = useState({});
  const [runner, setRunner] = useState(null);
  const [strava, setStrava] = useState({ status: "loading", athlete: null });
  const [loading, setLoading] = useState(true);
  const [stravaBusy, setStravaBusy] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const codeProcessedRef = useRef(false);

  useEffect(() => {
    (async () => {
      // Strava callback (code dans l'URL) — traiter en priorité
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const redirect_uri = stravaRedirect("/profil");
      if (code && !codeProcessedRef.current) {
        codeProcessedRef.current = true;
        setStravaBusy(true);
        try {
          await base44.functions.invoke("stravaConnect", { action: "connect", code, redirect_uri });
          window.history.replaceState({}, "", "/profil");
          toast({ title: "Strava connecté", description: "Tes activités peuvent être importées." });
        } catch (e) {
          window.history.replaceState({}, "", "/profil");
          toast({ title: "Erreur Strava", description: e.message, variant: "destructive" });
        } finally { setStravaBusy(false); }
      }

      let u = ctxUser;
      if (!u) { try { u = await base44.auth.me(); setUser(u); } catch { /* protected route */ } }
      if (!u) { setLoading(false); return; }

      try {
        const [att, pur, races, profiles] = await Promise.all([
          base44.entities.Attempt.filter({ $or: [{ created_by_id: u.id }, { runner_id: u.id }] }, "-created_date", 100),
          base44.entities.Purchase.filter({ created_by_id: u.id }, "-created_date", 100),
          base44.entities.Race.list("-created_date", 200),
          base44.entities.RunnerProfile.filter({ created_by_id: u.id }, "-created_date", 1)
        ]);
        setAttempts(att);
        setPurchases(pur);
        const r = profiles[0] || null;
        setRunner(r);
        const map = {};
        races.forEach((rr) => { map[rr.id] = rr.name; map[rr.name] = rr.name; });
        setRaceMap(map);
        if (!r) {
          navigate("/profil/completer", { replace: true });
          return;
        }
      } catch { /* ignore */ }

      try {
        const res = await base44.functions.invoke("stravaConnect", { action: "status" });
        if (res.data?.connected) setStrava({ status: "connected", athlete: res.data });
        else setStrava({ status: "disconnected", athlete: null });
      } catch { setStrava({ status: "disconnected", athlete: null }); }

      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleStravaConnect() {
    try {
      setStravaBusy(true);
      const res = await base44.functions.invoke("stravaConnect", {
        action: "auth_url",
        redirect_uri: stravaRedirect("/profil")
      });
      window.location.href = res.data.url;
    } catch (e) {
      setStravaBusy(false);
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  }

  async function handleStravaDisconnect() {
    try {
      setStravaBusy(true);
      await base44.functions.invoke("stravaConnect", { action: "disconnect" });
      setStrava({ status: "disconnected", athlete: null });
      toast({ title: "Strava déconnecté" });
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally { setStravaBusy(false); }
  }

  const validated = attempts.filter((a) => a.status === "validated");
  const stats = {
    courses: validated.length,
    kilometers: validated.reduce((s, a) => s + (a.distance_km || 0), 0),
    dplus: validated.reduce((s, a) => s + (a.elevation_gain_m || 0), 0),
    bestTime: validated.length
      ? fmtDuration(Math.min(...validated.map((a) => a.elapsed_time_s || Infinity)))
      : "—"
  };

  const statsArr = [
    { icon: Trophy, label: "Courses validées", value: stats.courses },
    { icon: Mountain, label: "Kilomètres", value: `${Math.round(stats.kilometers)} km` },
    { icon: TrendingUp, label: "D+ cumulé", value: `${Math.round(stats.dplus).toLocaleString("fr-FR")} m` },
    { icon: Clock, label: "Meilleur temps", value: stats.bestTime }
  ];

  const displayName = runner?.full_name || user?.full_name || "Athlète";
  const initial = (displayName || "?").charAt(0).toUpperCase();

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 flex items-center justify-center text-muted-foreground">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Chargement du profil…
      </div>
    );
  }

  const raceName = (id) => raceMap[id] || id || "—";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="rounded-3xl border border-[#303b49] bg-[#171f2b] p-6 flex flex-col gap-5 shadow-[0_18px_48px_rgba(19,31,45,0.18)] animate-arrive">
        {/* Hero */}
        <section className="rounded-3xl border border-[#354152] bg-[#202a38] overflow-hidden">
          <div
            className="h-24 bg-[#222d3b]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 50% 120%, transparent 38%, #f2c95d40 38.5%, transparent 39.2%), radial-gradient(circle at 50% 120%, transparent 46%, #f2c95d30 46.5%, transparent 47.2%), radial-gradient(circle at 50% 120%, transparent 54%, #f2c95d20 54.5%, transparent 55.2%), radial-gradient(circle at 50% 120%, transparent 62%, #f2c95d15 62.5%, transparent 63.2%)"
            }}
          />
          <div className="px-5 pb-5 -mt-11 flex items-end gap-4">
            <div className="w-[88px] h-[88px] shrink-0 rounded-[22px] border-4 border-[#202a38] bg-primary text-[#202a38] grid place-items-center font-[750] text-[30px] shadow-[0_8px_24px_#080e1760]">
              {initial}
            </div>
            <div className="flex-1 min-w-0 pb-[5px]">
              <div className="font-[750] text-2xl leading-[1.15] tracking-[-0.6px] truncate">{displayName}</div>
              <div className="mt-[5px] text-[#aab5c3] text-xs leading-[1.4] truncate">{user?.email || "—"}</div>
            </div>
            <button
              onClick={() => setShowPwd(true)}
              className={cn(btnBase, btnGhost, "self-start sm:self-end shrink-0")}
            >
              <KeyRound className="w-3.5 h-3.5" /> Changer le mot de passe
            </button>
          </div>
        </section>

        {/* Runner details */}
        <section className="rounded-[18px] border border-[#354152] bg-[#202a38] p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-[9px] text-[15px] font-bold leading-[1.4]">
              <User className="w-[17px] h-[17px] text-primary" /> Profil coureur
            </div>
            <Link to="/profil/completer" className={cn(btnBase, btnGhost, "px-3.5 py-2")}>
              Modifier
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-[1px] text-[#aab5c3]">Club</div>
              <div className="mt-1 text-sm truncate">{runner?.club || "—"}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[1px] text-[#aab5c3]">Ville</div>
              <div className="mt-1 text-sm truncate">{runner?.city || "—"}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[1px] text-[#aab5c3]">Naissance</div>
              <div className="mt-1 text-sm">{runner?.birth_date ? fmtDate(runner.birth_date) : "—"}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[1px] text-[#aab5c3]">Sexe</div>
              <div className="mt-1 text-sm">{SEX_LABEL[runner?.sex] || "—"}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[1px] text-[#aab5c3]">Poids</div>
              <div className="mt-1 text-sm">{runner?.weight_kg != null ? `${runner.weight_kg} kg` : "—"}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[1px] text-[#aab5c3]">Taille</div>
              <div className="mt-1 text-sm">{runner?.height_cm != null ? `${runner.height_cm} cm` : "—"}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[1px] text-[#aab5c3]">Niveau</div>
              <div className="mt-1 text-sm">{LEVEL_LABEL[runner?.level] || "—"}</div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statsArr.map((s, i) => (
            <div
              key={s.label}
              className="rounded-[18px] border border-[#354152] bg-[#202a38] px-4 pt-[17px] pb-4 animate-arrive"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <s.icon className="w-[17px] h-[17px] text-primary mb-[11px]" />
              <div className="text-[10px] uppercase tracking-[1px] text-[#aab5c3] leading-[1.3]">{s.label}</div>
              <div className="mt-[5px] text-[20px] font-[750] tracking-[-0.3px] leading-[1.2]">{s.value}</div>
            </div>
          ))}
        </section>

        {/* Dashboard */}
        <StatsDashboard attempts={attempts} />

        {/* Strava */}
        <section className="rounded-[18px] border border-[#354152] bg-[#202a38] p-[19px]">
          {strava.status === "loading" ? (
            <div className="flex items-center gap-3 text-sm text-[#aab5c3]">
              <Loader2 className="w-4 h-4 animate-spin" /> Vérification de la connexion Strava…
            </div>
          ) : strava.status === "connected" ? (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-[13px] min-w-0">
                <div className="w-[42px] h-[42px] shrink-0 rounded-[15px] bg-[#fc4c02] text-white grid place-items-center font-[800] text-[15px]">S</div>
                <div className="min-w-0">
                  <div className="font-bold text-[15px] leading-[1.4] flex items-center gap-2">
                    Strava connecté <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <div className="mt-[3px] text-[#aab5c3] text-xs leading-[1.45] truncate">
                    {strava.athlete?.athlete_name ? `Athlète ${strava.athlete.athlete_name}` : "Activités synchronisées"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to="/strava"
                  className={cn(btnBase, btnGhost, "px-3.5 py-2")}
                >
                  Activités <ChevronRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={handleStravaDisconnect}
                  disabled={stravaBusy}
                  className={cn(btnBase, btnGhost, "px-3.5 py-2", "disabled:opacity-60")}
                >
                  <Unlink className="w-3.5 h-3.5" /> Déconnecter
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-[13px] min-w-0">
                <div className="w-[42px] h-[42px] shrink-0 rounded-[15px] bg-[#303b49] text-primary grid place-items-center font-[800] text-[15px]">S</div>
                <div className="min-w-0">
                  <div className="font-bold text-[15px] leading-[1.4]">Strava non connecté</div>
                  <div className="mt-[3px] text-[#aab5c3] text-xs leading-[1.45]">Connecte ton compte pour importer tes traces GPS automatiquement.</div>
                </div>
              </div>
              <button
                onClick={handleStravaConnect}
                disabled={stravaBusy}
                className={cn(btnBase, btnOrange, "disabled:opacity-60")}
              >
                {stravaBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />} Connecter
              </button>
            </div>
          )}
        </section>

        {user?.role === "admin" && <AutoImportAdmin />}

        {/* Purchases */}
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center gap-[9px] text-[17px] font-bold tracking-[-0.2px] leading-[1.35]">
            <Receipt className="w-[17px] h-[17px] text-primary" /> Mes achats
          </div>
          <div className="rounded-[18px] border border-[#354152] bg-[#202a38] overflow-hidden">
            {purchases.length === 0 ? (
              <div className="px-5 py-7 text-center text-[#aab5c3] text-[13px] leading-[1.5]">Aucun achat pour l'instant.</div>
            ) : purchases.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3.5 border-b border-[#354152]/40 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{raceName(p.race_id)}</div>
                  <div className="text-[11px] text-[#aab5c3]">{fmtDate(p.purchase_date)} · {p.purchase_type}</div>
                </div>
                <div className="font-bold text-sm tabular-nums">{(p.amount_eur ?? 0).toFixed(2).replace(".", ",")} €</div>
              </div>
            ))}
          </div>
        </section>

        {/* Attempts */}
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center gap-[9px] text-[17px] font-bold tracking-[-0.2px] leading-[1.35]">
            <LineChart className="w-[17px] h-[17px] text-primary" /> Historique des tentatives
          </div>
          <div className="rounded-[18px] border border-[#354152] bg-[#202a38] overflow-hidden">
            {attempts.length === 0 ? (
              <div className="px-5 py-7 text-center text-[#aab5c3] text-[13px] leading-[1.5]">Aucune tentative pour l'instant.</div>
            ) : attempts.map((a) => {
              const st = STATUS[a.status] || STATUS.pending;
              const StIcon = st.icon;
              return (
                <div key={a.id} className="px-5 py-3.5 border-b border-[#354152]/40 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{raceName(a.race_id)}</div>
                      <div className="text-[11px] text-[#aab5c3]">{fmtDate(a.activity_date)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm tabular-nums">{fmtDuration(a.elapsed_time_s)}</div>
                      <div className="text-[11px] text-[#aab5c3] tabular-nums">
                        {a.distance_km ? `${a.distance_km} km` : ""} {a.elevation_gain_m ? `· +${Math.round(a.elevation_gain_m)} m` : ""}
                      </div>
                    </div>
                    <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full border border-[#354152] bg-[#303b49]", st.cls)}>
                      <StIcon className={cn("w-3 h-3", a.status === "pending" && "animate-spin")} /> {st.label}
                    </span>
                  </div>
                  {a.status === "rejected" && a.rejection_reason && (
                    <div className="mt-2 text-[11px] text-[#aab5c3]">Motif : {a.rejection_reason}</div>
                  )}
                  {a.status === "validated" && typeof a.match_pct === "number" && (
                    <div className="mt-2 text-[11px] text-[#aab5c3]">Correspondance tracé : {Math.round(a.match_pct)} %</div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-[#aab5c3] text-xs leading-[1.55]">Seule la meilleure performance compte. Les autres tentatives restent visibles dans ton historique personnel.</p>
        </section>

        {/* Déconnexion */}
        <button
          onClick={() => base44.auth.logout("/")}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-[#3d4858] bg-[#171f2b] py-3.5 text-sm font-semibold text-[#aab5c3] hover:text-white hover:border-primary/40 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Se déconnecter
        </button>
      </div>

      {showPwd && <PasswordDialog userId={user?.id} onClose={() => setShowPwd(false)} />}
    </div>
  );
}

function AutoImportAdmin() {
  const { toast } = useToast();
  const [state, setState] = useState({ loading: true, active: false });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    base44.functions.invoke("stravaWebhook", { action: "status" })
      .then((r) => setState({ loading: false, active: !!r.data?.active }))
      .catch(() => setState({ loading: false, active: false }));
  }, []);

  async function activate() {
    setBusy(true);
    try {
      const r = await base44.functions.invoke("stravaWebhook", { action: "subscribe" });
      if (r.data?.error) throw new Error(r.data.error);
      setState({ loading: false, active: true });
      toast({ title: "Import automatique activé", description: "Les sorties Strava seront validées toutes seules." });
    } catch (e) {
      toast({ title: "Activation impossible", description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  }

  return (
    <section className="rounded-[18px] border border-[#354152] bg-[#202a38] p-[19px] flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="font-bold text-[15px] leading-[1.4]">Import automatique Strava <span className="text-[10px] uppercase tracking-wider text-[#aab5c3]">admin</span></div>
        <div className="mt-[3px] text-[#aab5c3] text-xs leading-[1.45]">
          {state.loading ? "Vérification…" : state.active
            ? "Actif : chaque nouvelle sortie Strava est comparée aux courses où le coureur est inscrit."
            : "Inactif : les coureurs doivent importer leurs sorties à la main."}
        </div>
      </div>
      {!state.loading && !state.active && (
        <button onClick={activate} disabled={busy} className={cn(btnBase, btnOrange, "disabled:opacity-60")}>
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Activer
        </button>
      )}
      {!state.loading && state.active && <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />}
    </section>
  );
}

function PasswordDialog({ userId, onClose }) {
  const { toast } = useToast();
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) { setError("Le nouveau mot de passe doit faire au moins 8 caractères."); return; }
    if (newPassword !== confirm) { setError("Les nouveaux mots de passe ne correspondent pas."); return; }
    setLoading(true);
    try {
      await base44.auth.changePassword({ userId, currentPassword, newPassword });
      toast({ title: "Mot de passe modifié", description: "Utilise-le à ta prochaine connexion." });
      onClose();
    } catch (err) {
      setError(err.message || "Échec du changement de mot de passe.");
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 animate-fade-up">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <h3 className="font-heading font-bold text-lg">Changer le mot de passe</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-5">Choisis un nouveau mot de passe (8 caractères minimum).</p>
        {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Mot de passe actuel</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} required
              className="w-full h-11 rounded-xl border border-border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Nouveau mot de passe</label>
            <input type="password" value={newPassword} onChange={(e) => setNew(e.target.value)} required
              className="w-full h-11 rounded-xl border border-border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Confirmer le nouveau</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required
              className="w-full h-11 rounded-xl border border-border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button type="button" onClick={onClose} className="border border-border rounded-full py-3 text-sm text-muted-foreground hover:text-foreground">Annuler</button>
            <button type="submit" disabled={loading}
              className="bg-primary text-primary-foreground rounded-full py-3 text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 inline-flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}