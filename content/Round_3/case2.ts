import type { Round3Case } from "../types";

const caseStudy: Round3Case = {
  id: "r3-case2",
  title: "Repo rate reduction",
  caseText: `In an illustrative economic scenario, India’s headline Consumer Price Index (CPI) inflation decelerates steadily over four quarters from 5.1% to 3.2% (a phase of pronounced disinflation), accompanied by a negative output gap, weak private consumption, and a sub-zero Wholesale Price Index (WPI) reading for manufactured goods. Industrial credit growth at Whiterock National Bank slows to an annualised 6.5%, well below its deposit growth of 11.2%. At its latest Monetary Policy Committee (MPC) review, the RBI cuts the policy repo rate by 25 basis points from 6.50% to 6.25% and shifts its stance to accommodative, signalling comfort with maintaining a banking-system liquidity surplus to aid transmission.

To reinforce durable liquidity, the RBI also announces an Open Market Operation (OMO) purchase of ₹25,000 crore of dated Government Securities. Following the announcement, the 10-year benchmark G-Sec yield declines from 6.75% to 6.52%. Whiterock National Bank holds a Statutory Liquidity Ratio (SLR) portfolio at 22% of Net Demand and Time Liabilities (NDTL), well above the statutory minimum of 18%. While the bank’s treasury desk sees an opportunity to book capital gains on long-dated G-Secs as yields fall, the Chief Risk Officer warns that government fiscal borrowing could surprise on the upside in the second half of the year, potentially reversing the yield rally and causing mark-to-market (MTM) losses in the Available-for-Sale (AFS) and Fair Value Through Profit and Loss (FVTPL) portfolios.`,
  questions: [
    {
      id: "r3-c2-q1",
      question: "Following the RBI’s 25-basis-point repo rate cut and shift to an accommodative stance, how do existing fixed-coupon G-Sec prices and secondary-market yields respond, all else equal, and why does this differ across maturities?",
      options: [
        { id: "A", text: "Existing G-Sec prices rise and yields fall because new bonds will be issued at higher rates." },
        { id: "B", text: "Short-term T-Bill prices experience a larger percentage capital gain than 10-year G-Secs because short-term instruments are closer to the repo rate." },
        { id: "C", text: "Only overnight money-market rates decline, while fixed-coupon bond prices remain fixed at par value (₹100) until maturity regardless of secondary-market yield movements." },
        { id: "D", text: "Existing G-Sec prices rise and yields fall across the curve, with longer-duration bonds experiencing a larger percentage price increase than short-term T-Bills for a given decline in yield due to their higher modified duration." },
      ],
      correctOption: "D",
    },
    {
      id: "r3-c2-q2",
      question: "With corporate credit demand sluggish and deposit inflows strong, how should Whiterock National Bank’s treasury manage its excess SLR holdings and incremental funds in the immediate aftermath of the rate cut?",
      options: [
        { id: "A", text: "Immediately liquidate its entire excess SLR portfolio (4% of NDTL) and force-lend the proceeds to lower-rated corporate borrowers at below-market rates to boost credit growth." },
        { id: "B", text: "Retain and selectively add medium-to-long-tenor G-Secs in trading books to capture capital appreciation from falling yields and earn carry above the SDF rate, while gradually passing on lower funding costs (via MCLR and external benchmark resets) to stimulate creditworthy loan demand." },
        { id: "C", text: "Refuse all new customer deposits and park 100% of existing excess funds in the overnight SDF at 6.00%, completely avoiding the G-Sec market." },
        { id: "D", text: "Purchase high-coupon corporate bonds with poor credit ratings in the Held-to-Maturity (HTM) book, assuming the RBI rate cut eliminates default risk during an economic slowdown." },
      ],
      correctOption: "B",
    },
    {
      id: "r3-c2-q3",
      question: "What is the direct impact of the RBI’s ₹25,000 crore OMO purchase of dated G-Secs on the banking system, and how does it differ from a temporary 7-day Variable Rate Repo (VRR) injection?",
      options: [
        { id: "A", text: "The OMO purchase absorbs ₹25,000 crore of rupee liquidity and pushes G-Sec yields up, whereas a 7-day VRR injects permanent liquidity." },
        { id: "B", text: "Both the OMO purchase and the 7-day VRR permanently expand the RBI’s holdings of G-Secs and have identical effects on the 10-year bond yield." },
        { id: "C", text: "The OMO purchase injects ₹25,000 crore of durable reserve money into the banking system and directly adds purchase demand in the bond market (compressing G-Sec yields), whereas a 7-day VRR provides only temporary short-term liquidity that reverses upon maturity." },
        { id: "D", text: "The OMO purchase affects only the secondary bond market and has no bearing on commercial banks’ reserve balances with the RBI. VRRR injects short-term liquidity." },
      ],
      correctOption: "C",
    },
    {
      id: "r3-c2-q4",
      question: "Three months later, inflation expectations bottom out and the government announces an unexpected ₹50,000 crore increase in market borrowing, causing the 10-year G-Sec yield to show early signs of rising from 6.45%. Which portfolio strategy best balances Whiterock National Bank’s profitability, duration risk, and regulatory liquidity requirements?",
      options: [
        { id: "A", text: "Increase portfolio duration further by shifting all short-term T-Bills into 30-year G-Secs in the FVTPL book to average down as bond prices fall." },
        { id: "B", text: "Realise capital gains on long-duration G-Secs in the AFS/FVTPL trading books and shorten portfolio duration by shifting into shorter-tenor T-Bills or floating-rate bonds, shielding the P&L from mark-to-market losses while maintaining required SLR and Liquidity Coverage Ratio (LCR) buffers." },
        { id: "C", text: "Sell G-Secs until the bank’s SLR holdings fall to 14% of NDTL (below the 18% statutory requirement) to avoid any mark-to-market impact." },
        { id: "D", text: "Request the RBI to buy back the bank’s entire G-Sec portfolio at historical cost through the Marginal Standing Facility (MSF)." },
      ],
      correctOption: "B",
    },
  ],
};

export default caseStudy;
