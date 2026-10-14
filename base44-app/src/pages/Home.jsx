import React, { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ChevronRight, Compass, Flag, Mountain, ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";
import { base44 } from "@/api/base44Client";
import CourseCard from "@/components/CourseCard";
import { useAuth } from "@/lib/AuthContext";
import InstallBanner from "@/components/InstallBanner";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Accueil" },
  { to: "/parcours", label: "Courses" },
  { to: "/classement", label: "Classements" },
  { to: "/comment-ca-marche", label: "Comment" },
  { to: "/manifeste", label: "Manifeste" },
  { to: "/profil", label: "Profil" }
];

export default function Home() {
  const { user } = useAuth();
  const [races, setRaces] = useState([]);
  const [stats, setStats] = useState({ distance: 0, dplus: 0, altMax: 0, count: 0 });

  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.Race.filter({ status: "active" }, "-created_date", 50);
        setRaces(list);
        setStats({
          distance: list.reduce((s, r) => s + (r.distance_km || 0), 0),
          dplus: list.reduce((s, r) => s + (r.elevation_gain_m || 0), 0),
          altMax: list.reduce((m, r) => Math.max(m, r.altitude_max_m || 0), 0),
          count: list.length
        });
      } catch {
        /* bêta : catalogue encore vide */
      }
    })();
  }, []);

  const figures = [
    { value: stats.count, label: "parcours officiels", suffix: "" },
    { value: Math.round(stats.distance), label: "kilomètres de trail", suffix: " km" },
    { value: Math.round(stats.dplus), label: "dénivelé positif cumulé", suffix: " m" },
    { value: Math.round(stats.altMax), label: "altitude maximale", suffix: " m" }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="absolute top-0 inset-x-0 z-30">
        <InstallBanner />
        <div className="mx-auto max-w-5xl px-5 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <Logo size={36} />
            <div className="leading-none">
              <div className="font-heading font-bold tracking-tight text-sm">OTC</div>
              <div className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase">Off Trail Challenge</div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  cn(
                    "text-xs font-medium px-3 py-2 rounded-full transition-colors",
                    isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Link
                to="/profil"
                className="inline-flex items-center bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-full hover:bg-primary/90 transition-colors"
                >
                Mon compte
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden sm:inline text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-full hover:bg-primary/90 transition-colors"
                >
                  S'inscrire
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-5 overflow-hidden topo-lines">
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        <svg className="absolute bottom-0 inset-x-0 w-full h-1/3 text-foreground/[0.04]" viewBox="0 0 1200 300" preserveAspectRatio="none">
          <path d="M0 300 L0 180 L180 80 L320 200 L460 60 L640 220 L820 100 L980 200 L1200 90 L1200 300 Z" fill="currentColor" />
        </svg>

        <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto animate-fade-up">
          <div className="flex items-center gap-2 mb-6">
            <span className="h-px w-8 bg-primary/60" />
            <span className="text-[11px] tracking-[0.3em] uppercase text-primary font-medium">Off Trail Challenge</span>
            <span className="h-px w-8 bg-primary/60" />
          </div>

          <h1 className="font-heading font-bold text-4xl sm:text-6xl leading-[0.95] tracking-tight text-balance">
            Le trail.
            <br />
            <span className="text-primary">En totale autonomie.</span>
          </h1>

          <p className="mt-8 font-display italic text-lg sm:text-xl text-foreground/90 leading-relaxed text-balance max-w-xl">
            « Pas de balisage. Pas de ravito. Pas de spectateurs.<br />
            Juste toi, la trace et la montagne. »
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center gap-3">
            <Link
              to="/parcours"
              className="group inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-7 py-3.5 rounded-full text-sm hover:bg-primary/90 transition-colors"
            >
              Découvrir les courses
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/comment-ca-marche"
              className="inline-flex items-center gap-2 border border-border text-foreground font-medium px-7 py-3.5 rounded-full text-sm hover:border-primary/40 hover:text-primary transition-colors"
            >
              Comment ça marche
            </Link>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-muted-foreground/60 animate-fade-in">
          <span className="text-[10px] tracking-[0.2em] uppercase">Défiler</span>
          <ChevronRight className="w-4 h-4 rotate-90" />
        </div>
      </section>

      {/* Big figures */}
      <section className="border-t border-border/40 py-16 sm:py-20 px-5 bg-gradient-to-b from-secondary/20 to-transparent">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <span className="text-[11px] tracking-[0.3em] uppercase text-primary font-medium">La saison</span>
            <h2 className="mt-3 font-heading font-bold text-2xl sm:text-3xl tracking-tight">Des chiffres. De la montagne.</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border/40 rounded-2xl overflow-hidden border border-border/40">
            {figures.map((f) => (
              <div key={f.label} className="bg-card px-5 py-8 text-center">
                <div className="font-heading font-bold text-4xl sm:text-5xl tracking-tight text-primary tabular-nums">
                  {f.value.toLocaleString("fr-FR")}
                  <span className="text-2xl sm:text-3xl text-primary/70">{f.suffix}</span>
                </div>
                <div className="mt-2 text-[11px] sm:text-xs uppercase tracking-wider text-muted-foreground">{f.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Concept teaser */}
      <section className="py-20 px-5 border-t border-border/40">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <span className="text-[11px] tracking-[0.3em] uppercase text-primary font-medium">Le concept</span>
            <h2 className="mt-3 font-heading font-bold text-3xl sm:text-4xl tracking-tight">Choisis. Cours. Classe-toi.</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              { num: "01", title: "Choisis ta course", icon: Compass, desc: "Un catalogue de parcours officiels, du trail court à l'ultra, par région et par niveau." },
              { num: "02", title: "Cours en autonomie", icon: Mountain, desc: "Télécharge la trace GPX, envoie-la vers ta montre GPS et va courir. Seul, sans balisage." },
              { num: "03", title: "Fais-toi classer", icon: Flag, desc: "Importe ton activité Strava. Ta trace est vérifiée, ton temps entre au classement." }
            ].map(({ num, title, desc, icon: Icon }) => (
              <div key={num} className="relative rounded-2xl border border-border bg-card p-7">
                <div className="flex items-center justify-between mb-5">
                  <span className="font-display italic text-primary text-2xl">{num}</span>
                  <Icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="font-heading font-bold text-lg tracking-tight mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/comment-ca-marche" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
              Le détail des 4 étapes <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured courses */}
      <section className="py-20 px-5 border-t border-border/40 bg-gradient-to-b from-transparent to-secondary/20">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-[11px] tracking-[0.3em] uppercase text-primary font-medium">Parcours</span>
              <h2 className="mt-3 font-heading font-bold text-3xl sm:text-4xl tracking-tight">Les montagnes t'appellent</h2>
            </div>
            <Link to="/parcours" className="hidden sm:inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
              Tout voir <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {races.slice(0, 3).map((r) => (
              <CourseCard key={r.id} race={r} />
            ))}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Link to="/parcours" className="inline-flex items-center gap-1 text-sm text-primary">
              Tout voir <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Manifesto quote */}
      <section className="py-28 px-5 border-t border-border/40">
        <div className="mx-auto max-w-3xl text-center">
          <Flag className="w-8 h-8 text-primary mx-auto mb-6" />
          <p className="font-display italic text-2xl sm:text-3xl leading-relaxed text-balance">
            « Pas de balisage. Pas de ravito. Pas de spectateurs. Juste toi, la trace et la montagne. »
          </p>
          <Link
            to="/manifeste"
            className="mt-10 inline-flex items-center gap-2 border border-border px-6 py-3 rounded-full text-sm hover:border-primary/40 hover:text-primary transition-colors"
          >
            Lire le manifeste <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-10 px-5">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <Logo size={28} />
            <span>OTC — Off Trail Challenge · Le trail en totale autonomie.</span>
          </div>
          <div className="flex items-center gap-5">
            <Link to="/login" className="hover:text-foreground">Connexion</Link>
            <Link to="/manifeste" className="hover:text-foreground">Manifeste</Link>
            <span>CGU · CGV · Décharge</span>
          </div>
        </div>
      </footer>
    </div>
  );
}