import React from "react";
import { Link } from "react-router-dom";
import { Flag, ArrowRight } from "lucide-react";

export default function Manifeste() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="text-center mb-10">
        <Flag className="w-8 h-8 text-primary mx-auto mb-5" />
        <span className="text-[11px] tracking-[0.3em] uppercase text-primary font-medium">Manifeste</span>
        <h1 className="mt-3 font-heading font-bold text-3xl sm:text-4xl tracking-tight">La trace et la montagne</h1>
      </div>

      <blockquote className="font-display italic text-2xl sm:text-3xl leading-relaxed text-balance text-center mb-12">
        « Pas de balisage. Pas de ravito. Pas de spectateurs.<br />
        Juste toi, la trace et la montagne. »
      </blockquote>

      <div className="space-y-6 text-muted-foreground leading-relaxed">
        <p>
          OTC existe pour rendre au trail ce qui lui appartient : l'effort, l'engagement, la solitude.
          Pas de fanfare au départ, pas de ruban à l'arrivée. Une trace, un chrono, une montagne.
        </p>
        <p>
          Nous croyons que courir un grand trail ne devrait dépendre d'aucun dossard, d'aucune date imposée,
          d'aucune logistique. Tu choisis la course. Tu choisis le jour. Tu portes seul la responsabilité de ton entreprise.
        </p>
        <p>
          Pas de balisage : la trace est sur ta montre. Pas de ravitaillement : ce que tu emportes est ce que tu as.
          Pas de spectateurs : la montagne ne joue pas pour toi, elle te regarde passer.
        </p>
        <p>
          En échange, nous te donnons une chose que les grandes courses ont oubliée : la liberté de partir quand tu es prêt.
          Et un classement, pour que ton temps compte parmi ceux qui ont fait le même chemin, dans les mêmes conditions.
        </p>
        <p className="text-foreground font-medium">
          Tu cours seul. Tu n'es jamais seul sur la trace.
        </p>
      </div>

      <div className="mt-12 text-center">
        <Link
          to="/parcours"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-full text-sm hover:bg-primary/90 transition-colors"
        >
          Trouver ta course <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}