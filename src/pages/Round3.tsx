import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CaseView } from "../components/CaseView";
import { FullscreenGuard } from "../components/FullscreenGuard";
import { Timer } from "../components/Timer";
import { ViolationBadge } from "../components/ViolationBadge";
import { LeverageSelect } from "./LeverageSelect";
import { useRoundState } from "../hooks/useRoundState";
import { getCase } from "../lib/content";
import { ROUND3_DURATION_MINUTES } from "../config/constants";
import { getSessionToken } from "../lib/session";
import { rpcBeginQuestion, rpcSubmitAnswer, rpcSubmitCase } from "../lib/rpc";

export function Round3() {
  const nav = useNavigate();
  const { state, refresh } = useRoundState(5000);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const slice = state?.round_3;
  const caseOrder = slice?.case_order ?? [];
  const caseIdx = slice?.current_case_index ?? 0;
  const qIdx = slice?.current_question_index ?? 0;
  const caseId = caseOrder[caseIdx];
  const caseStudy = caseId ? getCase(3, caseId) : undefined;
  const qid = caseStudy?.questions[qIdx]?.id;

  const hasLeverage = useMemo(
    () => state?.leverage.some((l) => l.case_id === caseId) ?? false,
    [state?.leverage, caseId],
  );

  const answerRow = useMemo(
    () => state?.answers.find((a) => a.question_id === qid),
    [state?.answers, qid],
  );

  useEffect(() => {
    if (slice?.status !== "in_progress") nav("/lobby");
  }, [slice?.status, nav]);

  useEffect(() => {
    if (!qid || !hasLeverage) return;
    const token = getSessionToken();
    if (!token || answerRow?.started_at) return;
    void rpcBeginQuestion(token, qid).then(() => refresh());
  }, [qid, hasLeverage, answerRow?.started_at, refresh]);

  useEffect(() => setSelected(null), [qid]);

  const onNext = useCallback(async () => {
    if (!caseStudy || !qid || !selected || !caseId) return;
    const token = getSessionToken();
    if (!token) return;
    setSubmitting(true);
    try {
      await rpcSubmitAnswer(token, qid, selected);
      const isLast = qIdx === caseStudy.questions.length - 1;
      if (isLast) await rpcSubmitCase(token, caseId);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }, [caseStudy, qid, selected, caseId, qIdx, refresh]);

  const onRoundExpire = useCallback(async () => {
    await refresh();
    nav("/lobby");
  }, [refresh, nav]);

  if (!state || !slice || !caseStudy) return <div className="page-pad">Loading Round 3…</div>;

  return (
    <FullscreenGuard round={3}>
      <div className="round-page">
        <header className="round-header">
          <div>
            <span className="team-name round-team-name">{state.team_name}</span>
            <span className="mono">
              Case {caseIdx + 1} / {caseOrder.length} · {ROUND3_DURATION_MINUTES} min round
            </span>
            <h1>Round 3</h1>
          </div>
          <div className="round-header-right">
            <ViolationBadge violations={slice.violations} />
            <Timer deadlineIso={slice.deadline} label="Round" onExpire={onRoundExpire} />
          </div>
        </header>
        {!hasLeverage ? (
          <LeverageSelect caseStudy={caseStudy} onChosen={() => void refresh()} />
        ) : (
          <CaseView
            caseStudy={caseStudy}
            questionIndex={qIdx}
            selected={selected}
            onSelect={setSelected}
            onNext={() => void onNext()}
            submitting={submitting}
          />
        )}
      </div>
    </FullscreenGuard>
  );
}
