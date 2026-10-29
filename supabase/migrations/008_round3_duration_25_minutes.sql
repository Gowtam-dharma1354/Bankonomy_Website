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
