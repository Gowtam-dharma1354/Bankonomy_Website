import type { PublicCase, PublicMcq } from "../types/api";
import round1 from "../generated/round1.json";
import round2 from "../generated/round2.json";
import round3 from "../generated/round3.json";

export const round1Questions = round1 as PublicMcq[];
export const round2Cases = round2 as PublicCase[];
export const round3Cases = round3 as PublicCase[];

const r1Map = new Map(round1Questions.map((q) => [q.id, q]));
const r2Map = new Map(round2Cases.map((c) => [c.id, c]));
const r3Map = new Map(round3Cases.map((c) => [c.id, c]));

export function getRound1Question(id: string) {
  return r1Map.get(id);
}

export function getCase(round: 2 | 3, id: string) {
  return round === 2 ? r2Map.get(id) : r3Map.get(id);
}
