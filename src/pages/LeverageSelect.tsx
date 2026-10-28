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
  const [selectedOption, setSelectedOption] = useState<1 | 2 | null>(null);

  async function lockChoice() {
    const token = getSessionToken();
    if (!token || selectedOption === null) return;
    setLoading(true);
    setError(null);
    try {
      await rpcChooseLeverage(token, caseStudy.id, selectedOption);
      onChosen();
    } catch {
      setError("Could not save leverage choice.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="leverage-stage no-select">
      <section className="leverage-card">
        <p className="leverage-kicker">Select marking leverage</p>
        <h2>{caseStudy.title}</h2>
        {caseStudy.summary && <p className="leverage-summary">{caseStudy.summary}</p>}
        <div className="leverage-options">
          <button
            type="button"
            className={`leverage-option leverage-safe ${selectedOption === 1 ? "selected" : ""}`}
            disabled={loading}
            aria-pressed={selectedOption === 1}
            onClick={() => setSelectedOption(1)}
          >
            <span className="leverage-option-number">01</span>
            <strong>Safe</strong>
            <span>+10 per correct answer</span>
            <span>No penalty for incorrect answers</span>
            <span className="leverage-score-range">Score range: 0 to 40</span>
          </button>
          <button
            type="button"
            className={`leverage-option leverage-high ${selectedOption === 2 ? "selected" : ""}`}
            disabled={loading}
            aria-pressed={selectedOption === 2}
            onClick={() => setSelectedOption(2)}
          >
            <span className="leverage-option-number">02</span>
            <strong>High leverage</strong>
            <span>+20 per correct answer</span>
            <span>−20 per incorrect answer</span>
            <span className="leverage-score-range">Score range: −80 to +80</span>
          </button>
        </div>
        {error && <p className="error leverage-error" role="alert">{error}</p>}
        <button
          type="button"
          className="btn btn-primary leverage-lock"
          disabled={loading || selectedOption === null}
          onClick={() => void lockChoice()}
        >
          {loading ? "Locking choice…" : "Lock choice and continue"}
        </button>
        <p className="hint">Your choice cannot be changed after you lock it.</p>
      </section>
    </div>
  );
}
