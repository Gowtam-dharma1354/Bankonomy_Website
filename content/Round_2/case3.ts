import type { Round2Case } from "../types";

const caseStudy: Round2Case = {
  id: "r2-case3",
  title: "Dakshin-Path Tollways & Infra Corp.",
  caseText: `Adapted real-world scenario – Infrastructure

Note: This case is inspired by real-world credit dynamics in the Indian road infrastructure sector and is not a verbatim reproduction of an actual historical transaction.

Company background:Dakshin-Path Tollways & Infra Corp. (DPTIC) is an EPC and build-operate-transfer (BOT) road developer with annual revenues of ₹1,450 crore. While its order book stands at a healthy ₹4,200 crore, consolidated debt has risen to ₹2,900 crore, pulling its Interest Coverage Ratio down to 1.25x. DPTIC is requesting a ₹300 crore term loan for equipment purchases and mobilization advances for a newly awarded highway project.

Despite steady construction margins of 13%, operating cash flows have been negative for two consecutive years. Nearly ₹680 crore of DPTIC’s net worth is locked as equity investments and unsecured loans in three operational toll-road subsidiaries (SPVs) where commercial traffic has fallen 30% short of initial projections due to competing state highways. Furthermore, ₹450 crore in receivables is tied up in prolonged arbitration claims with state nodal agencies. The company’s promoters have already pledged 72% of their shareholding to existing lenders. DPTIC offers a subservient charge on current assets and a corporate guarantee from one of its underperforming toll SPVs as security for the ₹300 crore loan.`,
  questions: [
    {
      id: "r2-c3-q1",
      question: "What is the most appropriate decision for the bank regarding DPTIC’s ₹300 crore loan application?",
      options: [
        { id: "A", text: "Sanction the loan in full, as the ₹4,200 crore order book guarantees sufficient future revenue to resolve current liquidity mismatches." },
        { id: "B", text: "Approve ₹150 crore immediately against the ₹450 crore arbitration claims, treating disputed receivables as cash equivalents." },
        { id: "C", text: "Sanction the loan subject to the promoters pledging the remaining 28% of their unencumbered equity shares as primary collateral." },
        { id: "D", text: "Reject the proposal, as the combination of chronically negative operating cash flows, low interest coverage (1.25x), trapped capital in distressed SPVs, and weak security presents unacceptable credit risk." },
      ],
      correctOption: "D",
    },
    {
      id: "r2-c3-q2",
      question: "In assessing DPTIC’s balance sheet and cash flows, what is the core analytical flaw in relying on its reported net worth and ₹450 crore receivable balance to justify additional lending?",
      options: [
        { id: "A", text: "Accounting net worth and book receivables do not pay interest; when capital is illiquid in underperforming SPVs and disputed claims, real debt-servicing liquidity is severely overstated." },
        { id: "B", text: "Construction companies are required to write off all state nodal agency receivables within 90 days, making the reported balance legally invalid." },
        { id: "C", text: "A high order book automatically reduces a company's net worth by increasing its future tax liabilities." },
        { id: "D", text: "Subservient charges on current assets give the new lender priority over existing consortium banks in liquidating the arbitration claims." },
      ],
      correctOption: "A",
    },
    {
      id: "r2-c3-q3",
      question: "Why does the corporate guarantee from the operational toll SPV fail to provide meaningful credit enhancement for the proposed ₹300 crore facility?",
      options: [
        { id: "A", text: "Corporate guarantees from subsidiary companies are legally unenforceable under Indian banking and contract law." },
        { id: "B", text: "Toll Road SPVs collect revenue in cash, which cannot be routed through commercial bank escrow accounts for debt repayment." },
        { id: "C", text: "An SPV experiencing a 30% traffic shortfall is already struggling to service its own project-level debt, offering negligible residual cash flow to support the parent company's obligations." },
        { id: "D", text: "The SPV’s guarantee would only become valid after the parent company completes 100% of its ₹4,200 crore order book." },
      ],
      correctOption: "C",
    },
    {
      id: "r2-c3-q4",
      question: "Assume DPTIC enters a binding agreement with an Infrastructure Investment Trust (InvIT) to sell two of its toll SPVs for ₹950 crore in cash, committed solely to retiring existing debt, and requests the bank to fund only a ₹100 crore ring-fenced project facility backed by an escrow on central government annuity payments. How should the bank respond?",
      options: [
        { id: "A", text: "Maintain the outright rejection, because any company that has experienced negative operating cash flows in the past cannot be lent to for five years." },
        { id: "B", text: "Defer the decision until the ₹950 crore InvIT sale closes and debt reduction is verified, with a view to sanctioning the ring-fenced ₹100 crore facility once leverage and cash-flow ring-fencing are established." },
        { id: "C", text: "Sanction the original ₹300 crore loan immediately without waiting for the InvIT transaction to close, relying on the press announcement of the sale." },
        { id: "D", text: "Reject the ₹100 crore ring-fenced structure because annuity payments from central agencies carry higher traffic risk than state toll roads." },
      ],
      correctOption: "B",
    },
  ],
};

export default caseStudy;
