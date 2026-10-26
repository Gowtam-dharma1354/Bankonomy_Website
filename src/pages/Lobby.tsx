import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FullscreenGuard } from "../components/FullscreenGuard";
import { useRoundState } from "../hooks/useRoundState";
import { clearSessionToken, getSessionToken } from "../lib/session";

function activeRound(state: ReturnType<typeof useRoundState>["state"]) {
  if (!state) return null;

  const roundKeys = ["round_1", "round_2", "round_3"] as const;

  const inProgress = roundKeys.find((key) => state[key].status === "in_progress");
  if (inProgress) return Number(inProgress.replace("round_", ""));

  const activeWaiting = roundKeys.find((key) => state[key].global_status === "active" && state[key].status === "waiting");
  if (activeWaiting) return Number(activeWaiting.replace("round_", ""));

  return null;
}

export function Lobby() {
  const nav = useNavigate();
  const { state, loading, error } = useRoundState();

  useEffect(() => {
    if (!getSessionToken()) {
      clearSessionToken();
      nav("/login", { replace: true });
      return;
    }
  }, [nav]);

  useEffect(() => {
    if (!state && !loading && error) {
      clearSessionToken();
      nav("/login", { replace: true });
      return;
    }

    if (!state) return;
    if (state.disqualified) {
      clearSessionToken();
      nav("/login", { replace: true });
      return;
    }
    const r = activeRound(state);
    if (!r) return;

    const slice = state[`round_${r}` as keyof typeof state] as (typeof state)["round_1"];
    if (slice.status === "in_progress") {
      if (r === 1) nav("/round/1", { replace: true });
      if (r === 2) nav("/round/2", { replace: true });
      if (r === 3) nav("/round/3", { replace: true });
    } else if (slice.global_status === "active" && slice.status === "waiting") {
      nav(`/round/${r}/start`, { replace: true });
    }
  }, [state, loading, error, nav]);

  return (
    <FullscreenGuard round={null}>
      <div className="page-center">
        <div className="card lobby-card">
          <h1>Lobby</h1>
          {state && <p className="team-name">{state.team_name}</p>}
          <p>Wait for the admin to open your round. You will re-enter your team code when the round begins.</p>
          {loading && <p>Syncing…</p>}
        </div>
      </div>
    </FullscreenGuard>
  );
}
