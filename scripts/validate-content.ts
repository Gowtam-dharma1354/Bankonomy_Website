import { readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import type { Round1Question, Round2Case, Round3Case } from "../content/types.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const OPTION_IDS = new Set(["A", "B", "C", "D"]);

function fail(msg: string): never {
  console.error(`validate:content FAILED — ${msg}`);
  process.exit(1);
}

function validateOptions(questionId: string, options: { id: string; text: string }[], correctOption: string) {
  if (options.length !== 4) fail(`${questionId}: expected 4 options, got ${options.length}`);
  for (const o of options) {
    if (!OPTION_IDS.has(o.id)) fail(`${questionId}: invalid option id "${o.id}"`);
  }
  const ids = new Set(options.map((o) => o.id));
  if (ids.size !== 4) fail(`${questionId}: option ids must be unique`);
  if (!ids.has(correctOption)) fail(`${questionId}: correctOption "${correctOption}" not in options`);
}

async function loadDefault(path: string) {
  const mod = await import(pathToFileURL(path).href);
  return mod.default;
}

async function validateRound1() {
  const dir = join(root, "content", "Round_1");
  const files = readdirSync(dir)
    .filter((f) => /^q\d{2}\.ts$/.test(f))
    .sort();
  if (files.length !== 17) fail(`Round_1: expected 17 files, found ${files.length}`);
  const ids = new Set<string>();
  for (const f of files) {
    const q = (await loadDefault(join(dir, f))) as Round1Question;
    if (!q.id) fail(`${f}: missing id`);
    if (ids.has(q.id)) fail(`duplicate id ${q.id}`);
    ids.add(q.id);
    validateOptions(q.id, q.options, q.correctOption);
  }
  return ids.size;
}

async function validateCases(round: 2 | 3, expectedFiles: number) {
  const dir = join(root, "content", `Round_${round}`);
  const files = readdirSync(dir)
    .filter((f) => /^case\d+\.ts$/.test(f))
    .sort();
  if (files.length !== expectedFiles) {
    fail(`Round_${round}: expected ${expectedFiles} case files, found ${files.length}`);
  }
  const caseIds = new Set<string>();
  const questionIds = new Set<string>();
  for (const f of files) {
    const c = (await loadDefault(join(dir, f))) as Round2Case | Round3Case;
    if (!c.id) fail(`${f}: missing case id`);
    if (caseIds.has(c.id)) fail(`duplicate case id ${c.id}`);
    caseIds.add(c.id);
    if (round === 3 && !c.summary) fail(`${c.id}: Round 3 cases require summary`);
    if (c.questions.length !== 4) fail(`${c.id}: expected 4 questions`);
    for (const q of c.questions) {
      if (questionIds.has(q.id)) fail(`duplicate question id ${q.id}`);
      questionIds.add(q.id);
      validateOptions(q.id, q.options, q.correctOption);
    }
  }
}

async function main() {
  await validateRound1();
  await validateCases(2, 4);
  await validateCases(3, 2);
  console.log("validate:content OK — all content files valid.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
