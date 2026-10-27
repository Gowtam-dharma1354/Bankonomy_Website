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

function lobbyMessage(state: NonNullable<ReturnType<typeof useRoundState>["state"]>) {
  const completed = (status: string) => status === "completed" || status === "auto_finalized";

  if (completed(state.round_3.status)) {
    return {
      eyebrow: "Bankonomy · Event complete",
      title: "Round 3 completed",
      message: "Your event participation is complete. Please wait for the results.",
    };
  }
  if (completed(state.round_2.status)) {
    return {
      eyebrow: "Round 2 complete",
      title: "Round 2 completed",
      message: "Your submission is recorded. Please wait for Round 3 to begin.",
    };
  }
  if (completed(state.round_1.status)) {
    return {
      eyebrow: "Round 1 complete",
      title: "Round 1 completed",
      message: "Please wait here. You will continue when Round 2 opens.",
    };
  }
  return {
    eyebrow: "Bankonomy · Team lobby",
    title: "Lobby",
    message: "Wait here for the admin to open your round.",
  };
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

  const message = state ? lobbyMessage(state) : null;

  return (
    <FullscreenGuard round={null}>
      <div className="player-transition-page">
        <div className="player-transition-content">
          <p className="player-transition-eyebrow">{message?.eyebrow ?? "Bankonomy · Connecting"}</p>
          <h1>{message?.title ?? "Syncing your team…"}</h1>
          {state?.team_name && <p className="player-transition-team">{state.team_name}</p>}
          <p className="player-transition-message">
            {message?.message ?? (loading ? "Connecting to the event server." : "Waiting for team status.")}
          </p>
          {loading && <span className="player-transition-indicator" aria-label="Syncing" />}
        </div>
      </div>
    </FullscreenGuard>
  );
}
