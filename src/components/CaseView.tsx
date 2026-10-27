import type { PublicCase } from "../types/api";
import { QuestionCard } from "./QuestionCard";

type Props = {
  caseStudy: PublicCase;
  questionIndex: number;
  selected: string | null;
  onSelect: (id: string) => void;
  onNext: () => void;
  onPrevious?: () => void;
  submitting?: boolean;
};

export function CaseView({ caseStudy, questionIndex, selected, onSelect, onNext, onPrevious, submitting }: Props) {
  const q = caseStudy.questions[questionIndex];
  const isLast = questionIndex === caseStudy.questions.length - 1;

  return (
    <div className="case-layout no-select" onContextMenu={(e) => e.preventDefault()}>
      <aside className="case-text-panel">
        <h2>{caseStudy.title}</h2>
        <div className="case-text-scroll">{caseStudy.caseText}</div>
      </aside>
      <section className="case-questions-panel">
        <p className="case-progress">
          Question {questionIndex + 1} of {caseStudy.questions.length}
        </p>
        {q && (
          <QuestionCard question={q} selected={selected} onSelect={onSelect} disabled={submitting} />
        )}
        <div className="case-actions">
          {questionIndex > 0 && onPrevious && (
            <button
              type="button"
              className="btn btn-ghost case-previous"
              disabled={submitting}
              onClick={onPrevious}
            >
              Previous
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary case-next"
            disabled={!selected || submitting}
            onClick={onNext}
          >
            {isLast ? "Submit Case" : "Next"}
          </button>
        </div>
      </section>
    </div>
  );
}
