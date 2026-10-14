import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2, ShieldAlert } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";
import { safeReturnTo } from "@/lib/authReturnTo";
import { cn } from "@/lib/utils";

const SEX_OPTIONS = [
  { value: "male", label: "Homme" },
  { value: "female", label: "Femme" },
  { value: "other", label: "Autre" }
];

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [club, setClub] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [sex, setSex] = useState("");
  const [city, setCity] = useState("");
  const [waiver, setWaiver] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [waiverAcceptedAt, setWaiverAcceptedAt] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit faire au moins 8 caractères.");
      return;
    }
    if (!sex) {
      setError("Indique ton sexe.");
      return;
    }
    if (!waiver) {
      setError("Tu dois accepter la décharge de responsabilité pour t'inscrire.");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setWaiverAcceptedAt(new Date().toISOString());
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "Inscription échouée.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }

      // S'assurer que la session est bien active avant d'écrire le profil
      // (RLS create: created_by_id = user.id).
      let sessionReady = false;
      for (let i = 0; i < 5; i++) {
        try { if (await base44.auth.me()) { sessionReady = true; break; } } catch { /* retry */ }
        await new Promise((r) => setTimeout(r, 400));
      }

      let profileOk = false;
      if (sessionReady) {
        try {
          await base44.entities.RunnerProfile.create({
            full_name: fullName,
            club: club || null,
            birth_date: birthDate,
            sex,
            city,
            waiver_accepted_at: waiverAcceptedAt || new Date().toISOString()
          });
          profileOk = true;
        } catch { /* profil non créé → complétion forcée par le garde-fou */ }
      }

      if (profileOk) {
        window.location.href = safeReturnTo();
      } else {
        toast({
          title: "Dernière étape",
          description: "Compte créé. Complète ton profil coureur pour continuer."
        });
        window.location.href = "/profil/completer";
      }
    } catch (err) {
      setError(err.message || "Code de vérification invalide.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast({ title: "Code envoyé", description: "Vérifie ta boîte mail." });
    } catch (err) {
      setError(err.message || "Envoi du code impossible.");
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", safeReturnTo());
  };

  if (showOtp) {
    return (
      <AuthLayout
        icon={Mail}
        title="Vérifie ton email"
        subtitle={`Un code a été envoyé à ${email}`}
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
        )}
        <div className="flex justify-center mb-6">
          <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button className="w-full h-12 font-medium" onClick={handleVerify} disabled={loading || otpCode.length < 6}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Vérification…</> : "Vérifier"}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Pas reçu de code ?{" "}
          <button onClick={handleResend} className="text-primary font-medium hover:underline">Renvoyer</button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={UserPlus}
      title="Créer ton compte"
      subtitle="Rejoins le trail en totale autonomie"
      footer={
        <>
          Déjà un compte ?{" "}
          <Link
            to={"/login" + (safeReturnTo() !== "/" ? "?returnTo=" + encodeURIComponent(safeReturnTo()) : "")}
            className="text-primary font-medium hover:underline"
          >
            Connexion
          </Link>
        </>
      }
    >
      <Button variant="outline" className="w-full h-12 text-sm font-medium mb-6" onClick={handleGoogle}>
        <GoogleIcon className="w-5 h-5 mr-2" />
        Continuer avec Google
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">ou</span>
        </div>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Compte */}
        <div className="space-y-3">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Ton compte</div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input id="email" type="email" autoComplete="email" autoFocus placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12" required />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <Input id="password" type="password" autoComplete="new-password" placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-12" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmer</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <Input id="confirm" type="password" autoComplete="new-password" placeholder="••••••••"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10 h-12" required />
              </div>
            </div>
          </div>
        </div>

        {/* Profil coureur */}
        <div className="space-y-3">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Profil coureur</div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="fullname">Nom</Label>
              <Input id="fullname" type="text" autoComplete="name" placeholder="Prénom Nom"
                value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-12" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="club">Club <span className="text-muted-foreground normal-case">(optionnel)</span></Label>
              <Input id="club" type="text" placeholder="Club / affiliation"
                value={club} onChange={(e) => setClub(e.target.value)} className="h-12" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birth">Date de naissance</Label>
              <Input id="birth" type="date" value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)} className="h-12" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Ville</Label>
              <Input id="city" type="text" autoComplete="address-level2" placeholder="Ville"
                value={city} onChange={(e) => setCity(e.target.value)} className="h-12" required />
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
                    sex === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Décharge de responsabilité */}
        <div className="rounded-2xl border border-border bg-secondary/30 p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground leading-relaxed">
              <span className="text-foreground font-medium">Décharge de responsabilité.</span> L'Off Trail Challenge
              se court en totale autonomie : pas de balisage, pas de ravitaillement, pas de spectateurs. Tu es
              seul·e sur le parcours et reste seul·e responsable de ta sécurité, de tes décisions et de ton
              intégrité physique. L'organisateur ne fournit ni secours, ni encadrement.
            </div>
          </div>
          <label className="mt-3 flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={waiver}
              onChange={(e) => setWaiver(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-border accent-[hsl(var(--primary))]"
            />
            <span className="text-sm text-foreground">
              J'ai lu et j'accepte la décharge de responsabilité.
            </span>
          </label>
        </div>

        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Création…</>
          ) : (
            "Créer mon compte"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}