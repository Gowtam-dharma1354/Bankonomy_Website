import { readdirSync, mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { Round1Question, Round2Case, Round3Case, McqOption } from "../content/types.js";

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), "..", ".env") });

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "src", "generated");

type PublicOption = McqOption;
type PublicR1 = { id: string; question: string; options: PublicOption[]; image?: string };
type PublicCaseQ = { id: string; question: string; options: PublicOption[] };
type PublicR2Case = {
  id: string;
  title: string;
  caseText: string;
  summary?: string;
  questions: PublicCaseQ[];
};

async function loadDefault(path: string) {
  const mod = await import(pathToFileURL(path).href);
  return mod.default;
}

function stripCorrect<T extends { correctOption: string }>(q: T): Omit<T, "correctOption"> {
  const { correctOption: _, ...rest } = q;
  return rest;
}

async function buildRound1(): Promise<{ public: PublicR1[]; keys: { question_id: string; correct_option: string }[] }> {
  const dir = join(root, "content", "Round_1");
  const files = readdirSync(dir)
    .filter((f) => /^q\d{2}\.ts$/.test(f))
    .sort();
  const publicQs: PublicR1[] = [];
  const keys: { question_id: string; correct_option: string }[] = [];
  for (const f of files) {
    const q = (await loadDefault(join(dir, f))) as Round1Question;
    publicQs.push(stripCorrect(q) as PublicR1);
    keys.push({ question_id: q.id, correct_option: q.correctOption });
  }
  return { public: publicQs, keys };
}

async function buildCases(round: 2 | 3): Promise<{
  public: PublicR2Case[];
  keys: { question_id: string; correct_option: string }[];
}> {
  const dir = join(root, "content", `Round_${round}`);
  const files = readdirSync(dir)
    .filter((f) => /^case\d+\.ts$/.test(f))
    .sort();
  const publicCases: PublicR2Case[] = [];
  const keys: { question_id: string; correct_option: string }[] = [];
  for (const f of files) {
    const c = (await loadDefault(join(dir, f))) as Round2Case | Round3Case;
    publicCases.push({
      id: c.id,
      title: c.title,
      caseText: c.caseText,
      summary: c.summary,
      questions: c.questions.map((q) => stripCorrect(q) as PublicCaseQ),
    });
    for (const q of c.questions) {
      keys.push({ question_id: q.id, correct_option: q.correctOption });
    }
  }
  return { public: publicCases, keys };
}

async function upsertAnswerKey(rows: { question_id: string; correct_option: string }[]) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.warn(
      "build:content — SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set; skipping answer_key upsert (JSON still written).",
    );
    return;
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await supabase.from("answer_key").upsert(rows, { onConflict: "question_id" });
  if (error) throw new Error(`answer_key upsert failed: ${error.message}`);
  console.log(`Upserted ${rows.length} rows into answer_key.`);
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  const r1 = await buildRound1();
  const r2 = await buildCases(2);
  const r3 = await buildCases(3);

  writeFileSync(join(outDir, "round1.json"), JSON.stringify(r1.public, null, 2));
  writeFileSync(join(outDir, "round2.json"), JSON.stringify(r2.public, null, 2));
  writeFileSync(join(outDir, "round3.json"), JSON.stringify(r3.public, null, 2));

  const allKeys = [...r1.keys, ...r2.keys, ...r3.keys];
  await upsertAnswerKey(allKeys);
  console.log("build:content OK — wrote src/generated/*.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
