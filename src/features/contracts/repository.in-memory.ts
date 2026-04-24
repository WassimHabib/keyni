import { ulid } from "ulid";

import type { PropertyId } from "@/features/properties/types";
import type { UserId } from "@/features/users/types";
import type { InMemoryStore } from "@/lib/db/store";

import type { ContractRepository } from "./repository";
import type { Contract, ContractId } from "./types";

export class InMemoryContractRepository implements ContractRepository {
  constructor(private readonly store: InMemoryStore) {}

  async findAllByUser(
    userId: UserId,
    propertyId?: PropertyId,
  ): Promise<Contract[]> {
    await this.store.ensureSeeded();
    return Array.from(this.store.contracts.values())
      .filter((c) => c.userId === userId)
      .filter((c) => (propertyId ? c.propertyId === propertyId : true))
      .sort(
        (a, b) => b.dateEcheance.getTime() - a.dateEcheance.getTime(),
      );
  }

  async findById(id: ContractId): Promise<Contract | null> {
    await this.store.ensureSeeded();
    return this.store.contracts.get(id) ?? null;
  }

  async create(
    input: Omit<Contract, "id" | "createdAt" | "updatedAt">,
  ): Promise<Contract> {
    await this.store.ensureSeeded();
    const now = new Date();
    const contract: Contract = {
      ...input,
      id: ulid(),
      createdAt: now,
      updatedAt: now,
    };
    this.store.contracts.set(contract.id, contract);
    return contract;
  }

  async update(
    id: ContractId,
    patch: Partial<Omit<Contract, "id">>,
  ): Promise<Contract> {
    await this.store.ensureSeeded();
    const current = this.store.contracts.get(id);
    if (!current) throw new Error("Contrat introuvable");
    const next: Contract = {
      ...current,
      ...patch,
      updatedAt: new Date(),
    };
    this.store.contracts.set(id, next);
    return next;
  }

  async delete(id: ContractId): Promise<void> {
    await this.store.ensureSeeded();
    this.store.contracts.delete(id);
  }
}
