import { ulid } from "ulid";

import type { PropertyId } from "@/features/properties/types";
import type { UserId } from "@/features/users/types";
import type { InMemoryStore } from "@/lib/db/store";

import type { SinistreRepository } from "./repository";
import type { Sinistre, SinistreId } from "./types";

function makeReference(): string {
  const year = new Date().getFullYear();
  const suffix = Math.floor(Math.random() * 99999)
    .toString()
    .padStart(5, "0");
  return `KS-${year}-${suffix}`;
}

export class InMemorySinistreRepository implements SinistreRepository {
  constructor(private readonly store: InMemoryStore) {}

  async findAllByUser(userId: UserId): Promise<Sinistre[]> {
    await this.store.ensureSeeded();
    return Array.from(this.store.sinistres.values())
      .filter((s) => s.userId === userId)
      .sort(
        (a, b) => b.dateDeclaration.getTime() - a.dateDeclaration.getTime(),
      );
  }

  async findAllByProperty(propertyId: PropertyId): Promise<Sinistre[]> {
    await this.store.ensureSeeded();
    return Array.from(this.store.sinistres.values()).filter(
      (s) => s.propertyId === propertyId,
    );
  }

  async findAllByContract(contractId: string): Promise<Sinistre[]> {
    await this.store.ensureSeeded();
    return Array.from(this.store.sinistres.values()).filter(
      (s) => s.contractId === contractId,
    );
  }

  async findById(id: SinistreId): Promise<Sinistre | null> {
    await this.store.ensureSeeded();
    return this.store.sinistres.get(id) ?? null;
  }

  async create(
    input: Omit<Sinistre, "id" | "dateDeclaration" | "referenceInterne">,
  ): Promise<Sinistre> {
    await this.store.ensureSeeded();
    const now = new Date();
    const sinistre: Sinistre = {
      ...input,
      id: ulid(),
      dateDeclaration: now,
      referenceInterne: makeReference(),
      timeline: [
        ...(input.timeline ?? []),
        { at: now, label: "Sinistre déclaré en ligne" },
      ],
    };
    this.store.sinistres.set(sinistre.id, sinistre);
    return sinistre;
  }
}
