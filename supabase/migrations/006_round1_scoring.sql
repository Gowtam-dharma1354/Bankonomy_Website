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
    points := CASE WHEN v_is_correct THEN 5 ELSE 0 END;
    bonus := CASE
      WHEN v_is_correct
        AND p_started_at IS NOT NULL
        AND p_submitted_at <= p_started_at + interval '30 seconds'
      THEN 5 ELSE 0 END;
    RETURN NEXT;
    RETURN;
  END IF;

  IF p_question_id LIKE 'r2-%' THEN
    points := CASE WHEN v_is_correct THEN 10 ELSE 0 END;
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
  WHEN a.selected_option IS NOT NULL AND a.selected_option = ak.correct_option THEN 5
  ELSE 0
END
FROM answer_key ak
WHERE a.question_id LIKE 'r1-%'
  AND ak.question_id = a.question_id;
