import type { Round2Case } from "../types";

const caseStudy: Round2Case = {
  id: "r2-case1",
  title: "Vardhan Precision Forgings Ltd.",
  caseText: `Company background: Vardhan Precision Forgings Ltd. (VPFL) manufactures specialized steel components for commercial vehicles and railways. Over the last three years, annual revenue grew steadily by 14% to reach ₹620 crore, supported by consistent operating cash flows and a stable EBITDA margin of 16%. VPFL currently maintains low leverage, with a Debt-to-EBITDA ratio of 1.6x and an Interest Coverage Ratio (ICR) of 4.2x.

VPFL is requesting a 6-year term loan of ₹120 crore to set up an automated forging line in Pune, pledging the new plant and machinery as primary collateral alongside a 25% promoter equity contribution. While domestic railway demand remains strong, a single European automotive client accounts for 35% of total revenue. Recently, VPFL’s illustrative stock price fell by 18% after market analysts flagged rising energy costs in Europe; however, stock-price performance is contextual market evidence and not a substitute for fundamental credit analysis. Additionally, alloy steel input prices have become volatile, and the European client is currently renegotiating its three-year supply contract, requesting a 60-day extension in credit terms without a fixed minimum off-take guarantee.`,
  questions: [
    {
      id: "r2-c1-q1",
      question: "Based on the credit profile and business outlook provided, what is the most prudent lending decision for the bank regarding VPFL’s ₹120 crore loan request?",
      options: [
        { id: "A", text: "Sanction the full ₹120 crore loan with standard covenants, as the company’s strong historical operating cash flows and 25% equity contribution provide adequate cushion against client concentration." },
        { id: "B", text: "Reject the loan proposal immediately, because the 18% decline in the company's stock price and European headwinds indicate an imminent deterioration in core solvency." },
        { id: "C", text: "Sanction the loan subject to specific risk-mitigating conditions, including raw material price pass-through verification and tighter working capital covenants to manage extended receivables." },
        { id: "D", text: "Defer the loan decision until the company replaces its European client with domestic railway contracts to eliminate foreign revenue exposure completely." },
      ],
      correctOption: "C",
    },
    {
      id: "r2-c1-q2",
      question: "Which factor represents the most material threat to VPFL’s debt service coverage over the tenure of the proposed term loan?",
      options: [
        { id: "A", text: "The existing Debt-to-EBITDA ratio of 1.6x, which leaves no headroom for capital expenditure borrowing." },
        { id: "B", text: "Potential compression in operating cash flows from simultaneous raw material cost volatility and elongated receivable cycles from its largest customer." },
        { id: "C", text: "The recent 18% correction in the company’s equity market valuation, which directly reduces the liquidation value of the proposed plant and machinery collateral." },
        { id: "D", text: "The dependence on the domestic railway sector, which typically offers lower operating margins than export markets." },
      ],
      correctOption: "B",
    },
    {
      id: "r2-c1-q3",
      question: "Why does the 18% drop in VPFL’s illustrative stock price have limited standalone weight in determining whether the bank should reject the credit facility?",
      options: [
        { id: "A", text: "Equity market movements often reflect short-term investor sentiment regarding growth expectations, whereas credit appraisal focuses on downside cash-flow stability and debt servicing ability." },
        { id: "B", text: "Stock prices only affect a company's ability to raise working capital from commercial banks, having no bearing on long-term project finance loans." },
        { id: "C", text: "The Reserve Bank of India prohibits commercial banks from reviewing capital market indicators when appraising secured manufacturing term loans." },
        { id: "D", text: "A declining stock price improves the borrower's creditworthiness because management becomes less likely to distribute cash flows as dividends to shareholders." },
      ],
      correctOption: "A",
    },
    {
      id: "r2-c1-q4",
      question: "Assume that before disbursement, the European client cancels its contract entirely, and VPFL decides to fund the entire ₹120 crore expansion through debt by withdrawing its 25% promoter equity contribution. How should the bank revise its stance?",
      options: [
        { id: "A", text: "Proceed with the sanction by increasing the interest rate by 150 basis points to compensate for the higher leverage and loss of revenue visibility." },
        { id: "B", text: "Defer or reject the current proposal, as the simultaneous loss of 35% revenue visibility and removal of promoter skin-in-the-game fundamentally alters project viability and leverage." },
        { id: "C", text: "Sanction the full amount provided the promoters pledge their unencumbered listed shares to cover the 25% equity shortfall." },
        { id: "D", text: "Approve 65% of the loan amount immediately without requiring promoter equity, scaling the debt down proportionally to the remaining domestic revenue share." },
      ],
      correctOption: "B",
    },
  ],
};

export default caseStudy;
