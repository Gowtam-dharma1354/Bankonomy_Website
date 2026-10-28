export type ViolationCounts = {
  fullscreen_exit: number;
  tab_hidden: number;
  window_blur: number;
  tab_switches: number;
  total: number;
};

export type RoundSlice = {
  global_status: "lobby" | "active" | "paused" | "ended";
  status: "waiting" | "in_progress" | "completed" | "auto_finalized";
  started_at: string | null;
  deadline: string | null;
  question_order: string[] | null;
  case_order: string[] | null;
  current_question_index: number;
  current_case_index: number;
  violations: ViolationCounts;
};

export type AnswerRow = {
  question_id: string;
  selected_option: string | null;
  started_at: string | null;
  submitted_at: string | null;
  points: number;
  bonus: number;
};

export type RoundStatePayload = {
  team_id: string;
  team_name: string;
  batch: string;
  disqualified: boolean;
  server_now: string;
  round_1: RoundSlice;
  round_2: RoundSlice;
  round_3: RoundSlice;
  answers: AnswerRow[];
  leverage: { case_id: string; option: number }[];
};

export type PublicMcq = {
  id: string;
  question: string;
  options: { id: string; text: string }[];
  image?: string;
};

export type PublicCase = {
  id: string;
  title: string;
  caseText: string;
  summary?: string;
  questions: PublicMcq[];
};
