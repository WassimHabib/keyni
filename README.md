# Keyni — Espace client

Espace client du néo-assureur immobilier Keyni : tableau de bord, suivi des
contrats, score Keyni, analyse de documents juridiques, gestion des sinistres et
des bons plans.

## Prérequis

- Node.js 20+
- npm 10+

## Démarrage

```bash
npm install
cp .env.example .env.local
# Éditer SESSION_SECRET (≥ 32 caractères aléatoires)

npm run dev
```

L'application démarre sur [http://localhost:3000](http://localhost:3000).

### Identifiants de démonstration

Un utilisateur `MHM` est chargé dans le store in-memory au premier lancement.

- Email : `mhm@example.test`
- Mot de passe : `MhmKeyni2026!`

### Emails (mot de passe oublié)

En mode `EMAIL_PROVIDER=console` (défaut), les emails transactionnels sont
affichés dans la console et sauvegardés au format HTML dans `.tmp/emails/`.

## Scripts

| Commande | Description |
| --- | --- |
| `npm run dev` | Démarre le serveur Next.js en développement |
| `npm run build` | Construit l'application pour la production |
| `npm run start` | Lance le serveur Next.js de production |
| `npm run typecheck` | Vérification de types TypeScript |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run test` | Tests unitaires (Vitest) |
| `npm run test:cov` | Tests unitaires avec couverture |
| `npm run e2e` | Tests end-to-end (Playwright) |

## Architecture

Arborescence en bref :

- `src/app/` — Next.js App Router (pages & routes). Aucune logique métier.
  - `(auth)/` — pages publiques (login, mot de passe oublié)
  - `(app)/` — espace authentifié (dashboard, contrats, outils, bons plans,
    contact, profil, sinistres)
- `src/features/<domaine>/` — logique métier par domaine (auth, users,
  properties, contracts, documents, score, sinistres, referrals). Chaque
  domaine expose un `types.ts`, un `repository.ts` (interface) et des
  `actions.ts` pour les Server Actions.
- `src/lib/` — utilitaires transverses sans domaine (db, email, logger,
  validation).
- `src/components/ui/` — design system (shadcn/ui personnalisé Keyni).
- `src/components/layout/` — AppShell, sidebar, panneau droit, widgets.
- `src/components/charts/` — ScoreRing, KpiCard, MiniChart.
- `src/config/` — configuration (nav, env).
- `tests/` — tests unitaires (Vitest) et e2e (Playwright).
- `docs/` — spécifications, architecture et guide de branchement Postgres.

## Base de données

Le projet démarre sans base de données branchée : un store in-memory seedé
fournit les données de démonstration. La couche repository est entièrement
abstraite par des interfaces, ce qui permet de brancher Prisma/Postgres sans
modifier l'applicatif — voir `docs/branching-db.md`.

## Sécurité

- Mots de passe hashés en **Argon2id** (paramètres OWASP 2025).
- Sessions stockées côté serveur, cookies `httpOnly` + `Secure` + `SameSite=Lax`.
- Rate limiting en fenêtre glissante (login 5/15 min, reset 3/h).
- Audit log des événements d'authentification.
- En-têtes de sécurité (HSTS, X-Frame-Options, X-Content-Type-Options,
  Referrer-Policy, Permissions-Policy).

## Responsive

L'espace client est pensé desktop-first mais totalement responsive : la sidebar
devient un menu hamburger sous 1024 px, le panneau droit s'empile sous le
contenu principal et le layout bascule en une colonne sur mobile.
