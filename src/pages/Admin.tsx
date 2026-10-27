import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ExpandableHeader } from "../components/ExpandableHeader";
import { BATCH_OPTIONS } from "../config/constants";
import {
  rpcAdminDisqualify,
  rpcAdminForceSubmit,
  rpcAdminGrantExtraTime,
  rpcAdminRegisterTeam,
  rpcAdminResetSession,
  rpcAdminSetRoundStatus,
} from "../lib/rpc";
import { supabase } from "../lib/supabase";

type OverallRow = {
  team_id: string;
  team_name: string;
  batch: string;
  disqualified: boolean;
  round1_score: number;
  round2_score: number;
  round3_score: number;
  total_score: number;
  total_time_taken: number | null;
  tab_switches: number;
  rank: number;
};

type R1Row = {
  team_id: string;
  team_name: string;
  batch: string;
  disqualified: boolean;
  score: number;
  bonus_score: number;
  total_score: number;
  questions_solved: number;
  time_taken: number | null;
  status: string | null;
  current_question_index: number;
  question_order: string[] | null;
  fullscreen_exits: number;
  tab_switches: number;
  rank: number;
};

type R2Row = {
  team_id: string;
  team_name: string;
  batch: string;
  disqualified: boolean;
  total_score: number;
  cases_solved: number;
  time_taken: number | null;
  tab_switches: number;
  status: string | null;
  current_case_index: number;
  case_order: string[] | null;
  rank: number;
};

type R3Row = {
  team_id: string;
  team_name: string;
  batch: string;
  disqualified: boolean;
  case1_leverage: number | null;
  case2_leverage: number | null;
  case1_score: number;
  case2_score: number;
  total_score: number;
  time_taken: number | null;
  tab_switches: number;
  status: string | null;
  current_case_index: number;
  case_order: string[] | null;
  rank: number;
};

type EventRow = {
  id: string;
  team_id: string | null;
  round: number | null;
  event_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

function statusLabel(row: { disqualified: boolean; status?: string | null }) {
  if (row.disqualified) return "Disqualified";
  if (row.status === "in_progress") return "Active";
  if (row.status === "completed" || row.status === "auto_finalized") return "Completed";
  return "Waiting";
}

function overallStatusLabel(row: OverallRow, roundRows: { team_id: string; status: string | null }[][]) {
  if (row.disqualified) return "Disqualified";
  const teamRounds = roundRows.map((rows) => rows.find((round) => round.team_id === row.team_id));
  if (teamRounds.some((round) => round?.status === "in_progress")) return "Active";
  if (teamRounds.every((round) => round?.status === "completed" || round?.status === "auto_finalized")) {
    return "Completed";
  }
  return "Waiting";
}

function formatDuration(seconds: number | null) {
  if (seconds === null) return "—";
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainingSeconds = total % 60;
  return [hours, minutes, remainingSeconds].map((part) => String(part).padStart(2, "0")).join(":");
}

function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const lines = [keys.join(",")];
  for (const r of rows) {
    lines.push(keys.map((k) => JSON.stringify(r[k] ?? "")).join(","));
  }
  return lines.join("\n");
}

