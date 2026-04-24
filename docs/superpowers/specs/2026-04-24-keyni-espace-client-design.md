# Keyni — Espace client : spécification de design

**Date** : 2026-04-24
**Statut** : validé
**Périmètre** : refonte complète de l'espace client Keyni (dashboard + pages outils, contrats, bons plans, contact, authentification).

---

## 1. Contexte

Keyni est un néo-assureur spécialisé dans l'assurance immobilière destinée aux investisseurs (location longue/courte durée, assurances PNO / GLI / ADP, conseil juridique, gestion locative). L'espace client actuel est à refondre intégralement. Ce document spécifie la nouvelle version.

Le livrable doit :
- Reprendre à l'identique la charte graphique et les placements définis par 3 maquettes fournies (Tableau de bord, Améliorer mon score Keyni, Informations personnelles).
- Pouvoir fonctionner **sans base de données au démarrage** et se connecter à une base relationnelle (Postgres) sans refactor applicatif.
- Atteindre un niveau de qualité technique « senior / flagship » : arborescence claire, séparation des responsabilités stricte, scalabilité, sécurité forte.
- Offrir une expérience utilisateur ludique et facile à prendre en main.

## 2. Décisions produit

| Décision | Choix retenu |
|---|---|
| Périmètre du livrable | 5 rubriques complètes (3 mockées + Mes contrats, Bons plans, Contact conçues dans cette spec) |
| Authentification | Minimale : login email + mot de passe, mot de passe oublié. Pas de signup (comptes créés en back-office Keyni). Pas de 2FA. |
| Supports d'affichage | Responsive complet : desktop, tablette, mobile. Sidebar bascule en drawer hamburger en mobile. |
| Logique métier | Score Keyni calculé réellement (fonction pure paramétrable). Analyse IA des documents juridiques mockée de manière déterministe. |
| Stack | Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui + Recharts + React Hook Form + Zod. |
| Auth technique | Sessions stockées en DB (révocables), cookies `httpOnly`+`Secure`+`SameSite=Lax`, mots de passe hashés en Argon2id. |
| Email | Abstraction `EmailSender` : console en dev, Resend (ou SMTP) en prod. Templates React Email. |

## 3. Architecture & arborescence

### 3.1 Principes

- **Feature-first** : la logique métier est regroupée par domaine dans `src/features/<domaine>/`. Jamais éparpillée.
- **`app/` = routage uniquement**. Aucune règle métier n'y vit.
- **`components/` = UI pure**. Pas de data fetching. Pas d'appel direct aux repositories.
- **Une feature = une interface `Repository` + une implémentation**. Toute la persistance passe par là. Swap = un fichier.
- **Zero couplage entre features**. Une feature n'importe pas directement les internes d'une autre ; elle consomme des types/interfaces publics.

### 3.2 Arborescence cible

