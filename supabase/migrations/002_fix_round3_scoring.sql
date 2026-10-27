CREATE OR REPLACE FUNCTION public.score_answer(
  p_team_id uuid,
  p_question_id text,
  p_selected text,
  p_started_at timestamptz,
  p_submitted_at timestamptz
)
RETURNS TABLE (points int, bonus int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_correct text;
  v_case_id text;
  v_leverage int;
  v_is_correct boolean;
BEGIN
  SELECT correct_option INTO v_correct FROM answer_key WHERE question_id = p_question_id;
  v_is_correct := (p_selected IS NOT NULL AND v_correct IS NOT NULL AND p_selected = v_correct);

  IF p_question_id LIKE 'r1-%' THEN
    points := CASE WHEN v_is_correct THEN 10 ELSE 0 END;
    bonus := CASE
      WHEN v_is_correct
        AND p_started_at IS NOT NULL
        AND p_submitted_at <= p_started_at + interval '30 seconds'
      THEN 5 ELSE 0 END;
    RETURN NEXT;
    RETURN;
  END IF;

  IF p_question_id LIKE 'r2-%' THEN
    points := CASE WHEN v_is_correct THEN 20 ELSE 0 END;
    bonus := 0;
    RETURN NEXT;
    RETURN;
  END IF;

  IF p_question_id LIKE 'r3-%' THEN
    v_case_id := question_to_case_id(p_question_id);
    SELECT lc.option INTO v_leverage
    FROM leverage_choices lc
    WHERE lc.team_id = p_team_id AND lc.case_id = v_case_id;

    IF v_leverage = 2 THEN
      points := CASE WHEN v_is_correct THEN 20 WHEN p_selected IS NULL THEN 0 ELSE -20 END;
    ELSE
      points := CASE WHEN v_is_correct THEN 10 ELSE 0 END;
    END IF;
    bonus := 0;
    RETURN NEXT;
    RETURN;
  END IF;

  points := 0;
  bonus := 0;
  RETURN NEXT;
END;
$$;

UPDATE answers a
SET points = CASE
  WHEN lc.option = 2 AND a.selected_option IS NOT NULL AND a.selected_option = ak.correct_option THEN 20
  WHEN lc.option = 2 AND a.selected_option IS NOT NULL THEN -20
  WHEN lc.option = 2 THEN 0
  WHEN a.selected_option IS NOT NULL AND a.selected_option = ak.correct_option THEN 10
  ELSE 0
END,
bonus = 0
FROM answer_key ak, leverage_choices lc
WHERE a.question_id LIKE 'r3-%'
  AND ak.question_id = a.question_id
  AND lc.team_id = a.team_id
  AND lc.case_id = question_to_case_id(a.question_id);

CREATE OR REPLACE VIEW round3_standings AS
WITH answer_scores AS (
  SELECT
    a.team_id,
    COALESCE(SUM(a.points) FILTER (WHERE a.question_id LIKE 'r3-c1-%'), 0)::int AS case1_score,
    COALESCE(SUM(a.points) FILTER (WHERE a.question_id LIKE 'r3-c2-%'), 0)::int AS case2_score,
    COALESCE(SUM(a.points), 0)::int AS total_score
  FROM answers a
  WHERE a.question_id LIKE 'r3-%'
  GROUP BY a.team_id
),
leverage_scores AS (
  SELECT
    lc.team_id,
    MAX(lc.option) FILTER (WHERE lc.case_id = 'r3-case1') AS case1_leverage,
    MAX(lc.option) FILTER (WHERE lc.case_id = 'r3-case2') AS case2_leverage
  FROM leverage_choices lc
  GROUP BY lc.team_id
),
base AS (
  SELECT
    t.id AS team_id,
    t.name AS team_name,
    t.batch,
    t.disqualified,
    trs.status,
    trs.started_at,
    trs.deadline,
    trs.current_case_index,
    trs.case_order,
    lev.case1_leverage,
    lev.case2_leverage,
    COALESCE(scores.case1_score, 0)::int AS case1_score,
    COALESCE(scores.case2_score, 0)::int AS case2_score,
    COALESCE(scores.total_score, 0)::int AS total_score,
    CASE WHEN trs.started_at IS NOT NULL AND trs.deadline IS NOT NULL THEN
      EXTRACT(EPOCH FROM (LEAST(trs.deadline, now()) - trs.started_at))::int ELSE NULL END AS time_taken,
    (SELECT tab_switches FROM violation_counts(t.id, 3)) AS tab_switches
  FROM teams t
  LEFT JOIN team_round_state trs ON trs.team_id = t.id AND trs.round = 3
  LEFT JOIN answer_scores scores ON scores.team_id = t.id
  LEFT JOIN leverage_scores lev ON lev.team_id = t.id
)
SELECT *, rank() OVER (ORDER BY total_score DESC, time_taken ASC NULLS LAST, tab_switches ASC NULLS LAST) AS rank
FROM base;

GRANT SELECT ON round3_standings TO authenticated;