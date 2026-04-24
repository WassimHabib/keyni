# Brancher Postgres à Keyni

Le projet fonctionne aujourd'hui avec un store in-memory. Pour brancher une
base Postgres, il suffit d'ajouter Prisma et d'implémenter les interfaces
`Repository` déjà définies.

## 1. Installation

```bash
npm install prisma @prisma/client
npx prisma init
```

## 2. Schéma Prisma

Créer `prisma/schema.prisma` à partir des entités définies dans
`src/features/*/types.ts`. Exemple simplifié :

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id            String    @id
  email         String    @unique
  passwordHash  String
  profile       Json
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  properties    Property[]
  sessions      Session[]
  // …
}

model Property {
  id                         String   @id
  userId                     String
  name                       String
  city                       String?
  type                       String
  usage                      String
  surface                    Float
  dateAcquisition            DateTime
  prixAcquisitionCents       BigInt
  valeurActuelleEstimeeCents BigInt
  finances                   Json
  createdAt                  DateTime @default(now())
  updatedAt                  DateTime @updatedAt
  user                       User     @relation(fields: [userId], references: [id])
  contracts                  Contract[]
}

model Contract {
  id                  String   @id
  userId              String
  propertyId          String
  type                String
  assureur            String
  numeroPolice        String
  status              String
  primeAnnuelleCents  BigInt
  dateDebut           DateTime
  dateEcheance        DateTime
  garanties           Json
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  property            Property @relation(fields: [propertyId], references: [id])
}

model Session {
  id         String   @id
  userId     String
  tokenHash  String   @unique
  createdAt  DateTime @default(now())
  expiresAt  DateTime
  lastSeenAt DateTime
  ip         String?
  userAgent  String?
  user       User     @relation(fields: [userId], references: [id])
}

// … et ainsi de suite pour Document, Sinistre, Reward, Referral,
// AuditLog, PasswordResetToken, ScoreSnapshot.
```

## 3. Repositories Prisma

Pour chaque domaine, créer un fichier `repository.prisma.ts` qui implémente
l'interface existante. Exemple :

```ts
// src/features/users/repository.prisma.ts
import { PrismaClient } from "@prisma/client";
import type { UserRepository } from "./repository";
import type { User, UserId } from "./types";

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}
  async findById(id: UserId): Promise<User | null> { /* … */ }
  async findByEmail(email: string): Promise<User | null> { /* … */ }
  async create(input) { /* … */ }
  async updateProfile(id, input) { /* … */ }
  async updatePassword(id, passwordHash) { /* … */ }
}
```

## 4. Injection

Modifier `src/lib/db/repositories.ts` pour choisir l'implémentation selon
`env.DATABASE_URL` :

```ts
import { PrismaClient } from "@prisma/client";
// … imports des repos Prisma

const usePrisma = Boolean(env.DATABASE_URL);
const prisma = usePrisma ? new PrismaClient() : null;

export const repositories: Repositories = usePrisma && prisma
  ? {
      users: new PrismaUserRepository(prisma),
      properties: new PrismaPropertyRepository(prisma),
      // …
    }
  : {
      users: new InMemoryUserRepository(store),
      properties: new InMemoryPropertyRepository(store),
      // …
    };
```

## 5. Migration & seed

```bash
npx prisma migrate dev --name init
npx prisma db seed   # adaptez scripts/seed.ts pour cibler Prisma
```

## 6. Validation

- `npm run typecheck` passe sans modification du code applicatif.
- `npm run test` passe (tests métier indépendants de la persistance).
- `npm run e2e` passe avec une base Postgres réelle.

Si un test casse, c'est un symptôme de fuite d'abstraction — isolez-la avant
de valider la migration.
