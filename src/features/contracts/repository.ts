import type { PropertyId } from "@/features/properties/types";
import type { UserId } from "@/features/users/types";

import type { Contract, ContractId } from "./types";

export interface ContractRepository {
  findAllByUser(userId: UserId, propertyId?: PropertyId): Promise<Contract[]>;
  findById(id: ContractId): Promise<Contract | null>;
  create(input: Omit<Contract, "id" | "createdAt" | "updatedAt">): Promise<Contract>;
  update(id: ContractId, patch: Partial<Omit<Contract, "id">>): Promise<Contract>;
  delete(id: ContractId): Promise<void>;
}
