import { VIOLATION_THRESHOLD } from "../config/constants";
import type { ViolationCounts } from "../types/api";

type Props = {
  violations: ViolationCounts;
  showFullscreen?: boolean;
};

export function ViolationBadge({ violations, showFullscreen = true }: Props) {
  const total = violations.total;
  const hot = total >= VIOLATION_THRESHOLD;
  return (
    <div className={`violation-badge ${hot ? "violation-hot" : ""}`}>
      <span>Violations: {total}</span>
      {showFullscreen && violations.fullscreen_exit > 0 && (
        <span className="violation-sub">Fullscreen exits: {violations.fullscreen_exit}</span>
      )}
    </div>
  );
}