function download(name: string, text: string) {
  const blob = new Blob([text], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function Admin() {
  const nav = useNavigate();
  const [tab, setTab] = useState<"standings" | "audit">("standings");
  const [overall, setOverall] = useState<OverallRow[]>([]);
  const [r1, setR1] = useState<R1Row[]>([]);
  const [r2, setR2] = useState<R2Row[]>([]);
  const [r3, setR3] = useState<R3Row[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [roundStatuses, setRoundStatuses] = useState<Record<number, string>>({});
  const [roundActionError, setRoundActionError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyRound, setBusyRound] = useState<number | null>(null);
  const [expanded, setExpanded] = useState({ r1: false, r2: false, r3: false });
  const [search, setSearch] = useState("");
  const [batch, setBatch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roundFilter, setRoundFilter] = useState("");

  const [regName, setRegName] = useState("");
  const [regBatch, setRegBatch] = useState<string>(BATCH_OPTIONS[0]);
  const [members, setMembers] = useState([{ name: "", email: "" }]);
  const [registeredCode, setRegisteredCode] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const results = await Promise.allSettled([
      supabase.from("overall_standings").select("*").order("rank"),
      supabase.from("round1_standings").select("*").order("rank"),
      supabase.from("round2_standings").select("*").order("rank"),
      supabase.from("round3_standings").select("*").order("rank"),
      supabase.from("events").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("rounds_config").select("round, status").order("round"),
    ]);

    const firstError = results.find((r) => r.status === "rejected");
    if (firstError) {
      setLoadError(firstError.reason instanceof Error ? firstError.reason.message : "Failed to load admin data.");
    } else {
      setLoadError(null);
    }

    const [o, a, b, c, ev, rounds] = results.map((r) => (r.status === "fulfilled" ? r.value : null));
    if (o?.data) setOverall(o.data as OverallRow[]);
    if (a?.data) setR1(a.data as R1Row[]);
    if (b?.data) setR2(b.data as R2Row[]);
    if (c?.data) setR3(c.data as R3Row[]);
    if (ev?.data) setEvents(ev.data as EventRow[]);
    if (rounds?.data) {
      setRoundStatuses(Object.fromEntries(rounds.data.map(({ round, status }) => [round, status])));
    }
  }, []);

  useEffect(() => {
    void supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        nav("/admin/login");
        return;
      }

      const { data: adminRow } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", data.session.user.id)
        .maybeSingle();

      if (!adminRow) {
        await supabase.auth.signOut();
        nav("/admin/login");
      }
    });
  }, [nav]);

  useEffect(() => {
    void refresh();
    const ch = supabase
      .channel("admin-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "answers" }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "team_round_state" }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "leverage_choices" }, () => void refresh())
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

  const stats = useMemo(() => {
    const total = overall.length;
    const disqualified = overall.filter((t) => t.disqualified).length;
    const active = r1.filter((t) => t.status === "in_progress").length
      + r2.filter((t) => t.status === "in_progress").length
      + r3.filter((t) => t.status === "in_progress").length;
    const completed = overall.filter(
      (t) =>
        !t.disqualified &&
        r1.find((x) => x.team_id === t.team_id)?.status === "completed" &&
        r2.find((x) => x.team_id === t.team_id)?.status === "completed" &&
        r3.find((x) => x.team_id === t.team_id)?.status === "completed",
    ).length;
    return { total, active, completed, disqualified };
  }, [overall, r1, r2, r3]);

  const filteredOverall = useMemo(() => {
    return overall.filter((row) => {
      if (search && !row.team_name.toLowerCase().includes(search.toLowerCase())) return false;
      if (batch && row.batch !== batch) return false;
      if (statusFilter === "disqualified" && !row.disqualified) return false;
      if (statusFilter === "active") {
        const active = [r1, r2, r3].some((list) =>
          list.find((x) => x.team_id === row.team_id && x.status === "in_progress"),
        );
        if (!active) return false;
      }
      if (roundFilter) {
        const rn = Number(roundFilter);
        const slice = rn === 1 ? r1 : rn === 2 ? r2 : r3;
        const st = slice.find((x) => x.team_id === row.team_id)?.status;
        if (st !== "in_progress" && st !== "completed" && st !== "auto_finalized") return false;
      }
      return true;
    });
  }, [overall, search, batch, statusFilter, roundFilter, r1, r2, r3]);

  async function signOut() {
    await supabase.auth.signOut();
    nav("/admin/login");
  }

  async function onRegister(e: FormEvent) {
    e.preventDefault();
    const validMembers = members.filter((m) => m.name && m.email);
    const res = await rpcAdminRegisterTeam(regName, regBatch, validMembers);
    setRegisteredCode(res.code);
    setRegName("");
    setMembers([{ name: "", email: "" }]);
    await refresh();
  }

  async function changeRoundStatus(round: number, status: "lobby" | "active" | "paused" | "ended") {
    setBusyRound(round);
    setRoundActionError(null);
    try {
      await rpcAdminSetRoundStatus(round, status);
      await refresh();
    } catch (error) {
      setRoundActionError(error instanceof Error ? error.message : "Could not update round status.");
    } finally {
      setBusyRound(null);
    }
  }

  function currentQuestion(teamId: string) {
    const row = r1.find((t) => t.team_id === teamId);
    if (!row?.question_order) return "—";
    const idx = row.current_question_index;
    if (row.status !== "in_progress") return String(row.questions_solved);
    return `${Math.min(idx + 1, row.question_order.length)} / ${row.question_order.length}`;
  }

  function currentCase(teamId: string, round: 2 | 3) {
    if (round === 2) {
      const row = r2.find((t) => t.team_id === teamId);
      if (!row?.case_order) return "—";
      if (row.status !== "in_progress") return String(row.cases_solved ?? row.current_case_index);
      return `${row.current_case_index + 1} / ${row.case_order.length}`;
    }
    const row = r3.find((t) => t.team_id === teamId);
    if (!row?.case_order) return "—";
    if (row.status !== "in_progress") return String(row.current_case_index);
    return `${row.current_case_index + 1} / ${row.case_order.length}`;
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <div className="brand-nism">NISM</div>
          <div className="brand-club">Banking and Economy Club</div>
          <h1 className="brand-event">BANKONOMY</h1>
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => void signOut()}>
          SIGN OUT
        </button>
      </header>

      <div className="stats-row">
        {[
          ["Total Teams", stats.total],
          ["Active", stats.active],
          ["Completed", stats.completed],
          ["Disqualified", stats.disqualified],
        ].map(([label, val]) => (
          <div key={label as string} className="stat-card">
            <span className="mono">{label}</span>
            <strong>{val}</strong>
          </div>
        ))}
      </div>

      <div className="toolbar card">
        <input placeholder="Search team" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={batch} onChange={(e) => setBatch(e.target.value)}>
          <option value="">Batch</option>
          {BATCH_OPTIONS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Status</option>
          <option value="active">Active</option>
          <option value="disqualified">Disqualified</option>
        </select>
        <select value={roundFilter} onChange={(e) => setRoundFilter(e.target.value)}>
          <option value="">Current Round</option>
          <option value="1">Round 1</option>
          <option value="2">Round 2</option>
          <option value="3">Round 3</option>
        </select>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            setSearch("");
            setBatch("");
            setStatusFilter("");
            setRoundFilter("");
          }}
        >
          Clear Filters
        </button>
        <Link className="btn btn-primary" to="/live-standings" target="_blank">
          Open Fullscreen
        </Link>
        <button type="button" className="btn btn-ghost" onClick={() => download("standings.csv", toCsv(filteredOverall))}>
          Export CSV
        </button>
      </div>

      <div className="tabs">
        <button type="button" className={tab === "standings" ? "tab active" : "tab"} onClick={() => setTab("standings")}>
          Standings
        </button>
        <button type="button" className={tab === "audit" ? "tab active" : "tab"} onClick={() => setTab("audit")}>
          Audit log
        </button>
      </div>

      {loadError && <div className="card error" style={{ margin: "16px 0" }}>{loadError}</div>}

      {tab === "standings" && (
        <>
          <div className="round-controls card">
            {[1, 2, 3].map((round) => (
              <div key={round} className="round-control-group">
                <span className="round-control-heading">
                  <span className="mono">Round {round}</span>
                  <span className={`round-status status-${roundStatuses[round] ?? "unknown"}`}>
                    {roundStatuses[round] ?? "Loading status"}
                  </span>
                </span>
                {(["lobby", "active", "paused", "ended"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    className="btn btn-sm"
                    disabled={busyRound === round}
                    onClick={() => void changeRoundStatus(round, st)}
                  >
                    {busyRound === round
                      ? "Updating..."
                      : st === "lobby" ? "Open Lobby" : st === "active" ? "Start" : st === "paused" ? "Pause" : "End"}
                  </button>
                ))}
              </div>
            ))}
            {roundActionError && <p className="error round-action-error" role="alert">{roundActionError}</p>}
          </div>

          <div className="expand-toggles card">
            <ExpandableHeader label="Round 1" expanded={expanded.r1} onToggle={() => setExpanded((e) => ({ ...e, r1: !e.r1 }))} />
            <ExpandableHeader label="Round 2" expanded={expanded.r2} onToggle={() => setExpanded((e) => ({ ...e, r2: !e.r2 }))} />
            <ExpandableHeader label="Round 3" expanded={expanded.r3} onToggle={() => setExpanded((e) => ({ ...e, r3: !e.r3 }))} />
          </div>

          {!expanded.r1 && !expanded.r2 && !expanded.r3 && (
            <div className="table-wrap card">
              <table className="standings-table">
                <thead>
                  <tr>
                    <th className="sticky-col">Rank</th>
                    <th className="sticky-col-2">Team Name</th>
                    <th>Batch</th>
                    <th>R1</th>
                    <th>R2</th>
                    <th>R3</th>
                    <th>Total</th>
                    <th>Overall Time</th>
                    <th>Tab Switches</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOverall.map((row) => (
                    <tr key={row.team_id}>
                      <td className="sticky-col">{row.rank}</td>
                      <td className="sticky-col-2">{row.team_name}</td>
                      <td>{row.batch}</td>
                      <td>{row.round1_score}</td>
                      <td>{row.round2_score}</td>
                      <td>{row.round3_score}</td>
                      <td>{row.total_score}</td>
                      <td>{formatDuration(row.total_time_taken)}</td>
                      <td>{row.tab_switches}</td>
                      <td>{overallStatusLabel(row, [r1, r2, r3])}</td>
                      <td className="actions-cell">
                        <button type="button" onClick={() => void rpcAdminDisqualify(row.team_id, true).then(refresh)}>DQ</button>
                        <button type="button" onClick={() => void rpcAdminResetSession(row.team_id).then(refresh)}>Reset</button>
                        <button
                          type="button"
                          onClick={() => {
                            const s = prompt("Extra seconds for which round (1/2/3)?", "60");
                            const r = prompt("Round number?", "1");
                            if (s && r) void rpcAdminGrantExtraTime(row.team_id, Number(r), Number(s)).then(refresh);
                          }}
                        >
                          +Time
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const r = prompt("Force submit round (1/2/3)?", "1");
                            if (r) void rpcAdminForceSubmit(row.team_id, Number(r)).then(refresh);
                          }}
                        >
                          Force
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {expanded.r1 && (
            <div className="table-wrap card">
              <h3 className="mono">Round 1 detail</h3>
              <table className="standings-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Team</th>
                    <th>Batch</th>
                    <th>Score</th>
                    <th>Bonus</th>
                    <th>Total</th>
                    <th>Q Solved</th>
                    <th>Current Q</th>
                    <th>Time</th>
                    <th>Tab Sw</th>
                    <th>FS exits</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {r1.map((row) => (
                    <tr key={row.team_id}>
                      <td>{row.rank}</td>
                      <td>{row.team_name}</td>
                      <td>{row.batch}</td>
                      <td>{row.score}</td>
                      <td>{row.bonus_score}</td>
                      <td>{row.total_score}</td>
                      <td>{row.questions_solved}</td>
                      <td>{currentQuestion(row.team_id)}</td>
                      <td>{formatDuration(row.time_taken)}</td>
                      <td>{row.tab_switches}</td>
                      <td>{row.fullscreen_exits}</td>
                      <td>{statusLabel(row)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {expanded.r2 && (
            <div className="table-wrap card">
              <h3 className="mono">Round 2 detail</h3>
              <table className="standings-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Team</th>
                    <th>Batch</th>
                    <th>Total</th>
                    <th>Cases</th>
                    <th>Current case</th>
                    <th>Time</th>
                    <th>Tab Sw</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {r2.map((row) => (
                    <tr key={row.team_id}>
                      <td>{row.rank}</td>
                      <td>{row.team_name}</td>
                      <td>{row.batch}</td>
                      <td>{row.total_score}</td>
                      <td>{row.cases_solved}</td>
                      <td>{currentCase(row.team_id, 2)}</td>
                      <td>{formatDuration(row.time_taken)}</td>
                      <td>{row.tab_switches}</td>
                      <td>{statusLabel(row)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {expanded.r3 && (
            <div className="table-wrap card">
              <h3 className="mono">Round 3 detail</h3>
              <table className="standings-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Team</th>
                    <th>Batch</th>
                    <th>C1 Lev</th>
                    <th>C2 Lev</th>
                    <th>C1 Score</th>
                    <th>C2 Score</th>
                    <th>Total</th>
                    <th>Current case</th>
                    <th>Time</th>
                    <th>Tab Sw</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {r3.map((row) => (
                    <tr key={row.team_id}>
                      <td>{row.rank}</td>
                      <td>{row.team_name}</td>
                      <td>{row.batch}</td>
                      <td>{row.case1_leverage === 2 ? "High" : row.case1_leverage === 1 ? "Safe" : "—"}</td>
                      <td>{row.case2_leverage === 2 ? "High" : row.case2_leverage === 1 ? "Safe" : "—"}</td>
                      <td>{row.case1_score}</td>
                      <td>{row.case2_score}</td>
                      <td>{row.total_score}</td>
                      <td>{currentCase(row.team_id, 3)}</td>
                      <td>{formatDuration(row.time_taken)}</td>
                      <td>{row.tab_switches}</td>
                      <td>{statusLabel(row)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <form className="card register-form" onSubmit={onRegister}>
            <h2 className="mono">Admin: Register Team</h2>
            <label>
              Team name
              <input value={regName} onChange={(e) => setRegName(e.target.value)} required />
            </label>
            <label>
              Batch
              <select value={regBatch} onChange={(e) => setRegBatch(e.target.value)}>
                {BATCH_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </label>
            {members.map((m, i) => (
              <div key={i} className="member-row">
                <input
                  placeholder="Name"
                  value={m.name}
                  onChange={(e) => {
                    const next = [...members];
                    next[i] = { ...next[i], name: e.target.value };
                    setMembers(next);
                  }}
                />
                <input
                  placeholder="Email"
                  type="email"
                  value={m.email}
                  onChange={(e) => {
                    const next = [...members];
                    next[i] = { ...next[i], email: e.target.value };
                    setMembers(next);
                  }}
                />
              </div>
            ))}
            <button type="button" className="btn btn-ghost" onClick={() => setMembers([...members, { name: "", email: "" }])}>
              + Add team member
            </button>
            <button type="submit" className="btn btn-primary">
              Register Team
            </button>
            {registeredCode && (
              <p className="success">
                Team registered. Code: <strong>{registeredCode}</strong>
              </p>
            )}
          </form>
        </>
      )}

      {tab === "audit" && (
        <div className="table-wrap card">
          <button type="button" className="btn btn-ghost" onClick={() => download("audit.csv", toCsv(events))}>
            Export audit CSV
          </button>
          <table className="standings-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Team</th>
                <th>Round</th>
                <th>Event</th>
                <th>Metadata</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id}>
                  <td>{new Date(ev.created_at).toLocaleString()}</td>
                  <td>{ev.team_id ?? "—"}</td>
                  <td>{ev.round ?? "—"}</td>
                  <td>{ev.event_type}</td>
                  <td>{JSON.stringify(ev.metadata)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
