type Props = {
  label: string;
  expanded: boolean;
  onToggle: () => void;
};

export function ExpandableHeader({ label, expanded, onToggle }: Props) {
  return (
    <button
      type="button"
      className={`expand-header ${expanded ? "is-expanded" : ""}`}
      onClick={onToggle}
      aria-expanded={expanded}
    >
      <span>{label}</span>
      <span className="expand-indicator" aria-hidden="true">{expanded ? "−" : "+"}</span>
    </button>
  );
}
