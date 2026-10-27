import { useCallback, useEffect, useState } from "react";
import { clearSessionToken, getSessionToken } from "../lib/session";
import { rpcGetRoundState } from "../lib/rpc";
import { setServerClockOffset } from "../lib/serverClock";
import type { RoundStatePayload } from "../types/api";

export function useRoundState(pollMs = 2000) {
  const [state, setState] = useState<RoundStatePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = getSessionToken();
    if (!token) {
      setError("no_session");
      setLoading(false);
      return null;
    }
    try {
      const data = await rpcGetRoundState(token);
      setServerClockOffset(data.server_now);
      setState(data);
      setError(null);
      return data;
    } catch (e) {
      const message = e instanceof Error ? e.message : "fetch_failed";
      const isStaleOrInvalidSession = /invalid|expired|session|token|permission|not found|unauthorized|PGRST116|404/i.test(message);

      if (isStaleOrInvalidSession) {
        clearSessionToken();
        setState(null);
        setError("session_expired");
      } else {
        setError(message);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), pollMs);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("focus", refreshWhenVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("focus", refreshWhenVisible);
    };
  }, [refresh, pollMs]);

  return { state, error, loading, refresh };
}
