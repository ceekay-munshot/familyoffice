import type { BrokerReport } from "@/types";

const isoDaysAgo = (d: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() - d);
  return dt.toISOString();
};

export const MOCK_BROKER_REPORTS: BrokerReport[] = [
  {
    id: "br1",
    broker: "Morgan Stanley",
    date: isoDaysAgo(0),
    title: "NVIDIA: Blackwell ramp ahead of plan; raise PT",
    sector: "Technology",
    tickers: ["NVDA"],
    ratingChange: { from: "Overweight", to: "Overweight" },
    priceTargetChange: { from: 1050, to: 1280, currency: "USD" },
    summary:
      "Supply checks across H200/B100 indicate Q3 deliveries tracking 8–10% above prior model. We move FY26 EPS +7%.",
    recommendation: "OVERWEIGHT",
    keyTakeaways: [
      "Hyperscaler capex commitments through 2027 imply continued data-center upside.",
      "Networking attach growing faster than compute; mix-shift positive for gross margin.",
      "Risk: competitive response from AMD MI400 not before mid-2027.",
    ],
    relevance: "high",
  },
  {
    id: "br2",
    broker: "Goldman Sachs",
    date: isoDaysAgo(1),
    title: "Managed Care: Recalibrating UNH risk premium",
    sector: "Healthcare",
    tickers: ["UNH"],
    ratingChange: { from: "Buy", to: "Neutral" },
    priceTargetChange: { from: 612, to: 540, currency: "USD" },
    summary:
      "Regulatory probe overhang and MLR pressure warrant near-term de-rating. We see fair value $520–$560.",
    recommendation: "HOLD",
    keyTakeaways: [
      "Step-down from Buy reflects elevated regulatory tail risk and MLR creep.",
      "Optum margins resilient; Care Delivery segment provides cushion.",
      "Catalyst path opaque until DOJ inquiry resolves.",
    ],
    relevance: "high",
  },
  {
    id: "br3",
    broker: "Jefferies",
    date: isoDaysAgo(2),
    title: "Indian Banks: Margin trajectory bottoming",
    sector: "Financials",
    tickers: ["HDFCBANK", "BAJFINANCE"],
    priceTargetChange: { from: 1820, to: 1920, currency: "INR" },
    summary:
      "Deposit cost peak behind us; expect 10–15 bps NIM expansion by H2FY27. Prefer HDFCB; cautious on BAF on unsecured stress.",
    recommendation: "BUY",
    keyTakeaways: [
      "HDFC Bank credit-deposit ratio normalization on track.",
      "Bajaj Finance: rural MFI book to drive 2 quarters of elevated credit costs.",
      "PSU bank consolidation tailwind for private-sector market share.",
    ],
    relevance: "high",
  },
  {
    id: "br4",
    broker: "Bernstein",
    date: isoDaysAgo(2),
    title: "Mega-cap AI capex: Where does it really land?",
    sector: "Technology",
    tickers: ["MSFT", "GOOGL", "META", "AMZN"],
    summary:
      "Mapping $410B FY26 capex across the four. We see Microsoft and Meta capturing most operating leverage; Alphabet incremental ROIC under pressure.",
    recommendation: "OVERWEIGHT",
    keyTakeaways: [
      "MSFT: Azure capacity adds tracking ahead; gross margin trough behind us.",
      "META: ad inventory monetization + open-source moat under-appreciated.",
      "GOOGL: Search query erosion offset by Cloud, but margins trail.",
    ],
    relevance: "high",
  },
  {
    id: "br5",
    broker: "Citi",
    date: isoDaysAgo(3),
    title: "Apple: Services re-rating on-device AI",
    sector: "Technology",
    tickers: ["AAPL"],
    ratingChange: { from: "Neutral", to: "Buy" },
    priceTargetChange: { from: 195, to: 245, currency: "USD" },
    summary:
      "Apple Intelligence drives a structurally higher services attach, justifying premium multiple expansion.",
    recommendation: "BUY",
    keyTakeaways: [
      "On-device LLM stack pulls services growth to high-teens for FY27.",
      "Hardware refresh cycle elongation now embedded in consensus.",
      "China iPhone share stabilizing post-Q3.",
    ],
    relevance: "high",
  },
  {
    id: "br6",
    broker: "JPMorgan",
    date: isoDaysAgo(4),
    title: "Eli Lilly: Zepbound capacity update bullish",
    sector: "Healthcare",
    tickers: ["LLY"],
    ratingChange: { from: "Overweight", to: "Overweight" },
    priceTargetChange: { from: 880, to: 960, currency: "USD" },
    summary:
      "Capacity expansion 14 months ahead of prior plan; we model 18% upside to FY27 obesity revenue.",
    recommendation: "OVERWEIGHT",
    keyTakeaways: [
      "GLP-1 TAM upgrades to $130B by 2030.",
      "Diabetes franchise pricing intact ex-Inflation Reduction Act re-pricing.",
      "Risk: Novo orforglipron data Q3.",
    ],
    relevance: "high",
  },
  {
    id: "br7",
    broker: "Kotak Institutional",
    date: isoDaysAgo(5),
    title: "Reliance: Telecom monetization to drive valuation re-rating",
    sector: "Energy",
    tickers: ["RELIANCE"],
    priceTargetChange: { from: 3050, to: 3250, currency: "INR" },
    summary:
      "Jio tariff hike acceptance better than modeled; retail steady; refining drag manageable.",
    recommendation: "BUY",
    keyTakeaways: [
      "Jio EBITDA growth to 22% YoY for FY27.",
      "Retail expansion focused on tier-2/3; margin discipline maintained.",
      "Refining: cracks bottoming, expect gradual recovery into H2FY27.",
    ],
    relevance: "medium",
  },
  {
    id: "br8",
    broker: "Barclays",
    date: isoDaysAgo(6),
    title: "Integrated Oils: Brent floor at $80, supply-side discipline",
    sector: "Energy",
    tickers: ["XOM"],
    summary:
      "OPEC+ cohesion supportive; demand growth tracks 1.1mb/d. Prefer integrated for FCF, dividends.",
    recommendation: "OVERWEIGHT",
    keyTakeaways: [
      "XOM Guyana ramp to drive 12% upstream production growth.",
      "Refining margins compressed but stable.",
      "Capital discipline + buybacks underpin TSR.",
    ],
    relevance: "medium",
  },
  {
    id: "br9",
    broker: "Macquarie",
    date: isoDaysAgo(7),
    title: "Bajaj Finance: Asset quality reset",
    sector: "Financials",
    tickers: ["BAJFINANCE"],
    ratingChange: { from: "Neutral", to: "Underperform" },
    priceTargetChange: { from: 7400, to: 6600, currency: "INR" },
    summary:
      "Unsecured book stress accelerating; expect credit cost to peak in Q2FY27. Cut EPS 9% / 6% for FY27/28.",
    recommendation: "UNDERWEIGHT",
    keyTakeaways: [
      "MFI and unsecured personal loan delinquencies rising.",
      "Management tightening underwriting; growth trade-off ahead.",
      "Premium multiple difficult to defend at current asset-quality trajectory.",
    ],
    relevance: "high",
  },
  {
    id: "br10",
    broker: "UBS",
    date: isoDaysAgo(8),
    title: "Indian IT: Discretionary cycle bottoming but no V-shape",
    sector: "Technology",
    tickers: ["TCS", "INFY"],
    summary:
      "Order book improving sequentially; BFSI commentary mixed. Prefer Infosys on better growth optionality.",
    recommendation: "HOLD",
    keyTakeaways: [
      "Margin expansion at risk if revenue growth disappoints.",
      "Gen-AI deal cycles still early-stage; revenue conversion 12–18 months out.",
      "Cross-currency tailwind FY27 mildly positive.",
    ],
    relevance: "medium",
  },
];
