import type { AuditLog, PasswordResetToken, Session } from "@/features/auth/types";
import type { Contract } from "@/features/contracts/types";
import type { Document } from "@/features/documents/types";
import type { Property } from "@/features/properties/types";
import type { Referral, Reward } from "@/features/referrals/types";
import type { Sinistre } from "@/features/sinistres/types";
import type { User } from "@/features/users/types";

export interface ScoreSnapshot {
  id: string;
  userId: string;
  capturedAt: Date;
  globalScore: number;
  cashFlowCents: number;
  patrimoineCents: number;
  rentabiliteNette: number;
  plusValueCents: number;
}

/**
 * Store en mémoire — point de passage unique pour les repositories.
 * Le seeding est lazy : la première fois qu'un repository lit le store,
 * il s'assure que le seed a tourné (hashing du mot de passe MHM compris).
 */
export class InMemoryStore {
  users = new Map<string, User>();
  properties = new Map<string, Property>();
  contracts = new Map<string, Contract>();
  documents = new Map<string, Document>();
  sinistres = new Map<string, Sinistre>();
  rewards = new Map<string, Reward>();
  referrals = new Map<string, Referral>();
  sessions = new Map<string, Session>();
  auditLogs = new Map<string, AuditLog>();
  resetTokens = new Map<string, PasswordResetToken>();
  scoreSnapshots = new Map<string, ScoreSnapshot>();

  /** Valeurs arbitraires (counters, rate-limits…). */
  kv = new Map<string, unknown>();

  private seedingPromise?: Promise<void>;
  private seedLoader?: () => Promise<void>;

  registerSeedLoader(loader: () => Promise<void>): void {
    this.seedLoader = loader;
  }

  async ensureSeeded(): Promise<void> {
    if (!this.seedLoader) return;
    if (!this.seedingPromise) {
      this.seedingPromise = this.seedLoader();
    }
    await this.seedingPromise;
  }

  reset(): void {
    this.users.clear();
    this.properties.clear();
    this.contracts.clear();
    this.documents.clear();
    this.sinistres.clear();
    this.rewards.clear();
    this.referrals.clear();
    this.sessions.clear();
    this.auditLogs.clear();
    this.resetTokens.clear();
    this.scoreSnapshots.clear();
    this.kv.clear();
    this.seedingPromise = undefined;
  }
}

/** Singleton partagé au process. */
const globalForStore = globalThis as unknown as {
  __keyniStore?: InMemoryStore;
};

export const store: InMemoryStore =
  globalForStore.__keyniStore ?? new InMemoryStore();

// eslint-disable-next-line no-process-env
if (process.env.NODE_ENV !== "production") {
  globalForStore.__keyniStore = store;
}
