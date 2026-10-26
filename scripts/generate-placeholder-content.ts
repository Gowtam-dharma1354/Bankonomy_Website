/**
 * One-off helper to create placeholder content files. Safe to re-run.
 */
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const OPTIONS = ["A", "B", "C", "D"].map((id) => ({
  id,
  text: `[PLACEHOLDER] Option ${id} — replace with real text`,
}));

function writeRound1() {
  const dir = join(root, "content", "Round_1");
  mkdirSync(dir, { recursive: true });
  for (let n = 1; n <= 17; n++) {
    const nn = String(n).padStart(2, "0");
    const path = join(dir, `q${nn}.ts`);
    if (existsSync(path)) continue;
    const body = `import type { Round1Question } from "../types";

const q: Round1Question = {
  id: "r1-q${nn}",
  question: "[PLACEHOLDER] Round 1 Question ${n} — paste real question text here",
  options: ${JSON.stringify(OPTIONS, null, 2)},
  correctOption: "A",
};

export default q;
`;
    writeFileSync(path, body);
  }
}

function writeCase(round: 2 | 3, caseNum: number, count: number) {
  const dir = join(root, "content", `Round_${round}`);
  mkdirSync(dir, { recursive: true });
  for (let c = 1; c <= count; c++) {
    const path = join(dir, `case${c}.ts`);
    if (existsSync(path)) continue;
    const questions = [1, 2, 3, 4].map((q) => ({
      id: `r${round}-c${c}-q${q}`,
      question: `[PLACEHOLDER] Round ${round} Case ${c} Question ${q}`,
      options: OPTIONS,
      correctOption: "A",
    }));
    const summaryLine =
      round === 3
        ? `\n  summary: "[PLACEHOLDER] Short summary for leverage screen — Case ${c}",`
        : `\n  summary: "[PLACEHOLDER] Optional summary — Case ${c}",`;
    const body = `import type { Round${round}Case } from "../types";

const caseStudy: Round${round}Case = {
  id: "r${round}-case${c}",
  title: "[PLACEHOLDER] Case ${c} Title",
  caseText: "[PLACEHOLDER] Long case study text for Round ${round} Case ${c}. Paste the full narrative here.",${summaryLine}
  questions: ${JSON.stringify(questions, null, 2)},
};

export default caseStudy;
`;
    writeFileSync(path, body);
  }
}

writeRound1();
writeCase(2, 1, 4);
writeCase(3, 1, 2);
console.log("Placeholder content files ensured.");
