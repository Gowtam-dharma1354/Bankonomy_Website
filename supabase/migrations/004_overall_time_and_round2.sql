ALTER TABLE team_round_state
ADD COLUMN IF NOT EXISTS completed_at timestamptz;

CREATE OR REPLACE FUNCTION public.finalize_team_round(p_team_id uuid, p_round int, p_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_state team_round_state%ROWTYPE;
  v_qids text[];
  v_q text;
  v_now timestamptz := now();
  v_case text;
  v_cq text[];
BEGIN
  SELECT * INTO v_state FROM team_round_state WHERE team_id = p_team_id AND round = p_round FOR UPDATE;
  IF NOT FOUND OR v_state.status NOT IN ('in_progress') THEN
    RETURN;
  END IF;

  IF p_round = 1 THEN
    v_qids := ARRAY(SELECT jsonb_array_elements_text(v_state.question_order));
    FOREACH v_q IN ARRAY v_qids LOOP
      IF NOT EXISTS (
        SELECT 1 FROM answers a
        WHERE a.team_id = p_team_id AND a.question_id = v_q AND a.submitted_at IS NOT NULL
      ) THEN
        INSERT INTO answers (team_id, question_id, selected_option, submitted_at, points, bonus)
        VALUES (p_team_id, v_q, NULL, v_now, 0, 0)
        ON CONFLICT (team_id, question_id) DO NOTHING;
      END IF;
    END LOOP;
  ELSIF p_round IN (2, 3) THEN
    FOR v_case IN SELECT jsonb_array_elements_text(v_state.case_order) LOOP
      v_cq := case_question_ids(v_case);
      FOREACH v_q IN ARRAY v_cq LOOP
        IF NOT EXISTS (
          SELECT 1 FROM answers a
          WHERE a.team_id = p_team_id AND a.question_id = v_q AND a.submitted_at IS NOT NULL
        ) THEN
          INSERT INTO answers (team_id, question_id, selected_option, submitted_at, points, bonus)
          VALUES (p_team_id, v_q, NULL, v_now, 0, 0)
          ON CONFLICT (team_id, question_id) DO NOTHING;
        END IF;
      END LOOP;
    END LOOP;
  END IF;

  UPDATE team_round_state
  SET status = CASE WHEN p_reason = 'timeout' THEN 'auto_finalized' ELSE 'completed' END,
      completed_at = v_now
  WHERE team_id = p_team_id AND round = p_round;

  PERFORM log_event_internal(p_team_id, p_round, 'auto_submit', jsonb_build_object('reason', p_reason));
END;
$$;

UPDATE team_round_state trs
SET completed_at = trs.started_at
WHERE trs.status IN ('completed', 'auto_finalized') AND trs.completed_at IS NULL AND trs.started_at IS NOT NULL;

DROP VIEW IF EXISTS overall_standings CASCADE;
DROP VIEW IF EXISTS round1_standings CASCADE;
DROP VIEW IF EXISTS round2_standings CASCADE;
DROP VIEW IF EXISTS round3_standings CASCADE;

CREATE VIEW round1_standings AS
WITH base AS (
  SELECT t.id AS team_id, t.name AS team_name, t.batch, t.disqualified,
    trs.status, trs.started_at, trs.deadline, trs.completed_at,
    trs.current_question_index, trs.question_order,
    COALESCE(SUM(a.points), 0)::int AS score,
    COALESCE(SUM(a.bonus), 0)::int AS bonus_score,
    COALESCE(SUM(a.points + a.bonus), 0)::int AS total_score,
    COUNT(a.submitted_at) FILTER (WHERE a.submitted_at IS NOT NULL)::int AS questions_solved,
    CASE WHEN trs.started_at IS NOT NULL THEN
      CASE WHEN trs.completed_at IS NOT NULL THEN
        EXTRACT(EPOCH FROM (trs.completed_at - trs.started_at))::int
      ELSE EXTRACT(EPOCH FROM (LEAST(COALESCE(trs.deadline, now()), now()) - trs.started_at))::int
      END ELSE NULL END AS time_taken,
    (SELECT tab_switches FROM violation_counts(t.id, 1)) AS tab_switches,
    (SELECT fullscreen_exit FROM violation_counts(t.id, 1)) AS fullscreen_exits
  FROM teams t
  LEFT JOIN team_round_state trs ON trs.team_id = t.id AND trs.round = 1
  LEFT JOIN answers a ON a.team_id = t.id AND a.question_id LIKE 'r1-%'
  GROUP BY t.id, t.name, t.batch, t.disqualified, trs.status, trs.started_at, trs.deadline,
    trs.completed_at, trs.current_question_index, trs.question_order
)
SELECT team_id, team_name, batch, disqualified, status, current_question_index, question_order,
  score, bonus_score, total_score, questions_solved, time_taken, tab_switches, fullscreen_exits,
  rank() OVER (ORDER BY total_score DESC, time_taken ASC NULLS LAST, tab_switches ASC NULLS LAST) AS rank
FROM base;

CREATE VIEW round2_standings AS
WITH base AS (
  SELECT t.id AS team_id, t.name AS team_name, t.batch, t.disqualified,
    trs.status, trs.started_at, trs.deadline, trs.completed_at,
    trs.current_case_index, trs.case_order,
    COALESCE(SUM(a.points), 0)::int AS total_score,
    trs.current_case_index AS cases_solved,
    CASE WHEN trs.started_at IS NOT NULL THEN
      CASE WHEN trs.completed_at IS NOT NULL THEN
        EXTRACT(EPOCH FROM (trs.completed_at - trs.started_at))::int
      ELSE EXTRACT(EPOCH FROM (LEAST(COALESCE(trs.deadline, now()), now()) - trs.started_at))::int
      END ELSE NULL END AS time_taken,
    (SELECT tab_switches FROM violation_counts(t.id, 2)) AS tab_switches
  FROM teams t
  LEFT JOIN team_round_state trs ON trs.team_id = t.id AND trs.round = 2
  LEFT JOIN answers a ON a.team_id = t.id AND a.question_id LIKE 'r2-%'
  GROUP BY t.id, t.name, t.batch, t.disqualified, trs.status, trs.started_at, trs.deadline,
    trs.completed_at, trs.current_case_index, trs.case_order
)
SELECT *, rank() OVER (ORDER BY total_score DESC, time_taken ASC NULLS LAST, tab_switches ASC NULLS LAST) AS rank
FROM base;

CREATE VIEW round3_standings AS
WITH answer_scores AS (
  SELECT a.team_id,
    COALESCE(SUM(a.points) FILTER (WHERE a.question_id LIKE 'r3-c1-%'), 0)::int AS case1_score,
    COALESCE(SUM(a.points) FILTER (WHERE a.question_id LIKE 'r3-c2-%'), 0)::int AS case2_score,
    COALESCE(SUM(a.points), 0)::int AS total_score
  FROM answers a WHERE a.question_id LIKE 'r3-%' GROUP BY a.team_id
),
leverage_scores AS (
  SELECT lc.team_id,
    MAX(lc.option) FILTER (WHERE lc.case_id = 'r3-case1') AS case1_leverage,
    MAX(lc.option) FILTER (WHERE lc.case_id = 'r3-case2') AS case2_leverage
  FROM leverage_choices lc GROUP BY lc.team_id
),
base AS (
  SELECT t.id AS team_id, t.name AS team_name, t.batch, t.disqualified,
    trs.status, trs.started_at, trs.deadline, trs.completed_at,
    trs.current_case_index, trs.case_order,
    lev.case1_leverage, lev.case2_leverage,
    COALESCE(scores.case1_score, 0)::int AS case1_score,
    COALESCE(scores.case2_score, 0)::int AS case2_score,
    COALESCE(scores.total_score, 0)::int AS total_score,
    CASE WHEN trs.started_at IS NOT NULL THEN
      CASE WHEN trs.completed_at IS NOT NULL THEN
        EXTRACT(EPOCH FROM (trs.completed_at - trs.started_at))::int
      ELSE EXTRACT(EPOCH FROM (LEAST(COALESCE(trs.deadline, now()), now()) - trs.started_at))::int
      END ELSE NULL END AS time_taken,
    (SELECT tab_switches FROM violation_counts(t.id, 3)) AS tab_switches
  FROM teams t
  LEFT JOIN team_round_state trs ON trs.team_id = t.id AND trs.round = 3
  LEFT JOIN answer_scores scores ON scores.team_id = t.id
  LEFT JOIN leverage_scores lev ON lev.team_id = t.id
)
SELECT *, rank() OVER (ORDER BY total_score DESC, time_taken ASC NULLS LAST, tab_switches ASC NULLS LAST) AS rank
FROM base;

CREATE VIEW overall_standings AS
WITH r1 AS (
  SELECT team_id, total_score AS r1_score, time_taken AS r1_time FROM round1_standings
), r2 AS (
  SELECT team_id, total_score AS r2_score, time_taken AS r2_time FROM round2_standings
), r3 AS (
  SELECT team_id, total_score AS r3_score, time_taken AS r3_time FROM round3_standings
), viol AS (
  SELECT team_id, SUM(tab_switches)::int AS tab_switches FROM (
    SELECT team_id, tab_switches FROM round1_standings
    UNION ALL SELECT team_id, tab_switches FROM round2_standings
    UNION ALL SELECT team_id, tab_switches FROM round3_standings
  ) x GROUP BY team_id
)
SELECT t.id AS team_id, t.name AS team_name, t.batch, t.disqualified,
  COALESCE(r1.r1_score, 0) AS round1_score,
  COALESCE(r2.r2_score, 0) AS round2_score,
  COALESCE(r3.r3_score, 0) AS round3_score,
  COALESCE(r1.r1_score, 0) + COALESCE(r2.r2_score, 0) + COALESCE(r3.r3_score, 0) AS total_score,
  COALESCE(r1.r1_time, 0) + COALESCE(r2.r2_time, 0) + COALESCE(r3.r3_time, 0) AS total_time_taken,
  COALESCE(v.tab_switches, 0) AS tab_switches,
  rank() OVER (
    ORDER BY
      COALESCE(r1.r1_score, 0) + COALESCE(r2.r2_score, 0) + COALESCE(r3.r3_score, 0) DESC,
      COALESCE(r1.r1_time, 0) + COALESCE(r2.r2_time, 0) + COALESCE(r3.r3_time, 0) ASC,
      COALESCE(v.tab_switches, 0) ASC
  ) AS rank
FROM teams t
LEFT JOIN r1 ON r1.team_id = t.id
LEFT JOIN r2 ON r2.team_id = t.id
LEFT JOIN r3 ON r3.team_id = t.id
LEFT JOIN viol v ON v.team_id = t.id;

GRANT SELECT ON round1_standings, round2_standings, round3_standings, overall_standings TO authenticated;
GRANT SELECT ON round1_standings, round2_standings, round3_standings, overall_standings TO anon;

CREATE OR REPLACE FUNCTION public.start_round(
  p_token text,
  p_round int,
  p_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id uuid := verify_team_session(p_token);
  v_team teams%ROWTYPE;
  v_rc rounds_config%ROWTYPE;
  v_state team_round_state%ROWTYPE;
  v_pause int;
  v_duration interval;
  v_qorder jsonb;
  v_corder jsonb;
BEGIN
  SELECT * INTO v_team FROM teams WHERE id = v_team_id;
  IF v_team.disqualified THEN RAISE EXCEPTION 'disqualified'; END IF;
  IF upper(trim(p_code)) <> v_team.code THEN RAISE EXCEPTION 'invalid_code'; END IF;

  SELECT * INTO v_rc FROM rounds_config WHERE round = p_round;
  IF v_rc.status <> 'active' THEN RAISE EXCEPTION 'round_not_active'; END IF;

  SELECT * INTO v_state FROM team_round_state WHERE team_id = v_team_id AND round = p_round FOR UPDATE;
  IF v_state.status IN ('completed', 'auto_finalized') THEN
    RAISE EXCEPTION 'round_already_finished';
  END IF;
  IF v_state.status = 'in_progress' THEN
    RETURN get_round_state(p_token);
  END IF;

  v_pause := effective_round_pause_seconds(p_round);

  IF p_round = 1 THEN
    v_duration := interval '17 minutes';
    SELECT jsonb_agg(q ORDER BY random()) INTO v_qorder FROM unnest(r1_question_ids()) AS q;
  ELSIF p_round = 2 THEN
    v_duration := interval '30 minutes';
    SELECT jsonb_agg(c ORDER BY random()) INTO v_corder FROM unnest(r2_case_ids()) AS c;
  ELSE
    v_duration := interval '25 minutes';
    SELECT jsonb_agg(c ORDER BY random()) INTO v_corder FROM unnest(r3_case_ids()) AS c;
  END IF;

  UPDATE team_round_state SET
    status = 'in_progress',
    started_at = now(),
    deadline = now() + v_duration + (v_state.extra_seconds || ' seconds')::interval
      + (v_pause || ' seconds')::interval,
    completed_at = NULL,
    question_order = COALESCE(v_qorder, question_order),
    case_order = COALESCE(v_corder, case_order),
    current_question_index = 0,
    current_case_index = 0
  WHERE team_id = v_team_id AND round = p_round;

  PERFORM log_event_internal(v_team_id, p_round, 'round_start', '{}');
  RETURN get_round_state(p_token);
END;
$$;

GRANT EXECUTE ON FUNCTION public.start_round(text, int, text) TO anon, authenticated;
