import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FullscreenGuard, enterFullscreen } from "../components/FullscreenGuard";
import { getSessionToken } from "../lib/session";
import { rpcStartRound } from "../lib/rpc";

export function RoundStart() {
  const { roundId } = useParams();
  const round = Number(roundId);
  const nav = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const token = getSessionToken();
    if (!token) {
      nav("/login");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const ok = await enterFullscreen();
      if (!ok) {
        setError("Fullscreen is required to start the round.");
        return;
      }
      await rpcStartRound(token, round, code.trim());
      nav(`/round/${round}`);
    } catch {
      setError("Could not start round. Check your code and that the round is active.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <FullscreenGuard round={round} requireOnMount>
      <div className="page-center">
        <form className="card login-card" onSubmit={onSubmit}>
          <h1>Start Round {round}</h1>
          <p>Re-enter your team code to begin. Timers are server-side.</p>
          <label>
            Team code
            <input value={code} onChange={(e) => setCode(e.target.value)} required autoComplete="off" />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            Begin Round {round}
          </button>
        </form>
      </div>
    </FullscreenGuard>
  );
}
