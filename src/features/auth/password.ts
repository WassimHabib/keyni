import { hash as argonHash, verify as argonVerify } from "@node-rs/argon2";

/**
 * Paramètres Argon2id conformes aux recommandations OWASP 2025.
 * memoryCost 64 MB, 3 itérations, parallélisme 1.
 * Algorithm: 2 = Argon2id (valeur d'enum évitée pour isolatedModules).
 */
const OPTIONS = {
  algorithm: 2,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
} as const;

/**
 * Hash constant utilisé pour éviter les attaques par timing lorsqu'un
 * utilisateur inexistant essaie de se connecter. Pré-calculé à l'import.
 */
let fakeHashPromise: Promise<string> | null = null;

export async function hashPassword(plain: string): Promise<string> {
  return argonHash(plain, OPTIONS);
}

export async function verifyPassword(
  hash: string,
  plain: string,
): Promise<boolean> {
  try {
    return await argonVerify(hash, plain, OPTIONS);
  } catch {
    return false;
  }
}

export async function getFakeHash(): Promise<string> {
  if (!fakeHashPromise) {
    fakeHashPromise = hashPassword(
      "__keyni_fake_hash_never_matches_any_input__",
    );
  }
  return fakeHashPromise;
}

/**
 * Force un hash pour contrer le timing : utile côté login quand l'utilisateur
 * n'existe pas, pour que le temps de réponse reste similaire.
 */
export async function verifyAgainstFakeHash(): Promise<boolean> {
  const fake = await getFakeHash();
  return verifyPassword(fake, "this-will-never-match");
}
