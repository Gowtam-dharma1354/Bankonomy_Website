import { useEffect, useState } from "react";
import { msUntil, nowMs } from "../lib/serverClock";

type Props = {
  deadlineIso: string | null;
  label?: string;
  onExpire?: () => void;
  className?: string;
};

function format(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function Timer({ deadlineIso, label, onExpire, className }: Props) {
  const [display, setDisplay] = useState("--:--");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!deadlineIso) return;
    let fired = false;
    const tick = () => {
      const left = msUntil(deadlineIso);
      if (left === null) return;
      if (left <= 0) {
        setDisplay("0:00");
        setExpired(true);
        if (!fired) {
          fired = true;
          onExpire?.();
        }
      } else {
        setDisplay(format(left));
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [deadlineIso, onExpire]);

  return (
    <div className={`timer ${expired ? "timer-expired" : ""} ${className ?? ""}`}>
      {label && <span className="timer-label">{label}</span>}
      <span className="timer-value">{display}</span>
    </div>
  );
}

type BonusProps = {
  startedAtIso: string | null;
  bonusSeconds?: number;
};

export function BonusTimer({ startedAtIso, bonusSeconds = 30 }: BonusProps) {
  const [display, setDisplay] = useState<string | null>(null);
  const [lost, setLost] = useState(false);

  useEffect(() => {
    if (!startedAtIso) return;
    const endMs = new Date(startedAtIso).getTime() + bonusSeconds * 1000;
    const tick = () => {
      const left = endMs - nowMs();
      if (left <= 0) {
        setLost(true);
        setDisplay("Bonus lost");
      } else {
        setDisplay(format(left));
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [startedAtIso, bonusSeconds]);

  if (!startedAtIso) return null;

  return (
    <div className={`bonus-timer ${lost ? "bonus-lost" : ""}`}>
      <span className="timer-label">Bonus window</span>
      <span className="timer-value">{display}</span>
    </div>
  );
}
