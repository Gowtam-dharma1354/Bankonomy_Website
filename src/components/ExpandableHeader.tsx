type Props = {
  label: string;
  expanded: boolean;
  onToggle: () => void;
};

export function ExpandableHeader({ label, expanded, onToggle }: Props) {
  return (
    <button type="button" className="expand-header" onClick={onToggle} aria-expanded={expanded}>
      {label} <span aria-hidden>{expanded ? "⊟" : "⊞"}</span>
    </button>
  );
}
