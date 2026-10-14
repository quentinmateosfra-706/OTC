import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Compass, Download, Mountain, Activity, ChevronRight, ArrowRight, Smartphone, Share, PlusSquare, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

const INSTALL = {
  iphone: {
    label: "iPhone",
    note: "Le plus simple est Safari. Sur un iPhone récent, ça marche aussi depuis Chrome (bouton Partager → « Sur l'écran d'accueil »).",
    steps: [
      { icon: Compass, text: "Ouvre off-trail-challenge.base44.app dans Safari." },
      { icon: Share, text: "Appuie sur Partager (le carré avec une flèche vers le haut). Sur les iOS récents, il est dans le menu « ••• » en bas à droite." },
      { icon: PlusSquare, text: "Fais défiler et choisis « Sur l'écran d'accueil »." },
      { icon: Smartphone, text: "Laisse le nom « OTC » et appuie sur « Ajouter ». L'icône apparaît sur ton écran d'accueil." }
    ]
  },
  android: {
    label: "Android",
    note: "Avec Chrome (ou Samsung Internet : menu → « Ajouter la page à » → « Écran d'accueil »).",
    steps: [
      { icon: Compass, text: "Ouvre off-trail-challenge.base44.app dans Chrome." },
      { icon: MoreVertical, text: "Appuie sur le menu ⋮ en haut à droite." },
      { icon: PlusSquare, text: "Choisis « Installer l'application » ou « Ajouter à l'écran d'accueil »." },
      { icon: Smartphone, text: "Confirme avec « Installer ». OTC s'ouvre ensuite en plein écran, comme une application." }
    ]
  }
};

function InstallGuide() {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const [os, setOs] = useState(/android/i.test(ua) ? "android" : "iphone");
  const guide = INSTALL[os];
  return (
    <section id="installer" className="mt-12 scroll-mt-24 rounded-2xl border border-primary/30 bg-primary/5 p-6">
      <div className="flex items-center gap-2 mb-1">
        <Smartphone className="w-4 h-4 text-primary" />
        <span className="text-[11px] tracking-[0.3em] uppercase text-primary font-medium">Bêta</span>
      </div>
      <h2 className="font-heading font-bold text-2xl tracking-tight">Installe OTC sur ton téléphone</h2>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
        Pendant la bêta, OTC n'est pas sur les stores : c'est une web app. Ajoute-la à ton écran d'accueil pour l'ouvrir
        en un geste, en plein écran, comme une vraie application. Gratuit, sans téléchargement.
      </p>

      <div className="mt-5 inline-flex rounded-full border border-border bg-card p-1">
        {Object.entries(INSTALL).map(([key, g]) => (
          <button
            key={key}
            type="button"
            onClick={() => setOs(key)}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-medium transition-colors",
              os === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {g.label}
          </button>
        ))}
      </div>

      <ol className="mt-5 space-y-3">
        {guide.steps.map(({ icon: Icon, text }, i) => (
          <li key={i} className="flex gap-3 items-start">
            <span className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">{i + 1}</span>
            <div className="flex-1 flex gap-2 items-start pt-1">
              <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span className="text-sm leading-relaxed">{text}</span>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-xs text-muted-foreground">{guide.note}</p>
    </section>
  );
}

const steps = [
  {
    num: "01",
    icon: Compass,
    title: "Choisis ta course",
    desc: "Parcours le catalogue des trails officiels. Du court à l'ultra, par région et par niveau. Chaque course existe pour de vrai : une trace, un départ, un profil. Tu débloques l'accès, la trace est à toi."
  },
  {
    num: "02",
    icon: Download,
    title: "Télécharge la trace GPX",
    desc: "Récupère le fichier GPX officiel et envoie-le vers ta montre ou ton GPS. C'est la seule ligne de conduite que tu emporteras sur la montagne — il n'y en aura pas d'autre."
  },
  {
    num: "03",
    icon: Mountain,
    title: "Cours en autonomie avec ta montre GPS",
    desc: "Pars quand tu veux, dans la fenêtre de tentative. Seul, sans balisage, sans ravitaillement, sans assistance. Tu portes seul la responsabilité de ton entreprise. Ta montre enregistre."
  },
  {
    num: "04",
    icon: Activity,
    title: "Importe ton activité Strava",
    desc: "Connecte Strava et importe ton activité. La trace est comparée au parcours officiel, les checkpoints vérifiés dans l'ordre. Si tout passe, ton temps entre au classement."
  }
];

export default function HowItWorks() {
  const { hash } = useLocation();
  useEffect(() => {
    if (hash !== "#installer") return;
    const t = setTimeout(() => document.getElementById("installer")?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    return () => clearTimeout(t);
  }, [hash]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-10 text-center">
        <span className="text-[11px] tracking-[0.3em] uppercase text-primary font-medium">Le concept</span>
        <h1 className="mt-3 font-heading font-bold text-3xl sm:text-4xl tracking-tight">Comment ça marche</h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
          Quatre étapes, de l'écran à la montagne, et de la montagne au classement.
        </p>
      </div>

      <div className="space-y-4">
        {steps.map(({ num, icon: Icon, title, desc }) => (
          <div key={num} className="flex gap-5 rounded-2xl border border-border bg-card p-6">
            <div className="shrink-0">
              <span className="font-display italic text-primary text-3xl leading-none">{num}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-primary" />
                <h2 className="font-heading font-semibold text-lg leading-tight">{title}</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <InstallGuide />

      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          to="/parcours"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-full text-sm hover:bg-primary/90 transition-colors"
        >
          Voir les courses <ChevronRight className="w-4 h-4" />
        </Link>
        <Link
          to="/manifeste"
          className="inline-flex items-center gap-2 border border-border px-6 py-3 rounded-full text-sm hover:border-primary/40 hover:text-primary transition-colors"
        >
          Lire le manifeste <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}