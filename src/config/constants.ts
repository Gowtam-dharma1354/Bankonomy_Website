/** ASSUMPTION: violation badge turns red at this count (no auto-DQ). */
export const VIOLATION_THRESHOLD = 3;

/** Round 3 total duration (must match server migration). */
export const ROUND3_DURATION_MINUTES = 30;

export const BATCH_OPTIONS = ["PGDM1", "PGDM2", "PGPISM", "LLM", "PGCSM"] as const;
