import type { Recommendation } from "@/types";

const isoDaysAgo = (d: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() - d);
  return dt.toISOString();
};

export const MOCK_RECOMMENDATIONS: Recommendation[] = [
  {
    id: "r1",
    date: isoDaysAgo(0),
    type: "TRIM",
    priority: "high",
    title: "Trim UNH by ~30% — regulatory overhang & analyst downgrade",
    rationale:
      "Goldman Sachs moved UNH to Hold with PT cut to $540. DOJ probe widening alongside MLR creep. Position is 4.2% of book — outsized for current risk profile.",
    affectedTickers: ["UNH"],
    suggestedAction: "Reduce UNH from 4.2% → 2.5%. Redeploy proceeds into LLY (within Healthcare sleeve).",
    evidenceIds: ["br2", "n2"],
    confidence: 78,
    expectedImpact: "Reduces healthcare regulatory beta by ~35%; expected drawdown contribution -110 bps.",
  },
  {
    id: "r2",
    date: isoDaysAgo(0),
    type: "REBALANCE",
    priority: "high",
    title: "Trim NVDA satellite overweight back toward target",
    rationale:
      "NVDA position has compounded to 11.4% from ~5% cost basis on the 168% YTD move. Concentration risk is now the largest single-name in the book. Even with bullish thesis intact, position size warrants discipline.",
    affectedTickers: ["NVDA"],
    suggestedAction: "Sell ~35% of NVDA position to bring weight to ~7%. Move proceeds: half to cash buffer, half to under-weight Consumer Staples sleeve.",
    evidenceIds: ["br1", "n1"],
    confidence: 84,
    expectedImpact: "Position-level VaR drops 28%; portfolio Sharpe estimated +0.08.",
  },
  {
    id: "r3",
    date: isoDaysAgo(1),
    type: "EXIT",
    priority: "medium",
    title: "Exit BAJFINANCE — asset quality reset under way",
    rationale:
      "Macquarie cut to Underperform, PT ₹6,600. Unsecured book stress accelerating; management tightening underwriting (2+ quarters of muted growth). Risk/reward unfavorable vs. HDFCB at similar valuation.",
    affectedTickers: ["BAJFINANCE"],
    suggestedAction: "Exit full BAJFINANCE position. Reinvest in HDFC Bank (already core overweight) and ICICI Bank.",
    evidenceIds: ["br9", "n11"],
    confidence: 71,
    expectedImpact: "Improves Financials sleeve quality; reduces unsecured retail exposure to nil.",
  },
  {
    id: "r4",
    date: isoDaysAgo(1),
    type: "ADD",
    priority: "medium",
    title: "Add to LLY on Zepbound capacity inflection",
    rationale:
      "JPMorgan PT raised to $960. Capacity expansion 14 months ahead of plan. Healthcare sleeve is 200 bps below target — natural place to add quality compounding.",
    affectedTickers: ["LLY"],
    suggestedAction: "Increase LLY weight from 1.4% → 2.6%. Funded from UNH trim (see r1) and cash sleeve.",
    evidenceIds: ["br6", "n8"],
    confidence: 76,
    expectedImpact: "Healthcare beta down ~15%; sleeve expected return +120 bps.",
  },
  {
    id: "r5",
    date: isoDaysAgo(2),
    type: "WATCH",
    priority: "medium",
    title: "Watch Indian IT — discretionary cycle bottoming but mixed",
    rationale:
      "UBS notes order book improving but no V-shape. TCS BSNL ramp slipped a quarter. Infosys preferred. Position sizes currently appropriate; revisit after Q1FY27 prints.",
    affectedTickers: ["TCS", "INFY"],
    suggestedAction: "Hold current weights. Set alerts on margin commentary, BFSI discretionary spend, and Gen-AI deal TCV trajectory.",
    evidenceIds: ["br10", "n7"],
    confidence: 60,
    expectedImpact: "No portfolio impact today; positioning maintains optionality.",
  },
  {
    id: "r6",
    date: isoDaysAgo(3),
    type: "HEDGE",
    priority: "low",
    title: "Consider partial USD hedge on India sleeve",
    rationale:
      "INR has appreciated 1.8% YTD; downside skew to 84.5–85.0 if Fed cut path pushes out. India sleeve is 33% of book — hedging 30–40% of FX exposure caps drawdown without dragging upside materially.",
    affectedTickers: ["RELIANCE", "TCS", "HDFCBANK", "INFY", "BAJFINANCE", "TITAN", "NIFTYBEES"],
    suggestedAction: "Buy 3-month USD/INR call spreads covering ~35% of India NAV. Cost: ~25 bps of NAV.",
    evidenceIds: ["br3"],
    confidence: 55,
    expectedImpact: "Caps INR drawdown contribution at ~120 bps; small drag on upside scenarios.",
  },
  {
    id: "r7",
    date: isoDaysAgo(4),
    type: "ADD",
    priority: "low",
    title: "Initiate small position in Consumer Staples diversification",
    rationale:
      "Costco is the only Consumer Staples holding — sleeve is below 6% target. Adding a defensive cash-flow name lowers portfolio beta during macro de-risking.",
    affectedTickers: [],
    suggestedAction: "Initiate 1.5% position in either PG, KO, or WMT. Funded from cash sleeve.",
    evidenceIds: [],
    confidence: 52,
    expectedImpact: "Portfolio beta down ~0.04; sleeve aligned to target.",
  },
];
