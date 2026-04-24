# Architecture — Keyni Espace client

## Vue d'ensemble

```
┌────────────────────────────────────────────────────────────────┐
│                    Navigateur (mobile / desktop)               │
└────────────────────────────────────────────────────────────────┘
                              │ HTTPS
                              ▼
┌────────────────────────────────────────────────────────────────┐
│               Next.js 15 · App Router · Node                   │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │   src/app    │  │ src/features │  │ src/components/ui  │   │
│  │  (routage)   │──│  (métier)    │──│  (design system)   │   │
│  └──────┬───────┘  └──────┬───────┘  └─────────┬──────────┘   │
│         │                 │                     │              │
│         ▼                 ▼                     ▼              │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                  src/lib (transverse)                    │ │
│  │  db · email · logger · validation · utils                │ │
│  └────────────────────────┬─────────────────────────────────┘ │
│                           │                                   │
│                           ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  InMemoryStore (MVP)  ──►  PrismaClient + Postgres (V2)  │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

## Principes

- **Feature-first** : chaque domaine (auth, users, properties, contracts,
  documents, score, sinistres, referrals) est autonome dans `src/features/`.
- **`app/` ne contient que du routage** : aucune règle métier. Les pages
  appellent les Server Actions / repositories et assemblent des composants.
- **`components/` ne connaît pas le métier** : les composants reçoivent leurs
  données par props.
- **Interfaces Repository partout** : toute persistance passe par des
  interfaces abstraites. L'implémentation in-memory est remplaçable par
  Prisma sans modifier le code applicatif.

## Couches & responsabilités

| Couche | Contenu | Exemple de fichiers |
| --- | --- | --- |
| Route (Server Components) | Parsing searchParams, assemblage de la page | `src/app/(app)/tableau-de-bord/page.tsx` |
| Server Actions | Mutations, validation, audit | `src/features/documents/actions.ts` |
| Service | Orchestration lourde (ex. calcul score) | `src/features/score/service.ts` |
| Repository (interface) | Contrats CRUD par domaine | `src/features/properties/repository.ts` |
| Repository (impl.) | In-memory ou Prisma | `src/features/properties/repository.in-memory.ts` |
| Store | Singleton partagé en mémoire + seed lazy | `src/lib/db/store.ts` |
| Design system | Primitives UI & composants métier | `src/components/ui/*`, `src/components/charts/*` |

## Règles d'import

- `features/A` peut importer `lib/*` et `features/A/*`.
- `features/A` peut importer les **types publics** de `features/B/types.ts`
  (pas les internes).
- `components/*` n'importe **jamais** `features/*` — les données passent par
  props.
- `app/*` peut importer `features/*/actions.ts`, `features/*/types.ts` et
  `components/*`. Aucun calcul métier en page.

## Flux type : authentification

1. Le formulaire `/login` poste vers la Server Action `loginAction`.
2. `loginAction` valide (Zod), vérifie le rate-limit, récupère l'utilisateur
   via `repositories.users`, compare le mot de passe avec Argon2id.
3. En cas de succès, création d'une session via `repositories.sessions`, pose
   d'un cookie httpOnly, audit log, redirect.

## Flux type : calcul du score

1. `/outils/score` récupère l'utilisateur via `requireUser()`.
2. Appelle `getUserScore(user)` qui lit properties, contracts, documents et
   transmet à `computeScore(...)`.
3. `computeScore` est une fonction pure paramétrée par `scoreRules.ts`.
   Couverte par des tests unitaires.

## Observabilité

`src/lib/logger.ts` fournit un logger minimal. Brancher Pino / Sentry revient
à remplacer l'implémentation sans toucher aux appels.

## Sécurité

- Argon2id (OWASP 2025) — `@node-rs/argon2`.
- Sessions DB via `SessionRepository` — cookies opaques, renouvellement
  glissant.
- Rate limit in-memory (Redis-ready), audit log persistant.
- En-têtes HTTP configurés dans `next.config.ts`.
