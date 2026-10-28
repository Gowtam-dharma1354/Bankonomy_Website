CREATE OR REPLACE VIEW round2_standings AS
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
),
ranked AS (
  SELECT base.*,
    rank() OVER (ORDER BY total_score DESC, time_taken ASC NULLS LAST, tab_switches ASC NULLS LAST) AS rank
  FROM base
)
SELECT ranked.*,
  (SELECT fullscreen_exit FROM violation_counts(ranked.team_id, 2)) AS fullscreen_exits
FROM ranked;

CREATE OR REPLACE VIEW round3_standings AS
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
),
ranked AS (
  SELECT base.*,
    rank() OVER (ORDER BY total_score DESC, time_taken ASC NULLS LAST, tab_switches ASC NULLS LAST) AS rank
  FROM base
)
SELECT ranked.*,
  (SELECT fullscreen_exit FROM violation_counts(ranked.team_id, 3)) AS fullscreen_exits
FROM ranked;

CREATE OR REPLACE VIEW overall_standings AS
WITH r1 AS (
  SELECT team_id, total_score AS r1_score, time_taken AS r1_time, fullscreen_exits FROM round1_standings
),
r2 AS (
  SELECT team_id, total_score AS r2_score, time_taken AS r2_time, fullscreen_exits FROM round2_standings
),
r3 AS (
  SELECT team_id, total_score AS r3_score, time_taken AS r3_time, fullscreen_exits FROM round3_standings
),
viol AS (
  SELECT team_id, SUM(tab_switches)::int AS tab_switches FROM (
    SELECT team_id, tab_switches FROM round1_standings
    UNION ALL SELECT team_id, tab_switches FROM round2_standings
    UNION ALL SELECT team_id, tab_switches FROM round3_standings
  ) x GROUP BY team_id
),
fullscreen AS (
  SELECT team_id, SUM(fullscreen_exits)::int AS fullscreen_exits FROM (
    SELECT team_id, fullscreen_exits FROM round1_standings
    UNION ALL SELECT team_id, fullscreen_exits FROM round2_standings
    UNION ALL SELECT team_id, fullscreen_exits FROM round3_standings
  ) x GROUP BY team_id
),
ranked AS (
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
  LEFT JOIN viol v ON v.team_id = t.id
)
SELECT ranked.*, COALESCE(fullscreen.fullscreen_exits, 0)::int AS fullscreen_exits
FROM ranked
LEFT JOIN fullscreen ON fullscreen.team_id = ranked.team_id;
