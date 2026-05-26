import type { NewsItem } from "@/types";

const isoDaysAgo = (d: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() - d);
  dt.setHours(8 + (d % 8), (d * 13) % 60, 0, 0);
  return dt.toISOString();
};

export const MOCK_NEWS: NewsItem[] = [
  {
    id: "n1",
    title: "NVIDIA tops earnings, raises Q3 guidance on AI demand",
    source: "Bloomberg",
    date: isoDaysAgo(0),
    summary:
      "Data-center revenue +154% YoY; supply constraints easing on Blackwell ramp. Hyperscaler capex guides higher for FY26.",
    impact: "positive",
    tickers: ["NVDA", "MSFT", "GOOGL", "META"],
    sectors: ["Technology", "Communication Services"],
    importance: "high",
  },
  {
    id: "n2",
    title: "UnitedHealth shares slide as DOJ probe widens",
    source: "Reuters",
    date: isoDaysAgo(1),
    summary:
      "Regulatory overhang persists; analysts cut FY26 EPS by 6–8%. Risk premium expands across managed care peers.",
    impact: "negative",
    tickers: ["UNH"],
    sectors: ["Healthcare"],
    importance: "high",
  },
  {
    id: "n3",
    title: "RBI holds repo rate at 6.50%, signals data-dependent stance",
    source: "Mint",
    date: isoDaysAgo(1),
    summary:
      "Banks rally on stable NIMs outlook. HDFC Bank, ICICI lead gains on benign deposit cost trajectory.",
    impact: "positive",
    tickers: ["HDFCBANK", "RELIANCE"],
    sectors: ["Financials"],
    importance: "medium",
  },
  {
    id: "n4",
    title: "Apple unveils on-device LLM stack at WWDC",
    source: "The Information",
    date: isoDaysAgo(2),
    summary:
      "Services attach rate likely benefits; partnership with OpenAI flagged as optical, not strategic. Buy-side reads as services-led re-rating catalyst.",
    impact: "positive",
    tickers: ["AAPL"],
    sectors: ["Technology"],
    importance: "high",
  },
  {
    id: "n5",
    title: "JPMorgan flags credit normalization in card portfolio",
    source: "WSJ",
    date: isoDaysAgo(3),
    summary:
      "Charge-off rate up 30 bps QoQ; provision build expected. Management reiterates FY guide; capital return intact.",
    impact: "neutral",
    tickers: ["JPM"],
    sectors: ["Financials"],
    importance: "medium",
  },
  {
    id: "n6",
    title: "Reliance Jio tariff hike absorbed without churn",
    source: "Economic Times",
    date: isoDaysAgo(3),
    summary:
      "ARPU up 12%; retail margin trajectory in line. Street upgrades sum-of-parts on telecom; refining drag unchanged.",
    impact: "positive",
    tickers: ["RELIANCE"],
    sectors: ["Energy", "Communication Services"],
    importance: "medium",
  },
  {
    id: "n7",
    title: "TCS BSNL deal ramp slips one quarter",
    source: "Moneycontrol",
    date: isoDaysAgo(4),
    summary:
      "Revenue conversion pushed to Q2FY27; deal TCV unchanged. Margins guided flat; commentary on BFSI discretionary cautious.",
    impact: "negative",
    tickers: ["TCS", "INFY"],
    sectors: ["Technology"],
    importance: "medium",
  },
  {
    id: "n8",
    title: "Eli Lilly Zepbound supply expands in major US markets",
    source: "FT",
    date: isoDaysAgo(5),
    summary:
      "Compounding pharmacy headwind fades; access expanding through PBMs. Consensus revenue likely tracks upper end.",
    impact: "positive",
    tickers: ["LLY"],
    sectors: ["Healthcare"],
    importance: "medium",
  },
  {
    id: "n9",
    title: "OPEC+ extends voluntary cuts through Q2 next year",
    source: "Reuters",
    date: isoDaysAgo(5),
    summary:
      "Brent supportive at $82–$86; integrated oils benefit. Refining cracks remain pressured on Asia gasoline length.",
    impact: "positive",
    tickers: ["XOM", "RELIANCE"],
    sectors: ["Energy"],
    importance: "medium",
  },
  {
    id: "n10",
    title: "Meta open-sources Llama 4; capex guide reiterated",
    source: "Bloomberg",
    date: isoDaysAgo(6),
    summary:
      "Cost discipline messaging eases dilution fears; Reality Labs loss tracking lower. Reels monetization continues to scale.",
    impact: "positive",
    tickers: ["META"],
    sectors: ["Communication Services", "Technology"],
    importance: "medium",
  },
  {
    id: "n11",
    title: "Bajaj Finance asset-quality watch as MFI stress builds",
    source: "BloombergQuint",
    date: isoDaysAgo(7),
    summary:
      "Unsecured book under scrutiny; management tightens underwriting. Street trims FY27 EPS 4%.",
    impact: "negative",
    tickers: ["BAJFINANCE"],
    sectors: ["Financials"],
    importance: "high",
  },
  {
    id: "n12",
    title: "Costco posts strong holiday traffic; membership renewals at all-time high",
    source: "CNBC",
    date: isoDaysAgo(8),
    summary:
      "Comp ex-fuel +6.2%; membership fee revenue grew 8%. Treasure-hunt effect intact.",
    impact: "positive",
    tickers: ["COST"],
    sectors: ["Consumer Staples"],
    importance: "low",
  },
];
