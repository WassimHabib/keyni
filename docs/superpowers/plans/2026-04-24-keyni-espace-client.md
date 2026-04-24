# Keyni — Espace client : plan d'implémentation

## Contexte

Refonte complète de l'espace client Keyni (néo-assureur immobilier) : dashboard + 5 rubriques (Tableau de bord, Mes contrats, Outils, Bons plans, Contact), auth minimale mais sécurisée, responsive complet, score calculé réellement, IA mockée. La spec validée est dans `docs/superpowers/specs/2026-04-24-keyni-espace-client-design.md`.

Stack : Next.js 15 (App Router) + TypeScript strict + Tailwind + shadcn/ui + Recharts + React Hook Form + Zod + Vitest + Playwright. Auth maison : Argon2id + sessions DB abstraites. Couche data abstraite par interfaces `Repository` — implémentation in-memory aujourd'hui, Prisma/Postgres demain sans toucher à l'applicatif.

**Contrainte absolue** : aucune mention de Claude / IA / outil externe dans le code, commentaires, commits, README. Commits en français au nom de l'utilisateur uniquement.

Repo : `https://github.com/WassimHabib/keyni.git` (remote `origin` déjà configuré, branche `main`, spec déjà poussée).

---

## Stratégie d'exécution

9 phases séquentielles, chacune produit du code commité et un livrable vérifiable. Chaque phase se termine par un `npm run typecheck && npm run lint && npm run test` vert avant de passer à la suivante. Commits atomiques par tâche.

---

## Phase 1 — Scaffold projet & outillage

**Livrable** : `npm run dev` lance un Next.js vide qui affiche "Keyni" avec les bons tokens et la bonne police.

