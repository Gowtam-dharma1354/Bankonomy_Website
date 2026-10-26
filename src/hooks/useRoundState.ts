import { useCallback, useEffect, useState } from "react";
import { getSessionToken } from "../lib/session";
import { rpcGetRoundState } from "../lib/rpc";
import { setServerClockOffset } from "../lib/serverClock";
import type { RoundStatePayload } from "../types/api";

export function useRoundState(pollMs = 8000) {
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
      setError(e instanceof Error ? e.message : "fetch_failed");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), pollMs);
    return () => clearInterval(id);
  }, [refresh, pollMs]);

  return { state, error, loading, refresh };
}
