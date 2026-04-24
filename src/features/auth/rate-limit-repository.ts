export interface RateLimitStore {
  /**
   * Incrémente le compteur pour la clé donnée et retourne l'état courant.
   * Implémentation : fenêtre glissante.
   */
  hit(key: string, windowMs: number): Promise<{ count: number; oldestAt: Date }>;
  reset(key: string): Promise<void>;
}
