import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { enterFullscreen } from "../components/FullscreenGuard";
import { rpcLoginWithCode, rpcServerNow } from "../lib/rpc";
import { setSessionToken } from "../lib/session";
import { setServerClockOffset } from "../lib/serverClock";

export function Login() {
  const nav = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const fullscreenRequest = enterFullscreen();
      const ok = await fullscreenRequest;
      if (!ok) {
        setError("Fullscreen could not start. Allow fullscreen in your browser and submit again.");
        setLoading(false);
        return;
      }
      const serverNow = await rpcServerNow();
      setServerClockOffset(serverNow);
      let res;
      try {
        res = await rpcLoginWithCode(code.trim());
      } catch (loginError) {
        if (document.fullscreenElement) await document.exitFullscreen();
        const message = loginError instanceof Error ? loginError.message : "";
        setError(message.includes("invalid_code")
          ? "That team code was not recognized. Check the code and try again."
          : `Could not sign in: ${message || "Supabase rejected the request."}`);
        return;
      }
      setSessionToken(res.session_token);
      nav("/lobby");
    } catch (requestError) {
      if (document.fullscreenElement) await document.exitFullscreen();
      const message = requestError instanceof Error ? requestError.message : "";
      setError(`Could not connect to the event service: ${message || "Check your connection and Supabase settings."}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="event-login page-center">
      <div className="event-login-brand">
        <p className="welcome-kicker">NISM · Banking and Economy Club</p>
        <h1>Bankonomy</h1>
        <p>Enter your team code to join the event.</p>
      </div>
      <form className="card login-card" onSubmit={onSubmit}>
        <label>
          Team code
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter team code"
            autoComplete="off"
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Entering…" : "Enter event"}
        </button>
        <p className="hint">
          <a href="/admin">Admin login</a>
        </p>
      </form>
    </div>
  );
}
