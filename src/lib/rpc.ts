import { supabase } from "./supabase";
import type { RoundStatePayload } from "../types/api";

export async function rpcServerNow(): Promise<string> {
  const { data, error } = await supabase.rpc("server_now");
  if (error) throw error;
  return data as string;
}

export async function rpcLoginWithCode(code: string) {
  const { data, error } = await supabase.rpc("login_with_code", { p_code: code });
  if (error) throw error;
  return data as {
    session_token: string;
    team_id: string;
    team_name: string;
    batch: string;
    disqualified: boolean;
  };
}

export async function rpcGetRoundState(token: string): Promise<RoundStatePayload> {
  const { data, error } = await supabase.rpc("get_round_state", { p_token: token });
  if (error) throw error;
  return data as RoundStatePayload;
}

export async function rpcStartRound(token: string, round: number, code: string) {
  const { data, error } = await supabase.rpc("start_round", {
    p_token: token,
    p_round: round,
    p_code: code,
  });
  if (error) throw error;
  return data as RoundStatePayload;
}

export async function rpcBeginQuestion(token: string, questionId: string) {
  const { data, error } = await supabase.rpc("begin_question", {
    p_token: token,
    p_question_id: questionId,
  });
  if (error) throw error;
  return data as { question_id: string; started_at: string };
}

export async function rpcSubmitAnswer(token: string, questionId: string, selected: string) {
  const { data, error } = await supabase.rpc("submit_answer", {
    p_token: token,
    p_question_id: questionId,
    p_selected_option: selected,
  });
  if (error) throw error;
  return data as { points: number; bonus: number; submitted_at: string };
}

export async function rpcSubmitCase(token: string, caseId: string) {
  const { data, error } = await supabase.rpc("submit_case", {
    p_token: token,
    p_case_id: caseId,
  });
  if (error) throw error;
  return data as RoundStatePayload;
}

export async function rpcChooseLeverage(token: string, caseId: string, option: 1 | 2) {
  const { data, error } = await supabase.rpc("choose_leverage", {
    p_token: token,
    p_case_id: caseId,
    p_option: option,
  });
  if (error) throw error;
  return data as { case_id: string; option: number };
}

export async function rpcLogEvent(
  token: string,
  round: number | null,
  eventType: "fullscreen_exit" | "tab_hidden" | "window_blur",
) {
  const { error } = await supabase.rpc("log_event", {
    p_token: token,
    p_round: round,
    p_event_type: eventType,
    p_metadata: {},
  });
  if (error) console.error("log_event", error);
}

export async function rpcAdminRegisterTeam(name: string, batch: string, members: { name: string; email: string }[]) {
  const { data, error } = await supabase.rpc("admin_register_team", {
    p_name: name,
    p_batch: batch,
    p_members: members,
  });
  if (error) throw error;
  return data as { team_id: string; code: string };
}

export async function rpcAdminSetRoundStatus(round: number, status: string) {
  const { error } = await supabase.rpc("admin_set_round_status", { p_round: round, p_status: status });
  if (error) throw error;
}

export async function rpcAdminDisqualify(teamId: string, disqualified = true) {
  const { error } = await supabase.rpc("admin_disqualify_team", {
    p_team_id: teamId,
    p_disqualified: disqualified,
  });
  if (error) throw error;
}

export async function rpcAdminResetSession(teamId: string) {
  const { error } = await supabase.rpc("admin_reset_session", { p_team_id: teamId });
  if (error) throw error;
}

export async function rpcAdminGrantExtraTime(teamId: string, round: number, seconds: number) {
  const { error } = await supabase.rpc("admin_grant_extra_time", {
    p_team_id: teamId,
    p_round: round,
    p_seconds: seconds,
  });
  if (error) throw error;
}

export async function rpcAdminForceSubmit(teamId: string, round: number) {
  const { error } = await supabase.rpc("admin_force_submit", { p_team_id: teamId, p_round: round });
  if (error) throw error;
}
