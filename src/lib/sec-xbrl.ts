/**
 * SEC EDGAR XBRL Company Facts API
 * Fetches actual reported financial data from SEC regulatory filings (10-K, 10-Q).
 * This is the most authoritative source for US public company financials.
 *
 * API: https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json
 * Docs: https://www.sec.gov/edgar/sec-api-documentation
 */

const SEC_UA = "StockAnalysis admin@stockapp.dev";

let tickerCache: Record<string, number> | null = null;
let tickerCacheExpiry = 0;

export async function lookupCik(ticker: string): Promise<number | null> {
  const now = Date.now();
  if (!tickerCache || now > tickerCacheExpiry) {
    try {
      const res = await fetch("https://www.sec.gov/files/company_tickers.json", {
        headers: { "User-Agent": SEC_UA },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const map: Record<string, number> = {};
      for (const entry of Object.values(data as Record<string, { ticker: string; cik_str: number }>)) {
        map[String(entry.ticker).toUpperCase()] = entry.cik_str;
      }
      tickerCache = map;
      tickerCacheExpiry = now + 60 * 60 * 1000;
    } catch {
      return null;
    }
  }
  return tickerCache?.[ticker.toUpperCase()] ?? null;
}

type XbrlFact = {
  end: string;
  val: number;
  accn: string;
  fy: number;
  fp: string; // "FY" for annual, "Q1"/"Q2"/"Q3"/"Q4" for quarterly
  form: string; // "10-K", "10-Q"
  filed: string;
  frame?: string;
};

type XbrlUnit = {
  USD?: XbrlFact[];
  "USD/shares"?: XbrlFact[];
  shares?: XbrlFact[];
  pure?: XbrlFact[];
};

type XbrlConcept = {
  label: string;
  description: string;
  units: XbrlUnit;
};

type XbrlCompanyFacts = {
  cik: number;
  entityName: string;
  facts: {
    "us-gaap"?: Record<string, XbrlConcept>;
    dei?: Record<string, XbrlConcept>;
  };
};

function getLatestFact(
  concept: XbrlConcept | undefined,
  unitKey: "USD" | "USD/shares" | "shares" | "pure",
  formFilter?: string,
): XbrlFact | null {
  if (!concept) return null;
  const facts = concept.units[unitKey];
  if (!facts || facts.length === 0) return null;

  const filtered = formFilter
    ? facts.filter((f) => f.form === formFilter)
    : facts;

  if (filtered.length === 0) return null;

  return filtered.sort((a, b) => {
    const dateComp = b.end.localeCompare(a.end);
    if (dateComp !== 0) return dateComp;
    return b.filed.localeCompare(a.filed);
  })[0];
}

function getLatestAnnual(concept: XbrlConcept | undefined, unitKey: "USD" | "USD/shares" | "shares" | "pure"): XbrlFact | null {
  return getLatestFact(concept, unitKey, "10-K");
}

function getLatestQuarterly(concept: XbrlConcept | undefined, unitKey: "USD" | "USD/shares" | "shares" | "pure"): XbrlFact | null {
  return getLatestFact(concept, unitKey, "10-Q");
}

function tryMultipleConcepts(
  gaap: Record<string, XbrlConcept> | undefined,
  concepts: string[],
  unitKey: "USD" | "USD/shares" | "shares" | "pure",
  formFilter?: string,
): { value: number; period: string; form: string } | null {
  if (!gaap) return null;
  for (const name of concepts) {
    const c = gaap[name];
    if (!c) continue;
    const fact = formFilter ? getLatestFact(c, unitKey, formFilter) : getLatestAnnual(c, unitKey) ?? getLatestQuarterly(c, unitKey);
    if (fact) return { value: fact.val, period: fact.end, form: fact.form };
  }
  return null;
}

export type SecFinancials = {
  entityName: string;
  // Income Statement
  totalRevenue: { value: number; period: string; form: string } | null;
  netIncome: { value: number; period: string; form: string } | null;
  grossProfit: { value: number; period: string; form: string } | null;
  operatingIncome: { value: number; period: string; form: string } | null;
  ebitda: { value: number; period: string; form: string } | null;
  dilutedEPS: { value: number; period: string; form: string } | null;
  // Balance Sheet
  totalAssets: { value: number; period: string; form: string } | null;
  totalLiabilities: { value: number; period: string; form: string } | null;
  stockholdersEquity: { value: number; period: string; form: string } | null;
  totalCash: { value: number; period: string; form: string } | null;
  totalDebt: { value: number; period: string; form: string } | null;
  sharesOutstanding: { value: number; period: string; form: string } | null;
  // Cash Flow
  operatingCashflow: { value: number; period: string; form: string } | null;
  capex: { value: number; period: string; form: string } | null;
  // Derived
  freeCashflow: number | null;
  debtToEquity: number | null;
  currentRatio: { value: number; period: string; form: string } | null;
  bookValuePerShare: number | null;
  returnOnEquity: number | null;
  returnOnAssets: number | null;
  profitMargin: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  // Metadata
  lastFilingDate: string;
  source: "SEC EDGAR";
};

export async function fetchSecFinancials(ticker: string): Promise<SecFinancials | null> {
  try {
    const cik = await lookupCik(ticker);
    if (!cik) return null;

    const cikPad = String(cik).padStart(10, "0");
    const res = await fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cikPad}.json`, {
      headers: { "User-Agent": SEC_UA },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;

    const facts: XbrlCompanyFacts = await res.json();
    const gaap = facts.facts["us-gaap"];
    const dei = facts.facts.dei;

    if (!gaap) return null;

    const totalRevenue = tryMultipleConcepts(gaap, [
      "Revenues",
      "RevenueFromContractWithCustomerExcludingAssessedTax",
      "RevenueFromContractWithCustomerIncludingAssessedTax",
      "SalesRevenueNet",
      "SalesRevenueGoodsNet",
      "SalesRevenueServicesNet",
    ], "USD");

    const netIncome = tryMultipleConcepts(gaap, [
      "NetIncomeLoss",
      "NetIncomeLossAvailableToCommonStockholdersBasic",
      "ProfitLoss",
    ], "USD");

    const grossProfit = tryMultipleConcepts(gaap, [
      "GrossProfit",
    ], "USD");

    const operatingIncome = tryMultipleConcepts(gaap, [
      "OperatingIncomeLoss",
    ], "USD");

    const ebitda = tryMultipleConcepts(gaap, [
      "EarningsBeforeInterestTaxesDepreciationAndAmortization",
    ], "USD");

    const dilutedEPS = tryMultipleConcepts(gaap, [
      "EarningsPerShareDiluted",
    ], "USD/shares");

    const totalAssets = tryMultipleConcepts(gaap, [
      "Assets",
    ], "USD");

    const totalLiabilities = tryMultipleConcepts(gaap, [
      "Liabilities",
      "LiabilitiesAndStockholdersEquity",
    ], "USD");

    const stockholdersEquity = tryMultipleConcepts(gaap, [
      "StockholdersEquity",
      "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest",
    ], "USD");

    const totalCash = tryMultipleConcepts(gaap, [
      "CashAndCashEquivalentsAtCarryingValue",
      "CashCashEquivalentsAndShortTermInvestments",
      "Cash",
    ], "USD");

    const longTermDebt = tryMultipleConcepts(gaap, [
      "LongTermDebt",
      "LongTermDebtNoncurrent",
    ], "USD");
    const shortTermDebt = tryMultipleConcepts(gaap, [
      "ShortTermBorrowings",
      "LongTermDebtCurrent",
    ], "USD");
    const totalDebt = longTermDebt
      ? { value: longTermDebt.value + (shortTermDebt?.value ?? 0), period: longTermDebt.period, form: longTermDebt.form }
      : shortTermDebt;

    const sharesOutstanding = tryMultipleConcepts(dei ?? {}, [
      "EntityCommonStockSharesOutstanding",
    ], "shares") ?? tryMultipleConcepts(gaap, [
      "CommonStockSharesOutstanding",
      "WeightedAverageNumberOfDilutedSharesOutstanding",
    ], "shares");

    const operatingCashflow = tryMultipleConcepts(gaap, [
      "NetCashProvidedByOperatingActivities",
      "CashFlowsFromOperatingActivities",
    ], "USD");

    const capex = tryMultipleConcepts(gaap, [
      "PaymentsToAcquirePropertyPlantAndEquipment",
      "CapitalExpenditures",
    ], "USD");

    const currentAssets = tryMultipleConcepts(gaap, ["AssetsCurrent"], "USD");
    const currentLiabilities = tryMultipleConcepts(gaap, ["LiabilitiesCurrent"], "USD");
    const currentRatioVal = currentAssets && currentLiabilities && currentLiabilities.value > 0
      ? { value: currentAssets.value / currentLiabilities.value, period: currentAssets.period, form: currentAssets.form }
      : null;

    const freeCashflowVal = operatingCashflow && capex
      ? operatingCashflow.value - Math.abs(capex.value)
      : null;

    const debtToEquityVal = totalDebt && stockholdersEquity && stockholdersEquity.value > 0
      ? (totalDebt.value / stockholdersEquity.value) * 100
      : null;

    const bookValuePerShare = stockholdersEquity && sharesOutstanding && sharesOutstanding.value > 0
      ? stockholdersEquity.value / sharesOutstanding.value
      : null;

    const roeVal = netIncome && stockholdersEquity && stockholdersEquity.value > 0
      ? netIncome.value / stockholdersEquity.value
      : null;

    const roaVal = netIncome && totalAssets && totalAssets.value > 0
      ? netIncome.value / totalAssets.value
      : null;

    const profitMarginVal = netIncome && totalRevenue && totalRevenue.value > 0
      ? netIncome.value / totalRevenue.value
      : null;

    const grossMarginVal = grossProfit && totalRevenue && totalRevenue.value > 0
      ? grossProfit.value / totalRevenue.value
      : null;

    const operatingMarginVal = operatingIncome && totalRevenue && totalRevenue.value > 0
      ? operatingIncome.value / totalRevenue.value
      : null;

    const allDates = [totalRevenue, netIncome, totalAssets, operatingCashflow]
      .filter(Boolean)
      .map((x) => x!.period);
    const lastFilingDate = allDates.sort().pop() ?? "";

    return {
      entityName: facts.entityName,
      totalRevenue,
      netIncome,
      grossProfit,
      operatingIncome,
      ebitda,
      dilutedEPS,
      totalAssets,
      totalLiabilities,
      stockholdersEquity,
      totalCash,
      totalDebt,
      sharesOutstanding,
      operatingCashflow,
      capex,
      freeCashflow: freeCashflowVal,
      debtToEquity: debtToEquityVal,
      currentRatio: currentRatioVal,
      bookValuePerShare,
      returnOnEquity: roeVal,
      returnOnAssets: roaVal,
      profitMargin: profitMarginVal,
      grossMargin: grossMarginVal,
      operatingMargin: operatingMarginVal,
      lastFilingDate,
      source: "SEC EDGAR",
    };
  } catch {
    return null;
  }
}
