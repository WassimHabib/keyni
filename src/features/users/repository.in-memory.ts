import { ulid } from "ulid";

import type { InMemoryStore } from "@/lib/db/store";

import type { UserRepository } from "./repository";
import type {
  CreateUserInput,
  UpdateUserProfileInput,
  User,
  UserId,
} from "./types";

export class InMemoryUserRepository implements UserRepository {
  constructor(private readonly store: InMemoryStore) {}

  async findById(id: UserId): Promise<User | null> {
    await this.store.ensureSeeded();
    return this.store.users.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    await this.store.ensureSeeded();
    const normalized = email.trim().toLowerCase();
    for (const user of this.store.users.values()) {
      if (user.email === normalized) return user;
    }
    return null;
  }

  async create(input: CreateUserInput): Promise<User> {
    await this.store.ensureSeeded();
    const existing = await this.findByEmail(input.email);
    if (existing) {
      throw new Error("Un compte existe déjà pour cet email");
    }
    const now = new Date();
    const user: User = {
      id: ulid(),
      email: input.email.trim().toLowerCase(),
      passwordHash: input.passwordHash,
      profile: input.profile,
      createdAt: now,
      updatedAt: now,
    };
    this.store.users.set(user.id, user);
    return user;
  }

  async updateProfile(
    id: UserId,
    input: UpdateUserProfileInput,
  ): Promise<User> {
    await this.store.ensureSeeded();
    const current = this.store.users.get(id);
    if (!current) throw new Error("Utilisateur introuvable");
    const next: User = {
      ...current,
      profile: { ...current.profile, ...input } as User["profile"],
      updatedAt: new Date(),
    };
    this.store.users.set(id, next);
    return next;
  }

  async updatePassword(id: UserId, passwordHash: string): Promise<void> {
    await this.store.ensureSeeded();
    const current = this.store.users.get(id);
    if (!current) throw new Error("Utilisateur introuvable");
    this.store.users.set(id, {
      ...current,
      passwordHash,
      updatedAt: new Date(),
    });
  }
}
