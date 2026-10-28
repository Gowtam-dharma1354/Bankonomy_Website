import type { Round2Case } from "../types";

const caseStudy: Round2Case = {
  id: "r2-case2",
  title: "QuantEdge Broking & Algo-Tech Ltd.",
  caseText: `Company background: QuantEdge Broking & Algo-Tech Ltd. is a listed fintech firm providing low-latency algorithmic execution platforms to retail discount brokers and proprietary trading desks. Driven by a surge in derivatives trading volumes, its revenue doubled over two years to ₹280 crore, with a healthy EBITDA margin of 28% and minimal long-term debt of ₹15 crore. QuantEdge seeks an ₹85 crore 4-year facility to upgrade its co-location server infrastructure and meet increased working capital margin requirements at clearing corporations.

As security, the company offers a charge on its software intellectual property (IP) and office furniture, plus a personal guarantee from the founders. However, 65% of QuantEdge’s revenue comes from just three retail discount brokerages. Furthermore, the market regulator has released a consultation paper proposing stricter position limits and higher lot sizes on index options to curb speculative retail trading. QuantEdge’s illustrative stock valuation trades at a high price-to-earnings multiple, though equity optimism does not mitigate cash-flow volatility. Operating cash flows fluctuate sharply from quarter to quarter depending on market turnover, and one major brokerage client is already building an in-house execution engine.`,
  questions: [
    {
      id: "r2-c2-q1",
      question: "What is the primary credit weakness in QuantEdge’s proposal that prevents the bank from treating its 28% EBITDA margin and low debt as sufficient grounds for an unconditional sanction?",
      options: [
        { id: "A", text: "The high price-to-earnings multiple in the stock market, which indicates that the company’s financial statements are likely overstated." },
        { id: "B", text: "The mismatch between a 4-year loan tenure and server hardware, which normally has a productive lifespan exceeding 15 years." },
        { id: "C", text: "The company’s refusal to utilize equity capital markets for working capital despite trading at a favorable valuation." },
        { id: "D", text: "High earnings sensitivity to regulatory tightening in derivatives volumes, compounded by severe customer concentration and intangible, hard-to-liquidate collateral." },
      ],
      correctOption: "D",
    },
    {
      id: "r2-c2-q2",
      question: "How should the credit committee evaluate the collateral package offered by QuantEdge (software IP, office furniture, and founder personal guarantees)?",
      options: [
        { id: "A", text: "As inadequate standalone credit protection, because software IP rapidly loses value if regulatory shifts or client attrition impair the underlying business model." },
        { id: "B", text: "As robust primary security, since proprietary trading algorithms generate high margins and can be easily auctioned to competing banks in the event of default." },
        { id: "C", text: "As sufficient to waive cash-flow covenants, provided the founders’ personal net worth is currently tied to their shareholding in QuantEdge." },
        { id: "D", text: "As unacceptable under banking norms, because commercial banks are only permitted to lend against immovable industrial land and physical inventory." },
      ],
      correctOption: "A",
    },
    {
      id: "r2-c2-q3",
      question: "Considering the pending regulatory changes and client insourcing risk, what is the most defensible lending decision for the bank?",
      options: [
        { id: "A", text: "Sanction the full ₹85 crore unconditionally to capture a high-growth fintech relationship before competing banks offer lower interest rates." },
        { id: "B", text: "Sanction a reduced loan amount focused strictly on verifiable hardware capex, backed by a Debt Service Reserve Account (DSRA), cash-sweep covenants, and tangible cash margin collateral." },
        { id: "C", text: "Reject the proposal solely because service-sector companies with less than ₹500 crore in revenue lack the asset base required for corporate debt." },
        { id: "D", text: "Defer the decision for three years until the equity market enters a prolonged bear phase to observe how the company performs under stress." },
      ],
      correctOption: "B",
    },
    {
      id: "r2-c2-q4",
      question: "Suppose the market regulator implements the stricter derivatives norms immediately, causing QuantEdge’s monthly trading turnover to drop by 45%, while its largest client (accounting for 30% of revenue) terminates its contract upon completing its in-house platform. What should the bank do?",
      options: [
        { id: "A", text: "Sanction the ₹85 crore facility immediately, as the company will urgently need liquidity to survive the revenue downturn and develop new products." },
        { id: "B", text: "Reject the term loan request, as the structural erosion of its core revenue stream and client base compromises primary repayment capacity beyond what covenants can mitigate." },
        { id: "C", text: "Approve the loan on the condition that QuantEdge pledges its treasury stock as collateral to cover the 45% revenue shortfall." },
        { id: "D", text: "Convert the ₹85 crore request into an unsecured 10-year project loan to give the company lower monthly repayment obligations during the industry transition." },
      ],
      correctOption: "B",
    },
  ],
};

export default caseStudy;
