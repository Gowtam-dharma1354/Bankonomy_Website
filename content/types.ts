export type McqOption = { id: string; text: string };

export type Round1Question = {
  id: string;
  question: string;
  options: McqOption[];
  correctOption: string;
};

export type CaseQuestion = {
  id: string;
  question: string;
  options: McqOption[];
  correctOption: string;
};

export type Round2Case = {
  id: string;
  title: string;
  caseText: string;
  summary?: string;
  questions: CaseQuestion[];
};

export type Round3Case = {
  id: string;
  title: string;
  caseText: string;
  summary: string;
  questions: CaseQuestion[];
};
