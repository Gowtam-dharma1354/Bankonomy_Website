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

GRANT EXECUTE ON FUNCTION public.previous_question(text, int) TO anon, authenticated;
