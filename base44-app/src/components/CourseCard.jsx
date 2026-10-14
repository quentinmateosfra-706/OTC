import React from "react";
import { Link } from "react-router-dom";
import { MapPin, TrendingUp, Mountain, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { BETA, BETA_FREE_LABEL } from "@/lib/beta";
import RaceThumbnail from "@/components/RaceThumbnail";

const DIFFICULTY = {
  decouverte: "Découverte",
  court: "Accessible",
  moyen: "Soutenu",
  long: "Difficile",
  ultra: "Expert"
};

const difficultyStyles = {
  "Découverte": "text-emerald-300 border-emerald-400/30 bg-emerald-400/10",
  "Accessible": "text-emerald-300 border-emerald-400/30 bg-emerald-400/10",
  "Soutenu": "text-orange-300 border-orange-400/30 bg-orange-400/10",
  "Difficile": "text-red-300 border-red-400/30 bg-red-400/10",
  "Expert": "text-red-300 border-red-400/30 bg-red-400/10"
};

export default function CourseCard({ race }) {
  const difficulty = DIFFICULTY[race.distance_category] || "—";
  const available = race.status === "active";
  const hasTrace = Array.isArray(race.trace_preview) && race.trace_preview.length > 1;

  return (
    <Link
      to={`/parcours/${race.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/40 hover:shadow-[0_0_0_1px_hsl(var(--primary)/0.2)]"
    >
      <div className={cn("relative h-44 overflow-hidden", !hasTrace && "topo-lines bg-secondary")}>
        {hasTrace && (
          <div className="absolute inset-0 z-0">
            <RaceThumbnail trace_preview={race.trace_preview} start_point={race.start_point} />
          </div>
        )}
        <div className={cn(
          "absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[hsl(var(--card))] via-[hsl(var(--card))/0.6] to-transparent pointer-events-none",
          hasTrace ? "h-1/2" : "top-0"
        )} />
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
          <span className={cn(
            "text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full border backdrop-blur-md",
            available ? "text-primary border-primary/40 bg-background/85" : "text-muted-foreground border-border bg-background/85"
          )}>
            {available ? "Défi disponible" : "Bientôt"}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 right-3 z-10">
          <div className="text-[11px] text-muted-foreground uppercase tracking-[0.18em] mb-1">{race.region}</div>
          <h3 className="font-heading font-bold text-lg leading-tight text-balance">{race.name}</h3>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><Mountain className="w-4 h-4" />{race.distance_km} km</span>
          <span className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4" />+{Math.round(race.elevation_gain_m)} m</span>
          <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full border", difficultyStyles[difficulty])}>
            {difficulty}
          </span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/60">
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Accès parcours</div>
            {BETA ? (
              <div className="flex flex-col">
                <span className="font-heading font-bold text-primary">Gratuit</span>
                <span className="text-[10px] text-primary/80 font-medium">{BETA_FREE_LABEL}</span>
              </div>
            ) : (
              <div className="font-heading font-bold text-primary">{(race.price_eur ?? 0).toFixed(2).replace(".", ",")} €</div>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-foreground/80 group-hover:text-primary transition-colors">
            Voir le parcours
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}