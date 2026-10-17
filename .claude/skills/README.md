# Skills design du projet OTC

Installées le 14/10/2026 (sélection de l'article nocodefactory « Top 8 des Claude skills pour les designers »). Fichiers copiés depuis les dépôts d'origine après relecture ; licences dans `LICENSE-*`.

| Skill | Source | Rôle pour OTC |
|---|---|---|
| frontend-design | anthropics/claude-code | **Direction visuelle de référence** (couleurs, typos, mise en page) |
| emil-design-eng, animate, review-animations, improve-animations, find-animation-opportunities, animation-performance, animation-vocabulary, apple-design, mobile-native, break-ui, pick-ui-library, prototype, animate-expo, write-swift, ask-sonner | emilkowalski/skills | Finition : animations, ressenti mobile, robustesse. En relecture ponctuelle. |
| impeccable | pbakaus/impeccable | Audit final (`/critique`, `/audit`, `/polish`) |
| taste-skill | leonxlnx/taste-skill | **Seulement sur demande explicite** : direction visuelle contradictoire avec frontend-design |
| figma-design-to-code | figma/mcp-server-guide | Inutilisable tant que le serveur MCP Figma n'est pas connecté |

Déjà disponibles hors projet : canvas-design, brand-guidelines, theme-factory (Anthropic).

## Volontairement non installé
- **Hooks d'Impeccable** (`.claude/settings.json` du dépôt d'origine) : ils lançaient automatiquement un binaire téléchargé après chaque édition et à chaque fin de tour. Le dossier `scripts/` (lanceur de ce binaire) n'est pas copié non plus ; les commandes d'Impeccable qui en dépendent fonctionnent en mode dégradé.
- Les scripts Node de taste-skill (`scripts/*.mjs`) sont présents mais ne s'exécutent que si on les lance explicitement.

## Skills produit (installées le 17/10/2026)
Sélection de l'article Snyk « 7 Claude skills pour product managers ». Copiées après relecture ; licences dans `LICENSE-*`.

| Source | Skills installées |
|---|---|
| anthropics/knowledge-work-plugins (product-management) | write-spec, roadmap-update, competitive-brief, synthesize-research, stakeholder-update, metrics-review, product-brainstorming, sprint-planning |
| product-on-purpose/pm-skills (11 sur 40+) | deliver-prd, deliver-user-stories, deliver-launch-checklist, foundation-lean-canvas, foundation-persona, discover-market-sizing, discover-competitive-analysis, discover-interview-synthesis, define-hypothesis, measure-experiment-design, iterate-pivot-decision |
| snarktank/ralph | ralph-prd (renommée depuis `prd`) |
| alirezarezvani/claude-skills (product-team) | product-manager-toolkit (RICE), product-strategist (OKR), product-discovery, experiment-designer, competitive-teardown, agile-product-owner |
| wondelai/skills | jobs-to-be-done, hooked-ux, cro-methodology |

Volontairement non installé : la boucle autonome de Ralph (`ralph.sh`) et les skills qui génèrent du code (saas-scaffolder, spec-to-repo, landing-page-generator). Les scripts Python fournis ne s'exécutent que si on les lance.
