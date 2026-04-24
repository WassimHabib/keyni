import { repositories } from "@/lib/db/repositories";
import type { PropertyId } from "@/features/properties/types";
import type { User } from "@/features/users/types";

import { computeScore } from "./engine";
import type { ScoreResult } from "./types";

export async function getUserScore(user: User): Promise<ScoreResult> {
  const [properties, contracts, documents] = await Promise.all([
    repositories.properties.findAllByUser(user.id),
    repositories.contracts.findAllByUser(user.id),
    repositories.documents.findAllByUser(user.id),
  ]);
  return computeScore({
    profile: user.profile,
    properties,
    contracts,
    documents,
  });
}

export async function getPropertyScore(
  user: User,
  propertyId: PropertyId,
): Promise<number | null> {
  const score = await getUserScore(user);
  return score.perProperty[propertyId]?.value ?? null;
}
