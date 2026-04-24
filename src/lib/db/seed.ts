import { ulid } from "ulid";

import { hashPassword } from "@/features/auth/password";
import type { Contract } from "@/features/contracts/types";
import type { Document } from "@/features/documents/types";
import type { Property } from "@/features/properties/types";
import type { Referral, Reward } from "@/features/referrals/types";
import type { Sinistre } from "@/features/sinistres/types";
import type { User } from "@/features/users/types";

import type { InMemoryStore, ScoreSnapshot } from "./store";

export const DEMO_USER_EMAIL = "mhm@example.test";
export const DEMO_USER_PASSWORD = "MhmKeyni2026!";
export const DEMO_ADMIN_EMAIL = "admin@example.test";
export const DEMO_ADMIN_PASSWORD = "AdminKeyni2026!";

type SeedProperty = Omit<Property, "id" | "userId" | "createdAt" | "updatedAt">;
type SeedContract = Omit<Contract, "id" | "userId" | "propertyId" | "createdAt" | "updatedAt">;
type SeedDocument = Omit<Document, "id" | "userId" | "propertyId" | "uploadedAt">;

/**
 * Seed par défaut — conforme aux maquettes.
 * Chargé lazy à la première requête sur le store.
 */
export async function loadSeed(store: InMemoryStore): Promise<void> {
  if (store.users.size > 0) return;

  const now = new Date();
  const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

  const userId = ulid();
  const hash = await hashPassword(DEMO_USER_PASSWORD);

  const user: User = {
    id: userId,
    email: DEMO_USER_EMAIL,
    passwordHash: hash,
    role: "user",
    profile: {
      displayName: "MHM",
      firstName: "Marc-Henri",
      lastName: "M.",
      situation: "salarie",
      revenusMensuelsNetsCents: 420000,
      chargesMensuellesCents: 125000,
      personnesFoyer: 2,
      regimeFiscal: "micro_foncier",
    },
    createdAt: yearAgo,
    updatedAt: now,
  };
  store.users.set(user.id, user);

  // Compte administrateur — accès au back-office Keyni
  const adminId = ulid();
  const adminHash = await hashPassword(DEMO_ADMIN_PASSWORD);
  const admin: User = {
    id: adminId,
    email: DEMO_ADMIN_EMAIL,
    passwordHash: adminHash,
    role: "admin",
    profile: {
      displayName: "Admin Keyni",
      firstName: "Admin",
      lastName: "Keyni",
    },
    createdAt: yearAgo,
    updatedAt: now,
  };
  store.users.set(admin.id, admin);

  // Second client pour peupler la liste admin
  const secondId = ulid();
  const secondHash = await hashPassword("Demo2026Client!");
  const second: User = {
    id: secondId,
    email: "sophie.leclerc@example.test",
    passwordHash: secondHash,
    role: "user",
    profile: {
      displayName: "Sophie L.",
      firstName: "Sophie",
      lastName: "Leclerc",
      situation: "cadre",
      revenusMensuelsNetsCents: 620000,
      chargesMensuellesCents: 195000,
      personnesFoyer: 3,
      regimeFiscal: "lmnp_reel",
    },
    createdAt: new Date(yearAgo.getTime() + 30 * 24 * 60 * 60 * 1000),
    updatedAt: now,
  };
  store.users.set(second.id, second);

  // Un bien pour la cliente secondaire
  const sophiaProp: Property = {
    id: ulid(),
    userId: second.id,
    name: "Studio Paris 11e",
    city: "Paris",
    type: "appartement",
    usage: "location_meublee",
    surface: 32,
    dateAcquisition: new Date("2023-06-10"),
    prixAcquisitionCents: 28_500_000,
    valeurActuelleEstimeeCents: 30_200_000,
    finances: {
      loyerMensuelCents: 118_000,
      chargesMensuellesCents: 14_000,
      mensualiteCreditCents: 92_000,
      tauxInteret: 3.1,
      dureeRestantePretAnnees: 22,
      apportPersonnelCents: 5_500_000,
    },
    createdAt: new Date("2023-06-10"),
    updatedAt: now,
  };
  store.properties.set(sophiaProp.id, sophiaProp);

  const propertiesSeed: SeedProperty[] = [
    {
      name: "Appartement Lyon",
      city: "Lyon",
      type: "appartement",
      usage: "location_meublee",
      surface: 65,
      dateAcquisition: new Date("2022-04-12"),
      prixAcquisitionCents: 21_000_000,
      valeurActuelleEstimeeCents: 24_500_000,
      finances: {
        loyerMensuelCents: 95_000,
        chargesMensuellesCents: 12_000,
        mensualiteCreditCents: 62_000,
        tauxInteret: 1.45,
        dureeRestantePretAnnees: 18,
        apportPersonnelCents: 4_500_000,
      },
    },
    {
      name: "Maison Bordeaux",
      city: "Bordeaux",
      type: "maison",
      usage: "residence_principale",
      surface: 120,
      dateAcquisition: new Date("2019-09-01"),
      prixAcquisitionCents: 38_000_000,
      valeurActuelleEstimeeCents: 42_500_000,
      finances: {
        loyerMensuelCents: 0,
        chargesMensuellesCents: 18_000,
        mensualiteCreditCents: 128_000,
        tauxInteret: 1.9,
        dureeRestantePretAnnees: 14,
        apportPersonnelCents: 8_000_000,
      },
    },
    {
      name: "Commerces Paris",
      city: "Paris",
      type: "commerce",
      usage: "location_nue",
      surface: 85,
      dateAcquisition: new Date("2020-06-20"),
      prixAcquisitionCents: 55_000_000,
      valeurActuelleEstimeeCents: 62_000_000,
      finances: {
        loyerMensuelCents: 240_000,
        chargesMensuellesCents: 32_000,
        mensualiteCreditCents: 180_000,
        tauxInteret: 2.1,
        dureeRestantePretAnnees: 16,
        apportPersonnelCents: 12_000_000,
      },
    },
    {
      name: "Bureau Nantes",
      city: "Nantes",
      type: "bureau",
      usage: "location_nue",
      surface: 52,
      dateAcquisition: new Date("2023-02-15"),
      prixAcquisitionCents: 18_500_000,
      valeurActuelleEstimeeCents: 19_800_000,
      finances: {
        loyerMensuelCents: 120_000,
        chargesMensuellesCents: 15_000,
        mensualiteCreditCents: 78_000,
        tauxInteret: 3.25,
        dureeRestantePretAnnees: 22,
        apportPersonnelCents: 3_800_000,
      },
    },
  ];

  const properties: Property[] = propertiesSeed.map((seed) => {
    const id = ulid();
    const p: Property = {
      ...seed,
      id,
      userId,
      createdAt: seed.dateAcquisition,
      updatedAt: now,
    };
    store.properties.set(id, p);
    return p;
  });

  const lyon = properties[0]!;
  const bordeaux = properties[1]!;
  const paris = properties[2]!;
  const nantes = properties[3]!;

  const contractsSeed: Array<SeedContract & { propertyId: string }> = [
    {
      propertyId: lyon.id,
      type: "PNO",
      assureur: "Keyni Assurance",
      numeroPolice: "KY-PNO-2024-01182",
      status: "actif",
      primeAnnuelleCents: 14_800,
      dateDebut: new Date("2024-05-01"),
      dateEcheance: new Date("2027-04-30"),
      garanties: [
        "Dommages aux biens",
        "Dégâts des eaux",
        "Incendie",
        "Responsabilité civile",
      ],
    },
    {
      propertyId: bordeaux.id,
      type: "MRH",
      assureur: "Keyni Assurance",
      numeroPolice: "KY-MRH-2023-08420",
      status: "actif",
      primeAnnuelleCents: 28_500,
      dateDebut: new Date("2023-09-01"),
      dateEcheance: new Date("2026-08-31"),
      garanties: [
        "Multirisque habitation",
        "Responsabilité civile vie privée",
        "Protection juridique",
      ],
    },
    {
      propertyId: paris.id,
      type: "RC_PRO",
      assureur: "Keyni Assurance",
      numeroPolice: "KY-RC-2024-00912",
      status: "a_renouveler",
      primeAnnuelleCents: 42_000,
      dateDebut: new Date("2024-01-01"),
      dateEcheance: new Date("2025-12-31"),
      garanties: ["Responsabilité civile exploitation", "Protection juridique"],
    },
  ];

  const contracts: Contract[] = contractsSeed.map((seed) => {
    const id = ulid();
    const c: Contract = {
      ...seed,
      id,
      userId,
      createdAt: seed.dateDebut,
      updatedAt: now,
    };
    store.contracts.set(id, c);
    return c;
  });

  const documentsSeed: Array<SeedDocument & { propertyId?: string; contractId?: string }> = [
    {
      propertyId: lyon.id,
      contractId: contracts[0]!.id,
      type: "attestation",
      filename: "attestation-pno-lyon-2024.pdf",
      mime: "application/pdf",
      sizeBytes: 182_340,
      storageKey: `seed/${ulid()}.pdf`,
      conformity: "conform",
    },
    {
      propertyId: lyon.id,
      type: "bail",
      filename: "bail-meuble-lyon-2024.pdf",
      mime: "application/pdf",
      sizeBytes: 412_120,
      storageKey: `seed/${ulid()}.pdf`,
      conformity: "conform",
    },
    {
      propertyId: lyon.id,
      type: "etat_des_lieux",
      filename: "etat-des-lieux-entree-lyon.pdf",
      mime: "application/pdf",
      sizeBytes: 344_500,
      storageKey: `seed/${ulid()}.pdf`,
      conformity: "needs_review",
    },
    {
      propertyId: bordeaux.id,
      contractId: contracts[1]!.id,
      type: "attestation",
      filename: "attestation-mrh-bordeaux-2024.pdf",
      mime: "application/pdf",
      sizeBytes: 196_410,
      storageKey: `seed/${ulid()}.pdf`,
      conformity: "conform",
    },
    {
      propertyId: paris.id,
      type: "facture",
      filename: "facture-syndic-paris-t3-2025.pdf",
      mime: "application/pdf",
      sizeBytes: 128_000,
      storageKey: `seed/${ulid()}.pdf`,
      conformity: "conform",
    },
    {
      propertyId: paris.id,
      type: "echeancier",
      filename: "echeancier-credit-paris.pdf",
      mime: "application/pdf",
      sizeBytes: 224_300,
      storageKey: `seed/${ulid()}.pdf`,
      conformity: "conform",
    },
    {
      propertyId: nantes.id,
      type: "facture",
      filename: "facture-travaux-nantes.pdf",
      mime: "application/pdf",
      sizeBytes: 310_220,
      storageKey: `seed/${ulid()}.pdf`,
      conformity: "pending",
    },
  ];

  for (const seed of documentsSeed) {
    const doc: Document = {
      id: ulid(),
      userId,
      propertyId: seed.propertyId,
      contractId: seed.contractId,
      type: seed.type,
      filename: seed.filename,
      mime: seed.mime,
      sizeBytes: seed.sizeBytes,
      storageKey: seed.storageKey,
      conformity: seed.conformity,
      uploadedAt: new Date(
        now.getTime() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000,
      ),
    };
    store.documents.set(doc.id, doc);
  }

  // 6 snapshots score pour alimenter les mini-charts
  const snapshots: ScoreSnapshot[] = [];
  const baseScore = [34, 38, 42, 48, 52, 58];
  for (let i = 5; i >= 0; i -= 1) {
    const capturedAt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const snap: ScoreSnapshot = {
      id: ulid(),
      userId,
      capturedAt,
      globalScore: baseScore[5 - i] ?? 50,
      cashFlowCents: 55_000 - i * 1500,
      patrimoineCents: 620_000_00 - i * 280_000,
      rentabiliteNette: 3.12 - i * 0.08,
      plusValueCents: 8_730_000 - i * 120_000,
    };
    snapshots.push(snap);
    store.scoreSnapshots.set(snap.id, snap);
  }

  const sinistre: Sinistre = {
    id: ulid(),
    userId,
    propertyId: lyon.id,
    contractId: contracts[0]!.id,
    type: "degat_des_eaux",
    status: "cloture",
    dateSurvenue: new Date(now.getFullYear(), now.getMonth() - 4, 14),
    dateDeclaration: new Date(now.getFullYear(), now.getMonth() - 4, 16),
    description:
      "Fuite sous évier cuisine, dégâts sol et plinthes. Expertise et remise en état par l'assureur.",
    documentIds: [],
    timeline: [
      {
        at: new Date(now.getFullYear(), now.getMonth() - 4, 16),
        label: "Sinistre déclaré en ligne",
      },
      {
        at: new Date(now.getFullYear(), now.getMonth() - 4, 22),
        label: "Passage expert mandaté",
      },
      {
        at: new Date(now.getFullYear(), now.getMonth() - 3, 5),
        label: "Indemnisation versée",
      },
      {
        at: new Date(now.getFullYear(), now.getMonth() - 2, 18),
        label: "Dossier clôturé",
      },
    ],
    referenceInterne: "KS-2026-00418",
  };
  store.sinistres.set(sinistre.id, sinistre);

  const reward: Reward = {
    id: ulid(),
    userId,
    amountCents: 2000,
    source: "parrainage",
    status: "en_attente",
    label: "Parrainage validé — JD.",
    createdAt: new Date(now.getFullYear(), now.getMonth() - 1, 12),
  };
  store.rewards.set(reward.id, reward);

  const referralsSeed: Array<Omit<Referral, "id" | "userId">> = [
    {
      maskedName: "JD.",
      status: "valide",
      invitedAt: new Date(now.getFullYear(), now.getMonth() - 2, 8),
      completedAt: new Date(now.getFullYear(), now.getMonth() - 1, 12),
      rewardCents: 2000,
    },
    {
      maskedName: "SL.",
      status: "en_cours",
      invitedAt: new Date(now.getFullYear(), now.getMonth() - 1, 18),
      rewardCents: 0,
    },
    {
      maskedName: "AM.",
      status: "invite",
      invitedAt: new Date(now.getFullYear(), now.getMonth(), 5),
      rewardCents: 0,
    },
    {
      maskedName: "TR.",
      status: "expire",
      invitedAt: new Date(now.getFullYear(), now.getMonth() - 4, 3),
      rewardCents: 0,
    },
  ];

  for (const seed of referralsSeed) {
    const ref: Referral = { ...seed, id: ulid(), userId };
    store.referrals.set(ref.id, ref);
  }
}

export async function resetAndSeed(store: InMemoryStore): Promise<void> {
  store.reset();
  await loadSeed(store);
}
