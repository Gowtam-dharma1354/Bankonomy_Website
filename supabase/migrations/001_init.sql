-- Bankonomy initial schema, RLS, RPCs, views, pg_cron
-- Tiebreaker (single place): total DESC, time_taken ASC, tab_switches ASC

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE teams (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  name text NOT NULL,
  batch text NOT NULL,
  code text NOT NULL UNIQUE,
  disqualified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE members (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL
);

CREATE TABLE team_sessions (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  invalidated_at timestamptz
);

CREATE TABLE rounds_config (
  round int PRIMARY KEY CHECK (round IN (1, 2, 3)),
  status text NOT NULL DEFAULT 'lobby'
    CHECK (status IN ('lobby', 'active', 'paused', 'ended')),
  pause_started_at timestamptz,
  total_paused_seconds int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO rounds_config (round, status) VALUES (1, 'lobby'), (2, 'lobby'), (3, 'lobby');

CREATE TABLE team_round_state (
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  round int NOT NULL CHECK (round IN (1, 2, 3)),
  status text NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting', 'in_progress', 'completed', 'auto_finalized')),
  started_at timestamptz,
  deadline timestamptz,
  question_order jsonb,
  case_order jsonb,
  current_question_index int NOT NULL DEFAULT 0,
  current_case_index int NOT NULL DEFAULT 0,
  extra_seconds int NOT NULL DEFAULT 0,
  completed_at timestamptz,
  PRIMARY KEY (team_id, round)
);

CREATE TABLE answers (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  selected_option text,
  started_at timestamptz,
  submitted_at timestamptz,
  points int NOT NULL DEFAULT 0,
  bonus int NOT NULL DEFAULT 0,
  UNIQUE (team_id, question_id)
);

CREATE TABLE leverage_choices (
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  case_id text NOT NULL,
  option int NOT NULL CHECK (option IN (1, 2)),
  locked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, case_id)
);

CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  round int,
  event_type text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE answer_key (
  question_id text PRIMARY KEY,
  correct_option text NOT NULL
);

CREATE TABLE admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_events_team_round ON events (team_id, round);
CREATE INDEX idx_events_team_type ON events (team_id, event_type);
CREATE INDEX idx_answers_team ON answers (team_id);
CREATE INDEX idx_team_round_state_team_round ON team_round_state (team_id, round);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.hash_session_token(p_token text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT encode(extensions.digest(p_token, 'sha256'), 'hex');
$$;

CREATE OR REPLACE FUNCTION public.verify_team_session(p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id uuid;
BEGIN
  SELECT team_id INTO v_team_id
  FROM team_sessions
  WHERE token_hash = hash_session_token(p_token)
    AND invalidated_at IS NULL;
  IF v_team_id IS NULL THEN
    RAISE EXCEPTION 'invalid_session';
  END IF;
  RETURN v_team_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.effective_round_pause_seconds(p_round int)
RETURNS int
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rc.total_paused_seconds
    + CASE
        WHEN rc.status = 'paused' AND rc.pause_started_at IS NOT NULL THEN
          EXTRACT(EPOCH FROM (now() - rc.pause_started_at))::int
        ELSE 0
      END
  FROM rounds_config rc
  WHERE rc.round = p_round;
$$;

CREATE OR REPLACE FUNCTION public.r1_question_ids()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT ARRAY[
    'r1-q01','r1-q02','r1-q03','r1-q04','r1-q05','r1-q06','r1-q07',
    'r1-q08','r1-q09','r1-q10','r1-q11','r1-q12','r1-q13','r1-q14',
    'r1-q15','r1-q16','r1-q17'
  ];
$$;

CREATE OR REPLACE FUNCTION public.r2_case_ids()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT ARRAY['r2-case1','r2-case2','r2-case3','r2-case4'];
$$;

CREATE OR REPLACE FUNCTION public.r3_case_ids()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT ARRAY['r3-case1','r3-case2'];
$$;

CREATE OR REPLACE FUNCTION public.case_question_ids(p_case_id text)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_case_id
    WHEN 'r2-case1' THEN ARRAY['r2-c1-q1','r2-c1-q2','r2-c1-q3','r2-c1-q4']
    WHEN 'r2-case2' THEN ARRAY['r2-c2-q1','r2-c2-q2','r2-c2-q3','r2-c2-q4']
    WHEN 'r2-case3' THEN ARRAY['r2-c3-q1','r2-c3-q2','r2-c3-q3','r2-c3-q4']
    WHEN 'r2-case4' THEN ARRAY['r2-c4-q1','r2-c4-q2','r2-c4-q3','r2-c4-q4']
    WHEN 'r3-case1' THEN ARRAY['r3-c1-q1','r3-c1-q2','r3-c1-q3','r3-c1-q4']
    WHEN 'r3-case2' THEN ARRAY['r3-c2-q1','r3-c2-q2','r3-c2-q3','r3-c2-q4']
    ELSE ARRAY[]::text[]
  END;
$$;

CREATE OR REPLACE FUNCTION public.log_event_internal(
  p_team_id uuid,
  p_round int,
  p_event_type text,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO events (team_id, round, event_type, metadata)
  VALUES (p_team_id, p_round, p_event_type, COALESCE(p_metadata, '{}'));
END;
$$;

CREATE OR REPLACE FUNCTION public.violation_counts(p_team_id uuid, p_round int DEFAULT NULL)
RETURNS TABLE (
  fullscreen_exit int,
  tab_hidden int,
  window_blur int,
  tab_switches int,
  total_violations int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*) FILTER (WHERE e.event_type = 'fullscreen_exit')::int,
    COUNT(*) FILTER (WHERE e.event_type = 'tab_hidden')::int,
    COUNT(*) FILTER (WHERE e.event_type = 'window_blur')::int,
    (COUNT(*) FILTER (WHERE e.event_type IN ('tab_hidden', 'window_blur')))::int,
    COUNT(*)::int
  FROM events e
  WHERE e.team_id = p_team_id
    AND (p_round IS NULL OR e.round = p_round)
    AND e.event_type IN ('fullscreen_exit', 'tab_hidden', 'window_blur');
$$;

-- ---------------------------------------------------------------------------
-- Scoring
-- ---------------------------------------------------------------------------

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
  v_round int;
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
    v_case_id := regexp_replace(p_question_id, '-q\d$', '');
    v_case_id := regexp_replace(v_case_id, '^r3-c(\d)$', 'r3-case\1');
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

-- Fix case id extraction for r3-c1-q1 -> r3-case1
CREATE OR REPLACE FUNCTION public.question_to_case_id(p_question_id text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_question_id ~ '^r2-c(\d)-q\d$' THEN 'r2-case' || (regexp_match(p_question_id, '^r2-c(\d)-q\d$'))[1]
    WHEN p_question_id ~ '^r3-c(\d)-q\d$' THEN 'r3-case' || (regexp_match(p_question_id, '^r3-c(\d)-q\d$'))[1]
    ELSE NULL
  END;
$$;

-- Replace score_answer r3 case id logic
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

-- ---------------------------------------------------------------------------
-- Finalize / auto-submit
-- ---------------------------------------------------------------------------

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
      IF NOT EXISTS (SELECT 1 FROM answers a WHERE a.team_id = p_team_id AND a.question_id = v_q AND a.submitted_at IS NOT NULL) THEN
        INSERT INTO answers (team_id, question_id, selected_option, submitted_at, points, bonus)
        VALUES (p_team_id, v_q, NULL, v_now, 0, 0)
        ON CONFLICT (team_id, question_id) DO NOTHING;
      END IF;
    END LOOP;
  ELSIF p_round IN (2, 3) THEN
    FOR v_case IN SELECT jsonb_array_elements_text(v_state.case_order) LOOP
      v_cq := case_question_ids(v_case);
      FOREACH v_q IN ARRAY v_cq LOOP
        IF NOT EXISTS (SELECT 1 FROM answers a WHERE a.team_id = p_team_id AND a.question_id = v_q AND a.submitted_at IS NOT NULL) THEN
          INSERT INTO answers (team_id, question_id, selected_option, submitted_at, points, bonus)
          VALUES (p_team_id, v_q, NULL, v_now, 0, 0)
          ON CONFLICT (team_id, question_id) DO NOTHING;
        END IF;
      END LOOP;
    END LOOP;
  END IF;

  UPDATE team_round_state
  SET status = CASE WHEN p_reason = 'timeout' THEN 'auto_finalized' ELSE 'completed' END
  WHERE team_id = p_team_id AND round = p_round;

  PERFORM log_event_internal(p_team_id, p_round, 'auto_submit', jsonb_build_object('reason', p_reason));
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_expired_rounds()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT trs.team_id, trs.round
    FROM team_round_state trs
    JOIN rounds_config rc ON rc.round = trs.round
    WHERE trs.status = 'in_progress'
      AND trs.deadline IS NOT NULL
      AND trs.deadline <= now()
      AND rc.status IN ('active', 'ended')
  LOOP
    PERFORM finalize_team_round(r.team_id, r.round, 'timeout');
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- Team RPCs
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.server_now()
RETURNS timestamptz
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT now();
$$;

CREATE OR REPLACE FUNCTION public.login_with_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team teams%ROWTYPE;
  v_token text := encode(extensions.gen_random_bytes(32), 'hex');
BEGIN
  SELECT * INTO v_team FROM teams WHERE code = upper(trim(p_code));
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_code';
  END IF;

  IF EXISTS (SELECT 1 FROM team_sessions WHERE team_id = v_team.id AND invalidated_at IS NULL) THEN
    UPDATE team_sessions SET invalidated_at = now()
    WHERE team_id = v_team.id AND invalidated_at IS NULL;
    PERFORM log_event_internal(v_team.id, NULL, 'session_invalidated', jsonb_build_object('reason', 'new_login'));
  END IF;

  INSERT INTO team_sessions (team_id, token_hash) VALUES (v_team.id, hash_session_token(v_token));

  PERFORM log_event_internal(v_team.id, NULL, 'login', '{}');

  INSERT INTO team_round_state (team_id, round)
  VALUES (v_team.id, 1), (v_team.id, 2), (v_team.id, 3)
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object(
    'session_token', v_token,
    'team_id', v_team.id,
    'team_name', v_team.name,
    'batch', v_team.batch,
    'disqualified', v_team.disqualified
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.log_event(
  p_token text,
  p_round int,
  p_event_type text,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id uuid := verify_team_session(p_token);
BEGIN
  IF p_event_type NOT IN ('fullscreen_exit', 'tab_hidden', 'window_blur') THEN
    RAISE EXCEPTION 'invalid_event_type';
  END IF;
  PERFORM log_event_internal(v_team_id, p_round, p_event_type, p_metadata);
END;
$$;

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
    SELECT jsonb_agg(q ORDER BY random()) INTO v_qorder
    FROM unnest(r1_question_ids()) AS q;
  ELSIF p_round = 2 THEN
    v_duration := interval '30 minutes';
    SELECT jsonb_agg(c ORDER BY random()) INTO v_corder
    FROM unnest(r2_case_ids()) AS c;
  ELSE
    v_duration := interval '25 minutes';
    SELECT jsonb_agg(c ORDER BY random()) INTO v_corder
    FROM unnest(r3_case_ids()) AS c;
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

CREATE OR REPLACE FUNCTION public.get_round_state(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id uuid := verify_team_session(p_token);
  v_team teams%ROWTYPE;
  v_out jsonb := '{}';
  v_round int;
  v_state team_round_state%ROWTYPE;
  v_rc rounds_config%ROWTYPE;
  v_violations jsonb;
BEGIN
  SELECT * INTO v_team FROM teams WHERE id = v_team_id;

  v_out := v_out || jsonb_build_object(
    'team_id', v_team.id,
    'team_name', v_team.name,
    'batch', v_team.batch,
    'disqualified', v_team.disqualified,
    'server_now', now()
  );

  FOR v_round IN 1..3 LOOP
    SELECT * INTO v_state FROM team_round_state WHERE team_id = v_team_id AND round = v_round;
    SELECT * INTO v_rc FROM rounds_config WHERE round = v_round;
    SELECT jsonb_build_object(
      'fullscreen_exit', vc.fullscreen_exit,
      'tab_hidden', vc.tab_hidden,
      'window_blur', vc.window_blur,
      'tab_switches', vc.tab_switches,
      'total', vc.total_violations
    ) INTO v_violations
    FROM violation_counts(v_team_id, v_round) vc;

    v_out := v_out || jsonb_build_object(
      'round_' || v_round,
      jsonb_build_object(
        'global_status', v_rc.status,
        'status', v_state.status,
        'started_at', v_state.started_at,
        'deadline', v_state.deadline,
        'question_order', v_state.question_order,
        'case_order', v_state.case_order,
        'current_question_index', v_state.current_question_index,
        'current_case_index', v_state.current_case_index,
        'violations', v_violations
      )
    );
  END LOOP;

  v_out := v_out || jsonb_build_object(
    'answers',
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'question_id', a.question_id,
        'selected_option', a.selected_option,
        'started_at', a.started_at,
        'submitted_at', a.submitted_at,
        'points', a.points,
        'bonus', a.bonus
      ))
      FROM answers a WHERE a.team_id = v_team_id
    ), '[]'::jsonb),
    'leverage',
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object('case_id', lc.case_id, 'option', lc.option))
      FROM leverage_choices lc WHERE lc.team_id = v_team_id
    ), '[]'::jsonb)
  );

  RETURN v_out;
END;
$$;

CREATE OR REPLACE FUNCTION public.begin_question(p_token text, p_question_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id uuid := verify_team_session(p_token);
  v_now timestamptz := now();
BEGIN
  INSERT INTO answers (team_id, question_id, started_at)
  VALUES (v_team_id, p_question_id, v_now)
  ON CONFLICT (team_id, question_id) DO UPDATE
  SET started_at = COALESCE(answers.started_at, EXCLUDED.started_at);

  RETURN jsonb_build_object('question_id', p_question_id, 'started_at', (
    SELECT started_at FROM answers WHERE team_id = v_team_id AND question_id = p_question_id
  ));
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_answer(
  p_token text,
  p_question_id text,
  p_selected_option text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id uuid := verify_team_session(p_token);
  v_now timestamptz := now();
  v_round int;
  v_state team_round_state%ROWTYPE;
  v_started timestamptz;
  v_pts int;
  v_bonus int;
  v_expected_q text;
  v_case text;
  v_qidx int;
BEGIN
  IF p_question_id LIKE 'r1-%' THEN v_round := 1;
  ELSIF p_question_id LIKE 'r2-%' THEN v_round := 2;
  ELSIF p_question_id LIKE 'r3-%' THEN v_round := 3;
  ELSE RAISE EXCEPTION 'invalid_question'; END IF;

  SELECT * INTO v_state FROM team_round_state WHERE team_id = v_team_id AND round = v_round FOR UPDATE;
  IF v_state.status <> 'in_progress' THEN RAISE EXCEPTION 'round_not_in_progress'; END IF;

  IF v_round = 1 THEN
    v_expected_q := v_state.question_order ->> v_state.current_question_index;
    IF v_expected_q IS DISTINCT FROM p_question_id THEN RAISE EXCEPTION 'wrong_question'; END IF;
  ELSE
    v_case := v_state.case_order ->> v_state.current_case_index;
    v_qidx := v_state.current_question_index;
    v_expected_q := (case_question_ids(v_case))[v_qidx + 1];
    IF v_expected_q IS DISTINCT FROM p_question_id THEN RAISE EXCEPTION 'wrong_question'; END IF;
    IF v_round = 3 AND NOT EXISTS (
      SELECT 1 FROM leverage_choices WHERE team_id = v_team_id AND case_id = v_case
    ) THEN
      RAISE EXCEPTION 'leverage_required';
    END IF;
  END IF;

  SELECT started_at INTO v_started FROM answers WHERE team_id = v_team_id AND question_id = p_question_id;
  IF v_started IS NULL THEN
    v_started := v_now;
  END IF;

  SELECT s.points, s.bonus INTO v_pts, v_bonus
  FROM score_answer(v_team_id, p_question_id, p_selected_option, v_started, v_now) s;

  INSERT INTO answers (team_id, question_id, selected_option, started_at, submitted_at, points, bonus)
  VALUES (v_team_id, p_question_id, p_selected_option, v_started, v_now, v_pts, v_bonus)
  ON CONFLICT (team_id, question_id) DO UPDATE SET
    selected_option = EXCLUDED.selected_option,
    submitted_at = EXCLUDED.submitted_at,
    points = EXCLUDED.points,
    bonus = EXCLUDED.bonus;

  IF v_round = 1 THEN
    UPDATE team_round_state SET current_question_index = current_question_index + 1
    WHERE team_id = v_team_id AND round = 1;
    IF (SELECT current_question_index FROM team_round_state WHERE team_id = v_team_id AND round = 1) >=
       jsonb_array_length(v_state.question_order) THEN
      PERFORM finalize_team_round(v_team_id, 1, 'completed');
    END IF;
  ELSE
    UPDATE team_round_state SET current_question_index = current_question_index + 1
    WHERE team_id = v_team_id AND round = v_round;
  END IF;

  PERFORM log_event_internal(v_team_id, v_round, 'answer_submitted', jsonb_build_object('question_id', p_question_id));

  RETURN jsonb_build_object('points', v_pts, 'bonus', v_bonus, 'submitted_at', v_now);
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_case(p_token text, p_case_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id uuid := verify_team_session(p_token);
  v_round int;
  v_state team_round_state%ROWTYPE;
  v_current_case text;
  v_q text;
  v_cq text[];
BEGIN
  IF p_case_id LIKE 'r2-%' THEN v_round := 2; ELSE v_round := 3; END IF;

  SELECT * INTO v_state FROM team_round_state WHERE team_id = v_team_id AND round = v_round FOR UPDATE;
  IF v_state.status <> 'in_progress' THEN RAISE EXCEPTION 'round_not_in_progress'; END IF;

  v_current_case := v_state.case_order ->> v_state.current_case_index;
  IF v_current_case IS DISTINCT FROM p_case_id THEN RAISE EXCEPTION 'wrong_case'; END IF;

  v_cq := case_question_ids(p_case_id);
  FOREACH v_q IN ARRAY v_cq LOOP
    IF NOT EXISTS (
      SELECT 1 FROM answers a WHERE a.team_id = v_team_id AND a.question_id = v_q AND a.submitted_at IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'case_incomplete';
    END IF;
  END LOOP;

  UPDATE team_round_state SET
    current_case_index = current_case_index + 1,
    current_question_index = 0
  WHERE team_id = v_team_id AND round = v_round;

  PERFORM log_event_internal(v_team_id, v_round, 'case_submitted', jsonb_build_object('case_id', p_case_id));

  SELECT * INTO v_state FROM team_round_state WHERE team_id = v_team_id AND round = v_round;
  IF v_state.current_case_index >= jsonb_array_length(v_state.case_order) THEN
    PERFORM finalize_team_round(v_team_id, v_round, 'completed');
  END IF;

  RETURN get_round_state(p_token);
END;
$$;

CREATE OR REPLACE FUNCTION public.choose_leverage(
  p_token text,
  p_case_id text,
  p_option int
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id uuid := verify_team_session(p_token);
  v_state team_round_state%ROWTYPE;
  v_current_case text;
BEGIN
  IF p_option NOT IN (1, 2) THEN RAISE EXCEPTION 'invalid_option'; END IF;

  SELECT * INTO v_state FROM team_round_state WHERE team_id = v_team_id AND round = 3 FOR UPDATE;
  IF v_state.status <> 'in_progress' THEN RAISE EXCEPTION 'round_not_in_progress'; END IF;

  v_current_case := v_state.case_order ->> v_state.current_case_index;
  IF v_current_case IS DISTINCT FROM p_case_id THEN RAISE EXCEPTION 'wrong_case'; END IF;

  IF v_state.current_question_index > 0 OR EXISTS (
    SELECT 1 FROM answers a
    WHERE a.team_id = v_team_id
      AND a.question_id = ANY(case_question_ids(p_case_id))
      AND a.started_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'leverage_locked';
  END IF;

  INSERT INTO leverage_choices (team_id, case_id, option)
  VALUES (v_team_id, p_case_id, p_option)
  ON CONFLICT (team_id, case_id) DO NOTHING;

  PERFORM log_event_internal(v_team_id, 3, 'leverage_chosen', jsonb_build_object('case_id', p_case_id, 'option', p_option));

  RETURN jsonb_build_object('case_id', p_case_id, 'option', p_option);
END;
$$;

CREATE OR REPLACE FUNCTION public.previous_question(
  p_token text,
  p_round int
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id uuid := verify_team_session(p_token);
  v_state team_round_state%ROWTYPE;
BEGIN
  IF p_round NOT IN (2, 3) THEN
    RAISE EXCEPTION 'previous_not_allowed';
  END IF;

  SELECT * INTO v_state
  FROM team_round_state
  WHERE team_id = v_team_id AND round = p_round
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'round_state_not_found';
  END IF;
  IF v_state.status <> 'in_progress' THEN
    RAISE EXCEPTION 'round_not_in_progress';
  END IF;
  IF v_state.current_question_index <= 0 THEN
    RETURN get_round_state(p_token);
  END IF;

  UPDATE team_round_state
  SET current_question_index = current_question_index - 1
  WHERE team_id = v_team_id AND round = p_round;

  RETURN get_round_state(p_token);
END;
$$;

-- ---------------------------------------------------------------------------
-- Admin RPCs
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_register_team(
  p_name text,
  p_batch text,
  p_members jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id uuid;
  v_code text;
  m jsonb;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'not_admin'; END IF;

  v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));

  INSERT INTO teams (name, batch, code) VALUES (p_name, p_batch, v_code) RETURNING id INTO v_team_id;

  FOR m IN SELECT * FROM jsonb_array_elements(p_members) LOOP
    INSERT INTO members (team_id, name, email)
    VALUES (v_team_id, m->>'name', m->>'email');
  END LOOP;

  INSERT INTO team_round_state (team_id, round) VALUES (v_team_id, 1), (v_team_id, 2), (v_team_id, 3);

  PERFORM log_event_internal(v_team_id, NULL, 'team_registered', jsonb_build_object('code', v_code));

  RETURN jsonb_build_object('team_id', v_team_id, 'code', v_code);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_round_status(p_round int, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rc rounds_config%ROWTYPE;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'not_admin'; END IF;

  SELECT * INTO v_rc FROM rounds_config WHERE round = p_round FOR UPDATE;

  IF p_status = 'active' THEN
    UPDATE rounds_config SET
      status = CASE
        WHEN round = p_round THEN 'active'
        WHEN round < p_round THEN 'ended'
        ELSE 'lobby'
      END,
      pause_started_at = CASE WHEN round = p_round THEN NULL ELSE pause_started_at END,
      updated_at = now()
    WHERE round IN (1, 2, 3);

  ELSIF p_status = 'paused' AND v_rc.status = 'active' THEN
    UPDATE rounds_config SET status = 'paused', pause_started_at = now(), updated_at = now() WHERE round = p_round;
  ELSIF p_status = 'active' AND v_rc.status = 'paused' THEN
    UPDATE rounds_config SET
      status = 'active',
      total_paused_seconds = total_paused_seconds + COALESCE(EXTRACT(EPOCH FROM (now() - pause_started_at))::int, 0),
      pause_started_at = NULL,
      updated_at = now()
    WHERE round = p_round;
    UPDATE team_round_state SET
      deadline = deadline + COALESCE(EXTRACT(EPOCH FROM (now() - v_rc.pause_started_at))::int, 0) * interval '1 second'
    WHERE round = p_round AND status = 'in_progress';
  ELSE
    UPDATE rounds_config SET status = p_status, updated_at = now(), pause_started_at = NULL WHERE round = p_round;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_disqualify_team(p_team_id uuid, p_disqualified boolean DEFAULT true)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'not_admin'; END IF;
  UPDATE teams SET disqualified = p_disqualified WHERE id = p_team_id;
  PERFORM log_event_internal(p_team_id, NULL, 'disqualified', jsonb_build_object('value', p_disqualified));
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reset_session(p_team_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'not_admin'; END IF;
  UPDATE team_sessions SET invalidated_at = now() WHERE team_id = p_team_id AND invalidated_at IS NULL;
  PERFORM log_event_internal(p_team_id, NULL, 'session_reset', '{}');
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_grant_extra_time(p_team_id uuid, p_round int, p_seconds int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'not_admin'; END IF;
  UPDATE team_round_state SET
    extra_seconds = extra_seconds + p_seconds,
    deadline = CASE WHEN deadline IS NOT NULL THEN deadline + (p_seconds || ' seconds')::interval ELSE deadline END
  WHERE team_id = p_team_id AND round = p_round;
  PERFORM log_event_internal(p_team_id, p_round, 'extra_time', jsonb_build_object('seconds', p_seconds));
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_force_submit(p_team_id uuid, p_round int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'not_admin'; END IF;
  PERFORM finalize_team_round(p_team_id, p_round, 'force');
  PERFORM log_event_internal(p_team_id, p_round, 'force_submit', '{}');
END;
$$;

-- ---------------------------------------------------------------------------
-- Standings views
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW round1_standings AS
WITH base AS (
  SELECT
    t.id AS team_id,
    t.name AS team_name,
    t.batch,
    t.disqualified,
    trs.status,
    trs.started_at,
    trs.deadline,
    trs.current_question_index,
    trs.question_order,
    COALESCE(SUM(a.points), 0)::int AS score,
    COALESCE(SUM(a.bonus), 0)::int AS bonus_score,
    COALESCE(SUM(a.points + a.bonus), 0)::int AS total_score,
    COUNT(a.submitted_at) FILTER (WHERE a.submitted_at IS NOT NULL)::int AS questions_solved,
    CASE WHEN trs.started_at IS NOT NULL AND trs.deadline IS NOT NULL THEN
      EXTRACT(EPOCH FROM (LEAST(trs.deadline, now()) - trs.started_at))::int ELSE NULL END AS time_taken,
    (SELECT tab_switches FROM violation_counts(t.id, 1)) AS tab_switches,
    (SELECT fullscreen_exit FROM violation_counts(t.id, 1)) AS fullscreen_exits
  FROM teams t
  LEFT JOIN team_round_state trs ON trs.team_id = t.id AND trs.round = 1
  LEFT JOIN answers a ON a.team_id = t.id AND a.question_id LIKE 'r1-%'
  GROUP BY t.id, t.name, t.batch, t.disqualified, trs.status, trs.started_at, trs.deadline,
    trs.current_question_index, trs.question_order
)
SELECT
  team_id,
  team_name,
  batch,
  disqualified,
  status,
  current_question_index,
  question_order,
  score,
  bonus_score,
  total_score,
  questions_solved,
  time_taken,
  tab_switches,
  fullscreen_exits,
  rank() OVER (ORDER BY total_score DESC, time_taken ASC NULLS LAST, tab_switches ASC NULLS LAST) AS rank
FROM base;

CREATE OR REPLACE VIEW round2_standings AS
WITH base AS (
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
    COALESCE(SUM(a.points), 0)::int AS total_score,
    trs.current_case_index AS cases_solved,
    CASE WHEN trs.started_at IS NOT NULL AND trs.deadline IS NOT NULL THEN
      EXTRACT(EPOCH FROM (LEAST(trs.deadline, now()) - trs.started_at))::int ELSE NULL END AS time_taken,
    (SELECT tab_switches FROM violation_counts(t.id, 2)) AS tab_switches
  FROM teams t
  LEFT JOIN team_round_state trs ON trs.team_id = t.id AND trs.round = 2
  LEFT JOIN answers a ON a.team_id = t.id AND a.question_id LIKE 'r2-%'
  GROUP BY t.id, t.name, t.batch, t.disqualified, trs.status, trs.started_at, trs.deadline,
    trs.current_case_index, trs.case_order
)
SELECT *, rank() OVER (ORDER BY total_score DESC, time_taken ASC NULLS LAST, tab_switches ASC NULLS LAST) AS rank
FROM base;

CREATE OR REPLACE VIEW round3_standings AS
WITH base AS (
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
    MAX(CASE WHEN lc.case_id = 'r3-case1' THEN lc.option END) AS case1_leverage,
    MAX(CASE WHEN lc.case_id = 'r3-case2' THEN lc.option END) AS case2_leverage,
    COALESCE(SUM(a.points) FILTER (WHERE a.question_id LIKE 'r3-c1-%'), 0)::int AS case1_score,
    COALESCE(SUM(a.points) FILTER (WHERE a.question_id LIKE 'r3-c2-%'), 0)::int AS case2_score,
    COALESCE(SUM(a.points), 0)::int AS total_score,
    CASE WHEN trs.started_at IS NOT NULL AND trs.deadline IS NOT NULL THEN
      EXTRACT(EPOCH FROM (LEAST(trs.deadline, now()) - trs.started_at))::int ELSE NULL END AS time_taken,
    (SELECT tab_switches FROM violation_counts(t.id, 3)) AS tab_switches
  FROM teams t
  LEFT JOIN team_round_state trs ON trs.team_id = t.id AND trs.round = 3
  LEFT JOIN answers a ON a.team_id = t.id AND a.question_id LIKE 'r3-%'
  LEFT JOIN leverage_choices lc ON lc.team_id = t.id
  GROUP BY t.id, t.name, t.batch, t.disqualified, trs.status, trs.started_at, trs.deadline,
    trs.current_case_index, trs.case_order
)
SELECT *, rank() OVER (ORDER BY total_score DESC, time_taken ASC NULLS LAST, tab_switches ASC NULLS LAST) AS rank
FROM base;

CREATE OR REPLACE VIEW overall_standings AS
WITH r1 AS (SELECT team_id, total_score AS r1_score FROM round1_standings),
     r2 AS (SELECT team_id, total_score AS r2_score FROM round2_standings),
     r3 AS (SELECT team_id, total_score AS r3_score FROM round3_standings),
     viol AS (
       SELECT team_id, SUM(tab_switches)::int AS tab_switches FROM (
         SELECT team_id, tab_switches FROM round1_standings
         UNION ALL SELECT team_id, tab_switches FROM round2_standings
         UNION ALL SELECT team_id, tab_switches FROM round3_standings
       ) x GROUP BY team_id
     )
SELECT
  t.id AS team_id,
  t.name AS team_name,
  t.batch,
  t.disqualified,
  COALESCE(r1.r1_score, 0) AS round1_score,
  COALESCE(r2.r2_score, 0) AS round2_score,
  COALESCE(r3.r3_score, 0) AS round3_score,
  COALESCE(r1.r1_score, 0) + COALESCE(r2.r2_score, 0) + COALESCE(r3.r3_score, 0) AS total_score,
  COALESCE(v.tab_switches, 0) AS tab_switches,
  rank() OVER (
    ORDER BY
      COALESCE(r1.r1_score, 0) + COALESCE(r2.r2_score, 0) + COALESCE(r3.r3_score, 0) DESC,
      COALESCE((SELECT time_taken FROM round3_standings rs WHERE rs.team_id = t.id), 999999) ASC,
      COALESCE(v.tab_switches, 0) ASC
  ) AS rank
FROM teams t
LEFT JOIN r1 ON r1.team_id = t.id
LEFT JOIN r2 ON r2.team_id = t.id
LEFT JOIN r3 ON r3.team_id = t.id
LEFT JOIN viol v ON v.team_id = t.id;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_round_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE leverage_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_key ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- answer_key: no client access
CREATE POLICY answer_key_deny_all ON answer_key FOR ALL USING (false);

-- Admin read policies
CREATE POLICY admin_teams ON teams FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY admin_members ON members FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY admin_sessions ON team_sessions FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY admin_rounds_config ON rounds_config FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY admin_team_round_state ON team_round_state FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY admin_answers ON answers FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY admin_leverage ON leverage_choices FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY admin_events ON events FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY admin_admin_users ON admin_users FOR SELECT TO authenticated USING (is_admin());

-- Realtime: admin needs select on base tables (policies above)

GRANT SELECT ON round1_standings, round2_standings, round3_standings, overall_standings TO authenticated;

-- ---------------------------------------------------------------------------
-- pg_cron (enable extension in Supabase dashboard if needed)
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'bankonomy-finalize-expired',
  '15 seconds',
  $$SELECT public.finalize_expired_rounds();$$
);

-- RPC execute grants (teams use anon; admins use authenticated)
GRANT EXECUTE ON FUNCTION public.server_now() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.login_with_code(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_event(text, int, text, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.start_round(text, int, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_round_state(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.begin_question(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_answer(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_case(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.choose_leverage(text, text, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.previous_question(text, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_register_team(text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_round_status(int, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_disqualify_team(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reset_session(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_grant_extra_time(uuid, int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_force_submit(uuid, int) TO authenticated;
