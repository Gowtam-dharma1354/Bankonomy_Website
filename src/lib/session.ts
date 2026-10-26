const TOKEN_KEY = "bankonomy_session_token";

export function getSessionToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setSessionToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearSessionToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}
