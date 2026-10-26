let offsetMs = 0;

export function setServerClockOffset(serverNowIso: string) {
  const serverMs = new Date(serverNowIso).getTime();
  offsetMs = serverMs - Date.now();
}

export function nowMs(): number {
  return Date.now() + offsetMs;
}

export function msUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return new Date(iso).getTime() - nowMs();
}