```
keyni/
├── public/                             # logo, favicon, illustrations
├── src/
│   ├── app/                            # Next.js App Router — routage uniquement
│   │   ├── layout.tsx                  # <html> + providers globaux
│   │   ├── globals.css
│   │   │
│   │   ├── (auth)/                     # Pages publiques (layout dédié)
│   │   │   ├── layout.tsx
│   │   │   ├── login/
│   │   │   └── mot-de-passe-oublie/
│   │   │       ├── page.tsx            # Demande de reset
│   │   │       └── [token]/page.tsx    # Nouveau mot de passe
│   │   │
│   │   └── (app)/                      # Espace authentifié (guard + layout 3 colonnes)
│   │       ├── layout.tsx
│   │       ├── tableau-de-bord/
│   │       ├── mes-contrats/
│   │       │   ├── page.tsx
│   │       │   └── [id]/page.tsx
│   │       ├── outils/
│   │       │   ├── page.tsx            # Hub outils
│   │       │   ├── score/              # Améliorer mon score Keyni
│   │       │   └── informations/       # Infos perso
│   │       ├── bons-plans/
│   │       ├── contact/
│   │       ├── profil/
│   │       └── sinistres/
│   │           └── nouveau/            # Flow de déclaration
│   │
│   ├── features/                       # Logique métier — un domaine par dossier
│   │   ├── auth/
│   │   │   ├── actions.ts              # Server Actions (login, logout, reset)
│   │   │   ├── session.ts              # Création / lecture / invalidation de session
│   │   │   ├── password.ts             # Argon2id hash + verify
│   │   │   ├── rate-limit.ts           # Fenêtre glissante par IP + email
│   │   │   ├── audit.ts                # Émission d'événements AuditLog
│   │   │   └── guards.ts               # requireUser() pour les Server Components
│   │   ├── properties/                 # Biens
│   │   │   ├── repository.ts           # Interface
│   │   │   ├── repository.in-memory.ts
│   │   │   ├── types.ts                # Schémas Zod + types dérivés
│   │   │   └── actions.ts
│   │   ├── contracts/                  # Contrats d'assurance
│   │   ├── documents/                  # Documents + analyseur (mock)
│   │   ├── score/
│   │   │   ├── engine.ts               # computeScore — fonction pure
│   │   │   ├── rules.ts                # Règles paramétrables
│   │   │   └── types.ts
│   │   ├── sinistres/
│   │   └── referrals/                  # Bons plans / parrainage / gains
│   │
│   ├── lib/                            # Utilitaires transverses, pas de domaine métier
│   │   ├── db/
│   │   │   ├── store.ts                # Store in-memory + seed
│   │   │   ├── repositories.ts         # Point d'injection unique
│   │   │   └── seed.json               # Données de démarrage
│   │   ├── email/
│   │   │   ├── templates/              # React Email
│   │   │   └── send.ts                 # Adapter console / Resend / SMTP
│   │   ├── validation/                 # Schémas Zod partagés (money, date…)
│   │   ├── logger.ts                   # Abstraction pour Sentry/Pino plus tard
│   │   └── utils.ts
│   │
│   ├── components/                     # Design system — présentation pure
│   │   ├── ui/                         # shadcn/ui (Button, Input, Select, Dialog…)
│   │   ├── layout/                     # AppShell, Sidebar, RightPanel, TopBar, MobileNav
│   │   ├── charts/                     # ScoreRing, KpiCard, MiniChart
│   │   └── forms/                      # FormField, FormSection
│   │
│   ├── config/
│   │   ├── nav.ts                      # Config unique de la sidebar
│   │   └── env.ts                      # Validation env vars (Zod)
│   │
│   └── styles/
│       └── tokens.css                  # Variables CSS (couleurs, radius, shadows)
│
├── tests/
│   ├── unit/                           # Vitest (score, repos, auth)
│   └── e2e/                            # Playwright (parcours critiques)
│
├── scripts/
│   └── seed.ts                         # Reset du store in-memory
│
├── docs/
│   ├── architecture.md
│   ├── branching-db.md                 # Marche à suivre Postgres
│   └── superpowers/specs/
│
├── .env.example
├── README.md
├── next.config.ts
├── tailwind.config.ts
├── eslint.config.mjs
├── commitlint.config.js
└── tsconfig.json
```

### 3.3 Règles d'import

- `features/A` peut importer `lib/*` et `features/A/*`, **pas** `features/B/*` sauf pour consommer les types publics exportés par `features/B/types.ts`.
- `components/*` n'importe **jamais** de `features/*`. Les composants reçoivent leurs données par props.
- `app/*` peut importer `features/*/actions.ts`, `features/*/types.ts`, `components/*`. Il orchestre, il ne calcule pas.
- Cette règle est appliquée via ESLint (`eslint-plugin-import` + `no-restricted-paths`).

## 4. Modèle de données & couche repository

### 4.1 Entités

