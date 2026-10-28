import type { Round2Case } from "../types";

const caseStudy: Round2Case = {
  id: "r2-case4",
  title: "Company background:",
  caseText: `ArogyaSynth API Pharmaceuticals Ltd. manufactures Active Pharmaceutical Ingredients (APIs) for cardiovascular and anti-diabetic drugs, generating ₹880 crore in annual revenue. Two years ago, its EBITDA margin dipped from 20% to 12% due to sudden price spikes in imported chemical Key Starting Materials (KSMs) and higher freight costs. Following backward integration and renegotiated annual supply contracts, margins recovered to 17.5% over the last two quarters. Leverage remains moderate with a Debt-to-EBITDA ratio of 2.3x and an Interest Coverage Ratio of 3.1x.

ArogyaSynth seeks a ₹160 crore 5-year term loan to commission a backward-integrated fermentation unit that qualifies under the government’s Production Linked Incentive (PLI) scheme, aiming to reduce imported KSM dependence from 65% to 25%. The company offers a first pari-passu charge on fixed assets (asset coverage ratio of 1.8x). However, the US Food and Drug Administration (USFDA) recently concluded a routine inspection at ArogyaSynth’s flagship plant—which contributes 40% of revenue—and issued three procedural observations regarding laboratory data logging. Management has submitted corrective actions, and final regulatory clearance is expected within 60 days.`,
  questions: [
    {
      id: "r2-c4-q1",
      question: "What is the most commercially and financially sound course of action for the bank regarding ArogyaSynth’s ₹160 crore loan request?",
      options: [
        { id: "A", text: "Sanction and disburse the ₹160 crore loan immediately without conditions, because backward integration under the PLI scheme eliminates all operational and regulatory risks." },
        { id: "B", text: "Defer final disbursement (or make sanction contingent) until the USFDA inspection observations are satisfactorily resolved, as an adverse escalation at a plant generating 40% of revenue could severely impair repayment capacity." },
        { id: "C", text: "Reject the proposal permanently, because the historical margin drop from 20% to 12% proves that the pharmaceutical API sector is structurally unprofitable." },
        { id: "D", text: "Sanction the loan immediately by taking a second charge on imported KSM inventory instead of fixed assets to bypass regulatory uncertainty." },
      ],
      correctOption: "B",
    },
    {
      id: "r2-c4-q2",
      question: "How should the credit analyst interpret the decline in ArogyaSynth’s EBITDA margin to 12% two years ago and its subsequent recovery to 17.5%?",
      options: [
        { id: "A", text: "It reflects temporary input cost and supply-chain pressure that management is actively addressing through backward integration, rather than permanent business deterioration." },
        { id: "B", text: "It proves that the company manipulates its accounting depreciation schedules every two years to artificially boost reported margins prior to applying for bank loans." },
        { id: "C", text: "It indicates that the company’s cardiovascular and anti-diabetic API portfolio has become medically obsolete and faces permanent demand destruction." },
        { id: "D", text: "It demonstrates that revenue growth in the pharmaceutical industry always causes operating margins to contract due to regulatory compliance costs." },
      ],
      correctOption: "A",
    },
    {
      id: "r2-c4-q3",
      question: "Why is the resolution of the USFDA observations at the flagship facility critical to the bank’s credit appraisal, even though the proposed ₹160 crore loan is for a new domestic fermentation unit?",
      options: [
        { id: "A", text: "Under Indian banking regulations, a company with any pending foreign regulatory observation is legally barred from operating domestic bank accounts." },
        { id: "B", text: "During the construction and ramp-up phase of the new unit, the company’s existing operating cash flows—heavily reliant on the flagship plant—must service the interest and existing debt obligations." },
        { id: "C", text: "The USFDA holds the legal authority to seize the new domestic fermentation equipment if procedural observations at another plant are not resolved within 30 days." },
        { id: "D", text: "The government’s PLI scheme only reimburses capital expenditure for companies that export 100% of their production to the United States." },
      ],
      correctOption: "B",
    },
    {
      id: "r2-c4-q4",
      question: "Suppose ArogyaSynth receives an Establishment Inspection Report (EIR) clearing the USFDA observations within 45 days, and subsequently requests loan disbursement. Which covenant structure is most appropriate for sanctioning the ₹160 crore facility?",
      options: [
        { id: "A", text: "Sanction the loan with no financial covenants, since regulatory clearance guarantees that the company will maintain a 20% EBITDA margin indefinitely." },
        { id: "B", text: "Sanction the loan on the condition that ArogyaSynth halts all exports to regulated markets to avoid future inspection costs." },
        { id: "C", text: "Sanction only ₹40 crore and require the company to fund the remaining ₹120 crore through short-term 90-day commercial paper rollovers." },
        { id: "D", text: "Sanction the loan subject to project completion milestones, a cap on total Debt-to-EBITDA at 2.75x, mandatory hedging on unhedged foreign currency exposure, and routing of project cash flows through an escrow/trust and retention account." },
      ],
      correctOption: "D",
    },
  ],
};

export default caseStudy;
