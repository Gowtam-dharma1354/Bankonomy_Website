import type { PublicMcq } from "../types/api";

type Props = {
  question: PublicMcq;
  selected: string | null;
  onSelect: (id: string) => void;
  disabled?: boolean;
};

export function QuestionCard({ question, selected, onSelect, disabled }: Props) {
  return (
    <div className="question-card no-select" onContextMenu={(e) => e.preventDefault()}>
      <h2 className="question-text">{question.question}</h2>
      <ul className="options-list">
        {question.options.map((o) => (
          <li key={o.id}>
            <label className={`option ${selected === o.id ? "option-selected" : ""}`}>
              <input
                type="radio"
                name={question.id}
                value={o.id}
                checked={selected === o.id}
                disabled={disabled}
                onChange={() => onSelect(o.id)}
              />
              <span className="option-id">{o.id}.</span>
              <span>{o.text}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
