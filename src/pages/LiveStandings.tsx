import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function formatLiveDuration(seconds: number | null) {
  if (seconds === null) return "—";
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainingSeconds = total % 60;
  return [hours, minutes, remainingSeconds].map((part) => String(part).padStart(2, "0")).join(":");
}

type Row = {
  rank: number;
  team_name: string;
  batch: string;
  round1_score: number;
  round2_score: number;
  round3_score: number;
  total_score: number;
  total_time_taken: number | null;
  disqualified: boolean;
};

export function LiveStandings() {
  const nav = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [hideScores, setHideScores] = useState(false);

  const refresh = useCallback(async () => {
    const { data } = await supabase.from("overall_standings").select("*").order("rank");
    if (data) setRows(data as Row[]);
  }, []);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (!data.session) nav("/admin/login");
    });
  }, [nav]);

  useEffect(() => {
    void refresh();
    document.documentElement.requestFullscreen?.().catch(() => {});
    const ch = supabase
      .channel("live-standings")
      .on("postgres_changes", { event: "*", schema: "public", table: "answers" }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "team_round_state" }, () => void refresh())
      .subscribe();

    const pollId = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 2000);
    const refreshOnVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", refreshOnVisible);
    window.addEventListener("focus", refreshOnVisible);

    return () => {
      window.clearInterval(pollId);
      document.removeEventListener("visibilitychange", refreshOnVisible);
      window.removeEventListener("focus", refreshOnVisible);
      void supabase.removeChannel(ch);
    };
  }, [refresh]);

  return (
    <div className="live-shell">
      <header className="live-header">
        <div>
          <div className="brand-nism">NISM</div>
          <div className="brand-club">Banking and Economy Club</div>
          <h1 className="brand-event">BANKONOMY — Live</h1>
        </div>
        <label className="hide-toggle">
          <input type="checkbox" checked={hideScores} onChange={(e) => setHideScores(e.target.checked)} />
          Hide scores
        </label>
      </header>
      <table className="live-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Team</th>
            <th>Batch</th>
            {!hideScores && (
              <>
                <th>R1</th>
                <th>R2</th>
                <th>R3</th>
                <th>Total</th>
                <th>Overall Time</th>
              </>
            )}
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.team_name + r.rank}>
              <td>{r.rank}</td>
              <td>{r.team_name}</td>
              <td>{r.batch}</td>
              {!hideScores && (
                <>
                  <td>{r.round1_score}</td>
                  <td>{r.round2_score}</td>
                  <td>{r.round3_score}</td>
                  <td>{r.total_score}</td>
                  <td>{formatLiveDuration(r.total_time_taken)}</td>
                </>
              )}
              <td>{r.disqualified ? "DQ" : "Active"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
