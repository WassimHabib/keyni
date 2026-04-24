import { ulid } from "ulid";

import type { UserId } from "@/features/users/types";
import type { InMemoryStore } from "@/lib/db/store";

import type { PropertyRepository } from "./repository";
import type {
  CreatePropertyInput,
  Property,
  PropertyId,
  UpdatePropertyInput,
} from "./types";

export class InMemoryPropertyRepository implements PropertyRepository {
  constructor(private readonly store: InMemoryStore) {}

  async findAllByUser(userId: UserId): Promise<Property[]> {
    await this.store.ensureSeeded();
    return Array.from(this.store.properties.values())
      .filter((p) => p.userId === userId)
      .sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }

  async findById(id: PropertyId): Promise<Property | null> {
    await this.store.ensureSeeded();
    return this.store.properties.get(id) ?? null;
  }

  async create(
    userId: UserId,
    input: CreatePropertyInput,
  ): Promise<Property> {
    await this.store.ensureSeeded();
    const now = new Date();
    const property: Property = {
      id: ulid(),
      userId,
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    this.store.properties.set(property.id, property);
    return property;
  }

  async update(
    id: PropertyId,
    input: UpdatePropertyInput,
  ): Promise<Property> {
    await this.store.ensureSeeded();
    const current = this.store.properties.get(id);
    if (!current) throw new Error("Bien introuvable");
    const merged = { ...current, ...input } as Property;
    if (input.finances) {
      merged.finances = { ...current.finances, ...input.finances };
    }
    merged.updatedAt = new Date();
    this.store.properties.set(id, merged);
    return merged;
  }

  async delete(id: PropertyId): Promise<void> {
    await this.store.ensureSeeded();
    this.store.properties.delete(id);
  }
}
