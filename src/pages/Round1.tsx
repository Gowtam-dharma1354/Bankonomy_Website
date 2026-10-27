import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FullscreenGuard } from "../components/FullscreenGuard";
import { QuestionCard } from "../components/QuestionCard";
import { BonusTimer, Timer } from "../components/Timer";
import { ViolationBadge } from "../components/ViolationBadge";
import { useRoundState } from "../hooks/useRoundState";
import { getRound1Question } from "../lib/content";
import { getSessionToken } from "../lib/session";
import { rpcBeginQuestion, rpcSubmitAnswer } from "../lib/rpc";

export function Round1() {
  const nav = useNavigate();
  const { state, refresh } = useRoundState(5000);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const slice = state?.round_1;
  const order = slice?.question_order ?? [];
  const idx = slice?.current_question_index ?? 0;
  const qid = order[idx];
  const question = qid ? getRound1Question(qid) : undefined;

  const answerRow = useMemo(
    () => state?.answers.find((a) => a.question_id === qid),
    [state?.answers, qid],
  );

  useEffect(() => {
    if (!state) return;
    if (slice?.status !== "in_progress") {
      nav("/lobby");
    }
  }, [state, slice?.status, nav]);

  useEffect(() => {
    if (!qid) return;
    const token = getSessionToken();
    if (!token) return;
    if (!answerRow?.started_at) {
      void rpcBeginQuestion(token, qid).then(() => refresh());
    }
  }, [qid, answerRow?.started_at, refresh]);

  useEffect(() => {
    setSelected(null);
  }, [qid]);

  const onSubmit = useCallback(async () => {
    if (!qid || !selected) return;
    const token = getSessionToken();
    if (!token) return;
    setSubmitting(true);
    try {
      await rpcSubmitAnswer(token, qid, selected);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }, [qid, selected, refresh]);

  const onRoundExpire = useCallback(async () => {
    await refresh();
    nav("/lobby");
  }, [refresh, nav]);

  if (!state || !slice || !question) {
    return <div className="page-pad">Loading Round 1…</div>;
  }

  return (
    <FullscreenGuard round={1}>
      <div className="round-page no-select" onContextMenu={(e) => e.preventDefault()}>
        <header className="round-header">
          <div className="round-identity">
            <p className="round-event-name">Bankonomy <span>· Banking and Economy Club</span></p>
            <h1>Round 1</h1>
            <p className="round-team-name">Team <strong>{state.team_name}</strong></p>
            <span className="round-progress">
              Question {Math.min(idx + 1, order.length)} / {order.length}
            </span>
          </div>
          <div className="round-header-right">
            <div className="round-metric-card round-violation-card"><ViolationBadge violations={slice.violations} /></div>
            <div className="round-metric-card round-timer-card">
              <Timer deadlineIso={slice.deadline} label="Time remaining" onExpire={onRoundExpire} />
              <BonusTimer startedAtIso={answerRow?.started_at ?? null} />
            </div>
          </div>
        </header>
        <QuestionCard question={question} selected={selected} onSelect={setSelected} disabled={submitting} />
        <button
          type="button"
          className="btn btn-primary"
          disabled={!selected || submitting}
          onClick={() => void onSubmit()}
        >
          Submit
        </button>
      </div>
    </FullscreenGuard>
  );
}
