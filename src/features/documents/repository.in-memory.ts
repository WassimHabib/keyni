import { ulid } from "ulid";

import type { PropertyId } from "@/features/properties/types";
import type { UserId } from "@/features/users/types";
import type { InMemoryStore } from "@/lib/db/store";

import type { DocumentRepository } from "./repository";
import type {
  AnalysisReport,
  Conformity,
  Document,
  DocumentId,
} from "./types";

export class InMemoryDocumentRepository implements DocumentRepository {
  constructor(private readonly store: InMemoryStore) {}

  async findAllByUser(
    userId: UserId,
    propertyId?: PropertyId,
  ): Promise<Document[]> {
    await this.store.ensureSeeded();
    return Array.from(this.store.documents.values())
      .filter((d) => d.userId === userId)
      .filter((d) => (propertyId ? d.propertyId === propertyId : true))
      .sort(
        (a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime(),
      );
  }

  async findById(id: DocumentId): Promise<Document | null> {
    await this.store.ensureSeeded();
    return this.store.documents.get(id) ?? null;
  }

  async create(input: Omit<Document, "id" | "uploadedAt">): Promise<Document> {
    await this.store.ensureSeeded();
    const doc: Document = {
      ...input,
      id: ulid(),
      uploadedAt: new Date(),
    };
    this.store.documents.set(doc.id, doc);
    return doc;
  }

  async updateAnalysis(
    id: DocumentId,
    analysis: { conformity: Conformity; report: AnalysisReport },
  ): Promise<Document> {
    await this.store.ensureSeeded();
    const current = this.store.documents.get(id);
    if (!current) throw new Error("Document introuvable");
    const next: Document = {
      ...current,
      conformity: analysis.conformity,
      analysisReport: analysis.report,
    };
    this.store.documents.set(id, next);
    return next;
  }

  async delete(id: DocumentId): Promise<void> {
    await this.store.ensureSeeded();
    this.store.documents.delete(id);
  }
}
