import type { UserId } from "@/features/users/types";

import type {
  CreatePropertyInput,
  Property,
  PropertyId,
  UpdatePropertyInput,
} from "./types";

export interface PropertyRepository {
  findAllByUser(userId: UserId): Promise<Property[]>;
  findById(id: PropertyId): Promise<Property | null>;
  create(userId: UserId, input: CreatePropertyInput): Promise<Property>;
  update(id: PropertyId, input: UpdatePropertyInput): Promise<Property>;
  delete(id: PropertyId): Promise<void>;
}
