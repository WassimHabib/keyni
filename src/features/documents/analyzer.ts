import type { AnalysisReport, Conformity, Document } from "./types";

export interface DocumentAnalyzer {
  analyze(document: Document): Promise<{
    conformity: Conformity;
    report: AnalysisReport;
  }>;
}
