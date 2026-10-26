import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FullscreenGuard } from "../components/FullscreenGuard";
import { useRoundState } from "../hooks/useRoundState";

function activeRound(state: ReturnType<typeof useRoundState>["state"]) {
  if (!state) return null;
  for (const r of [1, 2, 3] as const) {
    const slice = state[`round_${r}`];
    if (slice.global_status === "active" && slice.status === "waiting") return r;
    if (slice.status === "in_progress") return r;
  }
  for (const r of [1, 2, 3] as const) {
    if (state[`round_${r}`].global_status === "active") return r;
  }
  return null;
}

export function Lobby() {
  const nav = useNavigate();
  const { state, loading } = useRoundState();

  useEffect(() => {
    if (!state) return;
    if (state.disqualified) {
      nav("/login");
      return;
    }
    const r = activeRound(state);
    if (!r) return;
    const slice = state[`round_${r}`];
    if (slice.status === "in_progress") {
      if (r === 1) nav("/round/1");
      if (r === 2) nav("/round/2");
      if (r === 3) nav("/round/3");
    } else if (slice.global_status === "active" && slice.status === "waiting") {
      nav(`/round/${r}/start`);
    }
  }, [state, nav]);

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