### T1.1 — Init Next.js 15 + TypeScript strict
- `npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*" --no-eslint --no-turbo` (répondre non à l'ESLint par défaut, on installe notre config)
- `tsconfig.json` : activer `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noUnusedLocals`, `noUnusedParameters`
- Nettoyer `src/app/page.tsx` et `src/app/layout.tsx` du contenu par défaut
- `.env.example` avec `APP_URL`, `SESSION_SECRET`, `EMAIL_PROVIDER=console`
- Commit : `chore: scaffold projet Next.js 15 avec TypeScript strict`

### T1.2 — ESLint flat config + Prettier + husky + lint-staged + commitlint
- Installer : `eslint`, `@typescript-eslint/*`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`, `eslint-plugin-import`, `eslint-plugin-security`, `prettier`, `husky`, `lint-staged`, `@commitlint/cli`, `@commitlint/config-conventional`
- `eslint.config.mjs` flat config avec les presets recommended + règles custom (`no-console: ['error', { allow: ['warn', 'error'] }]`, import ordering, `no-restricted-paths` pour les règles d'import inter-couches)
- `.prettierrc` minimal
- `commitlint.config.js` (conventional commits)
- Husky pre-commit = `lint-staged` (typecheck + lint + format sur fichiers modifiés), commit-msg = `commitlint`
- Scripts `package.json` : `dev`, `build`, `start`, `typecheck`, `lint`, `lint:fix`, `format`, `test`, `test:ui`, `test:cov`, `e2e`, `e2e:ui`
- Commit : `chore: ESLint + Prettier + git hooks avec conventional commits`

### T1.3 — Tokens de design + Tailwind config + Plus Jakarta Sans
- `src/styles/tokens.css` : toutes les variables CSS couleurs (primary, primary-soft, background, surface, border, success, warning, danger, chart-1..5, text-primary/secondary/muted) + radius + shadow-card
- `tailwind.config.ts` : mapper les variables CSS dans le thème, étendre les `borderRadius` (`xl: 20px`, etc.), `boxShadow.card`, charger les fonts via CSS variable
- `src/app/layout.tsx` : importer Plus Jakarta Sans via `next/font`, appliquer à `<body>`, importer `globals.css` (qui importe `tokens.css`)
- `src/app/page.tsx` temporaire : centre un titre "Keyni" sur fond crème pour valider les tokens
- Commit : `feat(design): tokens couleurs + typographie Plus Jakarta Sans`

### T1.4 — Validation des variables d'environnement
- `src/config/env.ts` : schéma Zod `envSchema`, parse `process.env` au chargement du module, refuse de démarrer si invalide (throw clair avec la liste des variables manquantes/invalides)
- Export : `env: z.infer<typeof envSchema>`
- Commit : `feat(config): validation des variables d'environnement avec Zod`

### T1.5 — Logger abstraction
- `src/lib/logger.ts` : interface `Logger` + implémentation `ConsoleLogger` (méthodes `info`, `warn`, `error`, `debug` avec niveau configurable par `env.LOG_LEVEL`)
- Export default d'une instance singleton
- Commit : `feat(lib): abstraction logger prête pour Pino/Sentry`

---

## Phase 2 — Types & couche data

**Livrable** : toutes les entités typées Zod-first, repositories interfaces + impl in-memory, seed MHM chargeable, tests unitaires verts.

### T2.1 — Schémas Zod et types partagés
- `src/lib/validation/common.ts` : `UlidSchema`, `EmailSchema`, `MoneyCentsSchema` (int ≥ 0), `IsoDateSchema`, `PasswordSchema` (min 12 chars)
- `src/lib/validation/index.ts` : re-exports
- Tests : `tests/unit/validation.test.ts` (cases passants et échouants par schéma)
- Commit : `feat(validation): schémas Zod de base (ulid, email, money, date, password)`

### T2.2 — Types et schémas d'entités
- `src/features/users/types.ts` : `UserSchema` (id, email, hash, profile: {situation, revenus, charges, foyer, regimeFiscal}, createdAt, updatedAt), `CreateUserInput`, `UpdateUserProfileInput`
- `src/features/properties/types.ts` : `PropertySchema` (id, userId, name, type, surface, dateAcquisition, prixAcquisition, valeurActuelleEstimee, usage, finances: {loyerMensuel, chargesMensuelles, mensualiteCredit, tauxInteret, dureeRestantePret, apportPersonnel}), enums `PropertyType`, `PropertyUsage`
- `src/features/contracts/types.ts` : `ContractSchema` + enums `ContractType` (PNO, GLI, ADP, MRH, autre), `ContractStatus`
- `src/features/documents/types.ts` : `DocumentSchema` + enums `DocumentType`, `Conformity`, `AnalysisReportSchema`
- `src/features/sinistres/types.ts` : `SinistreSchema` + enums
- `src/features/referrals/types.ts` : `RewardSchema`, `ReferralSchema`
- `src/features/auth/types.ts` : `SessionSchema`, `AuditEventSchema` + enum `AuditEvent`
- `src/features/score/types.ts` : `ScoreResult`, `PropertyScore`, `ScoreBreakdown`, `Recommendation` (types purs TS, pas de Zod — c'est une sortie de calcul)
- Types dérivés partout par `z.infer<typeof XxxSchema>`
- Commit : `feat(types): schémas Zod et types pour toutes les entités métier`

### T2.3 — Store in-memory + interfaces Repository
- `src/lib/db/store.ts` : classe `InMemoryStore` avec Maps pour chaque entité (users, properties, contracts, documents, sinistres, rewards, sessions, auditLogs, scoreSnapshots), méthodes `reset()` et `seed(data)`, singleton exporté
- `src/features/users/repository.ts` : interface `UserRepository` (`findById`, `findByEmail`, `create`, `updateProfile`, `updatePassword`)
- `src/features/properties/repository.ts` : interface `PropertyRepository` (`findAllByUser`, `findById`, `create`, `update`, `delete`)
- `src/features/contracts/repository.ts`, `documents/repository.ts`, `sinistres/repository.ts`, `referrals/repository.ts` : idem
- `src/features/auth/session-repository.ts` : interface `SessionRepository` (`create`, `findByTokenHash`, `delete`, `deleteAllForUser`, `extendExpiry`)
- `src/features/auth/audit-repository.ts` : interface `AuditLogRepository` (`log`, `findByUser`)
- `src/features/auth/rate-limit-repository.ts` : interface `RateLimitStore` (`increment`, `get`, `reset` — fenêtre glissante)
- `src/features/score/snapshot-repository.ts` : interface `ScoreSnapshotRepository` (`create`, `findRecentByUser`)
- Commit : `feat(data): store in-memory et interfaces Repository par domaine`

### T2.4 — Implémentations in-memory des repositories
- `src/features/users/repository.in-memory.ts` : `InMemoryUserRepository implements UserRepository`
- Idem pour chaque domaine : `properties`, `contracts`, `documents`, `sinistres`, `referrals`, `sessions`, `audit`, `rate-limit`, `score-snapshots`
- `src/lib/db/repositories.ts` : point d'injection unique exportant une const `repositories = { users, properties, contracts, ... }` instanciée depuis le store
- Commit : `feat(data): implémentations in-memory des repositories`

### T2.5 — Seed data MHM
- `src/lib/db/seed.json` : utilisateur MHM (email `mhm@example.test`, mot de passe hash Argon2 de `MhmKeyni2026!` — pré-calculé et en dur), 4 biens (Appartement Lyon, Maison Bordeaux, Commerces Paris, Bureau Nantes), 3 contrats (PNO sur Lyon actif, MRH sur Bordeaux actif, GLI en attente sur Lyon — d'où les "Manquante"), 6-8 documents répartis, 6 snapshots score mensuels, 1 sinistre clôturé, 1 reward de 2000 centimes en attente
- `scripts/seed.ts` : charge le JSON, reset le store, insère tout
- `src/lib/db/store.ts` : appelle `seed()` au premier import si `env.NODE_ENV !== 'test'` (pour ne pas polluer les tests unitaires)
- Tests : `tests/unit/repositories.test.ts` vérifie qu'après seed, `users.findByEmail('mhm@example.test')` retourne bien le user, que `properties.findAllByUser(MHM.id)` retourne 4 biens, etc.
- Commit : `feat(data): seed MHM avec 4 biens, contrats, documents et historique score`

---

## Phase 3 — Authentification & sécurité

**Livrable** : pages `/login`, `/mot-de-passe-oublie`, `/mot-de-passe-oublie/[token]` fonctionnelles, guard layout `(app)`, logout, audit log, rate-limit, tests verts.

### T3.1 — Hashing Argon2id
- Installer `@node-rs/argon2`
- `src/features/auth/password.ts` : `hashPassword(plain)`, `verifyPassword(hash, plain)` avec paramètres OWASP 2025 (memoryCost 65536, timeCost 3, parallelism 1) + `getFakeHash()` constant pour anti-timing
- Tests : `tests/unit/password.test.ts` (hash/verify OK, wrong password → false, même input → hashes différents)
- Commit : `feat(auth): hashing Argon2id avec paramètres OWASP`

### T3.2 — Rate limiter in-memory
- `src/features/auth/rate-limit.ts` : `class SlidingWindowRateLimiter implements RateLimiter`, méthodes `check(key, limit, windowMs)` retournant `{ allowed, remaining, resetAt }`
- Tests : `tests/unit/rate-limit.test.ts` (N appels OK, N+1 bloqué, reset après la fenêtre)
- Commit : `feat(auth): rate limiter en fenêtre glissante`

### T3.3 — Sessions
- Installer `@oslojs/crypto` et `@oslojs/encoding` (ou équivalent pour génération de tokens crypto-safe)
- `src/features/auth/session.ts` : `createSession(userId, meta)` (génère token 32 bytes, hash SHA-256 stocké, retourne token en clair), `validateSessionToken(token)` (hash + lookup + check expiration + rolling renewal si < 30 min restants), `invalidateSession(token)`, `invalidateAllUserSessions(userId)`
- Tests : `tests/unit/session.test.ts` (création, validation, expiration, invalidation, revocation globale)
- Commit : `feat(auth): gestion de sessions avec rolling renewal`

### T3.4 — Audit log
- `src/features/auth/audit.ts` : `logEvent(event, { userId, ip, userAgent, metadata })` wrapper autour du repo
- Enum `AuditEvent` : `login.success`, `login.failure`, `login.lockout`, `password_reset.requested`, `password_reset.completed`, `session.revoked`, `logout`
- Tests : simples, vérifier que `logEvent` appelle bien le repo avec la bonne shape
- Commit : `feat(auth): audit log des événements de sécurité`

### T3.5 — Email abstraction + templates
- Installer `@react-email/components` et `@react-email/render`
- `src/lib/email/types.ts` : interface `EmailSender` (`send(to, subject, react)`)
- `src/lib/email/console.ts` : `ConsoleEmailSender` logge dans console + sauve `.tmp/emails/<timestamp>.html`
- `src/lib/email/resend.ts` : `ResendEmailSender` (actif si `env.EMAIL_PROVIDER === 'resend'`)
- `src/lib/email/index.ts` : factory qui retourne le sender selon `env.EMAIL_PROVIDER`
- `src/lib/email/templates/PasswordReset.tsx` : template React Email (en-tête Keyni, phrase d'intro, bouton CTA vers le lien, expiration 30 min, fallback texte)
- Commit : `feat(email): abstraction EmailSender avec templates React Email`

### T3.6 — Server Actions auth (login, logout, reset)
- `src/features/auth/actions.ts` :
  - `loginAction(formData)` : parse Zod, check rate-limit (5/15min par IP+email), lookup user, timing-constant verify, create session, set cookie, audit, redirect `/tableau-de-bord`
  - `logoutAction()` : invalidate session, clear cookie, audit, redirect `/login`
  - `requestPasswordResetAction(formData)` : parse, rate-limit (3/h), générer token 32 bytes, hash + store avec expiry 30min, envoyer email, audit, **toujours retourner "email envoyé si le compte existe"**
  - `resetPasswordAction(token, formData)` : parse, validate token (existe, non expiré, non utilisé, constant-time compare), hash nouveau mdp Argon2, update user, marquer token used, invalidate toutes sessions user, audit
- `src/features/auth/guards.ts` : `requireUser()` (Server Component helper) lit cookie, valide session, retourne user ou redirect `/login`
- Tests unitaires pour chaque action (mocker repositories + cookies)
- Commit : `feat(auth): Server Actions login, logout, reset password`

### T3.7 — Pages auth
- `src/app/(auth)/layout.tsx` : layout centré, logo en haut, fond crème, card blanche. Redirect `/tableau-de-bord` si session active.
- `src/app/(auth)/login/page.tsx` : formulaire email + password (React Hook Form + Zod), lien "Mot de passe oublié", bouton primary "Se connecter", affichage d'erreur générique
- `src/app/(auth)/mot-de-passe-oublie/page.tsx` : formulaire email, message de succès générique après submit
- `src/app/(auth)/mot-de-passe-oublie/[token]/page.tsx` : Server Component vérifie le token (si invalide → page d'erreur "Lien invalide ou expiré"), sinon formulaire nouveau mdp + confirmation, barre de force avec `zxcvbn-ts`
- Commit : `feat(auth): pages login, mot de passe oublié et reset`

### T3.8 — Guards + layout (app)
- `src/app/(app)/layout.tsx` : appelle `requireUser()`, rend un placeholder "AppShell à venir" pour le moment (sera rempli phase 4). On valide juste que la redirection marche.
- Page `/tableau-de-bord/page.tsx` : placeholder "Dashboard à venir"
- Test manuel : visiter `/tableau-de-bord` sans session → redirect `/login` ; login → redirect `/tableau-de-bord` ; visiter `/login` connecté → redirect `/tableau-de-bord`
- Commit : `feat(auth): guard du groupe app et redirections`

### T3.9 — En-têtes de sécurité
- `next.config.ts` : `headers()` retourne `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` restrictif
- CSP : mode report-only dans un premier temps (pour ne pas casser Next dev), tightened en prod avec nonces
- Commit : `feat(security): en-têtes HTTP de sécurité et CSP`

---

## Phase 4 — App Shell & design system de base

**Livrable** : layout 3 colonnes responsive complet, sidebar fonctionnelle, bascule mobile hamburger, droite empilable.

### T4.1 — Install shadcn/ui + composants de base
- `npx shadcn@latest init` (config dans `components.json`, alias `@/components/ui`, préférer neutral)
- Installer composants : `button`, `input`, `label`, `select`, `textarea`, `checkbox`, `switch`, `radio-group`, `dialog`, `sheet`, `popover`, `tooltip`, `tabs`, `badge`, `dropdown-menu`, `avatar`, `sonner` (toast), `form`
- Personnaliser les couleurs shadcn pour mapper sur nos tokens (primary = notre teal, radius à 10px pour inputs/boutons)
- Installer `lucide-react`
- Commit : `feat(ui): shadcn/ui installé avec palette Keyni`

### T4.2 — Config nav
- `src/config/nav.ts` : `export const nav: NavItem[] = [...]` (Tableau de bord, Mes contrats, Outils, Bons plans, Contact) avec icônes Lucide + paths
- Type `NavItem` exporté
- Commit : `feat(config): source unique de la navigation`

### T4.3 — Logo + illustrations
- `public/logo.svg` : reconstitution fidèle du logo Keyni (carré vert menthe arrondi + "Keyni" en noir, Plus Jakarta Sans bold)
- `public/illustrations/money-waiting.svg` : illustration "20€ vous attendent" (billets verts stylisés)
- `public/illustrations/kpi-charts.svg` : illustration deux mini-graphes pour "Vos KPI"
- `src/components/layout/Logo.tsx` : `<Logo size="sm|md|lg" />` utilise le SVG
- Commit : `feat(assets): logo Keyni et illustrations`

### T4.4 — Sidebar (desktop)
- `src/components/layout/Sidebar.tsx` : 
  - Logo en haut
  - Liste de `SidebarItem` depuis `nav.ts` (icône + label, active state = fond `primary-soft` + text `primary`)
  - Widget "20€ vous attendent" en bas (petite carte cliquable vers `/bons-plans`)
  - Profil MHM + bouton "Se déconcter" (Server Action `logoutAction`)
  - Responsive : `w-60 xl:w-60 lg:w-[72px]`, labels masqués sur lg, tooltip au survol
- Commit : `feat(layout): sidebar desktop avec nav active et widget gains`

### T4.5 — Right Panel
- `src/components/layout/RightPanel.tsx` : reçoit `widgets: ReactNode[]`, les rend empilés, `w-80` en xl, `w-[300px]` en lg, empilé sous main en md
- `src/components/layout/widgets/TrustpilotBadge.tsx` : badge fixe "Trustpilot 4,7/5" (lien externe vers trustpilot)
- `src/components/layout/widgets/HelpCard.tsx` : carte "Besoin d'aide ? Discuter avec nous" avec bouton chat
- Commit : `feat(layout): panneau droit configurable par page`

### T4.6 — TopBar + ChatBubble
- `src/components/layout/TopBar.tsx` : lien "← Retour" conditionnel (prop `backHref?`), breadcrumb optionnel
- `src/components/layout/ChatBubble.tsx` : bouton floating bottom-right, icône message-circle, ouvre un Dialog "Chat en direct bientôt disponible" pour l'instant
- Commit : `feat(layout): TopBar avec retour et bulle chat flottante`

### T4.7 — Mobile nav + AppShell
- `src/components/layout/MobileNav.tsx` : bouton hamburger top-left en mobile, ouvre un `Sheet` plein écran avec la nav (mêmes items, profil en bas)
- `src/components/layout/AppShell.tsx` : compose Sidebar + TopBar + main (children) + RightPanel + ChatBubble, gère la grille responsive (`grid-cols-[240px_1fr_320px]` xl, `grid-cols-[72px_1fr_300px]` lg, etc.)
- `src/app/(app)/layout.tsx` : utilise `AppShell`, passe les children, le right panel sera injecté par page via un slot (pattern : `rightPanel: ReactNode` en prop, ou un Context Provider)
- Pattern choisi : chaque page exporte `generateRightPanel(props): ReactNode` ou pose un `<RightPanelSlot>` dans son JSX ; on fait un portail React simple via Context.
- Tests responsive manuels aux 4 breakpoints
- Commit : `feat(layout): AppShell responsive avec bascule mobile hamburger`

### T4.8 — Composants UI métier de base
- `src/components/ui/info-banner.tsx` : bandeau `primary-soft` + icône info + text
- `src/components/charts/score-ring.tsx` : SVG radial, prend `value` (0-100), `target`, rend un arc avec gradient selon niveau (rouge <40, ambre <70, vert <85, primary ≥85), centre affiche "SCORE X/100" et "SCORE KEYNI", animé à l'entrée (`framer-motion` ou CSS `@property`)
- `src/components/charts/kpi-card.tsx` : prend `title`, `value`, `delta`, `deltaDirection`, `chart: 'bar' | 'line'`, `chartData: number[]`, icône domaine ; rend la carte avec mini-chart Recharts en bas
- `src/components/charts/mini-chart.tsx` : wrapper Recharts `<ResponsiveContainer>` avec `<LineChart>` ou `<BarChart>`, sans axes ni tooltip, juste la ligne/barres
- Commit : `feat(ui): composants métier (InfoBanner, ScoreRing, KpiCard, MiniChart)`

---

## Phase 5 — Moteur Score Keyni (TDD)

**Livrable** : fonction pure `computeScore` avec règles paramétrables, couverture > 90 %.

### T5.1 — Règles & types
- `src/features/score/rules.ts` : objet `scoreRules` exactement comme spec §8.2
- `src/features/score/types.ts` : types `ScoreInput`, `ScoreResult`, `PropertyScore`, `ScoreBreakdown`, `Recommendation`, `Level`
- Commit : `feat(score): règles paramétrables et types`

### T5.2 — Tests d'abord (TDD)
- `tests/unit/score-engine.test.ts` — cas :
  - User sans bien → score baseScore (50)
  - 1 bien en location, 0 contrat → baseScore + 0 pts contrats
  - 1 bien en location, PNO souscrit → +10 pts
  - PNO sur résidence principale → 0 pt (non applicable)
  - 1 bien avec 20 documents conformes → +15 pts max (cap)
  - 2 biens, un à 500k score 70, un à 100k score 40 → global = pondéré par valeur
  - Profil incomplet → score profil diminué proportionnellement
  - Recommendations triées par impact descendant
  - Niveau dérivé correctement (40 → modéré, 70 → bon, 85 → excellent)
- Commit : `test(score): cas de test exhaustifs pour le moteur`

### T5.3 — Implémentation `computeScore`
- `src/features/score/engine.ts` : implémente `export function computeScore(input: ScoreInput): ScoreResult`
- Vérifier que tous les tests passent (`npm run test` vert)
- Objectif couverture : >= 90 % sur `features/score/`
- Commit : `feat(score): implémentation pure de computeScore`

### T5.4 — Mock document analyzer
- `src/features/documents/analyzer.ts` : interface `DocumentAnalyzer` avec `analyze(document): Promise<AnalysisReport>`
- `src/features/documents/mock-analyzer.ts` : `MockDocumentAnalyzer implements DocumentAnalyzer` — délai 2-4s, résultat déterministe par hash du nom de fichier (seed), retourne un rapport crédible (nombre de clauses, clauses à risque exemples réalistes, recommandations)
- Injection dans `src/lib/db/repositories.ts`
- Tests : `tests/unit/mock-analyzer.test.ts` — même nom = même résultat, délai respecté
- Commit : `feat(documents): analyseur IA mocké déterministe`

---

## Phase 6 — Pages mockées (Dashboard, Score, Infos perso)

**Livrable** : les 3 pages de la maquette fidèlement reproduites avec données réelles du seed.

### T6.1 — Server Actions properties/contracts/documents/scores
- `src/features/properties/actions.ts` : `getUserProperties()`, `updateProperty(id, input)`
- `src/features/contracts/actions.ts` : `getUserContracts(propertyId?)`
- `src/features/documents/actions.ts` : `getUserDocuments(propertyId?)`, `uploadDocument(formData)`, `analyzeDocument(id)`
- `src/features/score/actions.ts` : `getUserScore(propertyId?)` → appelle `computeScore` avec les données du user
- `src/features/users/actions.ts` : `getCurrentUserProfile()`, `updateProfile(input)`
- `src/features/referrals/actions.ts` : `getUserRewards()`, `claimReward(id, iban)`
- Commit : `feat(actions): Server Actions pour properties, contracts, documents, score, referrals`

### T6.2 — Page Tableau de bord
- `src/app/(app)/tableau-de-bord/page.tsx` : Server Component, récupère user + properties + contracts + documents + score via actions
  - Header "Bonjour MHM !" + sous-titre + BienSelector dropdown
  - `InfoBanner` "Complétez vos informations personnelles..."
  - Gros bloc Score Keyni avec `ScoreRing` + CTA "Améliorer mon score Keyni" → `/outils/score`
  - Grille 4 colonnes de `KpiCard` : Cash flow, Patrimoine immobilier, Rentabilité nette, Plus-value réalisée (valeurs calculées depuis les finances des biens + 6 snapshots pour la courbe)
- Right panel : Trustpilot + 3 `DocumentCard` (Attestations, Échéanciers, Factures avec compteurs) + carte Sinistre+ avec CTA "Déclarer un sinistre" → `/sinistres/nouveau`
- `loading.tsx` avec skeletons
- Commit : `feat(dashboard): page Tableau de bord fidèle à la maquette`

### T6.3 — Page Outils (hub)
- `src/app/(app)/outils/page.tsx` : hub avec cartes cliquables vers `/outils/score` et `/outils/informations` (+ placeholder pour d'autres outils à venir)
- Commit : `feat(outils): hub des outils`

### T6.4 — Page Outils → Score Keyni
- `src/app/(app)/outils/score/page.tsx` :
  - Header "Améliorer mon score Keyni" + lien "← Retour" + mini-score en header droite
  - `InfoBanner` explicatif
  - Dropdown "Voir mon score par Global / Par bien" (état client)
  - Module 1 "Risques financiers" : liste des 3 contrats possibles (PNO, GLI, ADP). Pour chacun : icône, nom, description, statut ("Manquante" badge rouge avec points potentiels OU "Souscrit" vert), bouton "Voir les offres" (lien vers keyni.eu à terme)
  - Module 2 "Risques juridiques" : zone upload (`DropZone`), à droite "Notre IA analyse vos documents" + liste des 4 bénéfices ("jusqu'à +15 pts")
  - Bloc "Bon à savoir" en bas
- Right panel : Trustpilot + "Mon score actuel" (`ScoreRing` + niveau + objectif 75/100 + barre de progression) + "Impact des actions" (assurances souscrites +X pts, documents conformes +Y pts, total possible +Z pts) + "Recommandations" (liste ordonnée depuis `recommendations` du score)
- Upload form : React Hook Form, FormData vers `uploadDocument`, puis appel `analyzeDocument(id)` avec état loading, affichage du rapport dans une card qui pop
- Commit : `feat(score): page Améliorer mon score Keyni avec upload et analyse mockée`

### T6.5 — Page Outils → Informations personnelles
- `src/app/(app)/outils/informations/page.tsx` :
  - Header "Informations personnelles" + sous-titre + dropdown "Bien concerné" (Appartement Lyon...) + bouton "+ Ajouter un bien"
  - `InfoBanner` "Ces informations nous permettent de calculer vos KPI..."
  - Section "Informations sur vous" : grille 2 colonnes (Situation professionnelle, Email, Revenus mensuels nets, Charges mensuelles, Nombre de personnes au foyer, Régime fiscal)
  - Section "Informations sur votre bien" : grille 3 colonnes (Type, Surface, Date d'acquisition, Prix d'acquisition, Valeur actuelle estimée, Usage du bien)
  - Section "Informations financières liées au bien" : grille 3 colonnes (Loyer mensuel, Charges mensuelles, Mensualité de crédit, Taux d'intérêt, Durée restante, Apport personnel)
  - Boutons "Annuler" (ghost) + "Enregistrer" (primary) fixés en bas
- Formulaire global React Hook Form + Zod combinant tous les champs, soumis via `updateProfile` + `updateProperty`
- Right panel : Trustpilot + "À quoi servent ces informations ?" (4 checkmarks) + image KPI + "Vos KPI mis à jour" (liste des 4 KPI) + carte "Besoin d'aide ?"
- Commit : `feat(outils): page Informations personnelles avec formulaire complet`

---

## Phase 7 — Pages conçues dans la spec

**Livrable** : Mes contrats, Bons plans, Contact, Profil, Sinistres.

### T7.1 — Mes contrats (liste)
- `src/app/(app)/mes-contrats/page.tsx` : liste des contrats, `BienSelector` + filtres `Tous/Actifs/À renouveler/Expirés` (state client via searchParams)
- `src/components/contracts/ContractCard.tsx` : carte avec icône type, nom du type, bien lié, assureur, prime, échéance, badge statut, liens actions
- Empty state si aucun contrat
- Right panel : Trustpilot + récap (X actifs / X expirés / prochaine échéance)
- Commit : `feat(contrats): liste des contrats avec filtres`

### T7.2 — Mes contrats (détail)
- `src/app/(app)/mes-contrats/[id]/page.tsx` : onglets (Informations, Garanties, Documents, Sinistres liés, Historique) via shadcn `Tabs`
- Chaque onglet rend le contenu correspondant — pour MVP : Informations (infos du contrat), Garanties (liste des garanties si stocké dans `contract.garanties`, sinon placeholder), Documents (liste `DocumentCard`), Sinistres (liste liée), Historique (timeline)
- Commit : `feat(contrats): page détail avec onglets`

### T7.3 — Bons plans
- `src/app/(app)/bons-plans/page.tsx` :
  - Héro carte "20€ vous attendent" (grand) avec CTA "Récupérer mes gains" → `Dialog` formulaire IBAN → confirmation
  - Section parrainage : lien personnel (généré côté user, ex: `keyni.eu/p/<userSlug>`) + bouton copier + compteur + tableau anonymisé
  - Section offres partenaires : 2-3 cartes statiques
- Right panel : Trustpilot + "Comment ça marche" (3 étapes) + historique
- Commit : `feat(bons-plans): page parrainage, gains et offres partenaires`

### T7.4 — Contact
- `src/app/(app)/contact/page.tsx` :
  - 3 cartes contact rapide (chat ouvre `ChatBubble`, tel affiche numéro, email `mailto:`)
  - Bloc prise de RDV : grille de slots 30min mockée sur 2 semaines + formulaire objet/message
  - FAQ accordéon depuis `src/content/faq.json` (10 questions pertinentes assurance immobilière)
- Right panel : Trustpilot + carte "Votre conseiller" (nom, photo placeholder, spécialité) + horaires
- Commit : `feat(contact): page contact avec RDV mocké et FAQ`

### T7.5 — Profil
- `src/app/(app)/profil/page.tsx` : email (lecture seule) + changement mot de passe (3 champs avec validation) + liste sessions actives avec révocation individuelle ou globale
- Server Action `changePasswordAction` (vérifie l'ancien mdp, applique argon2, optionnellement révoque autres sessions)
- Server Action `revokeSessionAction(sessionId)` et `revokeAllOtherSessions()`
- Commit : `feat(profil): changement mot de passe et gestion des sessions`

### T7.6 — Sinistres (déclaration)
- `src/app/(app)/sinistres/nouveau/page.tsx` : flow 3 étapes (stepper)
  - Étape 1 : sélection bien + contrat rattaché
  - Étape 2 : type sinistre (select) + date + description (textarea) + upload photos
  - Étape 3 : récap + bouton confirmer
- Server Action `declareSinistreAction` crée un sinistre avec statut `declare`, envoie email de confirmation au user
- Commit : `feat(sinistres): flow de déclaration en 3 étapes`

---

## Phase 8 — Loading, Errors, Polish

**Livrable** : skeletons partout, error boundaries par route, détails de finition.

### T8.1 — Loading states
- `loading.tsx` par route `(app)/*/` avec skeleton spécifique au contenu
- Commit : `feat(loading): skeletons par route`

### T8.2 — Error boundaries
- `error.tsx` par route avec carte d'erreur + bouton "Réessayer" (`reset()`)
- Page globale `/erreur` pour fallback
- Commit : `feat(errors): error boundaries par route et page erreur globale`

### T8.3 — Métadonnées et favicon
- `metadata` dans chaque page (`Tableau de bord — Keyni`, etc.)
- `public/favicon.ico` dérivé du logo
- Commit : `feat(meta): titres d'onglet et favicon`

### T8.4 — Responsive final pass
- Revue manuelle aux 4 breakpoints des 3 pages mockées + 5 autres pages
- Ajustements spacing, font-size, grilles
- Commit : `polish: ajustements responsive sur toutes les pages`

---

## Phase 9 — Tests E2E + CI + Documentation

**Livrable** : Playwright 3 scénarios verts, CI GitHub Actions configurée, README et docs écrits.

### T9.1 — Setup Playwright
- Installer `@playwright/test` + `npx playwright install chromium`
- `playwright.config.ts` : baseURL `http://localhost:3000`, `webServer` qui lance `npm run start` après `npm run build`
- Commit : `chore(e2e): setup Playwright`

### T9.2 — Tests E2E critiques
- `tests/e2e/auth.spec.ts` :
  - Login avec MHM → redirect dashboard → logout → redirect login
  - Reset password : demande reset → email console-logged → récupérer token des .tmp/emails → soumettre nouveau mdp → login avec nouveau mdp OK
- `tests/e2e/score.spec.ts` :
  - Login → Outils → Score → upload un PDF → attendre analyse (polling toast) → vérifier que le score a bougé
- Commit : `test(e2e): parcours login, reset et analyse document`

### T9.3 — CI GitHub Actions
- `.github/workflows/ci.yml` : jobs install + typecheck + lint + test + build + e2e (chromium seul pour vitesse), sur push et PR
- Commit : `chore(ci): workflow GitHub Actions`

### T9.4 — Documentation
- `README.md` : description (espace client Keyni), prérequis (Node 20+), démarrage (`npm install && cp .env.example .env.local && npm run dev` + identifiants MHM de dev), scripts, structure en un paragraphe, comment brancher Postgres (renvoi `docs/branching-db.md`)
- `docs/architecture.md` : vue d'ensemble en 2-3 pages, diagramme ASCII des couches
- `docs/branching-db.md` : tutoriel pas à pas pour ajouter Prisma + Postgres (schéma complet, étapes, checklist)
- Commit : `docs: README, architecture et guide de branchement DB`

### T9.5 — Commit de clôture + push
- Vérifier `npm run typecheck && npm run lint && npm run test && npm run build` vert
- `git push origin main`
- Commit final si amends nécessaires

---

## Vérification de bout en bout

Une fois tout exécuté, le livrable doit satisfaire :

1. `npm install && cp .env.example .env.local` (éditer `SESSION_SECRET`) `&& npm run dev` — l'app démarre sur `http://localhost:3000`
2. Visiter `/` sans session → redirect `/login`
3. Login avec `mhm@example.test` / `MhmKeyni2026!` → redirect `/tableau-de-bord`
4. Vérifier visuellement que les 3 pages mockées correspondent aux captures (couleurs, placements, données MHM affichées)
5. Uploader un PDF dans `/outils/score` → analyse 2-4s → rapport + score qui évolue
6. Reset password : `/mot-de-passe-oublie` → voir le mail dans `.tmp/emails/` → suivre le lien → définir nouveau mdp → re-login OK
7. Responsive : redimensionner à 375px, 768px, 1024px, 1280px+ → sidebar bascule en hamburger sous 768, layout toujours propre
8. `npm run typecheck && npm run lint && npm run test && npm run e2e && npm run build` → tout vert
9. Couverture : `npm run test:cov` → ≥ 90 % sur `features/score/` et `features/auth/`
10. Aucune mention de Claude/IA/outil externe dans le code, commentaires, commits, docs, README

---

## Non-goals (explicitement hors scope)

- 2FA/TOTP
- Signup self-service (les comptes sont créés côté Keyni en back-office)
- Intégration LLM réelle pour l'analyse de docs (mockée)
- Calendrier réel de prise de RDV (UI mockée)
- Application mobile native
- Dashboard admin Keyni

---

## Fichiers critiques (index rapide)

| Domaine | Fichiers |
|---|---|
| Entry points | `src/app/layout.tsx`, `src/app/(auth)/layout.tsx`, `src/app/(app)/layout.tsx` |
| Data layer | `src/lib/db/store.ts`, `src/lib/db/repositories.ts`, `src/lib/db/seed.json`, `src/features/*/repository.in-memory.ts` |
| Auth | `src/features/auth/{password,session,actions,guards,audit,rate-limit}.ts` |
| Score | `src/features/score/{engine,rules,types}.ts` |
| Design system | `src/styles/tokens.css`, `tailwind.config.ts`, `src/components/ui/*`, `src/components/layout/AppShell.tsx` |
| Config | `src/config/{env,nav}.ts` |
| Docs | `README.md`, `docs/architecture.md`, `docs/branching-db.md` |
