import type { PropertyId } from "@/features/properties/types";
import type { UserId } from "@/features/users/types";

import type { AnalysisReport, Conformity, Document, DocumentId } from "./types";

export interface DocumentRepository {
  findAllByUser(userId: UserId, propertyId?: PropertyId): Promise<Document[]>;
  findById(id: DocumentId): Promise<Document | null>;
  create(input: Omit<Document, "id" | "uploadedAt">): Promise<Document>;
  updateAnalysis(
    id: DocumentId,
    analysis: { conformity: Conformity; report: AnalysisReport },
  ): Promise<Document>;
  delete(id: DocumentId): Promise<void>;
}
