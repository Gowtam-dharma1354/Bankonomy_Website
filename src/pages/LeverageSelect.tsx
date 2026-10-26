import { useState } from "react";
import type { PublicCase } from "../types/api";
import { getSessionToken } from "../lib/session";
import { rpcChooseLeverage } from "../lib/rpc";

type Props = {
  caseStudy: PublicCase;
  onChosen: () => void;
};

export function LeverageSelect({ caseStudy, onChosen }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function choose(option: 1 | 2) {
    const token = getSessionToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await rpcChooseLeverage(token, caseStudy.id, option);
      onChosen();
    } catch {
      setError("Could not save leverage choice.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card leverage-card no-select">
      <h2>Leverage — {caseStudy.title}</h2>
      <p className="leverage-summary">{caseStudy.summary ?? "Read the summary and choose your risk profile."}</p>
      <div className="leverage-options">
        <button type="button" className="btn btn-outline" disabled={loading} onClick={() => void choose(1)}>
          <strong>Option 1 — Safe</strong>
          <span>+10 per correct, no negatives</span>
          <span className="mono">Score range: 0 to 40</span>
        </button>
        <button type="button" className="btn btn-primary" disabled={loading} onClick={() => void choose(2)}>
          <strong>Option 2 — High leverage</strong>
          <span>+20 correct / −20 wrong</span>
          <span className="mono">Score range: −80 to +80</span>
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      <p className="hint">Choice locks when the first question opens.</p>
    </div>
  );
}