- **User** — compte (email, hash mot de passe) + profil (situation pro, revenus mensuels nets en centimes, charges mensuelles en centimes, nombre de personnes au foyer, régime fiscal).
- **Property** (Bien) — nom, type (`appartement` | `maison` | `commerce` | `bureau`), surface, date d'acquisition, prix d'acquisition (centimes), valeur actuelle estimée (centimes), usage (`location_nue` | `location_meublee` | `residence_principale` | `residence_secondaire`). Contient les infos financières liées au bien : loyer mensuel, charges copropriété, mensualité de crédit, taux d'intérêt, durée restante, apport personnel.
- **Contract** (Contrat d'assurance) — type (`PNO` | `GLI` | `ADP` | `MRH` | `autre`), bien rattaché, assureur, numéro de police, prime annuelle (centimes), dates de couverture, statut (`actif` | `a_renouveler` | `expire` | `en_attente`), référence fichier attestation.
- **Document** — type (`attestation` | `echeancier` | `facture` | `bail` | `etat_des_lieux` | `avenant` | `autre`), nom, taille, mime, date upload, bien ou contrat rattaché, URL de stockage, champ `conformity` (`pending` | `conform` | `non_conform` | `needs_review`) + rapport d'analyse (objet).
- **Sinistre** — type, date, description, bien rattaché, contrat rattaché, statut (`declare` | `en_cours` | `cloture`), timeline d'événements.
- **Reward** — gains en attente (parrainage, promos). Montant en centimes, statut (`en_attente` | `valide` | `paye`), date.
- **AuditLog** — `{ userId?, ip, userAgent, timestamp, event, metadata }`.
- **ScoreSnapshot** — `{ userId, date, globalScore, perProperty, kpis }` — pour l'historique.

### 4.2 Conventions transverses

- **IDs** : ULID (26 chars, triables par date, Prisma-compatibles).
- **Argent** : entier en **centimes** partout. Formatage en euros uniquement au rendu.
- **Dates** : `Date` en TS, ISO 8601 sur le wire.
- **Types Zod-first** : chaque `features/*/types.ts` exporte des schémas Zod, les types TS sont dérivés par `z.infer`. Un schéma = validation + type.

### 4.3 Pattern repository

```ts
// src/features/properties/repository.ts
export interface PropertyRepository {
  findAllByUser(userId: UserId): Promise<Property[]>
  findById(id: PropertyId): Promise<Property | null>
  create(userId: UserId, input: CreatePropertyInput): Promise<Property>
  update(id: PropertyId, input: UpdatePropertyInput): Promise<Property>
  delete(id: PropertyId): Promise<void>
}

// src/features/properties/repository.in-memory.ts
export class InMemoryPropertyRepository implements PropertyRepository { … }

// src/lib/db/repositories.ts — point d'injection unique
export const repositories = {
  users:      new InMemoryUserRepository(store),
  properties: new InMemoryPropertyRepository(store),
  contracts:  new InMemoryContractRepository(store),
  documents:  new InMemoryDocumentRepository(store),
  sinistres:  new InMemorySinistreRepository(store),
  rewards:    new InMemoryRewardRepository(store),
  sessions:   new InMemorySessionRepository(store),
  auditLog:   new InMemoryAuditLogRepository(store),
  snapshots:  new InMemoryScoreSnapshotRepository(store),
}
```

Les Server Actions importent `repositories` et appellent les méthodes. **Aucune autre couche ne touche la persistance.**

### 4.4 Seed de dev

`src/lib/db/seed.json` contient :
- Un utilisateur "MHM" (Marc-Henri M.) avec email `mhm@example.test` et mot de passe connu (visible dans le README dev).
- 4 biens : Appartement Lyon, Maison Bordeaux, Commerces Paris, Bureau Nantes (cohérent avec la maquette).
- 3-5 contrats répartis (certains manquants pour justifier les "Manquante" du score).
- 5-10 documents (attestations, bail, état des lieux) avec conformités variées.
- 6 snapshots score mensuels pour alimenter les mini-charts.
- 1 sinistre type "clôturé".
- 1 gain parrainage en attente (`2000` centimes = "20 € vous attendent").

### 4.5 Migration vers Postgres

Voir `docs/branching-db.md`. Étapes :

1. `npm install prisma @prisma/client` + `npx prisma init`.
2. Coller le schéma Prisma (fourni dans `docs/branching-db.md`) qui reflète les entités ci-dessus.
3. Ajouter `repository.prisma.ts` pour chaque domaine — même interface que `repository.in-memory.ts`.
4. Modifier `src/lib/db/repositories.ts` pour instancier les `Prisma*Repository` si `DATABASE_URL` est défini.
5. `npx prisma migrate deploy`.

**Aucune autre ligne applicative ne change.**

## 5. Authentification & sécurité

### 5.1 Hashing

- **Argon2id**, paramètres OWASP 2025 : `memoryCost: 65536` (64 MB), `timeCost: 3`, `parallelism: 1`. Implémentation : `@node-rs/argon2`.
- Politique mot de passe : minimum 12 caractères, aucune autre règle arbitraire. Indicateur de force via `zxcvbn-ts`. Pas de rotation forcée.

### 5.2 Sessions

- Stockées en **DB** via `SessionRepository` — pas de JWT.
- Cookie `keyni_session` : `httpOnly`, `Secure` (hors dev), `SameSite=Lax`, `Path=/`, durée 7 jours, rolling renewal.
- Valeur du cookie = token opaque aléatoire 256 bits. Le token est hashé avant stockage (pas stocké en clair).
- Révocation : `deleteAllForUser(userId)` — appelée après un reset password réussi.

### 5.3 Flow login

1. Formulaire `/login` : email + mot de passe.
2. Vérification rate-limit (5 tentatives / 15 min par IP ET par email).
3. Lookup user par email. **Si pas trouvé, hash un faux mot de passe quand même** (anti-timing / anti-énumération).
4. Compare avec Argon2. Constant-time par design.
5. Succès → création session en DB, set-cookie, audit `login.success`, redirect `/tableau-de-bord`.
6. Échec → audit `login.failure`, message générique "identifiants invalides".
7. Après N échecs : audit `login.lockout`, toujours même message (pas de leak).

### 5.4 Flow reset password

1. `/mot-de-passe-oublie` : formulaire email.
2. Réponse **toujours générique** : "Si un compte existe, un email a été envoyé."
3. Si le compte existe : génération token 256 bits, hash stocké + `expiresAt: +30 min` + `used: false`. Email envoyé avec lien `/mot-de-passe-oublie/[token_en_clair]`.
4. Rate-limit : 3 reset / heure / email, 10 / heure / IP.
5. Page `[token]` : validation du token (existe, non expiré, non utilisé). Affichage formulaire nouveau mot de passe si OK.
6. Submit → validation Zod → hash Argon2 → update user, marquer token `used: true`, révoquer toutes les sessions, audit `password_reset.completed`.

### 5.5 CSRF

Next.js 15 Server Actions vérifient `Origin`/`Host` nativement. Suffisant — pas de double-submit tokens manuels.

### 5.6 En-têtes de sécurité (prod)

Configurés dans `next.config.ts` :
- `Content-Security-Policy` strict avec nonces pour scripts inline Next
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` restrictif

### 5.7 Guards

- Layout `(app)/layout.tsx` appelle `requireUser()` (Server Component). Redirige vers `/login` si session absente ou expirée.
- Layout `(auth)/layout.tsx` redirige vers `/tableau-de-bord` si session active.

### 5.8 Audit

Événements loggés : `login.success`, `login.failure`, `login.lockout`, `password_reset.requested`, `password_reset.completed`, `session.revoked`, `logout`. Chaque événement : `{ userId?, ip, userAgent, timestamp, event, metadata }`.

### 5.9 Rate-limit

Interface `RateLimiter` abstraite. Implémentation in-memory (sliding window) actuellement. Permet de swap vers Redis si déploiement multi-instances.

### 5.10 Variables d'environnement

Validées au démarrage par `src/config/env.ts` (Zod). Liste :

- `SESSION_SECRET` (≥ 32 bytes)
- `APP_URL` (URL absolue)
- `EMAIL_PROVIDER` (`console` | `resend` | `smtp`)
- `RESEND_API_KEY` (si `resend`)
- `SMTP_*` (si `smtp`)
- `DATABASE_URL` (plus tard)

Serveur refuse de démarrer si une valeur manque ou est invalide. `.env.example` commité.

## 6. Design system & UI

### 6.1 Tokens

Exportés en CSS variables (`src/styles/tokens.css`) **et** mappés dans `tailwind.config.ts`.

**Couleurs** (hex approx, calibrage final sur assets fournis) :

| Token | Valeur | Usage |
|---|---|---|
| `primary` | `#14B8A6` | Logo, CTA principal, nav actif |
| `primary-strong` | `#0EA598` | Hover CTA |
| `primary-soft` | `#E6F7F4` | Bandeau info, nav actif bg, upload zone |
| `background` | `#F7F5EF` | Fond d'app (crème) |
| `surface` | `#FFFFFF` | Cartes |
| `border` | `#E8E6DF` | Séparateurs |
| `success` | `#10B981` | Delta positif |
| `warning` | `#F59E0B` | Risque modéré |
| `danger` | `#EF4444` | Score bas, badge manquante |
| `chart-1..5` | palette bleu/turquoise/ambre/vert/rose | Mini-charts |
| `text` | `#0F172A` / `#475569` / `#94A3B8` | Titre / corps / muted |

**Typographie** : **Plus Jakarta Sans** (Google Font, chargée via `next/font`). Échelle : 12, 14, 16, 18, 24, 32, 48.

**Arrondis** : cards `20px`, boutons/inputs `10px`, pills `9999px`.

**Ombre carte** : `0 1px 3px rgba(15,23,42,.06), 0 1px 2px rgba(15,23,42,.04)`.

### 6.2 Composants

**Base shadcn/ui** (code à nous, dans `src/components/ui/`) : `Button`, `Input`, `Select`, `Textarea`, `Checkbox`, `Switch`, `Radio`, `Dialog`, `Sheet`, `Popover`, `Tooltip`, `Tabs`, `Badge`, `Toast` (Sonner), `DropdownMenu`, `Avatar`.

**Composants métier** :
- `AppShell` — layout 3 colonnes responsive
- `Sidebar` / `MobileNav` — config depuis `src/config/nav.ts`
- `RightPanel` — slot flexible, widgets configurés par page
- `TopBar` — lien "← Retour" + breadcrumb optionnel
- `KpiCard` — icône + titre + valeur + delta + mini-chart
- `ScoreRing` — SVG radial, gradient selon niveau, animé
- `InfoBanner` — bandeau info (`primary-soft`)
- `DocumentCard`, `DropZone`, `BienSelector`, `EmptyState`, `ChatBubble`, `FormSection`

**Icônes** : `lucide-react`.

### 6.3 Layout responsive

| Breakpoint | Sidebar | Panneau droit | Contenu |
|---|---|---|---|
| `≥ 1280px` | 240px fixe, labels+icônes | 320px fixe | flex |
| `1024-1279px` | 72px, icônes + tooltip | 300px fixe | flex |
| `768-1023px` | 72px, icônes | empilé sous main | full width |
| `< 768px` | hamburger → Sheet plein écran | empilé en bas / accordéon | full width |

### 6.4 États & UX

- **Loading** : skeletons spécifiques par composant.
- **Vide** : `EmptyState` avec illustration + CTA.
- **Erreur** : toast (Sonner) pour actions, `error.tsx` par route, page `/erreur` globale.
- **Transitions** : 150ms sur hover, `ScoreRing` animé à l'entrée, respect `prefers-reduced-motion`.

### 6.5 Accessibilité

Contrastes WCAG AA minimum (AAA corps de texte), focus ring visible, navigation clavier complète (Radix), libellés programmatiques, `aria-label` sur boutons icon-only, `jsx-a11y` en lint.

### 6.6 Assets

- Logo Keyni : reconstitution fidèle (carré vert menthe + "Keyni" noir) en SVG, remplaçable par l'asset officiel quand fourni.
- Illustrations ("20€ vous attendent", "Vos KPI mis à jour") : redessinées au plus proche en SVG, remplaçables.

## 7. Pages & routage

### 7.1 Sitemap

```
/                                      → redirige /tableau-de-bord ou /login
(auth)
  /login
  /mot-de-passe-oublie
  /mot-de-passe-oublie/[token]
(app)
  /tableau-de-bord
  /mes-contrats
  /mes-contrats/[id]
  /outils
  /outils/score
  /outils/informations
  /bons-plans
  /contact
  /profil
  /sinistres/nouveau
```

### 7.2 Layouts

- `(auth)/layout.tsx` : centré, logo en haut, fond crème. Redirect `/tableau-de-bord` si session active.
- `(app)/layout.tsx` : `AppShell` 3 colonnes. Appelle `requireUser()`. Injecte utilisateur dans Server Context. Consomme `nav.ts`.

### 7.3 Widgets du panneau droit — config par page

| Page | Widgets |
|---|---|
| Tableau de bord | Trustpilot · Documents (Attestations, Échéanciers, Factures) · Sinistre+ CTA |
| Score | Trustpilot · Mon score actuel · Impact des actions · Recommandations |
| Informations perso | Trustpilot · "À quoi servent ces infos" · "Vos KPI mis à jour" · "Besoin d'aide" |
| Mes contrats | Trustpilot · Récap (actifs / à renouveler / échéance proche) · "Besoin d'aide" |
| Bons plans | Trustpilot · "Comment ça marche" · Historique des gains |
| Contact | Trustpilot · Votre conseiller · Horaires & délai moyen |
| Profil | (panneau masqué — full width) |

### 7.4 Pages mockées

Les trois pages Tableau de bord, Outils → Score, Outils → Informations sont implémentées à l'identique des maquettes fournies. Champs, grilles, espacements, couleurs et placements fidèles. Les sections de formulaire "Informations personnelles" suivent la grille 2 colonnes avec suffixes €, %, m², ans.

### 7.5 Pages conçues dans cette spec

#### `/mes-contrats`

- Header : titre "Mes contrats", sous-titre, `BienSelector` ("Tous mes biens"), filtres `Tous` · `Actifs` · `À renouveler` · `Expirés`.
- Main : liste de `ContractCard`. Chaque carte : icône type + nom du type, bien rattaché (icône + nom), assureur + n° police, prime annuelle, date d'échéance, badge statut, actions `Voir le détail` + `Télécharger l'attestation`.
- Empty state : illustration + CTA "Voir les offres recommandées" → `/outils/score`.

#### `/mes-contrats/[id]`

- Onglets : `Informations` · `Garanties` · `Documents` · `Sinistres liés` · `Historique`.
- Header avec "← Retour" vers `/mes-contrats`.

#### `/bons-plans`

- Héro : carte "💰 20€ vous attendent" en grand, CTA "Récupérer mes gains" ouvrant un flow IBAN → confirmation.
- Section parrainage : lien personnel + compteur (invités / en cours / validés / gagnés) + tableau anonymisé.
- Section offres partenaires : cartes verticales (gestion locative, conseil juridique…).
- Panneau droit : "Comment ça marche" en 3 étapes + historique synthétique.

#### `/contact`

- 3 cartes de contact rapide : chat, téléphone, email.
- Bloc prise de rendez-vous : grid de slots 30 min sur 2 semaines (UI mockée, backendable plus tard via Cal.com / Calendly).
- FAQ en accordéon, contenu `src/content/faq.json`.
- Panneau droit : carte "Votre conseiller" (placeholder photo, nom, spécialité, dispo), horaires, Trustpilot.

#### `/profil`

- Sections : email (modifiable — hors scope initial, affiché en lecture), changement de mot de passe (3 champs : actuel / nouveau / confirmation), sessions actives (liste avec révocation individuelle ou globale "Se déconnecter partout").
- Panneau droit masqué, layout full width.

#### `/sinistres/nouveau`

Flow en 3 étapes :
1. **Choix du bien + contrat rattaché** (liste des contrats du bien).
2. **Type de sinistre** (dégât des eaux, incendie, vol, bris, autre) + date + description libre + upload photos/documents.
3. **Récap & confirmation** → crée un sinistre avec statut `declare`, envoie email de confirmation au user.

### 7.6 Nav — source de vérité unique

```ts
// src/config/nav.ts
export const nav = [
  { href: "/tableau-de-bord", label: "Tableau de bord", icon: "LayoutDashboard" },
  { href: "/mes-contrats",    label: "Mes contrats",    icon: "FileText" },
  { href: "/outils",          label: "Outils",          icon: "Wrench" },
  { href: "/bons-plans",      label: "Bons plans",      icon: "Gift" },
  { href: "/contact",         label: "Contact",         icon: "Phone" },
]
```

### 7.7 Loading & errors

Chaque route `(app)` : `loading.tsx` (skeleton spécifique) + `error.tsx` (carte erreur + retry). Page globale `/erreur` pour crashs catastrophiques.

### 7.8 Métadonnées

Chaque page exporte un `metadata` Next avec titre au format `<Page> — Keyni` et description succincte.

## 8. Moteur Score Keyni

### 8.1 Signatures

```ts
type ScoreInput = {
  user: UserProfile
  properties: Property[]
  contracts: Contract[]
  documents: Document[]
}

type ScoreResult = {
  global: number                       // 0-100
  level: 'critique' | 'modere' | 'bon' | 'excellent'
  target: number                       // 75 par défaut
  gap: number                          // target - global (0 si atteint)
  perProperty: Record<PropertyId, PropertyScore>
  breakdown: ScoreBreakdown[]
  recommendations: Recommendation[]    // triées par impact décroissant
}

type PropertyScore = {
  value: number
  level: 'critique' | 'modere' | 'bon' | 'excellent'
  financial: { earned: number; possible: number; missing: ContractType[] }
  legal:     { earned: number; possible: number; missingDocs: DocumentType[] }
}

export function computeScore(input: ScoreInput): ScoreResult
```

### 8.2 Règles — un fichier unique

```ts
// src/features/score/rules.ts
export const scoreRules = {
  baseScore: 50,
  levels: [
    { min: 0,  label: 'Critique',  color: 'danger'  },
    { min: 40, label: 'Modéré',    color: 'warning' },
    { min: 70, label: 'Bon',       color: 'success' },
    { min: 85, label: 'Excellent', color: 'primary' },
  ],
  targetScore: 75,
  contracts: {
    PNO: { points: 10, appliesTo: (p) => p.usage === 'location_nue' || p.usage === 'location_meublee' },
    GLI: { points: 8,  appliesTo: (p) => p.usage === 'location_nue' || p.usage === 'location_meublee' },
    ADP: { points: 5,  appliesTo: (p) => p.hasCredit },
    MRH: { points: 3,  appliesTo: (p) => p.usage === 'residence_principale' },
  },
  legal: {
    perConformDocument: 3,
    maxPerProperty: 15,
    relevantTypes: ['bail', 'etat_des_lieux', 'avenant'] as const,
  },
  profile: {
    maxPoints: 10,
    weightedFields: [
      { key: 'revenus',       weight: 3 },
      { key: 'charges',       weight: 2 },
      { key: 'situation',     weight: 2 },
      { key: 'regimeFiscal',  weight: 2 },
      { key: 'foyer',         weight: 1 },
    ],
  },
  aggregation: 'weighted-average-by-value',
}
```

### 8.3 Algorithme

1. Pour chaque bien : `baseScore` + somme des points contrats applicables (cap implicite par points max) + points docs conformes (cap `maxPerProperty`) + points profil répartis.
2. Score global = moyenne des scores par bien **pondérée par `valeurActuelleEstimee`**.
3. `breakdown` : retour inversé — points gagnés vs. possibles par catégorie (alimente le panneau droit "Impact des actions").
4. `recommendations` : triées par points perdus décroissants, capées aux 5 premières.
5. Niveau : lookup dans `scoreRules.levels`.

### 8.4 Analyseur IA (mock)

Interface `DocumentAnalyzer` — implémentation `MockDocumentAnalyzer` dans ce build :
- Délai simulé 2-4 s.
- Résultat **déterministe par nom de fichier** (hash du nom → seed) : même fichier → même résultat, démo rejouable.
- Retour : `{ conformity, clausesAnalyzed, clausesAtRisk: [...], recommendations: [...] }`.
- Swap futur : `ClaudeDocumentAnalyzer` ou `OpenAIDocumentAnalyzer` via même interface.

### 8.5 Snapshots

Entité `ScoreSnapshot` écrite 1x/jour en prod (cron post-DB). En dev : seed de 6 snapshots mensuels pour alimenter les mini-charts KPI et la courbe de progression.

### 8.6 Tests

Couverture ≥ 90 % sur `features/score/`. Cas couverts :
- Score de base sans contrat/doc → `baseScore`.
- Contrats applicables / non applicables (un PNO sur résidence principale = 0 pt).
- Cap documents (20 docs conformes sur un bien → `maxPerProperty`).
- Pondération globale par valeur du bien.
- Ordre des recommandations par impact.
- Profil incomplet → score global diminué proportionnellement.

## 9. Qualité, tests & outillage

### 9.1 TypeScript

`strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`. Alias `@/*` → `src/*`. Règle lint : pas de `any` sans exception nominative commentée.

### 9.2 Lint & format

ESLint flat config avec `@typescript-eslint/recommended-type-checked`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`, `eslint-plugin-import`, `eslint-plugin-security`. Règles custom : `no-console` (sauf `warn`/`error`), import ordering, no-default-export hors `app/`, `no-restricted-paths` pour forcer les règles d'import.

Prettier avec config minimale.

Pre-commit via husky + lint-staged.

### 9.3 Tests

| Niveau | Outil | Couverture |
|---|---|---|
| Unitaires | Vitest | ≥ 90 % sur `features/score/` et `features/auth/` |
| Composants | Vitest + Testing Library | composants avec logique (ScoreRing, KpiCard, forms) |
| E2E | Playwright | login + logout, reset password complet, upload document + score |

Tests `*.test.ts` à côté du code.

### 9.4 CI GitHub Actions (optionnelle)

Workflow `ci.yml` : install → typecheck → lint → test → build → e2e. Bloque la merge sur échec.

### 9.5 Git hooks

- Pre-commit : lint-staged + typecheck.
- Commit-msg : conventional commits via `commitlint` (permet un CHANGELOG auto plus tard).
- Commits en français, convention : `feat(...)`, `fix(...)`, `chore(...)`, etc.

### 9.6 Scripts `package.json`

```
dev          next dev
build        next build
start        next start
typecheck    tsc --noEmit
lint         eslint .
lint:fix     eslint . --fix
format       prettier --write .
test         vitest
test:ui      vitest --ui
test:cov     vitest --coverage
e2e          playwright test
e2e:ui       playwright test --ui
seed         tsx scripts/seed.ts
```

### 9.7 Performance

- `next/image` pour tout raster.
- `next/font` (Plus Jakarta Sans, `display: swap`).
- Code splitting automatique par route + `dynamic()` pour Recharts.
- Cible Lighthouse prod : Performance ≥ 90, Accessibilité 100, Best Practices 100, SEO ≥ 90.

### 9.8 Observabilité

`src/lib/logger.ts` — abstraction console en dev, prête à brancher Pino / Sentry plus tard. Aucune dépendance réseau installée dans ce build.

### 9.9 Documentation

- `README.md` : description, prérequis, démarrage, scripts, structure du projet en un paragraphe.
- `docs/architecture.md` : vue d'ensemble.
- `docs/branching-db.md` : marche à suivre pour brancher Postgres.
- `docs/superpowers/specs/` : specs et plans.

## 10. Plan de migration vers Postgres (résumé)

1. `npm install prisma @prisma/client @node-rs/argon2` (si pas déjà).
2. `npx prisma init` puis coller le schéma fourni (mapping direct des entités de §4.1).
3. Créer `repository.prisma.ts` pour chaque domaine. Même interface que `repository.in-memory.ts`.
4. Brancher dans `src/lib/db/repositories.ts` : si `DATABASE_URL` défini, instancier les `Prisma*Repository`, sinon garder in-memory.
5. `npx prisma migrate dev` puis `prisma db seed` (adaptation du `seed.json`).
6. Dérouler les tests e2e — aucun doit casser.

**Zéro ligne applicative ne doit changer à ce moment-là.** Si tel est le cas, c'est un bug d'abstraction.

## 11. Hors scope

- 2FA / TOTP (prévu pour une V2 éventuelle).
- Signup self-service (les comptes sont créés en back-office Keyni).
- Intégration IA réelle pour l'analyse de documents juridiques (mockée).
- Calendrier réel pour prise de rendez-vous (UI mockée, backendable ultérieurement).
- SSO partenaires.
- Application mobile native.
- Dashboard admin / back-office Keyni.
