import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCog, Loader2, ShieldAlert } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/lib/utils";

const SEX_OPTIONS = [
  { value: "male", label: "Homme" },
  { value: "female", label: "Femme" },
  { value: "other", label: "Autre" }
];

const LEVEL_OPTIONS = [
  { value: "decouverte", label: "Découverte" },
  { value: "regulier", label: "Régulier" },
  { value: "confirme", label: "Confirmé" },
  { value: "expert", label: "Expert" },
  { value: "elite", label: "Élite" }
];

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshRunnerProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [club, setClub] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [sex, setSex] = useState("");
  const [city, setCity] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [level, setLevel] = useState("");
  const [waiver, setWaiver] = useState(false);
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const profiles = await base44.entities.RunnerProfile.filter({}, "-created_date", 1);
        const p = profiles?.[0];
        if (p) {
          setExisting(p);
          setFullName(p.full_name || "");
          setClub(p.club || "");
          setBirthDate(p.birth_date || "");
          setSex(p.sex || "");
          setCity(p.city || "");
          setWeight(p.weight_kg != null ? String(p.weight_kg) : "");
          setHeight(p.height_cm != null ? String(p.height_cm) : "");
          setLevel(p.level || "");
          setWaiver(!!p.waiver_accepted_at);
        }
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!fullName) { setError("Indique ton nom complet."); return; }
    if (!birthDate) { setError("Indique ta date de naissance."); return; }
    if (!sex) { setError("Indique ton sexe."); return; }
    if (!city) { setError("Indique ta ville."); return; }
    if (!waiver) { setError("Tu dois accepter la décharge de responsabilité."); return; }
    setSaving(true);
    const payload = {
      full_name: fullName,
      club: club || null,
      birth_date: birthDate,
      sex,
      city,
      weight_kg: weight ? Number(weight) : null,
      height_cm: height ? Number(height) : null,
      level: level || null,
      waiver_accepted_at: existing?.waiver_accepted_at || new Date().toISOString()
    };
    try {
      if (existing?.id) {
        await base44.entities.RunnerProfile.update(existing.id, payload);
      } else {
        await base44.entities.RunnerProfile.create(payload);
      }
      await refreshRunnerProfile();
      toast({ title: "Profil enregistré", description: "Ton profil coureur est complet." });
      navigate("/profil");
    } catch (err) {
      setError(err.message || "Échec de l'enregistrement.");
    } finally { setSaving(false); }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Chargement…
      </div>
    );
  }

  return (
    <AuthLayout
      icon={UserCog}
      title={existing ? "Modifier ton profil coureur" : "Complète ton profil coureur"}
      subtitle="Une seule étape avant de courir en autonomie"
    >
      {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="fullname">Nom complet</Label>
            <Input id="fullname" value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-12" placeholder="Prénom Nom" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="club">Club <span className="text-muted-foreground normal-case">(optionnel)</span></Label>
            <Input id="club" value={club} onChange={(e) => setClub(e.target.value)} className="h-12" placeholder="Club / affiliation" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="birth">Date de naissance</Label>
            <Input id="birth" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="h-12" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Ville</Label>
            <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} className="h-12" placeholder="Ville" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weight">Poids (kg) <span className="text-muted-foreground normal-case">(optionnel)</span></Label>
            <Input id="weight" type="number" min="0" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} className="h-12" placeholder="ex. 68" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="height">Taille (cm) <span className="text-muted-foreground normal-case">(optionnel)</span></Label>
            <Input id="height" type="number" min="0" step="1" value={height} onChange={(e) => setHeight(e.target.value)} className="h-12" placeholder="ex. 175" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Niveau de pratique</Label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {LEVEL_OPTIONS.map((opt) => (
              <button
                type="button"
                key={opt.value}
                onClick={() => setLevel(opt.value)}
                className={cn(
                  "h-11 rounded-xl border text-sm transition-colors",
                  level === opt.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Sexe</Label>
          <div className="grid grid-cols-3 gap-2">
            {SEX_OPTIONS.map((opt) => (
              <button
                type="button"
                key={opt.value}
                onClick={() => setSex(opt.value)}
                className={cn(
                  "h-11 rounded-xl border text-sm transition-colors",
                  sex === opt.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-secondary/30 p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground leading-relaxed">
              <span className="text-foreground font-medium">Décharge de responsabilité.</span> L'Off Trail Challenge
              se court en totale autonomie : pas de balisage, pas de ravitaillement, pas de spectateurs. Tu es
              seul·e sur le parcours et reste seul·e responsable de ta sécurité, de tes décisions et de ton
              intégrité physique.
            </div>
          </div>
          <label className="mt-3 flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={waiver}
              onChange={(e) => setWaiver(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-border accent-[hsl(var(--primary))]"
            />
            <span className="text-sm text-foreground">J'ai lu et j'accepte la décharge de responsabilité.</span>
          </label>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={saving}>
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement…</> : "Enregistrer mon profil"}
        </Button>
      </form>
    </AuthLayout>
  );
}