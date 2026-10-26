import { useCallback, useEffect, useState, type ReactNode } from "react";
import { getSessionToken } from "../lib/session";
import { rpcLogEvent } from "../lib/rpc";

type Props = {
  round: number | null;
  children: ReactNode;
  requireOnMount?: boolean;
};

async function enterFullscreen() {
  const el = document.documentElement;
  if (document.fullscreenElement) return true;
  try {
    await el.requestFullscreen();
    return true;
  } catch {
    return false;
  }
}

export function FullscreenGuard({ round, children, requireOnMount = false }: Props) {
  const [blocked, setBlocked] = useState(false);
  const [ready, setReady] = useState(!requireOnMount);

  const check = useCallback(() => {
    const fs = !!document.fullscreenElement;
    setBlocked(!fs);
    if (fs) setReady(true);
  }, []);

  useEffect(() => {
    if (requireOnMount) {
      void enterFullscreen().then(() => check());
    }
    check();
  }, [requireOnMount, check]);

  useEffect(() => {
    const onFs = () => {
      const fs = !!document.fullscreenElement;
      if (!fs) {
        setBlocked(true);
        const token = getSessionToken();
        if (token) void rpcLogEvent(token, round, "fullscreen_exit");
      } else {
        setBlocked(false);
      }
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, [round]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        const token = getSessionToken();
        if (token) void rpcLogEvent(token, round, "tab_hidden");
      }
    };
    const onBlur = () => {
      const token = getSessionToken();
      if (token) void rpcLogEvent(token, round, "window_blur");
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onBlur);
    };
  }, [round]);

  if (requireOnMount && !ready) {
    return (
      <div className="overlay-block">
        <p>Enter fullscreen to continue.</p>
        <button type="button" className="btn btn-primary" onClick={() => void enterFullscreen()}>
          Go fullscreen
        </button>
      </div>
    );
  }

  return (
    <>
      {children}
      {blocked && (
        <div className="overlay-block">
          <p>Return to fullscreen to continue</p>
          <button type="button" className="btn btn-primary" onClick={() => void enterFullscreen()}>
            Return to fullscreen
          </button>
        </div>
      )}
    </>
  );
}

export { enterFullscreen };
