import { InMemoryAuditLogRepository } from "@/features/auth/audit-repository.in-memory";
import type { AuditLogRepository } from "@/features/auth/audit-repository";
import { InMemoryRateLimitStore } from "@/features/auth/rate-limit-repository.in-memory";
import type { RateLimitStore } from "@/features/auth/rate-limit-repository";
import { InMemoryPasswordResetTokenRepository } from "@/features/auth/reset-token-repository.in-memory";
import type { PasswordResetTokenRepository } from "@/features/auth/reset-token-repository";
import { InMemorySessionRepository } from "@/features/auth/session-repository.in-memory";
import type { SessionRepository } from "@/features/auth/session-repository";
import { InMemoryContractRepository } from "@/features/contracts/repository.in-memory";
import type { ContractRepository } from "@/features/contracts/repository";
import { InMemoryDocumentRepository } from "@/features/documents/repository.in-memory";
import type { DocumentRepository } from "@/features/documents/repository";
import { InMemoryPropertyRepository } from "@/features/properties/repository.in-memory";
import type { PropertyRepository } from "@/features/properties/repository";
import {
  InMemoryReferralRepository,
  InMemoryRewardRepository,
} from "@/features/referrals/repository.in-memory";
import type {
  ReferralRepository,
  RewardRepository,
} from "@/features/referrals/repository";
import { InMemoryScoreSnapshotRepository } from "@/features/score/snapshot-repository.in-memory";
import type { ScoreSnapshotRepository } from "@/features/score/snapshot-repository";
import { InMemorySinistreRepository } from "@/features/sinistres/repository.in-memory";
import type { SinistreRepository } from "@/features/sinistres/repository";
import { InMemoryUserRepository } from "@/features/users/repository.in-memory";
import type { UserRepository } from "@/features/users/repository";

import { store } from "./store";
import { loadSeed } from "./seed";

export interface Repositories {
  users: UserRepository;
  properties: PropertyRepository;
  contracts: ContractRepository;
  documents: DocumentRepository;
  sinistres: SinistreRepository;
  rewards: RewardRepository;
  referrals: ReferralRepository;
  sessions: SessionRepository;
  auditLog: AuditLogRepository;
  resetTokens: PasswordResetTokenRepository;
  rateLimit: RateLimitStore;
  scoreSnapshots: ScoreSnapshotRepository;
}

export const repositories: Repositories = {
  users: new InMemoryUserRepository(store),
  properties: new InMemoryPropertyRepository(store),
  contracts: new InMemoryContractRepository(store),
  documents: new InMemoryDocumentRepository(store),
  sinistres: new InMemorySinistreRepository(store),
  rewards: new InMemoryRewardRepository(store),
  referrals: new InMemoryReferralRepository(store),
  sessions: new InMemorySessionRepository(store),
  auditLog: new InMemoryAuditLogRepository(store),
  resetTokens: new InMemoryPasswordResetTokenRepository(store),
  rateLimit: new InMemoryRateLimitStore(store),
  scoreSnapshots: new InMemoryScoreSnapshotRepository(store),
};

// Branche le seed loader sur le store (exécuté lazy au premier accès).
// eslint-disable-next-line no-process-env
if (process.env.NODE_ENV !== "test") {
  store.registerSeedLoader(() => loadSeed(store));
}
