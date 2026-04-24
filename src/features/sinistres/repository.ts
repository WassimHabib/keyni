import type { PropertyId } from "@/features/properties/types";
import type { UserId } from "@/features/users/types";

import type { Sinistre, SinistreId } from "./types";

export interface SinistreRepository {
  findAllByUser(userId: UserId): Promise<Sinistre[]>;
  findAllByProperty(propertyId: PropertyId): Promise<Sinistre[]>;
  findAllByContract(contractId: string): Promise<Sinistre[]>;
  findById(id: SinistreId): Promise<Sinistre | null>;
  create(input: Omit<Sinistre, "id" | "dateDeclaration" | "referenceInterne">): Promise<Sinistre>;
}
