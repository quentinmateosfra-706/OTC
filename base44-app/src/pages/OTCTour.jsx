import React from "react";
import { Link } from "react-router-dom";
import { Award, Calendar, Mountain, ChevronRight, Trophy } from "lucide-react";
import { otcTour, rankings } from "@/lib/mockData";
import { cn } from "@/lib/utils";

export default function OTCTour() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <span className="text-[11px] tracking-[0.3em] uppercase text-primary font-medium">Compétition annuelle</span>
        <h1 className="mt-2 font-heading font-bold text-3xl tracking-tight">OTC Tour 2026</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-lg">
          10 courses officielles réparties dans toute la France. Chaque performance contribue à ton classement annuel.
          Le classement récompense — il ne bloque jamais l'accès aux parcours.
        </p>
      </div>

      {/* Season summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Courses", value: "10" },
          { label: "Régions", value: "8" },
          { label: "Saison", value: "2026" }
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4 text-center">
            <div className="font-heading font-bold text-2xl text-primary">{s.value}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Annual ranking */}
      <div className="rounded-2xl border border-border bg-card p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-4 h-4 text-primary" />
          <h2 className="font-heading font-semibold">Classement annuel OTC Tour</h2>
        </div>
        <div className="space-y-1">
          {rankings.global.slice(0, 5).map((r) => (
            <div key={r.rank} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
              <span className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                r.rank === 1 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>
                {r.rank}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{r.name}</div>
                <div className="text-[11px] text-muted-foreground">{r.city} · {r.courses} courses</div>
              </div>
              <div className="font-heading font-semibold text-sm text-primary tabular-nums">{r.score}</div>
            </div>
          ))}
        </div>
      </div>

      {/* The 10 races */}
      <h2 className="font-heading font-semibold mb-3">Les 10 courses</h2>
      <div className="space-y-2">
        {otcTour.map((c, i) => (
          <Link
            key={c.id}
            to={c.status === "open" ? `/parcours/${c.id}` : "#"}
            className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 hover:border-primary/40 transition-colors"
          >
            <span className="font-display italic text-primary text-xl w-8 text-center">{String(i + 1).padStart(2, "0")}</span>
            <div className="flex-1 min-w-0">
              <div className="font-heading font-semibold text-sm leading-tight">{c.name}</div>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                <span>{c.region}</span>
                <span className="flex items-center gap-1"><Mountain className="w-3 h-3" />{c.distance}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{c.window}</span>
              </div>
            </div>
            <span className={cn("text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border",
              c.status === "open" ? "text-primary border-primary/30 bg-primary/10" : "text-muted-foreground border-border")}>
              {c.status === "open" ? "Ouverte" : "Bientôt"}
            </span>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        ))}
      </div>

      {/* Rewards */}
      <div className="mt-6 rounded-2xl border border-dashed border-border bg-secondary/20 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Award className="w-4 h-4 text-primary" />
          <h3 className="font-heading font-semibold text-sm">Récompenses — Saison 1</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Les gagnants des 10 courses reçoivent un tee-shirt OTC. Le vainqueur du classement annuel remporte une récompense
          et un accès gratuit à la saison suivante. Badges, trophées virtuels et classements entre amis arriveront en V2.
        </p>
      </div>
    </div>
  );
}