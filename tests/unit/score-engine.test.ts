import { describe, expect, it } from "vitest";

import { computeScore } from "@/features/score/engine";
import { scoreRules } from "@/features/score/rules";
import type { Contract } from "@/features/contracts/types";
import type { Document } from "@/features/documents/types";
import type { Property } from "@/features/properties/types";
import type { UserProfile } from "@/features/users/types";

const emptyProfile: UserProfile = { displayName: "Test" };

function makeProperty(overrides: Partial<Property> = {}): Property {
  return {
    id: "01HX000000000000000000PROP",
    userId: "01HX000000000000000000USER",
    name: "Bien test",
    type: "appartement",
    usage: "location_nue",
    surface: 50,
    dateAcquisition: new Date("2022-01-01"),
    prixAcquisitionCents: 20_000_000,
    valeurActuelleEstimeeCents: 22_000_000,
    finances: {
      loyerMensuelCents: 80_000,
      chargesMensuellesCents: 10_000,
      mensualiteCreditCents: 60_000,
      tauxInteret: 1.5,
      dureeRestantePretAnnees: 15,
      apportPersonnelCents: 4_000_000,
    },
    createdAt: new Date("2022-01-01"),
    updatedAt: new Date("2022-01-01"),
    ...overrides,
  };
}

function makeContract(overrides: Partial<Contract>): Contract {
  return {
    id: "01HX000000000000000000CONT",
    userId: "01HX000000000000000000USER",
    propertyId: "01HX000000000000000000PROP",
    type: "PNO",
    assureur: "Keyni",
    numeroPolice: "POL",
    status: "actif",
    primeAnnuelleCents: 10_000,
    dateDebut: new Date("2024-01-01"),
    dateEcheance: new Date("2026-01-01"),
    garanties: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeDocument(overrides: Partial<Document>): Document {
  return {
    id: "01HX000000000000000000DOC",
    userId: "01HX000000000000000000USER",
    propertyId: "01HX000000000000000000PROP",
    type: "bail",
    filename: "bail.pdf",
    mime: "application/pdf",
    sizeBytes: 1024,
    storageKey: "test",
    conformity: "conform",
    uploadedAt: new Date(),
    ...overrides,
  };
}

describe("computeScore", () => {
  it("retourne baseScore quand aucun bien", () => {
    const result = computeScore({
      profile: emptyProfile,
      properties: [],
      contracts: [],
      documents: [],
    });
    expect(result.global).toBe(scoreRules.baseScore);
  });

  it("ajoute les points PNO sur un bien en location", () => {
    const property = makeProperty({ usage: "location_meublee" });
    const contract = makeContract({ propertyId: property.id, type: "PNO" });
    const result = computeScore({
      profile: emptyProfile,
      properties: [property],
      contracts: [contract],
      documents: [],
    });
    expect(result.global).toBeGreaterThanOrEqual(
      scoreRules.baseScore + scoreRules.contracts.PNO.points,
    );
  });

  it("n'ajoute pas PNO sur une résidence principale (non applicable)", () => {
    const property = makeProperty({ usage: "residence_principale" });
    const contract = makeContract({ propertyId: property.id, type: "PNO" });
    const result = computeScore({
      profile: emptyProfile,
      properties: [property],
      contracts: [contract],
      documents: [],
    });
    const score = result.perProperty[property.id]!;
    expect(score.financial.missing).not.toContain("PNO");
    expect(score.financial.earned).toBe(0);
  });

  it("plafonne les points documents à maxPerProperty", () => {
    const property = makeProperty({ usage: "location_nue" });
    const documents: Document[] = Array.from({ length: 20 }, (_, i) =>
      makeDocument({
        id: `doc-${i}`,
        propertyId: property.id,
        type: "bail",
        filename: `bail-${i}.pdf`,
        conformity: "conform",
      }),
    );
    const result = computeScore({
      profile: emptyProfile,
      properties: [property],
      contracts: [],
      documents,
    });
    const score = result.perProperty[property.id]!;
    expect(score.legal.earned).toBe(scoreRules.legal.maxPerProperty);
  });

  it("pondère le score global par la valeur du bien", () => {
    const gros = makeProperty({
      id: "01HX00000000000000000GROS",
      valeurActuelleEstimeeCents: 50_000_000,
    });
    const petit = makeProperty({
      id: "01HX00000000000000000PETI",
      valeurActuelleEstimeeCents: 5_000_000,
    });
    // Le gros a un PNO, pas le petit
    const contract = makeContract({ propertyId: gros.id, type: "PNO" });
    const result = computeScore({
      profile: emptyProfile,
      properties: [gros, petit],
      contracts: [contract],
      documents: [],
    });
    const scoreGros = result.perProperty[gros.id]!.value;
    const scorePetit = result.perProperty[petit.id]!.value;
    expect(scoreGros).toBeGreaterThan(scorePetit);
    expect(result.global).toBeGreaterThan(scorePetit);
    expect(result.global).toBeLessThanOrEqual(scoreGros);
  });

  it("recommandations triées par impact décroissant", () => {
    const property = makeProperty({
      usage: "location_nue",
      finances: {
        loyerMensuelCents: 50_000,
        chargesMensuellesCents: 0,
        mensualiteCreditCents: 60_000,
        tauxInteret: 1,
        dureeRestantePretAnnees: 10,
        apportPersonnelCents: 0,
      },
    });
    const result = computeScore({
      profile: emptyProfile,
      properties: [property],
      contracts: [],
      documents: [],
    });
    const impacts = result.recommendations.map((r) => r.impactPoints);
    for (let i = 1; i < impacts.length; i += 1) {
      expect(impacts[i]).toBeLessThanOrEqual(impacts[i - 1]!);
    }
  });

  it("profil incomplet diminue la part profil du score", () => {
    const property = makeProperty();
    const complete: UserProfile = {
      displayName: "Complet",
      situation: "salarie",
      revenusMensuelsNetsCents: 400_000,
      chargesMensuellesCents: 100_000,
      personnesFoyer: 2,
      regimeFiscal: "micro_foncier",
    };
    const resIncomplete = computeScore({
      profile: emptyProfile,
      properties: [property],
      contracts: [],
      documents: [],
    });
    const resComplete = computeScore({
      profile: complete,
      properties: [property],
      contracts: [],
      documents: [],
    });
    expect(resComplete.global).toBeGreaterThan(resIncomplete.global);
  });

  it("niveau dérivé correctement", () => {
    const result = computeScore({
      profile: emptyProfile,
      properties: [],
      contracts: [],
      documents: [],
    });
    expect(result.level).toBe("modere"); // 50 ≥ 40
  });
});
