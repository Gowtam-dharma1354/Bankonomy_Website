import type { Round3Case } from "../types";

const caseStudy: Round3Case = {
  id: "r3-case1",
  title: "FCNR issuance and fund inflow",
  caseText: `In an illustrative macroeconomic scenario, Indian commercial banks experience a surge in Foreign Currency Non-Resident (Bank) [FCNR(B)] deposits due to attractive global interest rate differentials. Mohapada Commercial Bank mobilises $1.5 billion in 3-year FCNR(B) deposits. To deploy these proceeds domestically while hedging currency risk, Mohapada Bank enters into a USD/INR sell/buy swap with the Reserve Bank of India (RBI), delivering US dollars spot in exchange for rupees and agreeing to repurchase the dollars at a predetermined forward rate upon maturity. Across the banking sector, similar swap operations and RBI spot dollar purchases to bolster foreign-exchange reserves inject ₹2.4 lakh crore of durable rupee liquidity into the system. Consequently, the Weighted Average Call Rate (WACR) falls to 6.28%, drifting toward the Standing Deposit Facility (SDF) rate of 6.25% and well below the illustrative policy repo rate of 6.50%. Meanwhile, domestic credit off-take remains moderate, leaving Mohapada Bank’s treasury with ₹8,500 crore in surplus rupee balances. The 91-day Treasury Bill yields 6.42%, and the 10-year benchmark Government Security (G-Sec) yields 6.85%. However, looking ahead 36 months, Mohapada Bank faces a concentrated dollar repayment obligation when the FCNR(B) deposits and the RBI swap mature simultaneously, exposing the bank to potential dollar liquidity tightness and domestic cash-flow mismatches if not managed proactively.`,
  questions: [
    {
      id: "r3-c1-q1",
      question: "Given the immediate surplus of ₹8,500 crore, the call rate at 6.28%, and the need to preserve short-term flexibility while earning a return above the overnight floor, which action is most appropriate for Mohapada Bank’s treasury?",
      options: [
        { id: "A", text: "Conduct an Open Market Operation (OMO) sale of G-Secs to the market to absorb the excess systemic liquidity." },
        { id: "B", text: "Deploy a portion of the surplus into 91-day Treasury Bills at 6.42% and bid in the RBI’s Variable Rate Reverse Repo (VRRR) auctions, while parking residual overnight balances in the SDF." },
        { id: "C", text: "Borrow additional overnight funds through the RBI’s Variable Rate Repo (VRR) window to lock in current low short-term rates." },
        { id: "D", text: "Hold the entire ₹8,500 crore in unremunerated excess Cash Reserve Ratio (CRR) balances with the RBI to eliminate interest rate risk completely." },
      ],
      correctOption: "B",
    },
    {
      id: "r3-c1-q2",
      question: "Concerned that the ₹2.4 lakh crore liquidity surplus is pushing the WACR persistently toward the SDF floor of 6.25% and weakening monetary policy transmission, the RBI decides to absorb liquidity temporarily for 14 days without permanently altering its G-Sec portfolio. Which instrument should the RBI utilise, and how does it differ from the SDF?",
      options: [
        { id: "A", text: "Conduct a 14-day Variable Rate Reverse Repo (VRRR) auction, which absorbs term liquidity against G-Sec collateral at market-discovered rates up to the repo rate, whereas the SDF absorbs overnight liquidity without collateral at a fixed floor rate." },
        { id: "B", text: "Conduct a 14-day Variable Rate Repo (VRR) auction, which absorbs liquidity against G-Sec collateral, unlike the uncollateralised SDF." },
        { id: "C", text: "Lower the SDF rate by 25 basis points to encourage banks to deposit more surplus funds overnight." },
        { id: "D", text: "Issue new 10-year dated Government Securities directly on its own balance sheet to permanently drain the 14-day surplus." },
      ],
      correctOption: "A",
    },
    {
      id: "r3-c1-q3",
      question: "Suppose Mohapada Bank uses ₹2,000 crore of its surplus to purchase 10-year G-Secs in the secondary interbank market from another commercial bank, while on the same day the RBI conducts an OMO outright sale of ₹10,000 crore of G-Secs to commercial banks. All else equal, what is the combined effect on aggregate banking-system rupee liquidity and secondary-market G-Sec yields?",
      options: [
        { id: "A", text: "Both Mohapada Bank’s purchase and the RBI’s OMO sale reduce aggregate banking-system liquidity by ₹12,000 crore and push G-Sec yields down." },
        { id: "B", text: "Mohapada Bank’s secondary-market purchase redistributes reserves between commercial banks without changing aggregate systemic liquidity, whereas the RBI’s ₹10,000 crore OMO sale absorbs durable systemic liquidity and exerts upward pressure on G-Sec yields." },
        { id: "C", text: "Mohapada Bank’s purchase injects ₹2,000 crore of new systemic liquidity, partially offsetting the ₹10,000 crore absorbed by the RBI’s OMO sale, leaving yields unchanged." },
        { id: "D", text: "The RBI’s OMO sale injects ₹10,000 crore of rupee liquidity into the system, driving G-Sec prices up and yields down." },
      ],
      correctOption: "B",
    },
    {
      id: "r3-c1-q4",
      question: "Six months before the 3-year FCNR(B) deposits and the USD/INR sell/buy swap mature, domestic rupee liquidity tightens into a systemic deficit, pushing short-term rupee rates higher, while 30% of the FCNR(B) depositors signal they will withdraw their dollars upon maturity rather than roll them over. What is the primary challenge facing Mohapada Bank’s treasury at maturity, and what is the most prudent preparatory response?",
      options: [
        { id: "A", text: "The bank faces unhedged spot exchange-rate depreciation risk on the principal; it should immediately cancel the RBI swap without penalty." },
        { id: "B", text: "The bank must deliver rupees to the RBI to receive the swapped dollars for paying retiring depositors, causing a sharp rupee outflow during a tight domestic liquidity phase; the treasury should build a buffer of maturing liquid rupee assets (such as T-Bills) and arrange forward swap rollovers for the retained deposits." },
        { id: "C", text: "The bank will experience a sudden influx of rupees on maturity when the swap unwinds; it should commit those anticipated rupees into long-term 15-year infrastructure loans today." },
        { id: "D", text: "Because the original transaction was a sell/buy swap with the RBI, the RBI automatically assumes the liability to repay the FCNR(B) depositors directly, requiring no action from Mohapada Bank." },
      ],
      correctOption: "B",
    },
  ],
};

export default caseStudy;
